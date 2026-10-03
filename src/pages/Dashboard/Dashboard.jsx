import { Link } from 'react-router-dom'
import {
  ScanFace,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  FileVideo,
} from 'lucide-react'
import Card   from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import { getCurrentUser } from '../../services/auth'
import './Dashboard.css'

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// All values below are hard-coded demo placeholders.
// Replace with real API calls (src/services/api.js) once Flask
// integration is complete in a later phase.
// ─────────────────────────────────────────────────────────────

const MOCK_USER = getCurrentUser() || { username: 'User' }

const MOCK_STATS = [
  {
    id:      'total',
    label:   'Total Analyses',
    value:   24,
    icon:    FileVideo,
    color:   'accent',
    note:    'All time',
  },
  {
    id:      'real',
    label:   'Authentic Videos',
    value:   17,
    icon:    CheckCircle2,
    color:   'success',
    note:    '71% of total',
  },
  {
    id:      'fake',
    label:   'Deepfakes Detected',
    value:   7,
    icon:    XCircle,
    color:   'danger',
    note:    '29% of total',
  },
  {
    id:      'pending',
    label:   'Pending Review',
    value:   2,
    icon:    Clock,
    color:   'warning',
    note:    'Queued',
  },
]

// Verdict options used in the recent-analyses table
const VERDICT = {
  authentic: { label: 'Authentic',  cls: 'badge--success' },
  deepfake:  { label: 'Deepfake',   cls: 'badge--danger'  },
  uncertain: { label: 'Uncertain',  cls: 'badge--warning' },
}

const MOCK_RECENT = [
  {
    id:         1,
    filename:   'interview_clip.mp4',
    uploadedAt: '2 hours ago',
    duration:   '1m 42s',
    verdict:    'authentic',
    confidence: 91,
  },
  {
    id:         2,
    filename:   'speech_video.avi',
    uploadedAt: 'Yesterday',
    duration:   '3m 08s',
    verdict:    'deepfake',
    confidence: 87,
  },
  {
    id:         3,
    filename:   'news_segment.mp4',
    uploadedAt: 'Yesterday',
    duration:   '0m 55s',
    verdict:    'authentic',
    confidence: 95,
  },
  {
    id:         4,
    filename:   'social_clip.mov',
    uploadedAt: '3 days ago',
    duration:   '0m 30s',
    verdict:    'uncertain',
    confidence: 54,
  },
  {
    id:         5,
    filename:   'conference_recording.mp4',
    uploadedAt: '5 days ago',
    duration:   '7m 21s',
    verdict:    'deepfake',
    confidence: 78,
  },
]

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

/** Single stat card — icon, big number, label */
function StatCard({ label, value, icon: Icon, color, note }) {
  return (
    <div className={`dash-stat dash-stat--${color}`}>
      <div className="dash-stat__icon-wrap">
        <Icon size={22} />
      </div>
      <div className="dash-stat__body">
        <span className="dash-stat__value">{value}</span>
        <span className="dash-stat__label">{label}</span>
        <span className="dash-stat__note">{note}</span>
      </div>
    </div>
  )
}

/** Verdict badge pill */
function VerdictBadge({ verdict }) {
  const { label, cls } = VERDICT[verdict]
  return <span className={`badge ${cls}`}>{label}</span>
}

/** Confidence bar + percentage */
function ConfidenceBar({ value }) {
  const level = value >= 80 ? 'high' : value >= 55 ? 'mid' : 'low'
  return (
    <div className="conf-bar">
      <div
        className={`conf-bar__fill conf-bar__fill--${level}`}
        style={{ width: `${value}%` }}
      />
      <span className="conf-bar__label">{value}%</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Dashboard page
// ─────────────────────────────────────────────────────────────

function Dashboard() {
  return (
    <div className="dashboard">

      {/* ── Welcome header ─────────────────────────────────── */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">
            Welcome back, {MOCK_USER.username}
          </h1>
          <p className="dashboard__subtitle">
            Here&apos;s an overview of your deepfake analysis activity.
          </p>
        </div>

        {/* Quick-action CTA */}
        <Link to="/analyze">
          <Button size="md">
            <ScanFace size={17} />
            Analyse a Video
          </Button>
        </Link>
      </div>

      {/* ── Demo data notice ───────────────────────────────── */}
      <div className="dashboard__demo-notice" role="status">
        <AlertTriangle size={15} />
        <span>
          Demo mode — statistics below are placeholder data.
          Real figures will appear after Flask API integration.
        </span>
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <section className="dashboard__stats" aria-label="Analysis statistics">
        {MOCK_STATS.map((s) => (
          <StatCard key={s.id} {...s} />
        ))}
      </section>

      {/* ── Bottom row: recent analyses + system overview ──── */}
      <div className="dashboard__bottom">

        {/* Recent analyses table */}
        <Card
          title="Recent Analyses"
          subtitle="Your 5 most recent video submissions"
          className="dashboard__recent-card"
          noPadding
        >
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Uploaded</th>
                  <th>Duration</th>
                  <th>Verdict</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT.map((row) => (
                  <tr key={row.id}>
                    <td className="dash-table__filename">
                      <FileVideo size={14} className="dash-table__file-icon" />
                      {row.filename}
                    </td>
                    <td className="dash-table__muted">{row.uploadedAt}</td>
                    <td className="dash-table__muted">{row.duration}</td>
                    <td><VerdictBadge verdict={row.verdict} /></td>
                    <td><ConfidenceBar value={row.confidence} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right column */}
        <div className="dashboard__right-col">

          {/* System overview card */}
          <Card title="System Overview" subtitle="Current pipeline status">
            <ul className="dash-overview">
              <li className="dash-overview__item">
                <span className="dash-overview__key">Visual Model</span>
                <span className="badge badge--success">EfficientNet Ready</span>
              </li>
              <li className="dash-overview__item">
                <span className="dash-overview__key">Audio Model</span>
                <span className="badge badge--success">Wav2Vec2 Ready</span>
              </li>
              <li className="dash-overview__item">
                <span className="dash-overview__key">Explainability</span>
                <span className="badge badge--success">Grad-CAM Ready</span>
              </li>
              <li className="dash-overview__item">
                <span className="dash-overview__key">API Status</span>
                <span className="badge badge--warning">Not Connected</span>
              </li>
              <li className="dash-overview__item">
                <span className="dash-overview__key">Database</span>
                <span className="badge badge--warning">Not Connected</span>
              </li>
            </ul>
          </Card>

          {/* Quick-action card */}
          <Card title="Quick Actions">
            <div className="dash-quick">
              <Link to="/analyze" className="dash-quick__item">
                <div className="dash-quick__icon">
                  <ScanFace size={20} />
                </div>
                <div className="dash-quick__text">
                  <span className="dash-quick__label">Analyse New Video</span>
                  <span className="dash-quick__desc">Upload and run detection</span>
                </div>
                <ArrowRight size={16} className="dash-quick__arrow" />
              </Link>

              <Link to="/history" className="dash-quick__item">
                <div className="dash-quick__icon">
                  <TrendingUp size={20} />
                </div>
                <div className="dash-quick__text">
                  <span className="dash-quick__label">View Full History</span>
                  <span className="dash-quick__desc">All past analyses</span>
                </div>
                <ArrowRight size={16} className="dash-quick__arrow" />
              </Link>
            </div>
          </Card>

        </div>
      </div>

    </div>
  )
}

export default Dashboard
