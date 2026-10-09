"""
download_dataset.py — Download Official PlantVillage 8-Class Dataset

Downloads images for the 8 target classes from the official PlantVillage repository
(https://github.com/spMohanty/PlantVillage-Dataset).
Uses multi-threaded parallel downloads for high speed and reliability.
"""

import os
import requests
import concurrent.futures
from urllib.parse import unquote

# Target 8 classes and their source folders in spMohanty/PlantVillage-Dataset
TARGET_CLASSES = {
    "Tomato_Early_blight": "Tomato___Early_blight",
    "Tomato_Late_blight": "Tomato___Late_blight",
    "Tomato_healthy": "Tomato___healthy",
    "Potato_Early_blight": "Potato___Early_blight",
    "Potato_Late_blight": "Potato___Late_blight",
    "Potato_healthy": "Potato___healthy",
    "Pepper_bell_Bacterial_spot": "Pepper,_bell___Bacterial_spot",
    "Pepper_bell_healthy": "Pepper,_bell___healthy"
}

API_BASE = "https://api.github.com/repos/spMohanty/PlantVillage-Dataset/contents/raw/color"
DEST_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "plantvillage")


def download_single_file(url, out_path):
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        return True
    try:
        r = requests.get(url, timeout=20)
        if r.status_code == 200:
            with open(out_path, "wb") as f:
                f.write(r.content)
            return True
    except Exception as e:
        pass
    return False


def download_class_images(target_name, folder_name, max_images=150, max_workers=16):
    class_dest = os.path.join(DEST_DIR, target_name)
    os.makedirs(class_dest, exist_ok=True)

    # Fetch file list via GitHub API
    api_url = f"{API_BASE}/{folder_name}"
    resp = requests.get(api_url, timeout=15)
    if resp.status_code != 200:
        print(f"⚠️ Failed to list contents for {folder_name} (HTTP {resp.status_code})")
        return 0

    items = resp.json()
    image_items = [x for x in items if x.get("type") == "file" and x.get("name", "").lower().endswith((".jpg", ".jpeg", ".png"))]
    selected = image_items[:max_images]

    tasks = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        for idx, item in enumerate(selected):
            download_url = item.get("download_url")
            fname = item.get("name")
            out_file = os.path.join(class_dest, fname)
            tasks.append(executor.submit(download_single_file, download_url, out_file))

        completed = sum(1 for f in concurrent.futures.as_completed(tasks) if f.result())

    print(f"  ✅ {target_name:30s}: Downloaded {completed}/{len(selected)} images")
    return completed


def download_all(max_per_class=150, max_workers=20):
    print("=" * 60)
    print("🌿 Downloading PlantVillage Dataset (8 Target Classes)")
    print(f"Destination: {os.path.abspath(DEST_DIR)}")
    print(f"Images per class: up to {max_per_class}")
    print("=" * 60)

    total_downloaded = 0
    for target_name, folder_name in TARGET_CLASSES.items():
        count = download_class_images(target_name, folder_name, max_images=max_per_class, max_workers=max_workers)
        total_downloaded += count

    print("=" * 60)
    print(f"🎉 Dataset ready! Total images: {total_downloaded}")
    print("=" * 60)
    return total_downloaded


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Download 8-class PlantVillage dataset")
    parser.add_argument("--max_per_class", type=int, default=150, help="Max images per class (default: 150)")
    parser.add_argument("--workers", type=int, default=20, help="Parallel download threads (default: 20)")
    args = parser.parse_args()

    download_all(max_per_class=args.max_per_class, max_workers=args.workers)
