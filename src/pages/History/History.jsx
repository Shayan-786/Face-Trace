import { Link } from 'react-router-dom'
import {
  FileVideo,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ScanFace,
} from 'lucide-react'
import Card   from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import './History.css'

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// These are hard-coded demo records for the first FYP evaluation.
// Real records will be loaded from the Flask API / MySQL database
// once backend integration is implemented (Phase 7+).
// ─────────────────────────────────────────────────────────────
const MOCK_HISTORY = [
  {
    id:         1,
    filename:   'interview_clip.mp4',
    date:       '2026-09-28',
    time:       '14:32',
    prediction: 'Real',
    confidence: 92,
    status:     'completed',
    duration:   '1m 42s',
    fileSize:   '38.4 MB',
  },
  {
    id:         2,
    filename:   'speech_video.avi',
    date:       '2026-09-27',
    time:       '09:15',
    prediction: 'Face Replacement',
    confidence: 87,
    status:     'completed',
    duration:   '3m 08s',
    fileSize:   '72.1 MB',
  },
  {
    id:         3,
    filename:   'news_segment.mp4',
    date:       '2026-09-26',
    time:       '17:04',
    prediction: 'Real',
    confidence: 95,
    status:     'completed',
    duration:   '0m 55s',
    fileSize:   '21.7 MB',
  },
  {
    id:         4,
    filename:   'social_clip.mov',
    date:       '2026-09-24',
    time:       '11:50',
    prediction: 'Facial Manipulation',
    confidence: 78,
    status:     'completed',
    duration:   '0m 30s',
    fileSize:   '14.3 MB',
  },
  {
    id:         5,
    filename:   'conference_recording.mp4',
    date:       '2026-09-20',
    time:       '08:22',
    prediction: 'Face Replacement',
    confidence: 81,
    status:     'completed',
    duration:   '7m 21s',
    fileSize:   '98.6 MB',
  },
]

// ── Helper: pick icon + colour class based on prediction ──────
function PredictionBadge({ prediction }) {
  const isReal = prediction === 'Real'
  return (
    <span className={`hist-badge ${isReal ? 'hist-badge--real' : 'hist-badge--fake'}`}>
      {isReal
        ? <CheckCircle2 size={12} />
        : <XCircle size={12} />
      }
      {prediction}
    </span>
  )
}

// ── Confidence bar ────────────────────────────────────────────
function ConfBar({ value }) {
  const level = value >= 80 ? 'high' : value >= 60 ? 'mid' : 'low'
  return (
    <div className="hist-conf">
      <div className="hist-conf__track">
        <div className={`hist-conf__fill hist-conf__fill--${level}`} style={{ width: `${value}%` }} />
      </div>
      <span className="hist-conf__label">{value}%</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
function History() {
  return (
    <div className="history">

      {/* Header */}
      <div className="history__header">
        <div>
          <h1 className="history__title">Analysis History</h1>
          <p className="history__subtitle">
            A record of all deepfake analyses you have run.
          </p>
        </div>
        <Link to="/analyze">
          <Button size="md">
            <ScanFace size={17} />
            New Analysis
          </Button>
        </Link>
      </div>

      {/* Demo notice */}
      <div className="history__demo-notice" role="status">
        <AlertTriangle size={15} />
        <span>
          Demo mode — the records below are sample data for the frontend evaluation.
          Real history will be loaded from the database after Flask integration.
        </span>
      </div>

      {/* Records table */}
      <Card
        title="Past Analyses"
        subtitle={`${MOCK_HISTORY.length} demo records`}
        noPadding
      >
        <div className="hist-table-wrap">
          <table className="hist-table">
            <thead>
              <tr>
                <th>#</th>
                <th>File</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Size</th>
                <th>Prediction</th>
                <th>Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_HISTORY.map((rec) => (
                <tr key={rec.id}>
                  <td className="hist-table__id">{rec.id}</td>
                  <td className="hist-table__file">
                    <FileVideo size={14} className="hist-table__file-icon" />
                    <span>{rec.filename}</span>
                  </td>
                  <td className="hist-table__muted">
                    <span>{rec.date}</span>
                    <span className="hist-table__time">{rec.time}</span>
                  </td>
                  <td className="hist-table__muted">{rec.duration}</td>
                  <td className="hist-table__muted">{rec.fileSize}</td>
                  <td><PredictionBadge prediction={rec.prediction} /></td>
                  <td><ConfBar value={rec.confidence} /></td>
                  <td>
                    <span className="hist-badge hist-badge--done">
                      <Clock size={11} />
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="history__summary">
        <div className="hist-summary-card">
          <span className="hist-summary-card__value">
            {MOCK_HISTORY.length}
          </span>
          <span className="hist-summary-card__label">Total Analyses</span>
        </div>
        <div className="hist-summary-card hist-summary-card--real">
          <span className="hist-summary-card__value">
            {MOCK_HISTORY.filter((r) => r.prediction === 'Real').length}
          </span>
          <span className="hist-summary-card__label">Authentic</span>
        </div>
        <div className="hist-summary-card hist-summary-card--fake">
          <span className="hist-summary-card__value">
            {MOCK_HISTORY.filter((r) => r.prediction !== 'Real').length}
          </span>
          <span className="hist-summary-card__label">Deepfakes</span>
        </div>
        <div className="hist-summary-card">
          <span className="hist-summary-card__value">
            {Math.round(
              MOCK_HISTORY.reduce((sum, r) => sum + r.confidence, 0) / MOCK_HISTORY.length
            )}%
          </span>
          <span className="hist-summary-card__label">Avg. Confidence</span>
        </div>
      </div>

    </div>
  )
}

export default History
