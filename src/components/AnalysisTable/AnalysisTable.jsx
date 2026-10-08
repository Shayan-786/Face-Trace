import { Link } from 'react-router-dom'
import { formatDuration } from '../../services/media'
import ConfidenceBar from '../ConfidenceBar/ConfidenceBar'

function AnalysisTable({ records }) {
  if (!records.length) {
    return (
      <div className="empty-state">
        <h2>No saved files yet</h2>
        <p>Select a video to check its details and save your first record.</p>
        <Link to="/analyze">Choose a video</Link>
      </div>
    )
  }

  return (
    <div
      className="records-table-wrap"
      role="region"
      aria-label="Saved file records"
      tabIndex={0}
    >
      <table className="records-table">
        <caption className="sr-only">
          Your saved file checks and analysis availability
        </caption>
        <thead>
          <tr>
            <th scope="col">File</th>
            <th scope="col">Saved</th>
            <th scope="col">Duration</th>
            <th scope="col">Status</th>
            <th scope="col">Model score</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <th scope="row">
                <Link to={`/history/${record.id}`}>{record.filename}</Link>
              </th>
              <td>
                <time dateTime={record.createdAt}>
                  {new Date(record.createdAt).toLocaleDateString()}
                </time>
              </td>
              <td>{formatDuration(record.duration)}</td>
              <td>
                <span className="badge">Not analysed</span>
              </td>
              <td>
                <ConfidenceBar value={record.confidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AnalysisTable
