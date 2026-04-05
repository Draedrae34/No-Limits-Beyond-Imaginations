#!/usr/bin/env python3
"""
NLBL Galaxy Empire Upload - ALL 159+ Designs
Simple: Enter token & shop ID, uploads everything
"""
import os
import json
import requests
import sys

print("🌌 NLBL GALAXY EMPIRE - MASS UPLOAD")
print("=" * 60)

# Get credentials
token = input("🔑 Enter your Printify API Token: ").strip()
if not token:
    print("❌ No token entered")
    sys.exit(1)

shop_id = input("🏪 Enter your Printify Shop ID: ").strip()
if not shop_id:
    print("❌ No shop ID entered")
    sys.exit(1)

print(f"✅ Token: {token[:20]}...")
print(f"✅ Shop ID: {shop_id}")

# Test connection
print("\n🔗 Testing connection...")
try:
    response = requests.get("https://api.printify.com/v1/shops.json",
                          headers={"Authorization": f"Bearer {token}"}, timeout=10)
    if response.status_code != 200:
        print(f"❌ Token test failed: {response.status_code}")
        sys.exit(1)
    print("✅ Connection successful!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)

# ALL DESIGN PATHS
ALL_DESIGNS = [
    # Main NLBL collection
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Black Tee Front Logo.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Navy Polo Shirt.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Lavender Long Sleeve.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/White Crewneck Sweatshirt.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Blue Tie-Dye Tank Top.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Pink Crop Hoodie.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Purple Galaxy Hoodie.png",
    "/home/aundrae/Silent-Spirits-Legacy/hoodies/NLBLITMWI_Hoodie_001/textures/galaxy_pattern.png",
    "/home/aundrae/Silent-Spirits-Legacy/hoodies/NLBLITMWI_Hoodie_001/textures/logo_main.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Cyan Denim Jacket.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Gold Varsity Jacket.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Neon Green Bomber Jacket.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Orange Windbreaker.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Coral Shorts.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Red Galaxy Joggers.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Silver Track Pants.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Mint Green Beanie.png",
    "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Yellow Snapback Hat.png"
]

# Add all Photos-3-001-2 designs (22 more)
photos_dir = "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/Photos-3-001-2/"
if os.path.exists(photos_dir):
    for f in os.listdir(photos_dir):
        if f.lower().endswith(('.png', '.jpg', '.jpeg')):
            ALL_DESIGNS.append(os.path.join(photos_dir, f))

# Add Photos-3-001-1 designs (3 more)
photos1_dir = "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/Photos-3-001-1/"
if os.path.exists(photos1_dir):
    for f in os.listdir(photos1_dir):
        if f.lower().endswith(('.png', '.jpg', '.jpeg')):
            ALL_DESIGNS.append(os.path.join(photos1_dir, f))

# Add extracted zip designs (40+ more)
extracted_dir = "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_03-50-24/"
if os.path.exists(extracted_dir):
    for root, dirs, files in os.walk(extracted_dir):
        for f in files:
            if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                ALL_DESIGNS.append(os.path.join(root, f))

print(f"\n📦 Found {len(ALL_DESIGNS)} total designs to upload!")

uploaded = []
failed = []

for i, design_path in enumerate(ALL_DESIGNS, 1):
    if not os.path.exists(design_path):
        print(f"❌ [{i}/{len(ALL_DESIGNS)}] Missing: {os.path.basename(design_path)}")
        failed.append({'path': design_path, 'error': 'File not found'})
        continue

    filename = os.path.basename(design_path)
    print(f"📤 [{i}/{len(ALL_DESIGNS)}] Uploading: {filename}")

    try:
        with open(design_path, 'rb') as img_file:
            files = {'file': (filename, img_file, 'image/png')}
            response = requests.post(
                "https://api.printify.com/v1/uploads/images.json",
                headers={"Authorization": f"Bearer {token}"},
                files=files,
                timeout=30
            )

        if response.status_code == 201:
            data = response.json()
            print(f"✅ Uploaded: {filename} → ID: {data['id']}")
            uploaded.append({
                'filename': filename,
                'path': design_path,
                'printify_id': data['id'],
                'url': data.get('url', '')
            })
        else:
            print(f"❌ Failed: {filename} - {response.status_code}")
            failed.append({'path': design_path, 'error': f'HTTP {response.status_code}'})

    except Exception as e:
        print(f"❌ Error: {filename} - {e}")
        failed.append({'path': design_path, 'error': str(e)})

print(f"\n" + "=" * 60)
print("🎉 UPLOAD COMPLETE!")
print(f"✅ Successfully uploaded: {len(uploaded)}/{len(ALL_DESIGNS)} designs")
print(f"❌ Failed: {len(failed)} designs")

if uploaded:
    # Save results
    results = {
        'summary': {
            'total_attempted': len(ALL_DESIGNS),
            'uploaded': len(uploaded),
            'failed': len(failed),
            'success_rate': len(uploaded)/len(ALL_DESIGNS)*100 if ALL_DESIGNS else 0
        },
        'uploaded_designs': uploaded,
        'failed_designs': failed
    }

    with open('/home/aundrae/Silent-Spirits-Legacy/complete_upload_results.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n💾 Results saved to: complete_upload_results.json")
    print(f"\n🚀 NEXT STEPS:")
    print(f"1. Go to Printify Dashboard → Images")
    print(f"2. Create products using your uploaded designs")
    print(f"3. Copy blueprint IDs for shop integration")
    print(f"\n🏆 YOUR NLBL GALAXY EMPIRE IS NOW ON PRINTIFY!")
    print(f"   {len(uploaded)} designs ready for production! 🌌")

if failed:
    print(f"\n⚠️ FAILED DESIGNS:")
    for fail in failed[:5]:  # Show first 5 failures
        print(f"   • {os.path.basename(fail['path'])} - {fail['error']}")
    if len(failed) > 5:
        print(f"   ... and {len(failed)-5} more")

print(f"\n" + "=" * 60)
