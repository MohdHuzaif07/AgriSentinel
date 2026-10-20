# AgriSentinel: AI-Assisted Crop Disease Monitoring & GIS Platform

AgriSentinel is a full-stack, offline-first agricultural intelligence platform designed for field workers, agricultural officers, and administrators. It empowers farmers and field workers to capture geotagged crop leaf photos, receive AI-assisted disease diagnoses in real time, and synchronizes field reports to a real-time GIS dashboard for agricultural authorities.

---

## 🌟 Key Features

- **Offline-First PWA**: Capture disease reports even without network connectivity. Reports are securely stored in browser IndexedDB and automatically synchronized when connectivity is restored.
- **AI-Powered Diagnostics (Google Gemini Vision API)**: High-speed, multimodal vision analysis using Google Gemini (`gemini-3.5-flash-lite` / `gemini-flash-latest`) for multi-class crop disease detection, treatment advice, and pesticide recommendations, with PyTorch ResNet-50 fallback.
- **Multilingual AI Translation (Gemini)**: Dynamic translation supporting English, Hindi (हिन्दी), and Tamil (தமிழ்) across farmer reports, officer GIS dashboards, and admin consoles with agricultural domain-specific terminology preservation.
- **Client-Side Image Optimization**: High-resolution camera photos are automatically compressed via HTML5 Canvas before network transmission, reducing payload size by up to 98% while preserving diagnostic visual features.
- **Officer GIS Dashboard**: Real-time interactive map (Leaflet) with hotspot clustering, severity filtering, high-resolution original image review, and treatment intervention tracking.
- **Role-Based Access Control (RBAC)**: Secure JWT authentication supporting `FIELD_WORKER` (Farmer), `AGRICULTURAL_OFFICER`, and `ADMIN` roles.
- **Modern Responsive UI**: Fully responsive Tailwind CSS interface with Dark / Light theme toggling, accessible forms, and real-time Socket.IO notifications.
- **Production-Ready Deployment**: Monorepo structure configured for seamless deployment on Vercel (SPA frontend + serverless Express API) and MongoDB Atlas.

---

## 🏗️ Architecture

```
                                 ┌──────────────────────────────────┐
                                 │       Vercel / Web Browser       │
                                 │   React (Vite) + Tailwind PWA    │
                                 │ (IndexedDB Cache & Offline Sync) │
                                 └────────────────┬─────────────────┘
                                                  │ HTTPS / JSON & Base64
                                                  ▼
                                 ┌──────────────────────────────────┐
                                 │   Vercel Serverless Function     │
                                 │       Express API Router         │
                                 │ (Auth, RBAC, Image Validation)   │
                                 └─────────┬──────────────┬─────────┘
                                           │              │
                   ┌───────────────────────┘              └────────────────────────┐
                   ▼                                                               ▼
        ┌─────────────────────┐                                         ┌─────────────────────┐
        │    MongoDB Atlas    │                                         │ FastAPI ML Service  │
        │ Users, Reports,     │                                         │ PyTorch ResNet-50   │
        │ Interventions       │                                         │ Inference & Caching │
        └─────────────────────┘                                         └─────────────────────┘
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ 
- **Python**: v3.9+ (for running the local ML service)
- **MongoDB**: MongoDB Atlas connection string or local MongoDB instance

---

### 2. Environment Configuration

#### Server (`Server/.env` or root `.env`)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret_key
ML_SERVICE_URL=http://localhost:8000
# Optional: REDIS_URL=redis://localhost:6379
```

#### Client (`Client/.env`)
```env
# Optional: Leave unset in production for same-origin (/api)
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

### 3. Installation & Local Development

#### Install Dependencies
From the repository root:
```bash
npm install
cd Client && npm install
cd ../Server && npm install
cd ../ML_service && pip install -r requirements.txt
```

#### Running the Services
1. **Start the Machine Learning Service (FastAPI):**
   ```bash
   cd ML_service
   uvicorn app.main:app --reload --port 8000
   ```
2. **Start the Express API Server:**
   ```bash
   cd Server
   npm run dev
   ```
3. **Start the React Frontend:**
   ```bash
   cd Client
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5173`.

---

## 🔐 User Roles & Registration

AgriSentinel does not use mock or hardcoded demo credentials. Users register through the registration page with their designated role:

| Role | Target User | Capabilities |
|---|---|---|
| `FIELD_WORKER` | Farmers & Field Agents | Capture & upload geotagged crop images, offline storage, view diagnosis and treatment guidance, retry failed analyses |
| `AGRICULTURAL_OFFICER` | District Officers & Agronomists | Access GIS interactive map, review farmer reports with original high-res imagery, manage interventions, monitor disease spread |
| `ADMIN` | System Administrators | Platform health monitoring, user directory, system configurations, and aggregate audit metrics |

To get started:
1. Navigate to `/register`.
2. Choose your role (`Field Worker / Farmer`, `Agricultural Officer`, or `Administrator`).
3. Fill in your details and log in at `/login`.

---

## 🧠 AI Diagnostic & Multilingual Pipeline

AgriSentinel features a dual-layer AI architecture designed for low latency, high diagnostic accuracy, and multi-dialect field accessibility:

- **Primary Diagnostic Engine (Google Gemini Vision API)**: Analyzes crop leaf photos with Google GenAI (`gemini-3.5-flash-lite`), classifying diseases across tomato, potato, corn, pepper, and apple crops with structured severity, confidence scores, and approved pesticide treatments in under 1.5 seconds.
- **Multilingual Localization Engine (Gemini)**: Translates dynamic diagnoses, treatment advice, and GIS alerts into Hindi and Tamil in real time while preserving critical active chemical ingredient names, dosages, and units.
- **Resilient Fallback (PyTorch ResNet-50)**: If external API limits are encountered, requests automatically fall back to the self-hosted PyTorch FastAPI microservice (`resnet50_plantvillage.pth`).
- **In-Memory Prediction Cache**: Implements an LRU cache in the backend worker to deliver near-instantaneous responses for recurring requests.
- **Client-Side Compression**: Compresses photos to a maximum dimension of 1024px at 85% JPEG quality before uploading, keeping payloads below Vercel's 4.5 MB serverless limit while preserving fine leaf texture details.

---

## 🌐 Production Deployment (Vercel)

The repository is configured as a monorepo for Vercel deployment:
- **Frontend SPA**: Built via `npm run build` (`vite build`) and served as static assets.
- **API Serverless Function**: `api/index.js` bridges the Express server into Vercel Serverless Functions.
- **Rewrites (`vercel.json`)**:
  - `/api/(.*)` routes directly to `api/index.js`
  - `/(.*)` routes to `index.html` for client-side routing

### Vercel Environment Variables
Add the following in your Vercel Project Settings > Environment Variables:
- `MONGODB_URI`: Your MongoDB Atlas URI.
- `JWT_SECRET`: A cryptographically secure random string.
- `GEMINI_API_KEY`: Google Gemini API key.
- `GEMINI_MODEL`: `gemini-3.5-flash-lite` (or `gemini-flash-latest`).

---

## 🛡️ Data Integrity & Safety

- No hardcoded demo credentials or fake fallback accounts are present in production.
- Empty states are cleanly rendered when no reports or interventions exist.
- Server-side authorization ensures only authenticated officers have access to district-wide GIS and intervention data.
