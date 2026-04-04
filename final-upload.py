#!/usr/bin/env python3
"""
NLBL PRINTIFY UPLOAD - FINAL SOLUTION
Just run this and follow the simple steps
"""
import os, json, requests, sys

print("🌌 NLBL PRINTIFY UPLOAD - FINAL SOLUTION")
print("=" * 50)
print("This will upload ALL your designs to Printify")
print()

# Step 1: Get credentials
print("STEP 1: Enter your Printify credentials")
print("-" * 30)

# Try to get from environment first
token = os.getenv('PRINTIFY_API_TOKEN')
shop_id = os.getenv('PRINTIFY_SHOP_ID')

if token and shop_id:
    print(f"✅ Found credentials in environment")
    print(f"   Token: {token[:20]}...")
    print(f"   Shop ID: {shop_id}")
    confirm = input("Use these credentials? (y/n): ").strip().lower()
    if confirm != 'y':
        token = None
        shop_id = None

if not token or not shop_id:
    print("Please enter your credentials manually:")
    token = input("🔑 Printify API Token: ").strip()
    shop_id = input("🏪 Printify Shop ID: ").strip()

if not token or not shop_id:
    print("❌ Both credentials required!")
    sys.exit(1)

# Step 2: Test connection
print("\nSTEP 2: Testing connection...")
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

# Step 3: Scan designs
print("\nSTEP 3: Scanning your designs...")
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

print(f"📦 Found {len(designs)} designs to upload")

if len(designs) == 0:
    print("❌ No designs found!")
    sys.exit(1)

# Step 4: Upload
print("\nSTEP 4: Starting upload...")
print("This may take a while...")

uploaded = []
failed = []

for i, design_path in enumerate(designs, 1):
    filename = os.path.basename(design_path)
    print(f"📤 [{i}/{len(designs)}] {filename}")

    if not os.path.exists(design_path):
        print("❌ File missing")
        failed.append({'filename': filename, 'error': 'File missing'})
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
            error_msg = f"HTTP {response.status_code}"
            try:
                error_data = response.json()
                error_msg = error_data.get('error', error_msg)
            except:
                pass
            print(f"❌ Failed: {error_msg}")
            failed.append({'filename': filename, 'error': error_msg})

    except Exception as e:
        print(f"❌ Error: {e}")
        failed.append({'filename': filename, 'error': str(e)})

# Step 5: Results
print("\n" + "=" * 50)
print("🎉 UPLOAD COMPLETE!")
print(f"✅ Successfully uploaded: {len(uploaded)}")
print(f"❌ Failed: {len(failed)}")

if uploaded:
    with open('/home/aundrae/Silent-Spirits-Legacy/final_upload_results.json', 'w') as f:
        json.dump({
            'total_uploaded': len(uploaded),
            'total_failed': len(failed),
            'uploaded': uploaded,
            'failed': failed
        }, f, indent=2)
    print("💾 Results saved to final_upload_results.json")

    print("\n🚀 NEXT STEPS:")
    print("1. Go to Printify Dashboard → Images")
    print("2. Your uploaded designs will be there")
    print("3. Create products using your designs")

if failed:
    print("\n❌ Failed uploads:")
    for item in failed[:10]:  # Show first 10
        print(f"   {item['filename']}: {item['error']}")
    if len(failed) > 10:
        print(f"   ... and {len(failed) - 10} more")

print("\n🌌 NLBL GALAXY EMPIRE UPLOAD COMPLETE! 🌌")
print("=" * 50)
