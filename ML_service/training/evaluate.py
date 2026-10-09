"""
evaluate.py — Comprehensive Model Evaluation & Metrics Report

Calculates:
- Overall Validation Accuracy
- Per-Class Precision, Recall, F1-Score, and Accuracy
- Confusion Matrix
- Saves results to ML_service/training/evaluation_report.json
"""

import os
import sys
import json
import torch
import torch.nn as nn
from torchvision import models
from collections import defaultdict

# Ensure dataset module can be imported
sys.path.insert(0, os.path.dirname(__file__))
from dataset import create_train_val_dataloaders, DISEASE_CLASSES

CHECKPOINT_PATH = os.path.join(os.path.dirname(__file__), "..", "resnet50_plantvillage.pth")
REPORT_PATH = os.path.join(os.path.dirname(__file__), "evaluation_report.json")


def evaluate_model(data_dir=None, checkpoint_path=None, batch_size=32):
    if checkpoint_path is None:
        checkpoint_path = CHECKPOINT_PATH

    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Checkpoint not found at: {checkpoint_path}. Train the model first.")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 60)
    print("📊 Evaluating AgriSentinel ResNet-50 Checkpoint")
    print(f"  Checkpoint: {checkpoint_path}")
    print(f"  Device:     {device}")
    print("=" * 60)

    # 1. Load Data
    _, val_loader, stats = create_train_val_dataloaders(data_dir=data_dir, batch_size=batch_size)
    print(f"Validation Samples: {stats['val_images']}")

    # 2. Instantiate Model and Load Weights
    model = models.resnet50(weights=None)
    model.fc = nn.Linear(model.fc.in_features, len(DISEASE_CLASSES))
    state_dict = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(state_dict)
    model = model.to(device)
    model.eval()

    # 3. Run Inference on Validation Set
    all_preds = []
    all_targets = []
    all_probs = []

    with torch.no_grad():
        for inputs, targets in val_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().tolist())
            all_targets.extend(targets.cpu().tolist())
            all_probs.extend(probs.cpu().tolist())

    total_samples = len(all_targets)
    correct_total = sum(p == t for p, t in zip(all_preds, all_targets))
    overall_accuracy = correct_total / total_samples

    # 4. Confusion Matrix (8x8)
    num_classes = len(DISEASE_CLASSES)
    cm = [[0 for _ in range(num_classes)] for _ in range(num_classes)]
    for p, t in zip(all_preds, all_targets):
        cm[t][p] += 1

    # 5. Per-Class Precision, Recall, F1
    per_class_metrics = {}
    for c_idx, c_name in enumerate(DISEASE_CLASSES):
        tp = cm[c_idx][c_idx]
        fp = sum(cm[other][c_idx] for other in range(num_classes) if other != c_idx)
        fn = sum(cm[c_idx][other] for other in range(num_classes) if other != c_idx)
        total_class = sum(cm[c_idx])

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        class_acc = tp / total_class if total_class > 0 else 0.0

        per_class_metrics[c_name] = {
            "samples": total_class,
            "correct": tp,
            "accuracy": round(class_acc, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4)
        }

    # 6. Display Summary Table
    print(f"\nOverall Validation Accuracy: {overall_accuracy*100:.2f}%\n")
    print(f"{'Class Name':<32} {'Samples':<8} {'Correct':<8} {'Acc (%)':<10} {'Precision':<10} {'Recall':<10} {'F1':<8}")
    print("-" * 90)
    for c_name, m in per_class_metrics.items():
        print(
            f"{c_name:<32} {m['samples']:<8} {m['correct']:<8} "
            f"{m['accuracy']*100:<10.2f} {m['precision']:<10.4f} {m['recall']:<10.4f} {m['f1_score']:<8.4f}"
        )
    print("-" * 90)

    report_payload = {
        "overall_accuracy": round(overall_accuracy, 4),
        "total_val_samples": total_samples,
        "per_class_metrics": per_class_metrics,
        "confusion_matrix": cm,
        "classes": DISEASE_CLASSES,
        "checkpoint": checkpoint_path
    }

    with open(REPORT_PATH, "w") as f:
        json.dump(report_payload, f, indent=2)

    print(f"\n✅ Full evaluation metrics written to {REPORT_PATH}\n")
    return report_payload


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default=None)
    parser.add_argument("--checkpoint", type=str, default=None)
    args = parser.parse_args()
    evaluate_model(data_dir=args.data_dir, checkpoint_path=args.checkpoint)
