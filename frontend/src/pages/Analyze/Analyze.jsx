import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { UploadCloud, FileVideo, X, Download, Clock } from 'lucide-react'
import Button from '../../components/Button/Button'
import Card from '../../components/Card/Card'
import { saveFileCheck } from '../../services/analysis'
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

// Workflow phases: idle | running | done
const ASSESSMENT_SECTIONS = [
  { key: 'video', label: 'Video Assessment' },
  { key: 'visual', label: 'Visual Assessment' },
  { key: 'audio', label: 'Audio Assessment' },
]

function AssessmentSection({ label, phase }) {
  return (
    <div className="assessment-section">
      <div className="assessment-section__header">
        <span className="assessment-section__label">{label}</span>
        {phase === 'running' && (
          <span
            className="assessment-section__status assessment-section__status--running"
            role="status"
          >
            <span
              className="spinner"
              aria-hidden="true"
            />
            Analysing…
          </span>
        )}
        {phase === 'done' && (
          <span className="assessment-section__status assessment-section__status--done">
            Completed — model result pending backend integration
          </span>
        )}
        {phase === 'idle' && (
          <span className="assessment-section__status assessment-section__status--idle">
            Waiting
          </span>
        )}
      </div>
      {phase === 'running' && (
        <div
          className="assessment-progress"
          aria-hidden="true"
        >
          <div className="assessment-progress__bar" />
        </div>
      )}
    </div>
  )
}

function Analyze() {
  const inputRef = useRef(null)
  const selectionRef = useRef(0)
  const analyzingRef = useRef(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [duration, setDuration] = useState(null)
  const [mediaState, setMediaState] = useState('idle')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  // workflow: 'idle' | 'running' | 'done'
  const [workflow, setWorkflow] = useState('idle')
  // per-section phase: 'idle' | 'running' | 'done'
  const [sectionPhase, setSectionPhase] = useState({ video: 'idle', visual: 'idle', audio: 'idle' })
  const [savedRecord, setSavedRecord] = useState(null)

  useEffect(() => {
    return () => {
      selectionRef.current += 1
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
    probe.onerror = () => {
      clearTimeout(timeout)
      unavailable()
    }
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
    if (files.length !== 1) {
      setError('Select one video at a time.')
      return
    }
    const chosen = files[0]
    const validationError = validateVideo(chosen)
    if (validationError) {
      setError(validationError)
      return
    }

    setMediaState('checking')
    setFile(null)
    setPreview('')
    setWorkflow('idle')
    setSavedRecord(null)
    setSectionPhase({ video: 'idle', visual: 'idle', audio: 'idle' })

    try {
      await verifyVideoHeader(chosen)
      if (selection === selectionRef.current) {
        setFile(chosen)
      }
    } catch (failure) {
      if (selection === selectionRef.current) {
        setError(failure.message || 'The file could not be read. Try selecting it again.')
        setMediaState('idle')
      }
    }
  }

  function clearFile() {
    selectionRef.current += 1
    setFile(null)
    setPreview('')
    setDuration(null)
    setMediaState('idle')
    setError('')
    setWorkflow('idle')
    setSavedRecord(null)
    setSectionPhase({ video: 'idle', visual: 'idle', audio: 'idle' })
    if (inputRef.current) inputRef.current.value = ''
  }

  async function runAnalysis() {
    if (!file || analyzingRef.current || !['ready', 'unsupported'].includes(mediaState)) return

    analyzingRef.current = true
    setWorkflow('running')
    setSectionPhase({ video: 'idle', visual: 'idle', audio: 'idle' })
    setError('')

    try {
      // Save the record first
      const record = saveFileCheck(file, duration, mediaState === 'ready')
      setSavedRecord(record)

      // Simulate local workflow progress for each section sequentially
      const sections = ['video', 'visual', 'audio']
      const delays = [1200, 1400, 1300]

      for (let i = 0; i < sections.length; i++) {
        const key = sections[i]
        setSectionPhase((prev) => ({ ...prev, [key]: 'running' }))
        await new Promise((resolve) => setTimeout(resolve, delays[i]))
        setSectionPhase((prev) => ({ ...prev, [key]: 'done' }))
      }

      setWorkflow('done')
    } catch (failure) {
      setError(failure.message)
      setWorkflow('idle')
      setSectionPhase({ video: 'idle', visual: 'idle', audio: 'idle' })
    } finally {
      analyzingRef.current = false
    }
  }

  const canAnalyze = !!file && ['ready', 'unsupported'].includes(mediaState) && workflow === 'idle'

  return (
    <div className="analyze">
      <div className="analyze__header">
        <h1 className="analyze__title">Analyse Video</h1>
        <p className="analyze__subtitle">
          Select a video to validate, preview, and run a local workflow check.
        </p>
      </div>

      <p className="notice">
        AI analysis is not connected yet. Files stay on your device; running the workflow
        does not generate a prediction or deepfake verdict.
      </p>

      <div className="analyze__layout">
        {/* ── Left column ── */}
        <div className="analyze__left">
          {!file && (
            <div
              className={`dropzone${dragOver ? ' dropzone--active' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setDragOver(true) }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDragOver(false)
              }}
              onDrop={(event) => {
                event.preventDefault()
                setDragOver(false)
                selectFiles(event.dataTransfer.files)
              }}
            >
              <UploadCloud size={38} aria-hidden="true" />
              <p className="dropzone__primary">Drag and drop your video here</p>
              <Button
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                disabled={mediaState === 'checking'}
              >
                {mediaState === 'checking' ? 'Checking file…' : 'Browse Files'}
              </Button>
              <p className="dropzone__hint">{VIDEO_FORMATS} · Up to 100 MB</p>
              <p className="dropzone__hint">Preview limit: 5 minutes when duration can be read</p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={VIDEO_ACCEPT}
            onChange={(event) => { selectFiles(event.target.files); event.target.value = '' }}
            className="analyze__file-input"
            aria-label="Select video file"
          />

          {error && (
            <p className="analyze__error" role="alert">{error}</p>
          )}

          {file && (
            <Card>
              <div className="file-info">
                <FileVideo size={24} aria-hidden="true" />
                <div className="file-info__details">
                  <span className="file-info__name" title={file.name}>{file.name}</span>
                  <span className="file-info__meta">
                    {formatBytes(file.size)} · {formatDuration(duration)}
                  </span>
                </div>
                {workflow === 'idle' && (
                  <button
                    type="button"
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

          {file && mediaState === 'loading' && (
            <p role="status">Reading video details…</p>
          )}

          {preview && mediaState === 'ready' && (
            <Card title="Local preview">
              <video
                key={preview}
                src={preview}
                controls
                preload="metadata"
                className="analyze__video"
                aria-label="Selected video preview"
                onError={() => setMediaState('unsupported')}
              >
                Your browser cannot play this video.
              </video>
            </Card>
          )}

          {mediaState === 'unsupported' && (
            <p className="notice" role="status">
              This browser cannot preview this codec, or the video is damaged. You can
              still run the workflow. For preview, try an MP4 with H.264 or a compatible WebM.
            </p>
          )}

          {/* Assessment sections */}
          {(workflow === 'running' || workflow === 'done') && (
            <div className="assessment-sections">
              <h2 className="assessment-sections__heading">Assessment</h2>
              {ASSESSMENT_SECTIONS.map(({ key, label }) => (
                <AssessmentSection key={key} label={label} phase={sectionPhase[key]} />
              ))}
            </div>
          )}

          {/* Post-completion actions */}
          {workflow === 'done' && savedRecord && (
            <div className="analyze__post-actions">
              <p className="analyze__complete-msg">
                Workflow complete. Backend model integration required for AI predictions.
              </p>
              <div className="action-row">
                <Button
                  onClick={() => downloadReport(savedRecord)}
                >
                  <Download size={16} aria-hidden="true" />
                  Download Report
                </Button>
                <Link
                  to={`/history/${savedRecord.id}`}
                  className="btn btn--secondary"
                >
                  View in History
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="analyze__right">
          <Card title={workflow === 'running' ? 'Analysing…' : workflow === 'done' ? 'Analysis complete' : 'Run analysis'}>
            <div className="action-panel">
              {workflow === 'idle' && (
                <>
                  <p className="muted">
                    Validate the video file and run the local workflow. The video is not
                    uploaded; no AI prediction is generated.
                  </p>
                  <Button
                    onClick={runAnalysis}
                    fullWidth
                    disabled={!canAnalyze}
                  >
                    Analyze Now
                  </Button>
                  {file && (
                    <Button variant="ghost" onClick={clearFile}>
                      Choose another file
                    </Button>
                  )}
                </>
              )}
              {workflow === 'running' && (
                <p className="muted" role="status">
                  <Clock size={14} aria-hidden="true" /> Running local workflow checks…
                </p>
              )}
              {workflow === 'done' && (
                <p className="muted" role="status">
                  Workflow finished. See results on the left.
                </p>
              )}
            </div>
          </Card>

          <Card title="File support">
            <ul className="support-list">
              <li>
                <strong>Accepted containers</strong>
                <span>{VIDEO_FORMATS}</span>
              </li>
              <li>
                <strong>Size limit</strong>
                <span>100 MB</span>
              </li>
              <li>
                <strong>Playback</strong>
                <span>
                  Depends on the codec and your browser. A supported extension does not
                  guarantee playback.
                </span>
              </li>
              <li>
                <strong>AI analysis</strong>
                <span>
                  Visual predictions, speech checks, and heatmaps require backend model
                  integration.
                </span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Analyze
