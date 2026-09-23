from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import random
import time

app = FastAPI(title="AgriSentinel ML Service - Mock Mode")

class PredictionResponse(BaseModel):
    success: bool
    predictedDisease: str
    confidence: float
    isMock: bool

DISEASE_CLASSES = [
    "Tomato_Early_blight",
    "Tomato_Late_blight",
    "Tomato_healthy",
    "Potato_Early_blight",
    "Potato_Late_blight",
    "Potato_healthy",
    "Pepper_bell_Bacterial_spot",
    "Pepper_bell_healthy"
]

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AgriSentinel ML Service API"}

@app.post("/predict", response_model=PredictionResponse)
async def predict_disease(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # MOCK INFERENCE LOGIC (Since no real model is provided yet)
    # Simulate processing delay
    time.sleep(2)
    
    predicted = random.choice(DISEASE_CLASSES)
    confidence = round(random.uniform(0.70, 0.99), 4)
    
    return {
        "success": True,
        "predictedDisease": predicted,
        "confidence": confidence,
        "isMock": True
    }
