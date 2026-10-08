import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, FileVideo, X } from 'lucide-react'
import Button from '../../components/Button/Button'
import Card from '../../components/Card/Card'
import { saveFileCheck } from '../../services/analysis'
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

function Analyze() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const selectionRef = useRef(0)
  const savingRef = useRef(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [duration, setDuration] = useState(null)
  const [mediaState, setMediaState] = useState('idle')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      selectionRef.current += 1
    }
  }, [])

  useEffect(() => {
    if (!file) {
      return
    }

    const url = URL.createObjectURL(file)
    const probe = document.createElement('video')
    let active = true
    setPreview(url)
    setMediaState('loading')
    setDuration(null)

    function unavailable() {
      if (active) {
        setMediaState('unsupported')
      }
    }

    const timeout = setTimeout(unavailable, 15000)
    probe.preload = 'metadata'
    probe.onloadedmetadata = () => {
      clearTimeout(timeout)
      if (!active) {
        return
      }
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
    if (!files?.length) {
      return
    }

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
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  function saveCheck() {
    if (!file || savingRef.current || !['ready', 'unsupported'].includes(mediaState)) {
      return
    }
    savingRef.current = true
    try {
      const result = saveFileCheck(file, duration, mediaState === 'ready')
      navigate(`/history/${result.id}`)
    } catch (failure) {
      setError(failure.message)
    } finally {
      savingRef.current = false
    }
  }

  return (
    <div className="analyze">
      <div className="analyze__header">
        <h1 className="analyze__title">Analyse Video</h1>
        <p className="analyze__subtitle">
          Select a video to check its format, preview it, and save its details.
        </p>
      </div>
      <p className="notice">
        AI analysis is not connected yet. Files stay on your device; saving a file check
        does not generate a prediction.
      </p>
      <div className="analyze__layout">
        <div className="analyze__left">
          {!file && (
            <div
              className={`dropzone ${dragOver ? 'dropzone--active' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setDragOver(false)
                }
              }}
              onDrop={(event) => {
                event.preventDefault()
                setDragOver(false)
                selectFiles(event.dataTransfer.files)
              }}
            >
              <UploadCloud
                size={38}
                aria-hidden="true"
              />
              <p className="dropzone__primary">Drag and drop your video here</p>
              <Button
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                disabled={mediaState === 'checking'}
              >
                {mediaState === 'checking' ? 'Checking file…' : 'Browse Files'}
              </Button>
              <p className="dropzone__hint">{VIDEO_FORMATS} · Up to 100 MB</p>
              <p className="dropzone__hint">
                Preview limit: 5 minutes when duration can be read
              </p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={VIDEO_ACCEPT}
            onChange={(event) => {
              selectFiles(event.target.files)
              event.target.value = ''
            }}
            className="analyze__file-input"
            aria-label="Select video file"
          />
          {error && (
            <p
              className="analyze__error"
              role="alert"
            >
              {error}
            </p>
          )}
          {file && (
            <Card>
              <div className="file-info">
                <FileVideo
                  size={24}
                  aria-hidden="true"
                />
                <div className="file-info__details">
                  <span
                    className="file-info__name"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <span className="file-info__meta">
                    {formatBytes(file.size)} · {formatDuration(duration)}
                  </span>
                </div>
                <button
                  type="button"
                  className="file-info__remove"
                  onClick={clearFile}
                  aria-label="Remove selected file"
                >
                  <X size={18} />
                </button>
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
            <p
              className="notice"
              role="status"
            >
              This browser cannot preview this codec, or the video is damaged. You can
              save its file details, but duration and playability are unverified. For
              preview, try an MP4 with H.264 video or a browser-compatible WebM.
            </p>
          )}
        </div>
        <div className="analyze__right">
          <Card title="File check">
            <div className="action-panel">
              <p className="muted">
                Save file details to your account history. The video itself is not stored.
              </p>
              <Button
                onClick={saveCheck}
                fullWidth
                disabled={!file || !['ready', 'unsupported'].includes(mediaState)}
              >
                Save file check
              </Button>
              {file && (
                <Button
                  variant="ghost"
                  onClick={clearFile}
                >
                  Choose another file
                </Button>
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
                <strong>Playback</strong>
                <span>
                  Depends on the codec and your browser. A supported extension does not
                  guarantee playback.
                </span>
              </li>
              <li>
                <strong>Analysis</strong>
                <span>
                  Visual predictions, speech checks, and heatmaps require the backend
                  models.
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
