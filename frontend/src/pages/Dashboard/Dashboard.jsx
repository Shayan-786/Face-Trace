import { Link } from 'react-router-dom'
import { FileVideo, Eye } from 'lucide-react'
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
      </div>

      {/* ── Stats ── */}
      <section className="dashboard__stats" aria-label="Workspace statistics">
        <div className="dash-stat">
          <FileVideo size={22} aria-hidden="true" />
          <div className="dash-stat__body">
            <span className="dash-stat__value">{records.length}</span>
            <span>Analysed videos</span>
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
          <p className="muted dashboard__empty-msg">No analysed videos yet.</p>
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
