#!/usr/bin/env python3
"""
Upload ALL Your Remaining NLBL Designs to Printify
Uploads the other 22+ clothing designs from Photos-3-001-2
"""
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

API_BASE = "https://api.printify.com/v1"
PRINTIFY_TOKEN = os.getenv("PRINTIFY_API_TOKEN")

if not PRINTIFY_TOKEN:
    print("❌ PRINTIFY_API_TOKEN not found in .env")
    exit(1)

HEADERS = {
    "Authorization": f"Bearer {PRINTIFY_TOKEN}",
    "Content-Type": "application/json"
}

# YOUR REMAINING CLOTHING DESIGN FILES (the ones not uploaded yet)
REMAINING_DESIGN_FILES = [
    "Clothing_Product/Photos-3-001-2/FC374EBB-E0D7-47AB-BA45-59E6A9990D4E.png",
    "Clothing_Product/Photos-3-001-2/IMG_1974.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1975.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1976.PNG",
    "Clothing_Product/Photos-3-001-2/IMG_1977.PNG",
    "Clothing_Product/Photos-3-001-2/IMG_1978.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1979.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1980.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1981.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1982.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1983.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1984.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1985.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1986.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1988.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1989.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1991.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1993.PNG",
    "Clothing_Product/Photos-3-001-2/IMG_1994.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1996 Copy(1).JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1996 Copy.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_1996.PNG",
    "Clothing_Product/Photos-3-001-2/IMG_1997.PNG",
    "Clothing_Product/Photos-3-001-2/IMG_1999.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_2001.JPG",
    "Clothing_Product/Photos-3-001-2/IMG_2348.JPG"
]

def upload_image_to_printify(image_path):
    """Upload a single image to Printify"""
    if not os.path.exists(image_path):
        print(f"❌ File not found: {image_path}")
        return None

    filename = os.path.basename(image_path)
    print(f"📤 Uploading: {filename}")

    try:
        with open(image_path, 'rb') as img_file:
            files = {'file': (filename, img_file, 'image/png')}
            response = requests.post(
                f"{API_BASE}/uploads/images.json",
                headers={"Authorization": f"Bearer {PRINTIFY_TOKEN}"},
                files=files
            )

        if response.status_code == 201:
            data = response.json()
            print(f"✅ Uploaded: {filename} → ID: {data['id']}")
            return {
                'filename': filename,
                'printify_id': data['id'],
                'url': data.get('url', '')
            }
        else:
            print(f"❌ Failed: {filename} - {response.status_code}: {response.text}")
            return None

    except Exception as e:
        print(f"❌ Error uploading {filename}: {e}")
        return None

def main():
    print("🎨 UPLOADING YOUR REMAINING NLBL DESIGNS TO PRINTIFY")
    print("=" * 60)
    print(f"📦 Total remaining files to upload: {len(REMAINING_DESIGN_FILES)}")
    print()

    uploaded_images = []

    for image_path in REMAINING_DESIGN_FILES:
        result = upload_image_to_printify(image_path)
        if result:
            uploaded_images.append(result)
        print()  # Add spacing between uploads

    print("=" * 60)
    print(f"🎉 UPLOAD COMPLETE!")
    print(f"✅ Successfully uploaded: {len(uploaded_images)}/{len(REMAINING_DESIGN_FILES)} images")
    print()

    if uploaded_images:
        print("📋 NEWLY UPLOADED IMAGES:")
        for img in uploaded_images:
            print(f"  • {img['filename']} → {img['printify_id']}")

        output_file = 'uploaded_designs.json'
        # Save for later use
        if os.path.exists(output_file):
            with open(output_file, 'r') as f:
                existing = json.load(f)
        else:
            existing = []

        existing.extend(uploaded_images)

        with open(output_file, 'w') as f:
            json.dump(existing, f, indent=2)
        print("
💾 Updated: uploaded_designs.json with all images"        print()
        print("🚀 TOTAL UPLOADED TO PRINTIFY:")
        print(f"   • First batch: 18 designs")
        print(f"   • Second batch: {len(uploaded_images)} designs")
        print(f"   • TOTAL: {18 + len(uploaded_images)} designs uploaded!")

    else:
        print("❌ No images were uploaded successfully.")
        print("Check your Printify API token and try again.")

if __name__ == "__main__":
    main()
