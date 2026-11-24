import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory'
import { deleteAnalysis } from '../../services/analysis'
import { downloadReport } from '../../services/pdf'
import { formatBytes, formatDuration } from '../../services/media'
import './Results.css'

const ASSESSMENT_SECTIONS = [
  {
    key: 'video',
    title: 'Video Assessment',
    description:
      'Frame-level video analysis checks for spatial and temporal inconsistencies. Requires backend model integration.',
    placeholder:
      'No video assessment result available. Backend integration will provide frame-level analysis and consistency checks.',
  },
  {
    key: 'visual',
    title: 'Visual Assessment',
    description:
      'EfficientNet-based visual model evaluates facial regions and blending artefacts. Requires backend model integration.',
    placeholder:
      'No visual assessment result available. Backend integration will provide model prediction, confidence score, and Grad-CAM explanation.',
  },
  {
    key: 'audio',
    title: 'Audio Assessment',
    description:
      'Wav2Vec2-based audio model evaluates speech authenticity and audio-visual sync. Requires backend model integration.',
    placeholder:
      'No audio assessment result available. Backend integration will provide speech authenticity and audio-visual sync analysis.',
  },
]

function AssessmentCard({ title, description, placeholder, result }) {
  return (
    <Card title={title}>
      <div className="assessment-card">
        <p className="assessment-card__desc muted">{description}</p>
        {result ? (
          /* Future: render real backend result here */
          <div className="assessment-card__result">{result}</div>
        ) : (
          <div className="assessment-card__pending">
            <span className="badge">Completed — model result pending backend integration</span>
            <p className="assessment-card__placeholder muted">{placeholder}</p>
          </div>
        )}
      </div>
    </Card>
  )
}

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
        <Button to="/history" variant="secondary">
          Back to history
        </Button>
      </div>
    )
  }

  const fileType =
    record.type ||
    (record.filename ? record.filename.split('.').pop().toUpperCase() : 'Unknown')

  return (
    <div className="results page-stack">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Record Details</h1>
          <p className="muted results__filename">{record.filename}</p>
        </div>
        <Button to="/history" variant="secondary">
          Back to history
        </Button>
      </div>

      {error && (
        <p role="alert" className="results__error">{error}</p>
      )}

      <p className="notice">
        AI prediction, confidence score, and Grad-CAM explanation are unavailable until
        backend model integration.
      </p>

      {/* ── File details ── */}
      <Card title="File Information">
        <dl className="details-list">
          <dt>File name</dt>
          <dd>{record.filename}</dd>

          <dt>File type</dt>
          <dd>{fileType}</dd>

          <dt>File size</dt>
          <dd>{formatBytes(record.size)}</dd>

          <dt>Duration</dt>
          <dd>{formatDuration(record.duration)}</dd>

          <dt>Saved</dt>
          <dd>
            <time dateTime={record.createdAt}>
              {new Date(record.createdAt).toLocaleString()}
            </time>
          </dd>

          <dt>Local preview</dt>
          <dd>
            {record.previewAvailable
              ? 'Available when file is re-selected'
              : 'Unavailable in this browser'}
          </dd>

          <dt>Original file</dt>
          <dd>Not stored. Select the video again to preview it locally.</dd>
        </dl>
      </Card>

      {/* ── Workflow status ── */}
      <Card title="Workflow Status">
        <div className="results__workflow-status">
          <span className="badge badge--success">
            Completed — model result pending backend integration
          </span>
          <p className="muted">
            The local workflow ran successfully. No AI analysis has been performed; no
            authenticity conclusion can be made from this record.
          </p>
        </div>
      </Card>

      {/* ── Assessment sections ── */}
      {ASSESSMENT_SECTIONS.map(({ key, title, description, placeholder }) => (
        <AssessmentCard
          key={key}
          title={title}
          description={description}
          placeholder={placeholder}
          result={record[key] ?? null}
        />
      ))}

      {/* ── Actions ── */}
      <div className="results__actions action-row">
        <Button onClick={() => downloadReport(record)}>
          <Download size={16} aria-hidden="true" />
          Download Report
        </Button>
        <Button to="/analyze" variant="secondary">
          Analyse another video
        </Button>
        <Button variant="danger" onClick={() => setConfirming(true)}>
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
