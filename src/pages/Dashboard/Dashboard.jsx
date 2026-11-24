import { Link } from 'react-router-dom'
import { FileVideo, ScanFace, Eye } from 'lucide-react'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory'
import { formatBytes, formatDuration } from '../../services/media'
import './Dashboard.css'

function Dashboard() {
  const user = useCurrentUser()
  const records = useAnalysisHistory()
  const recent = records.slice(0, 5)

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Welcome back, {user?.username}</h1>
          <p className="dashboard__subtitle">Your analysis workspace and saved records.</p>
        </div>
        <Button to="/analyze">
          <ScanFace size={17} aria-hidden="true" />
          Analyse a video
        </Button>
      </div>

      <p className="notice">
        AI analysis is not connected yet. Files stay on your device; running the workflow
        does not generate a prediction or deepfake verdict.
      </p>

      {/* ── Stats ── */}
      <section className="dashboard__stats" aria-label="Workspace statistics">
        <div className="dash-stat">
          <FileVideo size={22} aria-hidden="true" />
          <div className="dash-stat__body">
            <span className="dash-stat__value">{records.length}</span>
            <span>Analysed videos</span>
          </div>
        </div>
        <div className="dash-stat">
          <ScanFace size={22} aria-hidden="true" />
          <div className="dash-stat__body">
            <span className="dash-stat__value">
              {records.length > 0 ? 'Pending' : '—'}
            </span>
            <span>Backend integration</span>
          </div>
        </div>
      </section>

      {/* ── Recent records ── */}
      <Card
        title="Recent videos"
        subtitle={
          records.length === 0
            ? 'No records yet'
            : `Showing ${recent.length} of ${records.length}`
        }
      >
        {records.length === 0 ? (
          <div className="dashboard__empty">
            <p className="muted">No video records yet. Analyse a video to get started.</p>
            <Button to="/analyze" variant="secondary">
              Analyse a video
            </Button>
          </div>
        ) : (
          <div className="dashboard__recent">
            {recent.map((record) => (
              <div key={record.id} className="dashboard__record">
                <FileVideo size={18} aria-hidden="true" className="dashboard__record-icon" />
                <div className="dashboard__record-body">
                  <span className="dashboard__record-name" title={record.filename}>
                    {record.filename}
                  </span>
                  <span className="dashboard__record-meta">
                    {formatBytes(record.size)}
                    {record.duration ? ` · ${formatDuration(record.duration)}` : ''}
                    {' · '}
                    <time dateTime={record.createdAt}>
                      {new Date(record.createdAt).toLocaleDateString()}
                    </time>
                  </span>
                </div>
                <Link
                  to={`/history/${record.id}`}
                  className="dashboard__record-action"
                  aria-label={`View details for ${record.filename}`}
                  title="View Details"
                >
                  <Eye size={16} />
                  <span>View</span>
                </Link>
              </div>
            ))}
            {records.length > 5 && (
              <div className="dashboard__view-all">
                <Button to="/history" variant="ghost">
                  View all {records.length} records
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default Dashboard
