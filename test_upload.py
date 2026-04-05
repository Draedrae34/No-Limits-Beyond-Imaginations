#!/usr/bin/env python3
"""Quick test of image upload to Printify"""

import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
design_path = "galaxy_designs/cosmic_nebula.png"

print(f"Token: {token[:20]}...")
print(f"Design exists: {os.path.exists(design_path)}")

if os.path.exists(design_path):
    print(f"Design size: {os.path.getsize(design_path)} bytes")

    with open(design_path, "rb") as f:
        img_data = base64.b64encode(f.read()).decode("utf-8")

    print(f"Base64 length: {len(img_data)}")

    payload = {"file_name": "cosmic_nebula.png", "contents": img_data}

    print("Uploading to Printify...")
    response = requests.post(
        "https://api.printify.com/v1/uploads/images.json",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
else:
    print("Design file not found!")
