#!/usr/bin/env python3
"""
NLBL Upload - Manual Credential Entry
Type your credentials manually (no copy/paste needed)
"""
import os, json, requests, sys

print("🌌 NLBL UPLOAD - MANUAL CREDENTIAL ENTRY")
print("=" * 50)
print("Type your credentials manually (press Enter after each line)")
print()

# Manual entry
print("🔑 PRINTIFY API TOKEN:")
print("   Go to: https://printify.com/dashboard → Settings → API")
print("   Type the entire long token below:")
token = input("   API Token: ").strip()

if not token:
    print("❌ No token entered")
    sys.exit(1)

print("✅ Token received (length: {})".format(len(token)))

print()
print("🏪 PRINTIFY SHOP ID:")
print("   Look at URL: https://printify.com/dashboard/shops/[NUMBER]")
print("   Type just the number below:")
shop_id = input("   Shop ID: ").strip()

if not shop_id:
    print("❌ No shop ID entered")
    sys.exit(1)

print("✅ Shop ID received: {}".format(shop_id))

# Test connection
print("\n🔗 Testing connection...")
try:
    response = requests.get("https://api.printify.com/v1/shops.json",
                          headers={"Authorization": f"Bearer {token}"}, timeout=10)
    if response.status_code == 200:
        shops = response.json()
        shop = next((s for s in shops if str(s['id']) == str(shop_id)), None)
        if shop:
            print("✅ Connection successful! Shop: {}".format(shop['title']))
        else:
            print("❌ Shop ID {} not found".format(shop_id))
            sys.exit(1)
    else:
        print("❌ Connection failed: {}".format(response.status_code))
        sys.exit(1)
except Exception as e:
    print("❌ Error: {}".format(e))
    sys.exit(1)

print("\n🚀 STARTING MASS UPLOAD...")

# Scan all designs
designs = []
base_dir = "/home/aundrae/Silent-Spirits-Legacy"

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

print("📦 Found {} designs to upload".format(len(designs)))

uploaded = []
for i, design_path in enumerate(designs, 1):
    filename = os.path.basename(design_path)
    print("📤 [{}/{}] {}".format(i, len(designs), filename))

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
            print("✅ ID: {}".format(data['id']))
        else:
            print("❌ Failed: {}".format(response.status_code))

    except Exception as e:
        print("❌ Error: {}".format(e))

print("\n🎉 COMPLETE! Uploaded {}/{} designs".format(len(uploaded), len(designs)))

if uploaded:
    with open('/home/aundrae/Silent-Spirits-Legacy/manual_upload_results.json', 'w') as f:
        json.dump({
            'total_uploaded': len(uploaded),
            'designs': uploaded
        }, f, indent=2)
    print("💾 Results saved!")

    print("\n🚀 NEXT: Create products in Printify Dashboard → Images")

print("=" * 50)
