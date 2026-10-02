import io
import os
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

app = FastAPI(title="AgriSentinel ML Service - ResNet-50 Pipeline")

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

# Image transform pipeline matching PlantVillage standards:
# Resize -> CenterCrop -> ToTensor -> Normalize
transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# Initialize ResNet-50 architecture
model = models.resnet50(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, len(DISEASE_CLASSES))
model.eval()

# Check for fine-tuned weights file
WEIGHTS_PATH = os.environ.get(
    "MODEL_WEIGHTS_PATH",
    os.path.join(os.path.dirname(__file__), "..", "resnet50_plantvillage.pth")
)
weights_loaded = False
if os.path.exists(WEIGHTS_PATH):
    try:
        state_dict = torch.load(WEIGHTS_PATH, map_location=torch.device('cpu'))
        model.load_state_dict(state_dict)
        weights_loaded = True
        print(f"✅ Loaded fine-tuned ResNet-50 weights from {WEIGHTS_PATH}")
    except Exception as e:
        print(f"⚠️ Failed to load weights from {WEIGHTS_PATH}: {e}")
else:
    print(f"ℹ️ No pre-trained weights file found at {WEIGHTS_PATH}. Running ResNet-50 architecture in demo/uncalibrated mode.")

@app.get("/")
def read_root():
    return {
        "status": "ok",
        "service": "AgriSentinel ResNet-50 ML Service",
        "weights_loaded": weights_loaded,
        "classes": DISEASE_CLASSES
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_disease(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert('RGB')
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image content")
    
    # Preprocess image through PyTorch transform pipeline
    tensor = transform(image).unsqueeze(0)
    
    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
        confidence, predicted_idx = torch.max(probabilities, dim=0)
    
    predicted_disease = DISEASE_CLASSES[predicted_idx.item()]
    conf_score = round(float(confidence.item()), 4)
    
    return {
        "success": True,
        "disease": predicted_disease,
        "predictedDisease": predicted_disease,
        "confidence": conf_score,
        "isMock": not weights_loaded
    }
