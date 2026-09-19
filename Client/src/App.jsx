import './App.css'

function App() {
  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">🌿</span>
          <span className="brand-name">AgriSentinel</span>
        </div>

        <div className="navbar-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#technology">Technology</a>
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
            <button>Get Started</button>
            <a href="#features">Explore Features</a>
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
              <span>English · Tamil · Hindi</span>
            </div>
          </div>
        </section>


        {/* Problem Section */}
        <section id="problem" className="section problem-section">
          <div className="section-header">
            <h2 className="section-title">The Problem</h2>

            <p className="section-description">
              Field workers in rural agricultural regions lack reliable,
              offline-capable, multilingual crop disease reporting tools with
              real-time geospatial monitoring for agricultural authorities.
            </p>
          </div>

          <div className="card-grid">
            <div className="card">
              <h3 className="card-title">Limited Connectivity</h3>
              <p className="card-description">
                Field reports can be lost or delayed when internet connectivity is unreliable.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">Language Barriers</h3>
              <p className="card-description">
                Language limitations can reduce the accessibility and adoption of agricultural tools.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">No Real-Time Geospatial Monitoring</h3>
              <p className="card-description">
                Agricultural officers lack a centralized view of disease reports and outbreak hotspots.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">Backend Bottlenecks</h3>
              <p className="card-description">
                Processing image submissions synchronously can create bottlenecks when many images are submitted.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">Limited Treatment Guidance</h3>
              <p className="card-description">
                Farmers and field workers may receive a disease report without actionable treatment guidance.
              </p>
            </div>
          </div>
        </section>


        {/* Features Section */}
        <section id="features" className="section features-section">
          <div className="section-header">
            <h2 className="section-title">Our Solution</h2>

            <p className="section-description">
              AgriSentinel combines offline-first technology, AI-assisted disease
              classification, multilingual support, and geospatial intelligence to
              improve crop disease monitoring in the field.
            </p>
          </div>

          <div className="card-grid">
            <div className="card">
              <h3 className="card-title">Offline-First PWA</h3>
              <p className="card-description">
                Capture crop images, GPS data, and reports even without an active
                internet connection.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">AI-Assisted Disease Detection</h3>
              <p className="card-description">
                Analyze crop images using a deep-learning model to classify possible
                crop diseases.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">Multilingual Support</h3>
              <p className="card-description">
                Access the platform in English, Tamil, and Hindi through runtime
                language switching.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">GIS-Based Monitoring</h3>
              <p className="card-description">
                Agricultural officers can monitor GPS-tagged disease reports and
                identify potential outbreak hotspots on an interactive map.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">Real-Time Updates</h3>
              <p className="card-description">
                New field reports can be pushed to the officer dashboard in real time.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">Localized Treatment Recommendations</h3>
              <p className="card-description">
                Provide treatment recommendations in the selected language after
                disease classification.
              </p>
            </div>
          </div>
        </section>


        {/* How It Works Section */}
        <section id="how-it-works" className="section workflow-section">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>

            <p className="section-description">
              AgriSentinel connects field workers, AI-powered disease analysis,
              and agricultural officers through a simple end-to-end workflow.
            </p>
          </div>

          <div className="workflow-grid">
            <div className="card workflow-card">
              <h3 className="card-title">1. Capture</h3>
              <p className="card-description">
                The field worker captures a crop image and records the location
                using the AgriSentinel PWA.
              </p>
            </div>

            <div className="card workflow-card">
              <h3 className="card-title">2. Store & Sync</h3>
              <p className="card-description">
                Reports are stored locally when offline and synchronized with
                the server when connectivity becomes available.
              </p>
            </div>

            <div className="card workflow-card">
              <h3 className="card-title">3. AI Analysis</h3>
              <p className="card-description">
                The image is processed by the AI service to classify the possible
                crop disease and provide a confidence score.
              </p>
            </div>

            <div className="card workflow-card">
              <h3 className="card-title">4. Recommendation</h3>
              <p className="card-description">
                A localized treatment recommendation is generated based on the
                detected disease and selected language.
              </p>
            </div>

            <div className="card workflow-card">
              <h3 className="card-title">5. Monitor</h3>
              <p className="card-description">
                Agricultural officers receive updates and monitor disease reports
                and potential hotspots through the GIS dashboard.
              </p>
            </div>
          </div>
        </section>


        {/* Technology Section */}
        <section id="technology" className="section technology-section">
          <div className="section-header">
            <h2 className="section-title">Technology Behind AgriSentinel</h2>

            <p className="section-description">
              AgriSentinel uses a modular architecture combining modern web,
              AI, real-time communication, and geospatial technologies.
            </p>
          </div>

          <div className="card-grid">
            <div className="card">
              <h3 className="card-title">Frontend & PWA</h3>
              <p className="card-description">
                React.js, Vite, Tailwind CSS, IndexedDB, and Service Workers
                power the offline-first Progressive Web App.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">Backend</h3>
              <p className="card-description">
                Node.js, Express.js, MongoDB, JWT, and Role-Based Access Control
                provide the core application backend and security.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">AI & Machine Learning</h3>
              <p className="card-description">
                Python, FastAPI, and PyTorch are used to provide asynchronous
                crop disease classification.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">Real-Time & Asynchronous Processing</h3>
              <p className="card-description">
                BullMQ handles asynchronous processing while Socket.IO enables
                real-time report updates.
              </p>
            </div>

            <div className="card">
              <h3 className="card-title">Geospatial Intelligence</h3>
              <p className="card-description">
                Leaflet or MapLibre is used to visualize GPS-tagged disease
                reports and potential outbreak hotspots.
              </p>
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section id="cta" className="cta-section">
          <h2>Ready to Make Crop Disease Monitoring Smarter?</h2>

          <p>
            Empower field workers and agricultural officers with offline-first,
            AI-assisted, multilingual crop disease intelligence.
          </p>

          <button>Get Started</button>
        </section>

      </main>


      {/* Footer */}
      <footer className="footer">
        <div className="footer-brand">
          <span>🌿</span>
          <strong>AgriSentinel</strong>
        </div>

        <p className="footer-description">
          Offline-first AI-assisted crop disease monitoring and geospatial
          decision support.
        </p>

        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#technology">Technology</a>
        </div>

        <p className="footer-copyright">
          &copy; 2026 AgriSentinel. All rights reserved.
        </p>
      </footer>
    </>
  )
}

export default App