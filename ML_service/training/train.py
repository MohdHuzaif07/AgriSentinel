"""
train.py — Efficient Transfer Learning Fine-Tuning of ResNet-50 on PlantVillage 8-Class Dataset

- Pretrained Backbone: torchvision.models.resnet50 (ResNet50_Weights.DEFAULT)
- Strategy: Feature extraction & fine-tuning (freezes early layers, trains layer4 + custom 8-class FC head)
- Fast CPU execution (~1 minute total)
- Saves genuine fine-tuned PyTorch checkpoint to: ML_service/resnet50_plantvillage.pth
"""

import os
import sys
import time
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models

# Ensure dataset module can be imported
sys.path.insert(0, os.path.dirname(__file__))
from dataset import create_train_val_dataloaders, DISEASE_CLASSES

CHECKPOINT_PATH = os.path.join(os.path.dirname(__file__), "..", "resnet50_plantvillage.pth")
STATS_PATH = os.path.join(os.path.dirname(__file__), "training_stats.json")


def train_model(
    data_dir=None,
    num_epochs=4,
    batch_size=32,
    lr=0.001,
    val_split=0.2,
    max_per_class=75,
    seed=42
):
    print("=" * 65, flush=True)
    print("🌱 AgriSentinel ResNet-50 Fine-Tuning Pipeline (Transfer Learning)", flush=True)
    print("=" * 65, flush=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Hardware Device: {device}", flush=True)

    # 1. Load Data
    print("\n📂 Loading PlantVillage 8-Class Dataset...", flush=True)
    train_loader, val_loader, stats = create_train_val_dataloaders(
        data_dir=data_dir,
        val_split=val_split,
        batch_size=batch_size,
        seed=seed,
        max_per_class=max_per_class
    )

    print(f"  Total Images:      {stats['total_images']}", flush=True)
    print(f"  Training Images:   {stats['train_images']}", flush=True)
    print(f"  Validation Images: {stats['val_images']}", flush=True)
    print("\nClass Distribution:", flush=True)
    for cls_name, count in stats["class_counts"].items():
        print(f"  - {cls_name:30s}: {count} images", flush=True)

    # 2. Build Model with Transfer Learning
    print("\n🏗️ Loading Pretrained ResNet-50 Backbone...", flush=True)
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)

    # Freeze earlier layers (conv1, bn1, layer1, layer2, layer3) for fast and stable fine-tuning
    for name, param in model.named_parameters():
        if "layer4" not in name and "fc" not in name:
            param.requires_grad = False

    # Replace FC head with 8-class linear classifier
    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, len(DISEASE_CLASSES))
    model = model.to(device)

    # Trainable parameter count
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"  Trainable Parameters: {trainable_params:,} / {total_params:,} (layer4 + classifier head)", flush=True)

    # 3. Setup Loss, Optimizer, Scheduler
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam([
        {"params": model.layer4.parameters(), "lr": lr * 0.1},
        {"params": model.fc.parameters(), "lr": lr}
    ], weight_decay=1e-4)

    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=2, gamma=0.5)

    best_val_acc = 0.0
    history = []

    print(f"\n🚀 Training for {num_epochs} epochs (batch_size={batch_size})...\n", flush=True)
    start_time = time.time()

    for epoch in range(1, num_epochs + 1):
        epoch_start = time.time()

        # Training Phase
        model.train()
        running_loss = 0.0
        running_corrects = 0
        total_train = 0

        for batch_idx, (inputs, labels) in enumerate(train_loader, 1):
            inputs = inputs.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            _, preds = torch.max(outputs, 1)
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data).item()
            total_train += inputs.size(0)

        scheduler.step()

        train_loss = running_loss / total_train
        train_acc = running_corrects / total_train

        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_corrects = 0
        total_val = 0

        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device)
                labels = labels.to(device)

                outputs = model(inputs)
                loss = criterion(outputs, labels)

                _, preds = torch.max(outputs, 1)
                val_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data).item()
                total_val += inputs.size(0)

        val_loss = val_loss / total_val
        val_acc = val_corrects / total_val
        epoch_time = time.time() - epoch_start

        epoch_record = {
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc, 4),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc, 4),
            "time_sec": round(epoch_time, 1)
        }
        history.append(epoch_record)

        print(
            f"Epoch [{epoch:02d}/{num_epochs:02d}] "
            f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:.2f}% | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:.2f}% | "
            f"({epoch_time:.1f}s)",
            flush=True
        )

        # Save Best Model Checkpoint
        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            print(f"  🌟 Saving best checkpoint (Val Acc: {val_acc*100:.2f}%)...", flush=True)
            # Save standard state_dict compatible with standard torchvision.models.resnet50
            torch.save(model.state_dict(), CHECKPOINT_PATH)

    total_time = time.time() - start_time
    checkpoint_size_mb = os.path.getsize(CHECKPOINT_PATH) / (1024 * 1024)

    print("\n" + "=" * 65, flush=True)
    print("🎉 ResNet-50 Fine-Tuning Complete!", flush=True)
    print(f"  Total Duration:      {total_time:.1f} seconds", flush=True)
    print(f"  Best Val Accuracy:   {best_val_acc*100:.2f}%", flush=True)
    print(f"  Checkpoint File:     {CHECKPOINT_PATH} ({checkpoint_size_mb:.2f} MB)", flush=True)
    print("=" * 65 + "\n", flush=True)

    stats_payload = {
        "architecture": "ResNet-50 (Transfer Learning)",
        "dataset": "PlantVillage (8 classes)",
        "classes": DISEASE_CLASSES,
        "best_val_acc": round(best_val_acc, 4),
        "total_images": stats["total_images"],
        "train_images": stats["train_images"],
        "val_images": stats["val_images"],
        "epochs": num_epochs,
        "batch_size": batch_size,
        "learning_rate": lr,
        "history": history,
        "checkpoint_path": CHECKPOINT_PATH,
        "checkpoint_size_mb": round(checkpoint_size_mb, 2)
    }

    with open(STATS_PATH, "w") as f:
        json.dump(stats_payload, f, indent=2)

    return model, stats_payload


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Train ResNet-50 on PlantVillage 8-class dataset")
    parser.add_argument("--data_dir", type=str, default=None)
    parser.add_argument("--epochs", type=int, default=4)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=0.001)
    parser.add_argument("--max_per_class", type=int, default=75)
    args = parser.parse_args()

    train_model(
        data_dir=args.data_dir,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        max_per_class=args.max_per_class
    )
