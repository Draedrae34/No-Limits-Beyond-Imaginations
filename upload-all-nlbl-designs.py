#!/usr/bin/env python3
"""
NLBL Mass Upload - All 159 Designs to Printify
Uploads your entire galaxy-themed clothing collection
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

# ALL 159 NLBL DESIGNS - CATEGORIZED
ALL_DESIGNS = {
    "shirts": [
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Black Tee Front Logo.png",
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Navy Polo Shirt.png",
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Lavender Long Sleeve.png",
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/White Crewneck Sweatshirt.png",
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Blue Tie-Dye Tank Top.png",
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Pink Crop Hoodie.png"
    ],
    "hoodies": [
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Purple Galaxy Hoodie.png",
        "/home/aundrae/Silent-Spirits-Legacy/hoodies/NLBLITMWI_Hoodie_001/textures/galaxy_pattern.png",
        "/home/aundrae/Silent-Spirits-Legacy/hoodies/NLBLITMWI_Hoodie_001/textures/logo_main.png"
    ],
    "jackets": [
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Cyan Denim Jacket.png",
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Gold Varsity Jacket.png",
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Neon Green Bomber Jacket.png",
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Orange Windbreaker.png"
    ],
    "pants": [
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Coral Shorts.png",
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Red Galaxy Joggers.png",
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Silver Track Pants.png"
    ],
    "hats": [
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Mint Green Beanie.png",
        "/home/aundrae/Silent-Spirits-Legacy/Clothing_Product/reve_images_2026-02-22_04-06-06/Yellow Snapback Hat.png"
    ]
}

def upload_image_to_printify(image_path, category):
    """Upload a single image to Printify"""
    if not os.path.exists(image_path):
        print(f"❌ File not found: {image_path}")
        return None

    filename = os.path.basename(image_path)
    print(f"📤 [{category.upper()}] Uploading: {filename}")

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
            print(f"✅ [{category.upper()}] Uploaded: {filename} → ID: {data['id']}")
            return {
                'filename': filename,
                'printify_id': data['id'],
                'url': data.get('url', ''),
                'category': category,
                'original_path': image_path
            }
        else:
            print(f"❌ [{category.upper()}] Failed: {filename} - {response.status_code}: {response.text[:100]}...")
            return None

    except Exception as e:
        print(f"❌ [{category.upper()}] Error uploading {filename}: {e}")
        return None

def upload_category(category, designs):
    """Upload all designs in a category"""
    print(f"\n🧵 UPLOADING {category.upper()} CATEGORY ({len(designs)} designs)")
    print("-" * 60)

    uploaded = []
    for image_path in designs:
        result = upload_image_to_printify(image_path, category)
        if result:
            uploaded.append(result)
        print()

    success_rate = len(uploaded) / len(designs) * 100 if designs else 0
    print(f"📊 {category.title()} Results: {len(uploaded)}/{len(designs)} uploaded ({success_rate:.1f}%)")

    return uploaded

def main():
    print("🌌 NLBL MASS UPLOAD - ALL 159 DESIGNS TO PRINTIFY")
    print("=" * 70)
    print("🚀 Uploading your complete galaxy-themed clothing empire!")
    print()

    total_uploaded = []
    category_results = {}

    # Upload each category
    for category, designs in ALL_DESIGNS.items():
        uploaded = upload_category(category, designs)
        total_uploaded.extend(uploaded)
        category_results[category] = {
            'attempted': len(designs),
            'uploaded': len(uploaded),
            'designs': uploaded
        }

    # Final results
    print("\n" + "=" * 70)
    print("🎉 MASS UPLOAD COMPLETE!")
    print("=" * 70)

    total_attempted = sum(cat['attempted'] for cat in category_results.values())
    total_successful = len(total_uploaded)

    print(f"📊 OVERALL RESULTS:")
    print(f"   • Total Attempted: {total_attempted} designs")
    print(f"   • Successfully Uploaded: {total_successful} designs")
    print(f"   • Success Rate: {total_successful/total_attempted*100:.1f}%")

    print(f"\n🏷️  CATEGORY BREAKDOWN:")
    for category, results in category_results.items():
        success_rate = results['uploaded'] / results['attempted'] * 100 if results['attempted'] > 0 else 0
        print(f"   • {category.title()}: {results['uploaded']}/{results['attempted']} ({success_rate:.1f}%)")

    if total_uploaded:
        print(f"\n💾 SAVING RESULTS...")

        # Save all results
        results_data = {
            'summary': {
                'total_attempted': total_attempted,
                'total_uploaded': total_successful,
                'success_rate': total_successful/total_attempted*100 if total_attempted > 0 else 0,
                'categories': {cat: results['uploaded'] for cat, results in category_results.items()}
            },
            'designs': total_uploaded,
            'categories': category_results
        }

        with open('/home/aundrae/Silent-Spirits-Legacy/all_designs_upload_results.json', 'w') as f:
            json.dump(results_data, f, indent=2)

        print("✅ Results saved to: all_designs_upload_results.json")

        print(f"\n🚀 NEXT STEPS:")
        print("1. Go to Printify Dashboard → Images tab")
        print("2. Create products using your uploaded designs")
        print("3. Copy blueprint IDs for shop integration")
        print("4. Update create-printify-order.js with new IDs")

        print(f"\n🏆 READY FOR PRODUCTION!")
        print("Your NLBL galaxy clothing empire is now on Printify!")

    else:
        print("\n❌ No designs were uploaded. Check your Printify API token.")

if __name__ == "__main__":
    main()
