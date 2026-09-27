import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const LandingPage = () => {
  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen">
      {/* Top Navigation */}
      <nav className="landing-nav">
        <div className="navbar-brand">
          <span className="brand-icon">🌿</span>
          <span className="brand-name">AgriSentinel</span>
        </div>

        <div className="navbar-links">
          <a href="#home">Home</a>
          <a href="#problem">Problem</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#technology">Technology</a>
        </div>

        <div className="navbar-cta-group">
          <Link to="/login" className="btn-nav-login">
            Login
          </Link>
          <Link to="/register" className="btn-nav-signup">
            Sign Up
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section id="home" className="hero-section">
          <span className="hero-label">
            AI-POWERED AGRICULTURAL INTELLIGENCE
          </span>

          <h1 className="hero-title">AgriSentinel</h1>

          <p className="hero-description">
            An Offline-First Multilingual AI-Assisted Crop Disease Monitoring &
            Geospatial Decision Support Platform.
          </p>

          <p className="hero-subdescription">
            Capture crop images, report diseases, and receive localized recommendations
            even in low-connectivity rural areas.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="hero-btn-primary">
              Get Started Free →
            </Link>
            <Link to="/login" className="hero-btn-secondary">
              Sign In
            </Link>
            <a href="#features" className="hero-btn-secondary">
              Explore Features
            </a>
          </div>

          <div className="hero-highlights">
            <div className="hero-highlight">
              <strong>Offline-First</strong>
              <span>Works without constant internet</span>
            </div>

            <div className="hero-highlight">
              <strong>AI-Assisted</strong>
              <span>Crop disease classification</span>
            </div>

            <div className="hero-highlight">
              <strong>Multilingual</strong>
              <span>English · தமிழ் · हिन्दी</span>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="landing-section alt-bg">
          <div className="section-header">
            <h2 className="section-title">The Problem</h2>
            <p className="section-description">
              Field workers in rural agricultural regions lack reliable,
              offline-capable, multilingual crop disease reporting tools with
              real-time geospatial monitoring for agricultural authorities.
            </p>
          </div>

          <div className="card-grid">
            <div className="landing-card">
              <h3 className="card-title">📡 Limited Connectivity</h3>
              <p className="card-description">
                Field reports can be lost or delayed when internet connectivity is unreliable or completely absent.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">🗣️ Language Barriers</h3>
              <p className="card-description">
                Language limitations reduce the accessibility and adoption of modern agricultural diagnostic tools.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">🗺️ Lack of Real-Time Geospatial View</h3>
              <p className="card-description">
                Agricultural officers lack a centralized real-time view of disease reports and potential outbreak hotspots.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">⚡ Backend Bottlenecks</h3>
              <p className="card-description">
                Processing image submissions synchronously can stall servers when many field workers submit simultaneously.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">💊 Limited Actionable Guidance</h3>
              <p className="card-description">
                Farmers often receive generic diagnostic labels without localized, actionable treatment precautions.
              </p>
            </div>
          </div>
        </section>

        {/* Features / Solution Section */}
        <section id="features" className="landing-section">
          <div className="section-header">
            <h2 className="section-title">Our Solution</h2>
            <p className="section-description">
              AgriSentinel combines offline-first Progressive Web App technology, AI-assisted disease
              classification, multilingual translation, and geospatial intelligence to
              improve crop disease monitoring in the field.
            </p>
          </div>

          <div className="card-grid">
            <div className="landing-card">
              <h3 className="card-title">📱 Offline-First PWA</h3>
              <p className="card-description">
                Capture crop images, GPS coordinates, and field notes locally with IndexedDB storage when offline.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">🔬 AI-Assisted Disease Detection</h3>
              <p className="card-description">
                FastAPI microservice analyzes crop leaves to classify possible crop diseases with confidence ratings.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">🌐 Multilingual Support</h3>
              <p className="card-description">
                Switch seamlessly between English, Tamil, and Hindi for UI labels and treatment guidelines.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">🗺️ GIS Command Dashboard</h3>
              <p className="card-description">
                Agricultural officers monitor GPS-tagged reports, view heatmaps, and pinpoint regional disease hotspots.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">⚡ Real-Time Socket Updates</h3>
              <p className="card-description">
                New field reports and AI predictions update the command dashboard in real time without refreshing.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">🌿 Structured Treatment Advice</h3>
              <p className="card-description">
                Provide structured, informational treatment guidance based on disease identification and localized context.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="landing-section alt-bg">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-description">
              AgriSentinel connects field workers, AI-powered disease analysis,
              and agricultural officers through a simple end-to-end workflow.
            </p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-card">
              <div className="workflow-step-num">Step 01</div>
              <h3 className="card-title">Capture</h3>
              <p className="card-description">
                Field worker captures crop image and records GPS location on the mobile-optimized PWA.
              </p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">Step 02</div>
              <h3 className="card-title">Store & Sync</h3>
              <p className="card-description">
                Reports are saved to IndexedDB when offline and auto-synchronized when connectivity returns.
              </p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">Step 03</div>
              <h3 className="card-title">AI Analysis</h3>
              <p className="card-description">
                Asynchronous queue processes the image through the ML microservice for disease prediction.
              </p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">Step 04</div>
              <h3 className="card-title">Recommendation</h3>
              <p className="card-description">
                Localized treatment advice is retrieved from the agricultural knowledge base.
              </p>
            </div>

            <div className="workflow-card">
              <div className="workflow-step-num">Step 05</div>
              <h3 className="card-title">GIS Monitoring</h3>
              <p className="card-description">
                Agricultural officers monitor live geospatial maps and track outbreak clusters.
              </p>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section id="technology" className="landing-section">
          <div className="section-header">
            <h2 className="section-title">Technology Behind AgriSentinel</h2>
            <p className="section-description">
              AgriSentinel uses a modular architecture combining modern web,
              AI, real-time communication, and geospatial technologies.
            </p>
          </div>

          <div className="card-grid">
            <div className="landing-card">
              <h3 className="card-title">Frontend & PWA</h3>
              <p className="card-description">
                React.js, Vite, Tailwind CSS, IndexedDB, and Service Workers provide a fast, offline-first experience.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">Backend Architecture</h3>
              <p className="card-description">
                Node.js, Express.js, MongoDB, JWT authentication, and Role-Based Access Control ensure robust data management.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">AI & ML Microservice</h3>
              <p className="card-description">
                Python, FastAPI, and PyTorch transfer-learning interfaces classify crop leaf anomalies.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">Async Queue & Sockets</h3>
              <p className="card-description">
                BullMQ + Redis manage async image jobs while Socket.IO pushes live updates to connected officer clients.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="card-title">Geospatial GIS</h3>
              <p className="card-description">
                Interactive Leaflet maps with OpenStreetMap tiles render disease coordinates and danger heatmaps.
              </p>
            </div>
          </div>
        </section>

        {/* Call To Action */}
        <section id="cta" className="cta-section">
          <h2>Ready to Experience AgriSentinel?</h2>
          <p>
            Empower field workers and agricultural officers with offline-first,
            AI-assisted, multilingual crop disease intelligence.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn-primary">
              Create Free Account →
            </Link>
            <Link to="/login" className="hero-btn-secondary">
              Sign In to Dashboard
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <span>🌿</span>
          <strong>AgriSentinel</strong>
        </div>

        <p className="footer-description">
          An Offline-First Multilingual AI-Assisted Crop Disease Monitoring and Geospatial Decision Support Platform.
        </p>

        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#problem">Problem</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#technology">Technology</a>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>

        <p className="footer-copyright">
          &copy; 2026 AgriSentinel Academic Prototype. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
