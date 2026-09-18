import './App.css'
function App(){
  return(
    <> 

    <nav>
      <div>
        <span>🌿</span>
        <span>AgriSentinel</span>
      </div>
      <div>
        <a href="#home">Home</a>
        <a href="#features">Features</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#technology">Technology</a>
      </div>
    </nav>


    <main>

      <section id="home">
        <span>AI-POWERED AGRICULTURAL INTELLIGENCE</span>
        <h1>AgriSentinel</h1>
        <p>
          An Offline-First Multilingual AI-Assisted Crop Disease Monitoring &
          Geospatial Decision Support Platform.
        </p>
        <p>
          Capture crop images, report diseases, and receive localized recommendations
          even in low-connectivity rural areas.
        </p>
        <div>
          <button>Get Started</button>
          <a href="#features">Explore Features</a>
        </div>
        <div>
          <div>
            <strong>Offline-First</strong>
            <span>Works without constant internet</span>
          </div>

          <div>
            <strong>AI-Assisted</strong>
            <span>Crop disease classification</span>
          </div>

          <div>
            <strong>Multilingual</strong>
            <span>English · Tamil · Hindi</span>
          </div>
        </div>
      </section>

      <section id="problem">
        <h2>The Problem</h2>

        <p>
          Field workers in rural agricultural regions lack reliable,
          offline-capable, multilingual crop disease reporting tools with
          real-time geospatial monitoring for agricultural authorities.
        </p>

        <div>
          <div>
            <h3>Limited Connectivity</h3>
            <p>
              Field reports can be lost or delayed when internet connectivity is unreliable.
            </p>
          </div>

          <div>
            <h3>Language Barriers</h3>
            <p>
              Language limitations can reduce the accessibility and adoption of agricultural tools.
            </p>
          </div>

          <div>
            <h3>No Real-Time Geospatial Monitoring</h3>
            <p>
              Agricultural officers lack a centralized view of disease reports and outbreak hotspots.
            </p>
          </div>

          <div>
            <h3>Backend Bottlenecks</h3>
            <p>
              Processing image submissions synchronously can create bottlenecks when many images are submitted.
            </p>
          </div>

          <div>
            <h3>Limited Treatment Guidance</h3>
            <p>
              Farmers and field workers may receive a disease report without actionable treatment guidance.
            </p>
          </div>
        </div>
      </section>
      

      <section id="features">
        <h2>Our Solution</h2>

        <p>
          AgriSentinel combines offline-first technology, AI-assisted disease
          classification, multilingual support, and geospatial intelligence to
          improve crop disease monitoring in the field.
        </p>

        <div>
          <div>
            <h3>Offline-First PWA</h3>
            <p>
              Capture crop images, GPS data, and reports even without an active
              internet connection.
            </p>
          </div>

          <div>
            <h3>AI-Assisted Disease Detection</h3>
            <p>
              Analyze crop images using a deep-learning model to classify possible
              crop diseases.
            </p>
          </div>

          <div>
            <h3>Multilingual Support</h3>
            <p>
              Access the platform in English, Tamil, and Hindi through runtime
              language switching.
            </p>
          </div>

          <div>
            <h3>GIS-Based Monitoring</h3>
            <p>
              Agricultural officers can monitor GPS-tagged disease reports and
              identify potential outbreak hotspots on an interactive map.
            </p>
          </div>

          <div>
            <h3>Real-Time Updates</h3>
            <p>
              New field reports can be pushed to the officer dashboard in real time.
            </p>
          </div>

          <div>
            <h3>Localized Treatment Recommendations</h3>
            <p>
              Provide treatment recommendations in the selected language after
              disease classification.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works">
        <h2>How It Works</h2>

        <p>
          AgriSentinel connects field workers, AI-powered disease analysis,
          and agricultural officers through a simple end-to-end workflow.
        </p>

        <div>
          <div>
            <h3>1. Capture</h3>
            <p>
              The field worker captures a crop image and records the location
              using the AgriSentinel PWA.
            </p>
          </div>

          <div>
            <h3>2. Store & Sync</h3>
            <p>
              Reports are stored locally when offline and synchronized with
              the server when connectivity becomes available.
            </p>
          </div>

          <div>
            <h3>3. AI Analysis</h3>
            <p>
              The image is processed by the AI service to classify the possible
              crop disease and provide a confidence score.
            </p>
          </div>

          <div>
            <h3>4. Recommendation</h3>
            <p>
              A localized treatment recommendation is generated based on the
              detected disease and selected language.
            </p>
          </div>

          <div>
            <h3>5. Monitor</h3>
            <p>
              Agricultural officers receive updates and monitor disease reports
              and potential hotspots through the GIS dashboard.
            </p>
          </div>
        </div>
      </section>

      <section id="technology">
        <h2>Technology Behind AgriSentinel</h2>

        <p>
          AgriSentinel uses a modular architecture combining modern web,
          AI, real-time communication, and geospatial technologies.
        </p>

        <div>
          <div>
            <h3>Frontend & PWA</h3>
            <p>
              React.js, Vite, Tailwind CSS, IndexedDB, and Service Workers
              power the offline-first Progressive Web App.
            </p>
          </div>

          <div>
            <h3>Backend</h3>
            <p>
              Node.js, Express.js, MongoDB, JWT, and Role-Based Access Control
              provide the core application backend and security.
            </p>
          </div>

          <div>
            <h3>AI & Machine Learning</h3>
            <p>
              Python, FastAPI, and PyTorch are used to provide asynchronous
              crop disease classification.
            </p>
          </div>

          <div>
            <h3>Real-Time & Asynchronous Processing</h3>
            <p>
              BullMQ handles asynchronous processing while Socket.IO enables
              real-time report updates.
            </p>
          </div>

          <div>
            <h3>Geospatial Intelligence</h3>
            <p>
              Leaflet or MapLibre is used to visualize GPS-tagged disease
              reports and potential outbreak hotspots.
            </p>
          </div>
        </div>
      </section>

      <section id="cta">
        <h2>Ready to Make Crop Disease Monitoring Smarter?</h2>

        <p>
          Empower field workers and agricultural officers with offline-first,
          AI-assisted, multilingual crop disease intelligence.
        </p>

        <button>Get Started</button>
      </section>
    </main>


    <footer>
      <div>
        <span>🌿</span>
        <strong>AgriSentinel</strong>
      </div>

      <p>
        Offline-first AI-assisted crop disease monitoring and geospatial
        decision support.
      </p>

      <div>
        <a href="#home">Home</a>
        <a href="#features">Features</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#technology">Technology</a>
      </div>

      <p>&copy; 2026 AgriSentinel. All rights reserved.</p>
    </footer>

    </>
  )
}

export default App;