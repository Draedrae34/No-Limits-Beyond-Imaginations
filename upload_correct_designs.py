#!/usr/bin/env python3
"""
Upload CORRECT NLBL designs to Printify
Uses Logo_N_Galaxy_Fill_Space/ folder with actual NLBL logo + galaxy designs
"""

import os
import json
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# CORRECT design folder
DESIGN_FOLDER = "Logo_N_Galaxy_Fill_Space"

print("=" * 70)
print("UPLOADING CORRECT NLBL DESIGNS TO PRINTIFY")
print("=" * 70)
print(f"Design folder: {DESIGN_FOLDER}/")
print()

# Get all design files
design_files = [
    f for f in os.listdir(DESIGN_FOLDER) if f.endswith((".png", ".jpg", ".jpeg"))
]
print(f"Found {len(design_files)} design files")

# Upload each design
uploaded = {}
for design_file in design_files:
    design_path = os.path.join(DESIGN_FOLDER, design_file)

    print(f"\nUploading: {design_file}")

    try:
        with open(design_path, "rb") as f:
            img_data = base64.b64encode(f.read()).decode("utf-8")

        payload = {"file_name": design_file, "contents": img_data}

        resp = requests.post(
            "https://api.printify.com/v1/uploads/images.json",
            headers=headers,
            json=payload,
            timeout=60,
        )

        if resp.status_code in [200, 201]:
            image_id = resp.json()["id"]
            uploaded[design_file] = image_id
            print(f"  SUCCESS! ID: {image_id}")
        else:
            print(f"  FAILED: {resp.status_code} - {resp.text[:200]}")

    except Exception as e:
        print(f"  ERROR: {e}")

# Save uploaded design IDs
with open("uploaded_correct_designs.json", "w") as f:
    json.dump(uploaded, f, indent=2)

print("\n" + "=" * 70)
print(f"UPLOADED: {len(uploaded)}/{len(design_files)} designs")
print("=" * 70)
print("\nSaved to uploaded_correct_designs.json")
print("\nNext: Recreate products with these CORRECT designs!")
