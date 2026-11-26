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

const CLASS_LABELS = {
  real: 'Real',
  face_replacement: 'Face Replacement',
  face_manipulation: 'Face Manipulation',
}

const CLASS_COLORS = {
  real: 'var(--color-success)',
  face_replacement: 'var(--color-danger)',
  face_manipulation: 'var(--color-warning)',
}

function ProbBar({ label, value, highlight }) {
  return (
    <div className="prob-row">
      <span className="prob-row__label">{label}</span>
      <div className="prob-row__track">
        <div
          className="prob-row__fill"
          style={{ width: `${value}%`, background: highlight ? 'var(--color-accent)' : 'var(--color-border)' }}
        />
      </div>
      <span className="prob-row__value">{Number(value).toFixed(1)}%</span>
    </div>
  )
}

const ASSESSMENT_SECTIONS = [
  {
    key: 'video',
    title: 'Video Assessment',
    description:
      'Frame-level video analysis checks for spatial and temporal inconsistencies.',
  },
  {
    key: 'visual',
    title: 'Visual Assessment',
    description:
      'EfficientNet-B0 visual model evaluates facial regions and blending artefacts.',
  },
  {
    key: 'audio',
    title: 'Audio Assessment',
    description:
      'Wav2Vec2-based audio model evaluates speech authenticity. Not connected.',
  },
]

function AssessmentCard({ sectionKey, title, description, record }) {
  if (sectionKey === 'visual' && record.visual) {
    const v = record.visual
    const label = CLASS_LABELS[v.class_name] ?? v.class_name
    const color = CLASS_COLORS[v.class_name] ?? 'var(--color-text-primary)'
    return (
      <Card title={title}>
        <div className="assessment-card">
          <p className="assessment-card__desc muted">{description}</p>
          <div className="visual-result">
            <div className="visual-result__verdict" style={{ color }}>
              <span className="visual-result__class">{label}</span>
              <span className="visual-result__conf">{Number(v.confidence).toFixed(1)}% confidence</span>
            </div>
            <div className="visual-result__probs">
              {Object.entries(v.probabilities).map(([cls, prob]) => (
                <ProbBar
                  key={cls}
                  label={CLASS_LABELS[cls] ?? cls}
                  value={prob}
                  highlight={cls === v.class_name}
                />
              ))}
            </div>
          </div>
          {record.videoMeta && (
            <p className="muted" style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}>
              {record.videoMeta.frames_analyzed} of {record.videoMeta.frames_requested} frames analysed
            </p>
          )}
        </div>
      </Card>
    )
  }

  if (sectionKey === 'audio' && record.audio) {
    return (
      <Card title={title}>
        <div className="assessment-card">
          <p className="assessment-card__desc muted">{description}</p>
          <span className="badge">{record.audio.message ?? 'Not available'}</span>
        </div>
      </Card>
    )
  }

  if (sectionKey === 'video' && record.videoMeta) {
    const vm = record.videoMeta
    return (
      <Card title={title}>
        <div className="assessment-card">
          <p className="assessment-card__desc muted">{description}</p>
          <dl className="details-list" style={{ marginTop: 'var(--space-2)' }}>
            <dt>Duration</dt>
            <dd>{Number(vm.duration_seconds).toFixed(1)}s</dd>
            <dt>Frames requested</dt>
            <dd>{vm.frames_requested}</dd>
            <dt>Frames analysed</dt>
            <dd>{vm.frames_analyzed}</dd>
          </dl>
        </div>
      </Card>
    )
  }

  // No result yet
  const placeholders = {
    video: 'No video metadata available. Run the analysis workflow to populate this section.',
    visual: 'No visual assessment result available. Run the analysis workflow to generate a prediction.',
    audio: 'Audio analysis is not implemented in the current pipeline.',
  }
  return (
    <Card title={title}>
      <div className="assessment-card">
        <p className="assessment-card__desc muted">{description}</p>
        <div className="assessment-card__pending">
          <span className="badge">
            {sectionKey === 'audio' ? 'Not available' : 'Pending analysis'}
          </span>
          <p className="assessment-card__placeholder muted">{placeholders[sectionKey]}</p>
        </div>
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
        {record.visual
          ? 'Visual analysis result from EfficientNet-B0. Audio analysis and Grad-CAM are not connected.'
          : 'No analysis result stored. Run Analyze Now to generate a visual prediction.'}
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
          <span className={`badge ${record.visual ? 'badge--success' : ''}`}>
            {record.visual ? 'Analysed' : 'File check only — no analysis result'}
          </span>
          <p className="muted">
            {record.visual
              ? 'EfficientNet-B0 visual analysis completed. Audio analysis and Grad-CAM are not implemented.'
              : 'Only file metadata was saved. Open Analyze Video and run Analyze Now to get a real prediction.'}
          </p>
        </div>
      </Card>

      {/* ── Assessment sections ── */}
      {ASSESSMENT_SECTIONS.map(({ key, title, description }) => (
        <AssessmentCard
          key={key}
          sectionKey={key}
          title={title}
          description={description}
          record={record}
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
