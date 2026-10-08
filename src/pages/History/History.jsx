import { useState } from 'react'
import Button from '../../components/Button/Button'
import Card from '../../components/Card/Card'
import AnalysisTable from '../../components/AnalysisTable/AnalysisTable'
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory'
import './History.css'

function History() {
  const records = useAnalysisHistory()
  const [query, setQuery] = useState('')
  const filtered = records.filter((record) =>
    record.filename.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <div className="history">
      <div className="history__header">
        <div>
          <h1 className="history__title">Analysis History</h1>
          <p className="history__subtitle">
            File records saved for your account on this browser.
          </p>
        </div>
        <Button to="/analyze">Check a video</Button>
      </div>
      <label className="search-field">
        Search files
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by filename"
        />
      </label>
      <Card
        title="Saved files"
        subtitle={`${filtered.length} of ${records.length} records`}
        noPadding
      >
        {query.trim() && !filtered.length ? (
          <p
            className="empty-state"
            role="status"
          >
            No files match your search.
          </p>
        ) : (
          <AnalysisTable records={filtered} />
        )}
      </Card>
      <p className="muted">
        Only file details are saved. Original videos are not stored or uploaded, and saved
        checks do not contain AI predictions.
      </p>
    </div>
  )
}

export default History
