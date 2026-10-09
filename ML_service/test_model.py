"""
test_model.py — Standalone Model Inference Verification CLI

Usage:
  python test_model.py <image_path>
  python test_model.py --verify-all
"""

import os
import sys
import argparse
from PIL import Image
import torch
import torch.nn as nn
from torchvision import transforms, models

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

NORM_MEAN = [0.485, 0.456, 0.406]
NORM_STD = [0.229, 0.224, 0.225]

inference_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=NORM_MEAN, std=NORM_STD)
])

CHECKPOINT_PATH = os.environ.get(
    "MODEL_WEIGHTS_PATH",
    os.path.join(os.path.dirname(__file__), "resnet50_plantvillage.pth")
)


def load_classifier(checkpoint_path=CHECKPOINT_PATH, device="cpu"):
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(
            f"❌ Checkpoint file not found: {checkpoint_path}\n"
            f"Please train or provide the fine-tuned model weights first."
        )

    model = models.resnet50(weights=None)
    model.fc = nn.Linear(model.fc.in_features, len(DISEASE_CLASSES))
    state_dict = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model


def predict_single_image(image_path, model, device="cpu"):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at {image_path}")

    with open(image_path, "rb") as f:
        img = Image.open(f).convert("RGB")

    tensor = inference_transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.softmax(outputs, dim=1)[0]
        conf, pred_idx = torch.max(probs, dim=0)

    pred_class = DISEASE_CLASSES[pred_idx.item()]
    conf_score = float(conf.item())

    # Get top 3 predictions
    top3_probs, top3_indices = torch.topk(probs, k=min(3, len(DISEASE_CLASSES)))
    top3 = [(DISEASE_CLASSES[idx.item()], float(p.item())) for p, idx in zip(top3_probs, top3_indices)]

    return pred_class, conf_score, top3


def verify_all_classes(model, data_dir=None, device="cpu"):
    """
    Finds 1 representative image from each of the 8 classes and tests the model.
    """
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "training"))
    from dataset import load_plantvillage_samples

    samples, _ = load_plantvillage_samples(data_dir=data_dir)
    by_class = {}
    for path, label_idx in samples:
        cname = DISEASE_CLASSES[label_idx]
        if cname not in by_class:
            by_class[cname] = path

    print("\n" + "=" * 75)
    print("🌿 Testing Representative Images for All 8 PlantVillage Classes")
    print("=" * 75)
    print(f"{'Target Class':<30} {'Predicted Class':<30} {'Confidence':<12} {'Match':<6}")
    print("-" * 75)

    correct_count = 0
    for target_class in DISEASE_CLASSES:
        img_path = by_class.get(target_class)
        if not img_path:
            print(f"{target_class:<30} [No sample image found]")
            continue

        pred_class, conf, _ = predict_single_image(img_path, model, device=device)
        is_correct = pred_class == target_class
        if is_correct:
            correct_count += 1

        match_str = "✅ YES" if is_correct else "❌ NO"
        print(f"{target_class:<30} {pred_class:<30} {conf*100:>6.2f}%    {match_str}")

    print("-" * 75)
    print(f"Summary: {correct_count}/{len(DISEASE_CLASSES)} representative samples classified correctly.\n")


def main():
    parser = argparse.ArgumentParser(description="Standalone AgriSentinel ResNet-50 Disease Classifier Test")
    parser.add_argument("image_path", type=str, nargs="?", default=None, help="Path to crop leaf image to classify")
    parser.add_argument("--verify-all", action="store_true", help="Run inference across all 8 classes")
    parser.add_argument("--checkpoint", type=str, default=CHECKPOINT_PATH, help="Path to checkpoint file")
    args = parser.parse_args()

    device = "cuda" if torch.cuda.is_available() else "cpu"

    print("=" * 60)
    print("🔍 AgriSentinel Standalone Model Inference Test")
    print("=" * 60)

    try:
        model = load_classifier(checkpoint_path=args.checkpoint, device=device)
        print("Model loaded:      YES")
        print("Checkpoint loaded: YES")
        print(f"Checkpoint file:   {args.checkpoint}")
        print(f"Classes supported: {len(DISEASE_CLASSES)}")
        print("isMock:            false")
    except Exception as e:
        print("Model loaded:      NO")
        print("Checkpoint loaded: NO")
        print(f"Error: {e}")
        sys.exit(1)

    print("=" * 60)

    if args.verify_all:
        verify_all_classes(model, device=device)
        return

    if args.image_path:
        pred_class, conf, top3 = predict_single_image(args.image_path, model, device=device)
        print(f"Image:            {args.image_path}")
        print(f"Predicted class:  {pred_class}")
        print(f"Confidence:       {conf * 100:.2f}% ({conf:.4f})")
        print(f"isMock:           false")
        print("\nTop Probabilities:")
        for rank, (c, p) in enumerate(top3, 1):
            print(f"  {rank}. {c:30s} {p*100:6.2f}%")
        print("=" * 60)
    else:
        print("ℹ️ No image specified. Run with an image path or --verify-all.")
        print("Example: python test_model.py path/to/leaf.jpg")


if __name__ == "__main__":
    main()
