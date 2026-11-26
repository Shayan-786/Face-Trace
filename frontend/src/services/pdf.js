/**
 * pdf.js — minimal client-side PDF generation for Face Trace reports.
 * Generates a valid PDF 1.4 document without external dependencies.
 * Only plain text content; no images or embedded fonts required.
 */

import { formatBytes, formatDuration } from './media.js'

// ---------------------------------------------------------------------------
// Low-level PDF helpers
// ---------------------------------------------------------------------------

function escStr(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7e]/g, (ch) => {
      const code = ch.codePointAt(0)
      return code !== undefined ? `\\${code.toString(8).padStart(3, '0')}` : ''
    })
}

function buildPdf(lines) {
  // Each line: { text, x, y, size, bold }
  const objects = []
  const offsets = []

  function addObject(content) {
    const id = objects.length + 1
    offsets.push(null) // placeholder
    objects.push({ id, content })
    return id
  }

  // Page width / height in points (A4)
  const W = 595
  const H = 842

  // Build content stream
  const streamLines = []
  for (const line of lines) {
    const font = line.bold ? '/F2' : '/F1'
    streamLines.push(`BT`)
    streamLines.push(`${font} ${line.size} Tf`)
    streamLines.push(`${line.x} ${H - line.y} Td`)
    streamLines.push(`(${escStr(line.text)}) Tj`)
    streamLines.push(`ET`)
  }
  const streamBody = streamLines.join('\n')

  // Object 1 — catalog (placeholder until we know page id)
  addObject('') // catalog — filled later
  // Object 2 — pages (placeholder)
  addObject('')
  // Object 3 — font Helvetica
  addObject(
    '/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n/Encoding /WinAnsiEncoding',
  )
  // Object 4 — font Helvetica-Bold
  addObject(
    '/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica-Bold\n/Encoding /WinAnsiEncoding',
  )
  // Object 5 — content stream
  const streamId = addObject(
    `<< /Length ${streamBody.length} >>\nstream\n${streamBody}\nendstream`,
  )
  // Object 6 — page
  const pageId = addObject(
    `/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 ${W} ${H}]\n/Contents ${streamId} 0 R\n/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>`,
  )

  // Fix catalog and pages
  objects[0].content = `/Type /Catalog\n/Pages 2 0 R`
  objects[1].content = `/Type /Pages\n/Kids [${pageId} 0 R]\n/Count 1`

  // Serialise
  const parts = ['%PDF-1.4\n']
  for (const obj of objects) {
    offsets[obj.id - 1] = parts.join('').length
    parts.push(`${obj.id} 0 obj\n<< ${obj.content} >>\nendobj\n`)
  }

  const xrefOffset = parts.join('').length
  const count = objects.length + 1
  const xref = [
    'xref',
    `0 ${count}`,
    '0000000000 65535 f ',
    ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${count} /Root 1 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
  ]
  parts.push(xref.join('\n'))
  return parts.join('')
}

// ---------------------------------------------------------------------------
// Report layout
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

  function heading(text, size = 16) {
    lines.push({ text, x: 50, y, size, bold: true })
    y += size + 10
  }

  function subheading(text) {
    lines.push({ text, x: 50, y, size: 12, bold: true })
    y += 20
  }

  function row(label, value) {
    lines.push({ text: `${label}:`, x: 50, y, size: 10, bold: true })
    lines.push({ text: String(value), x: 180, y, size: 10, bold: false })
    y += 16
  }

  function para(text, size = 10) {
    // Wrap at ~80 chars
    const words = text.split(' ')
    let current = ''
    for (const word of words) {
      if ((current + ' ' + word).trim().length > 80) {
        lines.push({ text: current.trim(), x: 50, y, size, bold: false })
        y += size + 4
        current = word
      } else {
        current = current ? current + ' ' + word : word
      }
    }
    if (current) {
      lines.push({ text: current.trim(), x: 50, y, size, bold: false })
      y += size + 4
    }
  }

  function divider() {
    y += 8
  }

  // Title
  heading('Face Trace', 22)
  lines[lines.length - 1].text = 'Face Trace — Analysis Report'
  divider()

  // File details
  subheading('File Details')
  row('File name', record.filename)
  row('File type', type)
  row('File size', size)
  row('Duration', duration)
  row('Date and time', date)
  row('Preview', record.previewAvailable ? 'Available' : 'Unavailable in browser')
  divider()

  // Workflow status
  subheading('Workflow Status')
  const hasRealResult = record.visual && record.visual.class_name
  row('Status', hasRealResult ? 'Analysed — EfficientNet-B0 visual result available' : 'File check only — no analysis result')
  divider()

  // Assessment sections
  subheading('Assessment Results')

  // Video
  if (record.videoMeta) {
    row('Video Assessment', 'Completed')
    row('  Duration', `${Number(record.videoMeta.duration_seconds).toFixed(1)}s`)
    row('  Frames analysed', `${record.videoMeta.frames_analyzed} of ${record.videoMeta.frames_requested}`)
  } else {
    row('Video Assessment', 'No data — run Analyze Now to generate results')
  }

  // Visual
  if (hasRealResult) {
    const classLabels = { real: 'Real', face_replacement: 'Face Replacement', face_manipulation: 'Face Manipulation' }
    row('Visual Assessment', 'Completed')
    row('  Prediction', classLabels[record.visual.class_name] ?? record.visual.class_name)
    row('  Confidence', `${Number(record.visual.confidence).toFixed(1)}%`)
    if (record.visual.probabilities) {
      for (const [cls, prob] of Object.entries(record.visual.probabilities)) {
        row(`  ${classLabels[cls] ?? cls}`, `${Number(prob).toFixed(1)}%`)
      }
    }
  } else {
    row('Visual Assessment', 'No result — run Analyze Now to generate a prediction')
  }

  // Audio
  row('Audio Assessment', record.audio?.message ?? 'Not available — audio model not connected')
  divider()

  // Disclaimer
  y += 10
  subheading('Important Notice')
  para('AI prediction is generated by EfficientNet-B0 visual analysis only.', 10)
  para('Audio analysis and Grad-CAM explanation are not implemented in the current pipeline.', 10)
  if (!hasRealResult) {
    para('This report contains file metadata only. Run Analyze Now to generate a real prediction.', 10)
  }
  divider()

  // Footer
  y += 20
  lines.push({
    text: `Generated by Face Trace — ${new Date().toLocaleString()}`,
    x: 50,
    y,
    size: 8,
    bold: false,
  })

  const pdfText = buildPdf(lines)
  const blob = new Blob([pdfText], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = record.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  a.download = `FaceTrace_Report_${safeName}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
