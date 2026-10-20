import io
import os
import json
import base64
import requests
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

app = FastAPI(title="AgriSentinel ML Service - Gemini AI Pipeline")

class PredictionResponse(BaseModel):
    success: bool
    disease: str
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

# Gemini API configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")

# Optional legacy PyTorch model loader (fallback when Gemini key is not configured)
WEIGHTS_PATH = os.environ.get(
    "MODEL_WEIGHTS_PATH",
    os.path.join(os.path.dirname(__file__), "..", "resnet50_plantvillage.pth")
)
legacy_model = None
legacy_weights_loaded = False

try:
    import torch
    import torch.nn as nn
    from torchvision import transforms, models

    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    if os.path.exists(WEIGHTS_PATH):
        try:
            legacy_model = models.resnet50(weights=None)
            legacy_model.fc = nn.Linear(legacy_model.fc.in_features, len(DISEASE_CLASSES))
            state_dict = torch.load(WEIGHTS_PATH, map_location=torch.device('cpu'))
            legacy_model.load_state_dict(state_dict)
            legacy_model.eval()
            legacy_weights_loaded = True
            print(f"ℹ️ Legacy ResNet-50 weights loaded from {WEIGHTS_PATH} as fallback.")
        except Exception as e:
            print(f"⚠️ Could not load legacy weights: {e}")
except ImportError:
    pass

def normalize_disease_name(raw_name: str) -> str:
    """Matches raw model output to one of the strict PlantVillage class names."""
    if not raw_name:
        return DISEASE_CLASSES[0]

    raw_clean = raw_name.strip()
    # Direct match
    if raw_clean in DISEASE_CLASSES:
        return raw_clean

    raw_lower = raw_clean.lower().replace(" ", "_").replace("-", "_")
    for cls in DISEASE_CLASSES:
        cls_lower = cls.lower()
        if cls_lower == raw_lower or cls_lower in raw_lower or raw_lower in cls_lower:
            return cls

    # Keyword based classification
    is_tomato = "tomato" in raw_lower
    is_potato = "potato" in raw_lower
    is_pepper = "pepper" in raw_lower or "bell" in raw_lower
    is_early = "early" in raw_lower
    is_late = "late" in raw_lower
    is_healthy = "healthy" in raw_lower
    is_spot = "spot" in raw_lower or "bacterial" in raw_lower

    if is_tomato:
        if is_healthy: return "Tomato_healthy"
        if is_late: return "Tomato_Late_blight"
        return "Tomato_Early_blight"
    if is_potato:
        if is_healthy: return "Potato_healthy"
        if is_late: return "Potato_Late_blight"
        return "Potato_Early_blight"
    if is_pepper:
        if is_healthy: return "Pepper_bell_healthy"
        return "Pepper_bell_Bacterial_spot"

    return DISEASE_CLASSES[0]

def call_gemini_vision(image_bytes: bytes, mime_type: str = "image/jpeg"):
    """Invokes Gemini Multimodal Vision API for leaf disease diagnosis."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")

    base64_data = base64.b64encode(image_bytes).decode("utf-8")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

    prompt = (
        "You are an expert plant pathologist and agronomist. "
        "Inspect this crop leaf image and identify the exact disease condition. "
        "You MUST classify it into exactly one of these 8 PlantVillage classes:\n"
        "- Tomato_Early_blight\n"
        "- Tomato_Late_blight\n"
        "- Tomato_healthy\n"
        "- Potato_Early_blight\n"
        "- Potato_Late_blight\n"
        "- Potato_healthy\n"
        "- Pepper_bell_Bacterial_spot\n"
        "- Pepper_bell_healthy\n\n"
        "Assess visible symptoms (concentric rings, water-soaked lesions, bacterial spots, or healthy green tissue) "
        "and determine diagnostic confidence between 0.00 and 1.00.\n"
        "Return ONLY a valid JSON object with this exact schema:\n"
        "{\n"
        '  "disease": "<exact class from the list above>",\n'
        '  "confidence": <float between 0.00 and 1.00>\n'
        "}"
    )

    payload = {
        "contents": [{
            "parts": [
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": base64_data
                    }
                },
                {"text": prompt}
            ]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    response = requests.post(url, json=payload, timeout=15)
    if not response.ok:
        raise RuntimeError(f"Gemini API returned {response.status_code}: {response.text}")

    data = response.json()
    candidate_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    parsed = json.loads(candidate_text)

    predicted_disease = normalize_disease_name(parsed.get("disease", ""))
    confidence = float(parsed.get("confidence", 0.90))
    # Bound confidence
    confidence = max(0.01, min(0.99, round(confidence, 4)))

    return predicted_disease, confidence

@app.get("/")
def read_root():
    return {
        "status": "ok",
        "service": "AgriSentinel Gemini AI Service",
        "provider": "Google Gemini API" if GEMINI_API_KEY else "Local PyTorch",
        "model": GEMINI_MODEL if GEMINI_API_KEY else "ResNet-50",
        "gemini_active": bool(GEMINI_API_KEY),
        "weights_loaded": legacy_weights_loaded,
        "classes": DISEASE_CLASSES
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_disease(file: UploadFile = File(...)):
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    try:
        # Validate that image content is readable
        Image.open(io.BytesIO(contents)).convert('RGB')
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image content")

    mime_type = file.content_type or "image/jpeg"

    # 1. Try Gemini Vision API first (preferred modern high-speed inference)
    if GEMINI_API_KEY:
        try:
            predicted_disease, conf_score = call_gemini_vision(contents, mime_type)
            return {
                "success": True,
                "disease": predicted_disease,
                "predictedDisease": predicted_disease,
                "confidence": conf_score,
                "isMock": False
            }
        except Exception as e:
            print(f"⚠️ Gemini Vision API call failed: {e}. Checking fallback...")
            if not legacy_model:
                raise HTTPException(status_code=502, detail=f"Gemini inference failed: {str(e)}")

    # 2. Fallback to local PyTorch ResNet-50 if Gemini is unavailable
    if legacy_model is not None:
        try:
            import torch
            image = Image.open(io.BytesIO(contents)).convert('RGB')
            tensor = transform(image).unsqueeze(0)
            with torch.no_grad():
                outputs = legacy_model(tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
                confidence, predicted_idx = torch.max(probabilities, dim=0)
            predicted_disease = DISEASE_CLASSES[predicted_idx.item()]
            conf_score = round(float(confidence.item()), 4)
            return {
                "success": True,
                "disease": predicted_disease,
                "predictedDisease": predicted_disease,
                "confidence": conf_score,
                "isMock": not legacy_weights_loaded
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Fallback model failed: {str(e)}")

    raise HTTPException(status_code=503, detail="No AI inference provider available")
