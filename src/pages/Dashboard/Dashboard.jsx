import { FileVideo, ScanFace, Clock } from 'lucide-react'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import AnalysisTable from '../../components/AnalysisTable/AnalysisTable'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory'
import './Dashboard.css'

function Dashboard() {
  const user = useCurrentUser()
  const records = useAnalysisHistory()

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Welcome back, {user?.username}</h1>
          <p className="dashboard__subtitle">Your saved files and analysis workspace.</p>
        </div>
        <Button to="/analyze">
          <ScanFace
            size={17}
            aria-hidden="true"
          />
          Check a video
        </Button>
      </div>
      <p className="notice">
        Frontend preview: file checks and history work locally. AI predictions are
        unavailable until the analysis service is connected.
      </p>
      <section
        className="dashboard__stats"
        aria-label="Workspace statistics"
      >
        <div className="dash-stat">
          <FileVideo
            size={22}
            aria-hidden="true"
          />
          <div className="dash-stat__body">
            <span className="dash-stat__value">{records.length}</span>
            <span>Saved files</span>
          </div>
        </div>
        <div className="dash-stat">
          <Clock
            size={22}
            aria-hidden="true"
          />
          <div className="dash-stat__body">
            <span className="dash-stat__value">
              {records.filter((record) => record.status === 'not-analyzed').length}
            </span>
            <span>Not analysed</span>
          </div>
        </div>
      </section>
      <Card
        title="Recent files"
        subtitle="Your latest saved records"
        noPadding
      >
        <AnalysisTable records={records.slice(0, 5)} />
      </Card>
      <div className="dashboard__right-col">
        <Card title="Analysis service">
          <p className="muted">
            Visual detection, audio assessment, and heatmaps are not connected. No
            authenticity verdict is generated in this preview.
          </p>
        </Card>
        <Card title="Your workspace">
          <div className="action-row">
            <Button
              to="/history"
              variant="secondary"
            >
              View history
            </Button>
            <Button
              to="/profile"
              variant="ghost"
            >
              Manage account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
