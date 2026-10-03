import { Link } from 'react-router-dom'
import {
  ScanFace,
  ShieldCheck,
  AudioLines,
  BarChart2,
  FileVideo,
  FlaskConical,
  ArrowRight,
} from 'lucide-react'
import Button from '../../components/Button/Button'
import './Home.css'

// ── Feature cards data ────────────────────────────────────────
const FEATURES = [
  {
    icon: ScanFace,
    title: 'Video Deepfake Detection',
    description:
      'Frame-level analysis using an EfficientNet-based model trained to identify manipulated facial regions in video content.',
  },
  {
    icon: AudioLines,
    title: 'Audio Authenticity Analysis',
    description:
      'Wav2Vec2-powered audio inspection detects synthetic or cloned speech patterns embedded in uploaded videos.',
  },
  {
    icon: ShieldCheck,
    title: 'Explainability with Grad-CAM',
    description:
      'Visual heatmaps highlight which parts of each frame contributed most to the detection decision.',
  },
  {
    icon: BarChart2,
    title: 'Confidence Scoring',
    description:
      'Each analysis returns a clear confidence score so you can judge the reliability of the result.',
  },
  {
    icon: FileVideo,
    title: 'Multi-format Support',
    description:
      'Upload MP4, AVI, MOV and other common video formats. The system extracts both visual and audio streams automatically.',
  },
  {
    icon: FlaskConical,
    title: 'Research-grade Pipeline',
    description:
      'Built on peer-reviewed deep learning techniques as part of an undergraduate Final Year Project in Computer Science.',
  },
]

function Home() {
  return (
    <div className="home">

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="home__hero">
        <div className="container home__hero-inner">
          <div className="home__hero-badge">
            <ShieldCheck size={14} />
            <span>AI-Powered Multimedia Forensics</span>
          </div>

          <h1 className="home__hero-title">
            Detect Deepfakes with<br />
            <span className="home__hero-accent">Confidence</span>
          </h1>

          <p className="home__hero-subtitle">
            Face Trace analyses uploaded videos for signs of AI-generated
            manipulation — examining both visual frames and embedded audio
            to give you a transparent, explainable result.
          </p>

          <div className="home__hero-actions">
            <Link to="/register">
              <Button size="lg">
                Get Started <ArrowRight size={18} />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Subtle disclaimer — honest about the project scope */}
          <p className="home__hero-disclaimer">
            Academic FYP demo — results are indicative, not forensically certified.
          </p>
        </div>
      </section>

      {/* ── What is Face Trace ─────────────────────────────── */}
      <section className="home__about">
        <div className="container home__about-inner">
          <h2 className="home__section-title">What is Face Trace?</h2>
          <p className="home__section-body">
            Face Trace is a deepfake detection system developed as a
            Bachelor of Science in Computer Science Final Year Project.
            It combines a fine-tuned <strong>EfficientNet</strong> model for
            visual analysis with a <strong>Wav2Vec2</strong> model for audio
            verification, producing a combined authenticity assessment alongside
            <strong> Grad-CAM</strong> explainability maps so users can
            understand what the model found suspicious.
          </p>
        </div>
      </section>

      {/* ── Features grid ─────────────────────────────────── */}
      <section className="home__features">
        <div className="container">
          <h2 className="home__section-title home__section-title--center">
            System Capabilities
          </h2>
          <p className="home__section-sub home__section-sub--center">
            A breakdown of what the analysis pipeline covers.
          </p>

          <div className="home__features-grid">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="home__feature-card">
                <div className="home__feature-icon">
                  <Icon size={22} />
                </div>
                <h3 className="home__feature-title">{title}</h3>
                <p className="home__feature-desc">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to action ────────────────────────────────── */}
      <section className="home__cta">
        <div className="container home__cta-inner">
          <h2 className="home__cta-title">Ready to analyse a video?</h2>
          <p className="home__cta-body">
            Create a free account and upload your first video in seconds.
          </p>
          <Link to="/register">
            <Button size="lg">
              Create Account <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer note ───────────────────────────────────── */}
      <footer className="home__footer">
        <div className="container">
          <p className="home__footer-text">
            © {new Date().getFullYear()} Face Trace &mdash; BSCS Final Year Project
          </p>
        </div>
      </footer>

    </div>
  )
}

export default Home
