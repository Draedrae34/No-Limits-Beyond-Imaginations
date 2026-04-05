#!/usr/bin/env python3
"""
ONE-CLICK NLBL UPLOAD - Enter credentials and upload everything
"""
import os, json, requests, sys

print("🌌 NLBL GALAXY EMPIRE - ONE-CLICK UPLOAD")
print("=" * 50)

# Get credentials
token = input("🔑 PASTE your Printify API Token: ").strip()
shop_id = input("🏪 PASTE your Printify Shop ID: ").strip()

if not token or not shop_id:
    print("❌ Both credentials required!")
    sys.exit(1)

print(f"✅ Got credentials (token: {token[:20]}...)")

# Test connection
print("\n🔗 Testing connection...")
try:
    response = requests.get("https://api.printify.com/v1/shops.json",
                          headers={"Authorization": f"Bearer {token}"}, timeout=10)
    if response.status_code == 200:
        shops = response.json()
        shop = next((s for s in shops if str(s['id']) == str(shop_id)), None)
        if shop:
            print(f"✅ Connected to shop: {shop['title']}")
        else:
            print(f"❌ Shop ID {shop_id} not found")
            sys.exit(1)
    else:
        print(f"❌ Connection failed: {response.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

print("\n🚀 STARTING MASS UPLOAD...")

# ALL DESIGN PATHS (scanned automatically)
designs = []
base_dir = "/home/aundrae/Silent-Spirits-Legacy"

# Scan all design directories
dirs_to_scan = [
    "Clothing_Product/reve_images_2026-02-22_04-06-06",
    "Clothing_Product/Photos-3-001-2",
    "Clothing_Product/Photos-3-001-1",
    "Clothing_Product/reve_images_2026-02-22_03-50-24",
    "hoodies/NLBLITMWI_Hoodie_001/textures"
]

for dir_name in dirs_to_scan:
    full_dir = os.path.join(base_dir, dir_name)
    if os.path.exists(full_dir):
        for file in os.listdir(full_dir):
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                designs.append(os.path.join(full_dir, file))

print(f"📦 Found {len(designs)} designs to upload")

uploaded = []
for i, design_path in enumerate(designs, 1):
    filename = os.path.basename(design_path)
    print(f"📤 [{i}/{len(designs)}] {filename}")

    if not os.path.exists(design_path):
        print("❌ File missing")
        continue

    try:
        with open(design_path, 'rb') as f:
            response = requests.post(
                "https://api.printify.com/v1/uploads/images.json",
                headers={"Authorization": f"Bearer {token}"},
                files={'file': (filename, f, 'image/png')},
                timeout=30
            )

        if response.status_code == 201:
            data = response.json()
            uploaded.append({
                'filename': filename,
                'id': data['id'],
                'path': design_path
            })
            print(f"✅ ID: {data['id']}")
        else:
            print(f"❌ Failed: {response.status_code}")

    except Exception as e:
        print(f"❌ Error: {e}")

print(f"\n🎉 COMPLETE! Uploaded {len(uploaded)}/{len(designs)} designs")

# Save results
if uploaded:
    with open(f"{base_dir}/final_upload_results.json", 'w') as f:
        json.dump({
            'total_uploaded': len(uploaded),
            'designs': uploaded
        }, f, indent=2)
    print("💾 Results saved!")

    print("\n🚀 NEXT: Create products in Printify Dashboard → Images")

print("=" * 50)
