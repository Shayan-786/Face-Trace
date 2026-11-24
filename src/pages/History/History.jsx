import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Eye, FileVideo } from 'lucide-react'
import Button from '../../components/Button/Button'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory'
import { deleteAnalysis, deleteAllAnalysis } from '../../services/analysis'
import { formatBytes, formatDuration } from '../../services/media'
import './History.css'

function History() {
  const records = useAnalysisHistory()
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const [error, setError] = useState('')

  const filtered = records.filter((record) =>
    record.filename.toLowerCase().includes(query.trim().toLowerCase()),
  )

  function handleDelete(id) {
    try {
      deleteAnalysis(id)
      setDeletingId(null)
      setError('')
    } catch (failure) {
      setError(failure.message)
      setDeletingId(null)
    }
  }

  function handleDeleteAll() {
    try {
      deleteAllAnalysis()
      setDeletingAll(false)
      setError('')
    } catch (failure) {
      setError(failure.message)
      setDeletingAll(false)
    }
  }

  return (
    <div className="history">
      <div className="history__header">
        <div>
          <h1 className="history__title">Analysis History</h1>
          <p className="history__subtitle">
            File records saved for your account on this browser.
          </p>
        </div>
        <div className="history__header-actions">
          <Button to="/analyze">Analyse a video</Button>
          {records.length > 0 && (
            <Button variant="danger" onClick={() => setDeletingAll(true)}>
              Delete All Records
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="history__error" role="alert">{error}</p>
      )}

      <label className="search-field">
        Search files
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by filename"
        />
      </label>

      {records.length === 0 ? (
        <div className="history__empty">
          <FileVideo size={40} aria-hidden="true" />
          <h2>No saved records yet</h2>
          <p>Select a video and run a workflow to save your first record.</p>
          <Button to="/analyze">Analyse a video</Button>
        </div>
      ) : query.trim() && filtered.length === 0 ? (
        <p className="history__no-results" role="status">
          No files match your search.
        </p>
      ) : (
        <div className="history__list">
          {filtered.map((record) => (
            <div key={record.id} className="history-card">
              <div className="history-card__icon">
                <FileVideo size={22} aria-hidden="true" />
              </div>
              <div className="history-card__body">
                <span className="history-card__name" title={record.filename}>
                  {record.filename}
                </span>
                <span className="history-card__meta">
                  {formatBytes(record.size)}
                  {record.duration ? ` · ${formatDuration(record.duration)}` : ''}
                  {' · '}
                  <time dateTime={record.createdAt}>
                    {new Date(record.createdAt).toLocaleString()}
                  </time>
                </span>
                <span className="badge history-card__badge">
                  Completed — model result pending backend integration
                </span>
              </div>
              <div className="history-card__actions">
                <Link
                  to={`/history/${record.id}`}
                  className="history-card__action"
                  aria-label={`View details for ${record.filename}`}
                  title="View Details"
                >
                  <Eye size={17} />
                  <span>View Details</span>
                </Link>
                <button
                  type="button"
                  className="history-card__action history-card__action--danger"
                  onClick={() => setDeletingId(record.id)}
                  aria-label={`Delete record for ${record.filename}`}
                  title="Delete"
                >
                  <Trash2 size={17} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="muted">
        Only file details are saved. Original videos are not stored or uploaded, and saved
        checks do not contain AI predictions.
      </p>

      {/* Delete single record dialog */}
      <ConfirmDialog
        open={deletingId !== null}
        title="Delete this record?"
        description="This removes the saved file details from this browser. Your original video is unaffected."
        confirmLabel="Delete record"
        onCancel={() => setDeletingId(null)}
        onConfirm={() => handleDelete(deletingId)}
      />

      {/* Delete all records dialog */}
      <ConfirmDialog
        open={deletingAll}
        title="Delete all records?"
        description={`This will permanently remove all ${records.length} saved record${records.length !== 1 ? 's' : ''} from this browser. This cannot be undone.`}
        confirmLabel="Delete all records"
        onCancel={() => setDeletingAll(false)}
        onConfirm={handleDeleteAll}
      />
    </div>
  )
}

export default History
