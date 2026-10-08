import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import ConfidenceBar from '../../components/ConfidenceBar/ConfidenceBar'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory'
import { deleteAnalysis } from '../../services/analysis'
import { formatBytes, formatDuration } from '../../services/media'

function Results() {
  const { analysisId } = useParams()
  const navigate = useNavigate()
  const records = useAnalysisHistory()
  const record = records.find((item) => item.id === analysisId)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  function removeRecord() {
    try {
      deleteAnalysis(record.id)
      navigate('/history', { replace: true })
    } catch (failure) {
      setError(failure.message)
      setConfirming(false)
    }
  }

  if (!record) {
    return (
      <div className="empty-state">
        <h1>Record not found</h1>
        <p>This record is unavailable for your account or has been removed.</p>
        <Button
          to="/history"
          variant="secondary"
        >
          Back to history
        </Button>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>File details</h1>
          <p className="muted filename">{record.filename}</p>
        </div>
        <Button
          to="/history"
          variant="secondary"
        >
          Back to history
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="analyze__error"
        >
          {error}
        </p>
      )}
      <p className="notice">
        File details saved. No AI analysis has run, so no authenticity conclusion can be
        made.
      </p>
      <Card title="File information">
        <dl className="details-list">
          <dt>Saved</dt>
          <dd>{new Date(record.createdAt).toLocaleString()}</dd>
          <dt>Size</dt>
          <dd>{formatBytes(record.size)}</dd>
          <dt>Duration</dt>
          <dd>{formatDuration(record.duration)}</dd>
          <dt>Preview</dt>
          <dd>
            {record.previewAvailable
              ? 'Readable when selected'
              : 'Unavailable in this browser'}
          </dd>
          <dt>Original file</dt>
          <dd>Not stored. Select the video again to preview it.</dd>
        </dl>
      </Card>
      <div className="two-column">
        <Card title="Visual assessment">
          <p>Not analysed</p>
          <ConfidenceBar value={record.confidence} />
        </Card>
        <Card title="Audio assessment">
          <p>Not analysed</p>
          <p className="muted">Audio presence and authenticity have not been assessed.</p>
        </Card>
      </div>
      <Card title="Visual evidence">
        <p className="muted">
          No heatmaps are available. When connected, Grad-CAM will show regions that
          influenced the model, with frame timestamps.
        </p>
      </Card>
      <div className="action-row">
        <Button to="/analyze">Check another video</Button>
        <Button
          variant="danger"
          onClick={() => setConfirming(true)}
        >
          Delete record
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Delete this record?"
        description="This removes the saved file details from this browser. Your original video is unaffected."
        confirmLabel="Delete record"
        onCancel={() => setConfirming(false)}
        onConfirm={removeRecord}
      />
    </div>
  )
}

export default Results
