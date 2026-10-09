"""
dataset.py — PlantVillage 8-Class Dataset Loader & Splitter

Prepares training and validation datasets for the 8 AgriSentinel crop disease classes:
1. Tomato_Early_blight
2. Tomato_Late_blight
3. Tomato_healthy
4. Potato_Early_blight
5. Potato_Late_blight
6. Potato_healthy
7. Pepper_bell_Bacterial_spot
8. Pepper_bell_healthy
"""

import os
import glob
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

# Exact 8 classes in strict canonical order
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

# Mapping from raw PlantVillage folder names to canonical class names
FOLDER_MAPPING = {
    "Tomato___Early_blight": "Tomato_Early_blight",
    "Tomato___Late_blight": "Tomato_Late_blight",
    "Tomato___healthy": "Tomato_healthy",
    "Potato___Early_blight": "Potato_Early_blight",
    "Potato___Late_blight": "Potato_Late_blight",
    "Potato___healthy": "Potato_healthy",
    "Pepper,_bell___Bacterial_spot": "Pepper_bell_Bacterial_spot",
    "Pepper,_bell___healthy": "Pepper_bell_healthy",
    # Alternative naming conventions in some mirrors
    "Pepper__bell___Bacterial_spot": "Pepper_bell_Bacterial_spot",
    "Pepper__bell___healthy": "Pepper_bell_healthy",
    "Tomato_Early_blight": "Tomato_Early_blight",
    "Tomato_Late_blight": "Tomato_Late_blight",
    "Tomato_healthy": "Tomato_healthy",
    "Potato_Early_blight": "Potato_Early_blight",
    "Potato_Late_blight": "Potato_Late_blight",
    "Potato_healthy": "Potato_healthy",
    "Pepper_bell_Bacterial_spot": "Pepper_bell_Bacterial_spot",
    "Pepper_bell_healthy": "Pepper_bell_healthy"
}

# Standard normalization (matches PyTorch ImageNet & PlantVillage models)
NORM_MEAN = [0.485, 0.456, 0.406]
NORM_STD = [0.229, 0.224, 0.225]

# Preprocessing transforms
train_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.1, contrast=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=NORM_MEAN, std=NORM_STD)
])

val_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=NORM_MEAN, std=NORM_STD)
])


class PlantVillage8Class(Dataset):
    """Dataset for 8-class PlantVillage subset."""
    def __init__(self, samples, transform=None):
        """
        samples: list of tuples (image_path, class_idx)
        """
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        with open(path, "rb") as f:
            img = Image.open(f).convert("RGB")
        if self.transform is not None:
            img = self.transform(img)
        return img, label


def find_dataset_dir(base_dir=None):
    """Locate the dataset directory containing the 8 class folders."""
    possible_roots = [
        os.path.join(os.path.dirname(__file__), "..", "dataset_temp", "raw", "color"),
        os.path.join(os.path.dirname(__file__), "..", "data", "plantvillage"),
        os.path.join(os.path.dirname(__file__), "..", "data"),
        os.path.join(os.path.dirname(__file__), "..", "dataset_temp"),
        base_dir
    ]
    for r in possible_roots:
        if r and os.path.isdir(r):
            subdirs = os.listdir(r)
            if any(f in FOLDER_MAPPING for f in subdirs):
                return r
    return None


def load_plantvillage_samples(data_dir=None, max_per_class=None):
    """
    Scans dataset directory, collects image paths and labels for the 8 target classes.
    Returns: samples (list of (path, label)), class_counts (dict)
    """
    if data_dir is None:
        data_dir = find_dataset_dir()
    if data_dir is None or not os.path.exists(data_dir):
        raise FileNotFoundError(f"PlantVillage dataset directory not found. Please provide valid path.")

    class_to_idx = {name: idx for idx, name in enumerate(DISEASE_CLASSES)}
    samples = []
    class_counts = {c: 0 for c in DISEASE_CLASSES}

    # Find subdirectories matching our 8 classes
    for entry in os.listdir(data_dir):
        entry_path = os.path.join(data_dir, entry)
        if not os.path.isdir(entry_path):
            continue

        target_class = FOLDER_MAPPING.get(entry)
        if target_class is None:
            continue

        label_idx = class_to_idx[target_class]
        img_files = []
        for ext in ("*.jpg", "*.jpeg", "*.JPG", "*.JPEG", "*.png", "*.PNG"):
            img_files.extend(glob.glob(os.path.join(entry_path, ext)))

        if max_per_class:
            img_files = img_files[:max_per_class]

        for p in img_files:
            samples.append((p, label_idx))
            class_counts[target_class] += 1

    return samples, class_counts


def create_train_val_dataloaders(data_dir=None, val_split=0.2, batch_size=32, seed=42, max_per_class=None):
    """
    Creates stratified train and validation DataLoaders.
    """
    samples, class_counts = load_plantvillage_samples(data_dir, max_per_class=max_per_class)
    if len(samples) == 0:
        raise ValueError("No matching images found for the 8 PlantVillage classes.")

    # Stratified split by class
    from collections import defaultdict
    import random

    random.seed(seed)
    torch.manual_seed(seed)

    by_class = defaultdict(list)
    for path, label in samples:
        by_class[label].append((path, label))

    train_samples = []
    val_samples = []

    for label, items in by_class.items():
        random.shuffle(items)
        n_val = max(1, int(len(items) * val_split))
        val_samples.extend(items[:n_val])
        train_samples.extend(items[n_val:])

    train_dataset = PlantVillage8Class(train_samples, transform=train_transform)
    val_dataset = PlantVillage8Class(val_samples, transform=val_transform)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    stats = {
        "total_images": len(samples),
        "train_images": len(train_samples),
        "val_images": len(val_samples),
        "class_counts": class_counts,
        "classes": DISEASE_CLASSES
    }

    return train_loader, val_loader, stats
