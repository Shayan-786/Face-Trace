/**
 * pdf.js — client-side PDF generation for Face Trace reports.
 * Generates a valid PDF 1.4 document compatible with Edge, Chrome, and Firefox.
 */

import { formatBytes, formatDuration } from './media.js'

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

/** Escape a string for use inside PDF literal string parens. */
function escStr(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7e]/g, (ch) => {
      const code = ch.codePointAt(0)
      return code !== undefined ? `\\${code.toString(8).padStart(3, '0')}` : ''
    })
}

/** Zero-pad a number to 10 digits for xref table. */
function pad10(n) {
  return String(n).padStart(10, '0')
}

// ---------------------------------------------------------------------------
// PDF builder
// ---------------------------------------------------------------------------

function buildPdf(lines) {
  // Page dimensions in points (A4)
  const W = 595
  const H = 842

  // Build the content stream body
  const streamParts = []
  for (const line of lines) {
    const font = line.bold ? '/F2' : '/F1'
    // Each text op: position from bottom-left so y=0 is bottom
    streamParts.push(
      `BT\n${font} ${line.size} Tf\n${line.x} ${H - line.y} Td\n(${escStr(line.text)}) Tj\nET`,
    )
  }
  const streamBody = streamParts.join('\n')
  const streamLen = streamBody.length

  // Build objects as raw strings (no wrapping << >> — the caller decides)
  // Object numbering: 1=catalog 2=pages 3=font1 4=font2 5=stream 6=page
  const rawObjects = [
    // 1: catalog
    `1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj`,
    // 2: pages (kids filled after we know page id = 6)
    `2 0 obj\n<</Type /Pages /Kids [6 0 R] /Count 1>>\nendobj`,
    // 3: Helvetica font
    `3 0 obj\n<</Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding>>\nendobj`,
    // 4: Helvetica-Bold font
    `4 0 obj\n<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding>>\nendobj`,
    // 5: content stream — stream keyword must immediately follow the dict line
    `5 0 obj\n<</Length ${streamLen}>>\nstream\n${streamBody}\nendstream\nendobj`,
    // 6: page
    `6 0 obj\n<</Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 5 0 R /Resources <</Font <</F1 3 0 R /F2 4 0 R>>>>>>\nendobj`,
  ]

  // Serialise and record byte offsets
  const header = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n' // binary comment keeps viewers happy
  const parts = [header]
  const offsets = []

  for (const obj of rawObjects) {
    offsets.push(parts.join('').length)
    parts.push(obj + '\n')
  }

  // Cross-reference table
  const xrefStart = parts.join('').length
  const xref = [
    'xref',
    `0 ${rawObjects.length + 1}`,
    '0000000000 65535 f\r', // free entry — must end with \r\n or space+\r
    ...offsets.map((o) => `${pad10(o)} 00000 n\r`),
  ].join('\n')

  parts.push(xref)
  parts.push('\n')
  parts.push(`trailer\n<</Size ${rawObjects.length + 1} /Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF\n`)

  return parts.join('')
}

// ---------------------------------------------------------------------------
// Report layout helpers
// ---------------------------------------------------------------------------

export function downloadReport(record) {
  const date = new Date(record.createdAt).toLocaleString()
  const size = formatBytes(record.size)
  const duration = formatDuration(record.duration)
  const type =
    record.type ||
    (record.filename ? record.filename.split('.').pop().toUpperCase() : 'Unknown')

  const lines = []
  let y = 60

  function heading(text, fontSize = 18) {
    lines.push({ text, x: 50, y, size: fontSize, bold: true })
    y += fontSize + 12
  }

  function subheading(text) {
    lines.push({ text, x: 50, y, size: 13, bold: true })
    y += 22
  }

  function row(label, value) {
    lines.push({ text: `${label}:`, x: 50, y, size: 10, bold: true })
    lines.push({ text: String(value), x: 190, y, size: 10, bold: false })
    y += 17
  }

  function para(text, fontSize = 10) {
    const words = text.split(' ')
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (candidate.length > 82) {
        lines.push({ text: current, x: 50, y, size: fontSize, bold: false })
        y += fontSize + 5
        current = word
      } else {
        current = candidate
      }
    }
    if (current) {
      lines.push({ text: current, x: 50, y, size: fontSize, bold: false })
      y += fontSize + 5
    }
  }

  function gap(extra = 8) {
    y += extra
  }

  function rule() {
    // Simulate a horizontal rule with dashes
    lines.push({ text: '─'.repeat(72), x: 50, y, size: 8, bold: false })
    y += 14
  }

  // ── Title ──
  heading('Face Trace — Analysis Report', 20)
  lines.push({ text: `Generated: ${new Date().toLocaleString()}`, x: 50, y, size: 9, bold: false })
  y += 14
  rule()

  // ── File details ──
  subheading('File Details')
  row('File name', record.filename)
  row('File type', type)
  row('File size', size)
  row('Duration', duration)
  row('Saved', date)
  row('Local preview', record.previewAvailable ? 'Available' : 'Unavailable in browser')
  gap()

  // ── Workflow status ──
  rule()
  subheading('Workflow Status')
  const hasResult = !!(record.visual && record.visual.class_name)
  row('Status', hasResult ? 'Analysed — EfficientNet-B0 visual result available' : 'File check only — no analysis result')
  gap()

  // ── Assessment ──
  rule()
  subheading('Assessment Results')

  // Video meta
  if (record.videoMeta) {
    row('Video Assessment', 'Completed')
    row('  Duration', `${Number(record.videoMeta.duration_seconds).toFixed(1)}s`)
    row('  Frames analysed', `${record.videoMeta.frames_analyzed} of ${record.videoMeta.frames_requested}`)
  } else {
    row('Video Assessment', 'No data — run Analyze Now to generate results')
  }
  gap(6)

  // Visual prediction
  if (hasResult) {
    const CLASS_LABELS = {
      real: 'Real',
      face_replacement: 'Face Replacement',
      face_manipulation: 'Face Manipulation',
    }
    row('Visual Assessment', 'Completed')
    row('  Prediction', CLASS_LABELS[record.visual.class_name] ?? record.visual.class_name)
    row('  Confidence', `${Number(record.visual.confidence).toFixed(1)}%`)
    if (record.visual.probabilities) {
      for (const [cls, prob] of Object.entries(record.visual.probabilities)) {
        row(`  ${CLASS_LABELS[cls] ?? cls}`, `${Number(prob).toFixed(1)}%`)
      }
    }
  } else {
    row('Visual Assessment', 'No result — run Analyze Now to generate a prediction')
  }
  gap(6)

  // Audio
  row('Audio Assessment', record.audio?.message ?? 'Not available — audio model not connected')
  gap()

  // ── Notice ──
  rule()
  subheading('Important Notice')
  para('This report is generated by EfficientNet-B0 visual analysis only.')
  para('Audio analysis and Grad-CAM explainability are not implemented in the current pipeline.')
  if (!hasResult) {
    para('This report contains file metadata only. Run Analyze Now to generate a real prediction.')
  }
  para('AI predictions are not a guarantee of authenticity. Use results as one signal among many.')

  // ── Build and trigger download ──
  const pdfContent = buildPdf(lines)

  // Use Uint8Array to avoid encoding issues in Edge
  const bytes = new Uint8Array(pdfContent.length)
  for (let i = 0; i < pdfContent.length; i++) {
    bytes[i] = pdfContent.charCodeAt(i) & 0xff
  }

  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = (record.filename ?? 'report').replace(/[^a-zA-Z0-9._-]/g, '_')
  a.download = `FaceTrace_Report_${safeName}.pdf`
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
