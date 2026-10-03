import { useState, useRef, useCallback } from 'react'
import {
  UploadCloud,
  FileVideo,
  X,
  Play,
  ScanFace,
  CheckCircle2,
  AlertTriangle,
  Loader,
} from 'lucide-react'
import Button from '../../components/Button/Button'
import Card   from '../../components/Card/Card'
import { analyzeVideo } from '../../services/api'
import './Analyze.css'

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

/** Accepted MIME types shown to the browser's file picker */
const ACCEPTED_MIME = 'video/mp4,video/x-msvideo,video/quicktime,video/x-matroska,video/webm'

/** Human-readable format list shown in the UI */
const ACCEPTED_LABEL = 'MP4, AVI, MOV, MKV, WebM'

/** Max file size in bytes (100 MB) */
const MAX_SIZE_BYTES = 100 * 1024 * 1024

/** States the page can be in */
const PAGE_STATE = {
  IDLE:       'idle',       // no file selected
  SELECTED:   'selected',   // file chosen, ready to analyse
  PROCESSING: 'processing', // demo processing animation
  DONE:       'done',       // demo result returned
  ERROR:      'error',      // something went wrong
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k    = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i    = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function isValidVideo(file) {
  const validTypes = [
    'video/mp4',
    'video/x-msvideo',
    'video/quicktime',
    'video/x-matroska',
    'video/webm',
  ]
  return validTypes.includes(file.type) || file.name.match(/\.(mp4|avi|mov|mkv|webm)$/i)
}

// ─────────────────────────────────────────────────────────────
// Analyze page
// ─────────────────────────────────────────────────────────────

function Analyze() {
  const fileInputRef          = useRef(null)
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)   // object URL for local preview
  const [dragOver, setDragOver] = useState(false)
  const [pageState, setPageState] = useState(PAGE_STATE.IDLE)
  const [error, setError]     = useState('')
  const [progress, setProgress] = useState(0)    // 0-100 demo progress

  // ── File selection ────────────────────────────────────────
  const selectFile = useCallback((chosen) => {
    if (!chosen) return

    if (!isValidVideo(chosen)) {
      setError(`Unsupported file type. Please upload: ${ACCEPTED_LABEL}`)
      return
    }
    if (chosen.size > MAX_SIZE_BYTES) {
      setError(`File is too large. Maximum size is 100 MB.`)
      return
    }

    // Revoke previous object URL to avoid memory leak
    if (preview) URL.revokeObjectURL(preview)

    setError('')
    setFile(chosen)
    setPreview(URL.createObjectURL(chosen))
    setPageState(PAGE_STATE.SELECTED)
    setProgress(0)
  }, [preview])

  // ── Remove selection ──────────────────────────────────────
  function clearFile() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setPageState(PAGE_STATE.IDLE)
    setError('')
    setProgress(0)
    // Reset the hidden input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Drag-and-drop handlers ────────────────────────────────
  function onDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function onDragLeave(e) {
    e.preventDefault()
    setDragOver(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) selectFile(dropped)
  }

  // ── Input change ──────────────────────────────────────────
  function onInputChange(e) {
    selectFile(e.target.files[0])
  }

  // ── Analyse submit ────────────────────────────────────────
  async function handleAnalyze() {
    if (!file || pageState === PAGE_STATE.PROCESSING) return

    setPageState(PAGE_STATE.PROCESSING)
    setError('')
    setProgress(0)

    try {
      /*
       * ── Flask integration point ──────────────────────────
       * When the Flask API is ready, replace the demo block below
       * with a real call:
       *
       *   const result = await analyzeVideo(file, (pct) => setProgress(pct))
       *   // then navigate to a results page or display inline
       *
       * The analyzeVideo function in src/services/api.js already
       * accepts (videoFile, onProgress) — no changes to this
       * component will be needed beyond removing the demo block.
       * ────────────────────────────────────────────────────── */

      // Demo: log the API stub call so the hook is visible
      await analyzeVideo(file, (pct) => setProgress(pct))

      // Demo: simulate incremental progress over ~3 seconds
      await new Promise((resolve) => {
        let pct = 0
        const interval = setInterval(() => {
          pct += Math.floor(Math.random() * 12) + 4
          if (pct >= 100) {
            pct = 100
            setProgress(100)
            clearInterval(interval)
            resolve()
          } else {
            setProgress(pct)
          }
        }, 200)
      })

      setPageState(PAGE_STATE.DONE)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
      setPageState(PAGE_STATE.ERROR)
    }
  }

  // ── Reset to run another analysis ────────────────────────
  function handleReset() {
    clearFile()
  }

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="analyze">

      {/* Page header */}
      <div className="analyze__header">
        <h1 className="analyze__title">Analyse Video</h1>
        <p className="analyze__subtitle">
          Upload a video to check it for signs of deepfake manipulation.
          Both visual frames and embedded audio will be examined.
        </p>
      </div>

      <div className="analyze__layout">

        {/* ── Left: upload + preview ──────────────────────── */}
        <div className="analyze__left">

          {/* Drop zone — hidden once a file is selected */}
          {pageState === PAGE_STATE.IDLE && (
            <div
              className={`dropzone ${dragOver ? 'dropzone--active' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload video — click or drag and drop"
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <div className="dropzone__icon">
                <UploadCloud size={40} />
              </div>
              <p className="dropzone__primary">
                Drag &amp; drop your video here
              </p>
              <p className="dropzone__secondary">or</p>
              <Button variant="secondary" size="md" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                Browse Files
              </Button>
              <p className="dropzone__hint">
                Accepted formats: {ACCEPTED_LABEL}
              </p>
              <p className="dropzone__hint">Maximum size: 100 MB</p>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_MIME}
            onChange={onInputChange}
            className="analyze__file-input"
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* File info card — shown after selection */}
          {file && (
            <Card className="analyze__file-card">
              <div className="file-info">
                <div className="file-info__icon">
                  <FileVideo size={24} />
                </div>
                <div className="file-info__details">
                  <span className="file-info__name">{file.name}</span>
                  <span className="file-info__meta">
                    {formatBytes(file.size)}
                    &nbsp;&middot;&nbsp;
                    {file.type || 'video'}
                  </span>
                </div>
                {/* Only allow removal when not mid-processing */}
                {pageState !== PAGE_STATE.PROCESSING && (
                  <button
                    className="file-info__remove"
                    onClick={clearFile}
                    aria-label="Remove selected file"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Local video preview */}
          {preview && pageState !== PAGE_STATE.DONE && (
            <Card title="Preview" className="analyze__preview-card">
              <div className="analyze__video-wrap">
                <video
                  src={preview}
                  controls
                  className="analyze__video"
                  aria-label="Selected video preview"
                >
                  Your browser does not support the video element.
                </video>
              </div>
            </Card>
          )}

          {/* Validation error */}
          {error && (
            <div className="analyze__error" role="alert">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Right: action panel ─────────────────────────── */}
        <div className="analyze__right">
          <Card title="Analysis" subtitle="Run deepfake detection on the uploaded video">

            {/* IDLE — no file yet */}
            {pageState === PAGE_STATE.IDLE && (
              <div className="action-panel action-panel--idle">
                <ScanFace size={36} className="action-panel__icon" />
                <p className="action-panel__msg">
                  Select a video to enable analysis.
                </p>
              </div>
            )}

            {/* SELECTED — ready to run */}
            {pageState === PAGE_STATE.SELECTED && (
              <div className="action-panel">
                <p className="action-panel__ready">
                  Video ready. Click below to begin.
                </p>
                <Button fullWidth size="lg" onClick={handleAnalyze}>
                  <ScanFace size={18} />
                  Analyse Video
                </Button>
                <button className="action-panel__change" onClick={clearFile}>
                  Choose a different file
                </button>
              </div>
            )}

            {/* PROCESSING — demo progress bar */}
            {pageState === PAGE_STATE.PROCESSING && (
              <div className="action-panel">
                <div className="action-panel__processing-header">
                  <Loader size={18} className="action-panel__spinner" />
                  <span>Analysing&hellip; {progress}%</span>
                </div>

                <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
                </div>

                <ul className="action-panel__steps">
                  <li className={progress >= 20  ? 'done' : ''}>Extracting frames</li>
                  <li className={progress >= 45  ? 'done' : ''}>Running EfficientNet</li>
                  <li className={progress >= 70  ? 'done' : ''}>Analysing audio (Wav2Vec2)</li>
                  <li className={progress >= 90  ? 'done' : ''}>Generating Grad-CAM maps</li>
                  <li className={progress >= 100 ? 'done' : ''}>Compiling result</li>
                </ul>

                <p className="action-panel__demo-note">
                  <AlertTriangle size={12} />
                  Demo mode — no real analysis is running.
                </p>
              </div>
            )}

            {/* DONE — demo result */}
            {pageState === PAGE_STATE.DONE && (
              <div className="action-panel">
                <div className="action-panel__result">
                  <CheckCircle2 size={40} className="action-panel__result-icon" />
                  <h3 className="action-panel__result-title">Analysis Complete</h3>
                  <p className="action-panel__result-sub">
                    This is a frontend-only demo result.<br />
                    Real predictions will appear here after Flask API integration.
                  </p>
                </div>

                {/* Placeholder result metrics */}
                <div className="result-metrics">
                  <div className="result-metric">
                    <span className="result-metric__label">Verdict</span>
                    <span className="badge badge--success">Authentic (demo)</span>
                  </div>
                  <div className="result-metric">
                    <span className="result-metric__label">Confidence</span>
                    <span className="result-metric__value">— %</span>
                  </div>
                  <div className="result-metric">
                    <span className="result-metric__label">Audio Check</span>
                    <span className="result-metric__value">— </span>
                  </div>
                  <div className="result-metric">
                    <span className="result-metric__label">Grad-CAM</span>
                    <span className="result-metric__value">Not available (demo)</span>
                  </div>
                </div>

                <Button variant="secondary" fullWidth onClick={handleReset}>
                  Analyse Another Video
                </Button>
              </div>
            )}

            {/* ERROR state */}
            {pageState === PAGE_STATE.ERROR && (
              <div className="action-panel">
                <div className="analyze__error" role="alert">
                  <AlertTriangle size={15} />
                  <span>{error || 'An unexpected error occurred.'}</span>
                </div>
                <Button variant="secondary" fullWidth onClick={() => setPageState(PAGE_STATE.SELECTED)}>
                  Try Again
                </Button>
              </div>
            )}

          </Card>

          {/* Info card */}
          <Card title="What gets analysed?">
            <ul className="analyze__info-list">
              <li>
                <Play size={13} />
                <span><strong>Visual frames</strong> — EfficientNet scans each frame for manipulation artefacts</span>
              </li>
              <li>
                <Play size={13} />
                <span><strong>Audio track</strong> — Wav2Vec2 checks for synthetic or cloned speech</span>
              </li>
              <li>
                <Play size={13} />
                <span><strong>Grad-CAM heatmaps</strong> — highlights suspicious regions per frame</span>
              </li>
              <li>
                <Play size={13} />
                <span><strong>Confidence score</strong> — combined probability returned for each modality</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Analyze
