# AgriSentinel: Crop Disease Monitoring & GIS Platform

This is an **academic prototype** demonstrating an offline-first MERN + FastAPI architecture for tracking crop diseases via image upload, GPS tagging, and AI-assisted classification.

> **Disclaimer**: This is a college mini-project. It does not represent a government deployment, nor does it guarantee clinical accuracy. The ML predictions are purely AI-assisted informational guidance based on limited dataset patterns (like PlantVillage).

## Architecture

1. **Frontend**: React, Vite, Tailwind, React Router, IndexedDB, vite-plugin-pwa (Offline First).
2. **Backend**: Node.js, Express, MongoDB, Socket.IO, BullMQ.
3. **ML Service**: Python FastAPI, simulating model inference (MOCK mode default).

## Features

- **Offline-First PWA**: Capture reports without internet. Saves to IndexedDB and auto-syncs when online.
- **Multilingual UI**: Configured with i18next (English, Hindi, Tamil).
- **GIS Dashboard**: Leaflet Map indicating crop hotspots, integrated via Socket.IO for real-time updates.
- **Async Queueing**: Node.js backend pushes requests to Redis via BullMQ, which are processed by the Python service.

## Running the Application

### 1. Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379`

### 2. Backend (Server)
```bash
cd Server
npm install
npm run dev
```

### 3. Frontend (Client)
```bash
cd Client
npm install
npm run dev
```

### 4. ML Service (FastAPI)
```bash
cd ML_service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 5. Seeding Demo Data
To view the Officer Dashboard with map markers:
```bash
cd Server
node seed.js
```
Then login on the frontend using `officer@example.com` / `password123`.
