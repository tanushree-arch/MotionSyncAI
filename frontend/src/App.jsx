import { useState, useEffect } from 'react';
import PoseStudio from './components/PoseStudio';

const features = [
  {
    number: '01',
    title: 'Live Pose Tracking',
    text: 'Track 33 body landmarks while performing yoga and exercises.',
    icon: '✦',
  },
  {
    number: '02',
    title: 'AI Form Analysis',
    text: 'Evaluate joint alignment and identify incorrect movements.',
    icon: '◎',
  },
  {
    number: '03',
    title: 'Intelligent Coaching',
    text: 'Receive real-time visual and voice-based correction cues.',
    icon: '✧',
  },
];

function App() {
  const [apiStatus, setApiStatus] = useState('Not checked');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );
    };
  }, []);

  async function checkBackend() {
    setApiStatus('Checking...');

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/health'
      );

      if (!response.ok) {
        throw new Error('Backend connection failed');
      }

      const data = await response.json();

      setApiStatus(
        data.status === 'ok'
          ? 'Connected ✓'
          : 'Unexpected response'
      );
    } catch (error) {
      console.error('Backend error:', error);
      setApiStatus('Not connected');
    }
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }

  return (
    <main className="shell">

      {/* NAVIGATION */}
      <nav className="nav">
        <a className="brand" href="#">
          <span className="brand-mark">M</span>
          MotionSync<span>AI</span>
        </a>

        <div className="nav-actions">
          <a href="#how-it-works" className="nav-link">
            How it works
          </a>

          <button
            className="fullscreen-button"
            onClick={toggleFullscreen}
          >
            {isFullscreen
              ? '✕ Exit Full Screen'
              : '⛶ Full Screen'}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="pulse"></span>
            YOUR PERSONAL AI FITNESS COACH
          </div>

          <h1>
            Move with purpose.
            <br />
            <span>Find your form.</span>
          </h1>

          <p className="hero-copy">
            Experience intelligent movement tracking and
            real-time posture analysis with MotionSyncAI.
            Improve your yoga and exercise techniques with
            the assistance of artificial intelligence.
          </p>

          <div className="hero-actions">
            <a
              href="#live-studio"
              className="button primary"
            >
              Start Training ↗
            </a>

            <button
              className="button secondary"
              onClick={checkBackend}
            >
              Check Backend
            </button>
          </div>

          <p className="status">
            API Status:
            <strong> {apiStatus}</strong>
          </p>
        </div>

        <div className="hero-visual">
          <div className="glow-circle circle-one"></div>
          <div className="glow-circle circle-two"></div>
          <div className="glow-circle circle-three"></div>

          <div className="hero-orbit">
            <span>AI</span>
          </div>
        </div>
      </section>

      {/* POSE STUDIO */}
      <section
        id="live-studio"
        className="studio-section"
      >
        <div className="section-intro">
          <span className="eyebrow">
            REAL-TIME AI TECHNOLOGY
          </span>

          <h2>Motion Studio</h2>

          <p>
            Your personal movement analysis workspace.
          </p>
        </div>

        <PoseStudio />
      </section>

      {/* FEATURES */}
      <section
        className="feature-section"
        id="how-it-works"
      >
        <div className="section-heading">
          <span className="eyebrow">
            THE MOTIONSYNC APPROACH
          </span>

          <h2>
            Awareness in every movement.
          </h2>

          <p>
            Intelligent technology that helps you move better.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article
              className="feature-card"
              key={feature.number}
            >
              <div className="feature-icon">
                {feature.icon}
              </div>

              <span className="feature-number">
                {feature.number}
              </span>

              <h3>{feature.title}</h3>

              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <span className="footer-brand">
          MotionSyncAI
        </span>

        <span>
          AI-Powered Movement Intelligence
        </span>
      </footer>

    </main>
  );
}

export default App;