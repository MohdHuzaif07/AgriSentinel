"""
verify_pipeline.py — Verify Live FastAPI Model Inference with Real Images
"""

import os
import glob
import requests

def test_live_pipeline():
    print("=" * 65)
    print("🌱 Live FastAPI Model Inference Test (Real Trained ResNet-50)")
    print("=" * 65)

    # 1. Test Root
    res_root = requests.get("http://127.0.0.1:8000/")
    root_data = res_root.json()
    print("Root Endpoint Response:", root_data)
    assert root_data.get("weights_loaded") is True, "Checkpoint weights must be loaded!"
    print("✅ weights_loaded == True verified!")

    # 2. Test 3 representative real leaf images
    test_cases = [
        ("Tomato Early Blight", "data/plantvillage/Tomato_Early_blight/*.*"),
        ("Potato Late Blight", "data/plantvillage/Potato_Late_blight/*.*"),
        ("Pepper Healthy", "data/plantvillage/Pepper_bell_healthy/*.*")
    ]

    print("\n" + "-" * 65)
    for label, pattern in test_cases:
        matches = glob.glob(pattern)
        if not matches:
            print(f"⚠️ No image found for {label}")
            continue
        img_path = matches[0]
        fname = os.path.basename(img_path)

        with open(img_path, "rb") as f:
            res = requests.post(
                "http://127.0.0.1:8000/predict",
                files={"file": (fname, f.read(), "image/jpeg")}
            )

        assert res.status_code == 200, f"Predict failed: {res.text}"
        data = res.json()

        print(f"Input Image:     {fname} ({label})")
        print(f"Predicted Class: {data['disease']}")
        print(f"Confidence:      {data['confidence'] * 100:.2f}%")
        print(f"isMock:          {data['isMock']}")
        assert data["isMock"] is False, "isMock must be False when real weights are used!"
        print("-" * 65)

    print("\n🎉 Live ML Inference Verification: ALL TESTS PASSED!")

if __name__ == "__main__":
    test_live_pipeline()
