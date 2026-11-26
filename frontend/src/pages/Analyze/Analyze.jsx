import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { UploadCloud, FileVideo, X, Download, CheckCircle, AlertCircle } from 'lucide-react'
import Button from '../../components/Button/Button'
import Card from '../../components/Card/Card'
import { saveFileCheck, updateRecordResult } from '../../services/analysis'
import { downloadReport } from '../../services/pdf'
import {
  VIDEO_ACCEPT,
  VIDEO_FORMATS,
  MAX_DURATION_SECONDS,
  validateVideo,
  verifyVideoHeader,
  formatBytes,
  formatDuration,
} from '../../services/media'
import './Analyze.css'

const BACKEND_URL = 'http://127.0.0.1:5000'

// Loading step labels shown while the backend processes
const LOADING_STEPS = [
  { key: 'upload',  label: 'Uploading video…' },
  { key: 'frames',  label: 'Sampling video frames…' },
  { key: 'faces',   label: 'Detecting faces…' },
  { key: 'model',   label: 'Running visual model…' },
]

const CLASS_LABELS = {
  real: 'Real',
  face_replacement: 'Face Replacement',
  face_manipulation: 'Face Manipulation',
}

const CLASS_COLORS = {
  real: 'var(--color-success)',
  face_replacement: 'var(--color-danger)',
  face_manipulation: 'var(--color-warning)',
}

function ProbBar({ label, value, highlight }) {
  return (
    <div className="prob-row">
      <span className="prob-row__label">{label}</span>
      <div className="prob-row__track">
        <div
          className="prob-row__fill"
          style={{ width: `${value}%`, background: highlight ? 'var(--color-accent)' : 'var(--color-border)' }}
        />
      </div>
      <span className="prob-row__value">{value.toFixed(1)}%</span>
    </div>
  )
}

function VisualResult({ visual }) {
  const label = CLASS_LABELS[visual.class_name] ?? visual.class_name
  const color = CLASS_COLORS[visual.class_name] ?? 'var(--color-text-primary)'
  return (
    <div className="visual-result">
      <div className="visual-result__verdict" style={{ color }}>
        <span className="visual-result__class">{label}</span>
        <span className="visual-result__conf">{visual.confidence.toFixed(1)}% confidence</span>
      </div>
      <div className="visual-result__probs">
        {Object.entries(visual.probabilities).map(([cls, prob]) => (
          <ProbBar
            key={cls}
            label={CLASS_LABELS[cls] ?? cls}
            value={prob}
            highlight={cls === visual.class_name}
          />
        ))}
      </div>
    </div>
  )
}

function Analyze() {
  const inputRef = useRef(null)
  const selectionRef = useRef(0)
  const analyzingRef = useRef(false)
  const abortRef = useRef(null)
  const assessmentRef = useRef(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [duration, setDuration] = useState(null)
  const [mediaState, setMediaState] = useState('idle')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  // workflow: 'idle' | 'running' | 'done' | 'error'
  const [workflow, setWorkflow] = useState('idle')
  const [loadingStep, setLoadingStep] = useState(0)
  const [savedRecord, setSavedRecord] = useState(null)
  const [apiResult, setApiResult] = useState(null)
  const [backendAvailable, setBackendAvailable] = useState(null) // null=unknown

  // Check health on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/health`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setBackendAvailable(data?.model_loaded === true))
      .catch(() => setBackendAvailable(false))
  }, [])

  useEffect(() => {
    return () => {
      selectionRef.current += 1
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const probe = document.createElement('video')
    let active = true
    setPreview(url)
    setMediaState('loading')
    setDuration(null)

    function unavailable() {
      if (active) setMediaState('unsupported')
    }
    const timeout = setTimeout(unavailable, 15000)
    probe.preload = 'metadata'
    probe.onloadedmetadata = () => {
      clearTimeout(timeout)
      if (!active) return
      if (!Number.isFinite(probe.duration) || probe.duration <= 0 || !probe.videoWidth) {
        setError('No readable video track was found. Choose a different file.')
        setMediaState('invalid')
        return
      }
      setDuration(probe.duration)
      if (probe.duration > MAX_DURATION_SECONDS) {
        setError('This video exceeds the 5-minute preview limit. Choose a shorter clip.')
        setMediaState('invalid')
        return
      }
      setMediaState('ready')
    }
    probe.onerror = () => { clearTimeout(timeout); unavailable() }
    probe.src = url
    return () => {
      active = false
      clearTimeout(timeout)
      probe.onloadedmetadata = null
      probe.onerror = null
      probe.removeAttribute('src')
      probe.load()
      URL.revokeObjectURL(url)
    }
  }, [file])

  async function selectFiles(files) {
    if (!files?.length) return
    const selection = ++selectionRef.current
    setError('')
    if (files.length !== 1) { setError('Select one video at a time.'); return }
    const chosen = files[0]
    const validationError = validateVideo(chosen)
    if (validationError) { setError(validationError); return }
    setMediaState('checking')
    setFile(null)
    setPreview('')
    setWorkflow('idle')
    setSavedRecord(null)
    setApiResult(null)
    try {
      await verifyVideoHeader(chosen)
      if (selection === selectionRef.current) setFile(chosen)
    } catch (failure) {
      if (selection === selectionRef.current) {
        setError(failure.message || 'The file could not be read. Try selecting it again.')
        setMediaState('idle')
      }
    }
  }

  function clearFile() {
    selectionRef.current += 1
    abortRef.current?.abort()
    setFile(null)
    setPreview('')
    setDuration(null)
    setMediaState('idle')
    setError('')
    setWorkflow('idle')
    setSavedRecord(null)
    setApiResult(null)
    setLoadingStep(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function runAnalysis() {
    if (!file || analyzingRef.current || !['ready', 'unsupported'].includes(mediaState)) return

    analyzingRef.current = true
    setWorkflow('running')
    setLoadingStep(0)
    setError('')
    setApiResult(null)

    // Save the local record immediately so we have an id
    let record
    try {
      record = saveFileCheck(file, duration, mediaState === 'ready')
      setSavedRecord(record)
    } catch (failure) {
      setError(failure.message)
      setWorkflow('idle')
      analyzingRef.current = false
      return
    }

    // Advance loading steps on a timer while fetch is in progress
    const stepTimer = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1))
    }, 1800)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      if (backendAvailable === false) {
        throw new Error('Backend is not running. Start the Flask server and try again.')
      }

      const formData = new FormData()
      formData.append('video', file)

      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server returned ${response.status}.`)
      }

      // Store real result into local history
      updateRecordResult(record.id, data)
      setApiResult(data)
      setWorkflow('done')

    } catch (failure) {
      if (failure.name === 'AbortError') {
        setWorkflow('idle')
      } else {
        const msg = failure.message || 'Analysis failed. Check the backend server.'
        setError(msg)
        setWorkflow('error')
      }
    } finally {
      clearInterval(stepTimer)
      setLoadingStep(LOADING_STEPS.length - 1)
      analyzingRef.current = false
      abortRef.current = null
    }
  }

  // Scroll to assessment section when analysis starts or results arrive
  useEffect(() => {
    if (workflow === 'running' || workflow === 'done') {
      setTimeout(() => {
        assessmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [workflow])

  const canAnalyze = !!file && ['ready', 'unsupported'].includes(mediaState) && workflow === 'idle'
  const isRunning = workflow === 'running'
  const isDone = workflow === 'done'
  const isError = workflow === 'error'

  return (
    <div className="analyze">
      <div className="analyze__header">
        <h1 className="analyze__title">Analyse Video</h1>
        <p className="analyze__subtitle">
          Upload a video to run EfficientNet-B0 visual deepfake detection.
        </p>
      </div>

      {backendAvailable === false && (
        <p className="analyze__error" role="alert">
          Backend is offline. Start the Flask server at <code>http://127.0.0.1:5000</code> before analysing.
        </p>
      )}

      <div className="analyze__layout">
        {/* ── Left column ── */}
        <div className="analyze__left">
          {!file && (
            <div
              className={`dropzone${dragOver ? ' dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false) }}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); selectFiles(e.dataTransfer.files) }}
            >
              <UploadCloud size={38} aria-hidden="true" />
              <p className="dropzone__primary">Drag and drop your video here</p>
              <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={mediaState === 'checking'}>
                {mediaState === 'checking' ? 'Checking file…' : 'Browse Files'}
              </Button>
              <p className="dropzone__hint">{VIDEO_FORMATS} · Up to 100 MB</p>
              <p className="dropzone__hint">Max duration: 5 minutes</p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={VIDEO_ACCEPT}
            onChange={(e) => { selectFiles(e.target.files); e.target.value = '' }}
            className="analyze__file-input"
            aria-label="Select video file"
          />

          {error && <p className="analyze__error" role="alert">{error}</p>}

          {file && (
            <Card>
              <div className="file-info">
                <FileVideo size={24} aria-hidden="true" />
                <div className="file-info__details">
                  <span className="file-info__name" title={file.name}>{file.name}</span>
                  <span className="file-info__meta">{formatBytes(file.size)} · {formatDuration(duration)}</span>
                </div>
                {workflow === 'idle' && (
                  <button type="button" className="file-info__remove" onClick={clearFile} aria-label="Remove selected file">
                    <X size={18} />
                  </button>
                )}
              </div>
            </Card>
          )}

          {file && mediaState === 'loading' && <p role="status">Reading video details…</p>}

          {preview && mediaState === 'ready' && (
            <Card title="Local preview">
              <video key={preview} src={preview} controls preload="metadata" className="analyze__video"
                aria-label="Selected video preview" onError={() => setMediaState('unsupported')}>
                Your browser cannot play this video.
              </video>
            </Card>
          )}

          {workflow === 'idle' && (
            <Button onClick={runAnalysis} fullWidth disabled={!canAnalyze}>
              Analyze Now
            </Button>
          )}

          {mediaState === 'unsupported' && (
            <p className="notice" role="status">
              This browser cannot preview this codec. You can still run the analysis.
            </p>
          )}

          {/* ── Loading state ── */}
          {isRunning && (
            <div className="assessment-sections" ref={assessmentRef}>
              <h2 className="assessment-sections__heading">Analysis in progress</h2>
              {LOADING_STEPS.map((step, i) => (
                <div key={step.key} className="assessment-section">
                  <div className="assessment-section__header">
                    <span className="assessment-section__label">{step.label}</span>
                    {i < loadingStep && (
                      <span className="assessment-section__status assessment-section__status--done">
                        <CheckCircle size={14} aria-hidden="true" /> Done
                      </span>
                    )}
                    {i === loadingStep && (
                      <span className="assessment-section__status assessment-section__status--running" role="status">
                        <span className="spinner" aria-hidden="true" /> Running…
                      </span>
                    )}
                    {i > loadingStep && (
                      <span className="assessment-section__status assessment-section__status--idle">Waiting</span>
                    )}
                  </div>
                  {i === loadingStep && (
                    <div className="assessment-progress" aria-hidden="true">
                      <div className="assessment-progress__bar" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Results ── */}
          {isDone && apiResult && (
            <div className="assessment-sections" ref={assessmentRef}>
              <h2 className="assessment-sections__heading">Results</h2>

              {/* Video info */}
              <div className="assessment-section">
                <div className="assessment-section__header">
                  <span className="assessment-section__label">Video Assessment</span>
                  <span className="assessment-section__status assessment-section__status--done">
                    <CheckCircle size={14} aria-hidden="true" /> Complete
                  </span>
                </div>
                <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
                  {apiResult.video.frames_analyzed} of {apiResult.video.frames_requested} frames analysed
                  · {formatDuration(apiResult.video.duration_seconds)}
                </p>
              </div>

              {/* Visual prediction */}
              <div className="assessment-section">
                <div className="assessment-section__header">
                  <span className="assessment-section__label">Visual Assessment</span>
                  <span className="assessment-section__status assessment-section__status--done">
                    <CheckCircle size={14} aria-hidden="true" /> Complete
                  </span>
                </div>
                <VisualResult visual={apiResult.visual} />
              </div>

              {/* Audio */}
              <div className="assessment-section">
                <div className="assessment-section__header">
                  <span className="assessment-section__label">Audio Assessment</span>
                  <span className="assessment-section__status assessment-section__status--idle">
                    <AlertCircle size={14} aria-hidden="true" /> Not available
                  </span>
                </div>
                <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
                  {apiResult.audio.message}
                </p>
              </div>

              {/* Extracted frames */}
              {apiResult.extracted_frames?.length > 0 && (
                <div className="assessment-section">
                  <div className="assessment-section__header">
                    <span className="assessment-section__label">Extracted Frames</span>
                    <span className="assessment-section__status assessment-section__status--done">
                      <CheckCircle size={14} aria-hidden="true" /> {apiResult.video.frames_analyzed} frames analysed
                    </span>
                  </div>
                  <p style={{fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)'}}>
                    Sample frames analysed by the model (cropped and resized to 224×224)
                  </p>
                  <div className="extracted-frames">
                    {apiResult.extracted_frames.map((frame, i) => (
                      <img
                        key={i}
                        src={`data:image/jpeg;base64,${frame}`}
                        alt={`Extracted frame ${i + 1}`}
                        className="extracted-frame"
                        onClick={() => window.open(`data:image/jpeg;base64,${frame}`, '_blank')}
                        title="Click to view full size"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Post-completion actions ── */}
          {(isDone || isError) && savedRecord && (
            <div className="analyze__post-actions">
              {isDone && (
                <p className="analyze__complete-msg">
                  Analysis complete. Results saved to your history.
                </p>
              )}
              <div className="action-row">
                {isDone && (
                  <Button onClick={() => downloadReport({ ...savedRecord, visual: apiResult?.visual, audio: apiResult?.audio, videoMeta: apiResult?.video })}>
                    <Download size={16} aria-hidden="true" />
                    Download Report
                  </Button>
                )}
                <Link to={`/history/${savedRecord.id}`} className="btn btn--secondary">
                  View in History
                </Link>
                <Button variant="ghost" onClick={clearFile}>
                  Analyse another
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="analyze__right">
          <Card title={isRunning ? 'Analysing…' : isDone ? 'Analysis complete' : 'Run analysis'}>
            <div className="action-panel">
              {workflow === 'idle' && (
                <>
                  <p className="muted">
                    The video is sent to the local Flask backend for EfficientNet-B0 visual analysis.
                    Nothing is uploaded to external servers.
                  </p>
                </>
              )}
              {isRunning && (
                <p className="muted" role="status">
                  Processing… this may take a few seconds depending on video length.
                </p>
              )}
              {isDone && (
                <p className="muted" role="status">Analysis complete. See results on the left.</p>
              )}
              {isError && (
                <Button variant="secondary" onClick={() => { setWorkflow('idle'); setError('') }}>
                  Try again
                </Button>
              )}
            </div>
          </Card>

          <Card title="File support">
            <ul className="support-list">
              <li><strong>Containers</strong><span>{VIDEO_FORMATS}</span></li>
              <li><strong>Size limit</strong><span>100 MB</span></li>
              <li><strong>Duration limit</strong><span>5 minutes</span></li>
              <li><strong>Visual model</strong><span>EfficientNet-B0, 3 classes: Real, Face Replacement, Face Manipulation</span></li>
              <li><strong>Audio model</strong><span>Not connected — audio status will show as unavailable</span></li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Analyze
