#!/usr/bin/env python3
"""
Printify Product Synchronization Engine
Synchronizes local product data with the Printify shop.
"""
import os
import json
import requests
import base64
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

PRINTIFY_TOKEN = os.getenv("PRINTIFY_API_TOKEN")
SHOP_ID = os.getenv("PRINTIFY_SHOP_ID")
BASE_URL = "https://api.printify.com/v1"
CATALOG_PATH = Path("data/catalog-metadata.json")
PRODUCTS_PATH = Path("data/products.json")

LOGO_PATH = "assets/Logo/logo.png"
GALAXY_PATH = "assets/textures/galaxy_pattern.png"

def get_headers():
    return {
        "Authorization": f"Bearer {PRINTIFY_TOKEN}",
        "Content-Type": "application/json",
        "User-Agent": "NLBL-Cosmic-Lab/2.0"
    }

def upload_image(file_path):
    """Uploads local image to Printify Media Library and returns the image ID"""
    if not os.path.exists(file_path):
        print(f"  ⚠️  Image not found: {file_path}")
        return None

    url = f"{BASE_URL}/uploads/images.json"
    file_name = os.path.basename(file_path)
    
    with open(file_path, "rb") as f:
        img_data = base64.b64encode(f.read()).decode('utf-8')

    payload = {
        "file_name": file_name,
        "base64": img_data
    }

    response = requests.post(url, headers=get_headers(), json=payload)
    if response.status_code in [200, 201]:
        data = response.json()
        print(f"  🖼️  Image uploaded: {data['id']}")
        return data['id']
    else:
        print(f"  ❌ Image upload failed: {response.text}")
        return None

def fetch_printify_products():
    """Fetch all products currently in the Printify shop."""
    if not SHOP_ID:
        return []
    
    url = f"{BASE_URL}/shops/{SHOP_ID}/products.json"
    response = requests.get(url, headers=get_headers())
    return response.json().get('data', []) if response.status_code == 200 else []

def fetch_variants(blueprint_id, provider_id):
    """Fetches valid variants for a blueprint/provider combination"""
    url = f"{BASE_URL}/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json"
    try:
        response = requests.get(url, headers=get_headers())
        if response.status_code == 200:
            variants = response.json().get('variants', [])
            # Return first 5 variant IDs (usually enough for S, M, L, XL, XXL)
            return [v['id'] for v in variants[:5]]
    except Exception as e:
        print(f"  ❌ Failed to fetch variants: {e}")
    return []

def create_printify_product(item, galaxy_id=None, logo_id=None):
    """Creates a new product on Printify and returns the ID"""
    print(f"  🚀 Creating: {item['title']}...")
    
    primary_image_id = upload_image(item['image']) if item.get('image') else None
    if not primary_image_id and not (galaxy_id and logo_id):
        return None
        
    # 2. Get Metadata
    blueprint_id = item.get('blueprintId', 10) # Default Basic Hoodie
    provider_id = item.get('printProviderId', 16) # Default SwiftPOD
    variant_ids = item.get('variantIds') or fetch_variants(blueprint_id, provider_id)
    
    if not variant_ids:
        print("  ❌ No valid variants found for this blueprint/provider.")
        return None

    # 3. Handle Layering (Galaxy Fill + Logo)
    placeholders = []
    if galaxy_id and logo_id:
        # Layer 0: Galaxy Pattern (Background), Layer 1: Logo (Foreground)
        print("  🌌 Applying Galaxy Theme Space Fill + Logo layers...")
        placeholders = [
            {"id": galaxy_id, "x": 0.5, "y": 0.5, "scale": 1.5, "angle": 0},
            {"id": logo_id, "x": 0.5, "y": 0.5, "scale": 0.5, "angle": 0}
        ]
    else:
        placeholders = [{"id": primary_image_id, "x": 0.5, "y": 0.5, "scale": 1}]

    # 3. Create Product
    url = f"{BASE_URL}/shops/{SHOP_ID}/products.json"
    payload = {
        "title": item['title'],
        "description": item['description'],
        "blueprint_id": blueprint_id,
        "print_provider_id": provider_id,
        "variants": [{"id": v, "price": int(item['price'] * 100), "is_enabled": True} for v in variant_ids],
        "print_areas": [
            {
                "variant_ids": variant_ids,
                "placeholders": [{"position": "front", "images": placeholders}]
            }
        ],
        "visible": True
    }

    response = requests.post(url, headers=get_headers(), json=payload)
    if response.status_code in [200, 201]:
        data = response.json()
        print(f"  ✅ Product created: {data['id']}")
        return data['id']
    else:
        print(f"  ❌ Creation failed: {response.text}")
        return None

def sync_remote_to_local():
    """Pulls current Printify shop state into data/products.json"""
    print("📡 Pulling live products from Printify...")
    remote_products = fetch_printify_products()
    
    transformed = []
    for p in remote_products:
        transformed.append({
            "id": p.get("id"),
            "title": p.get("title"),
            "description": p.get("description", ""),
            "price": float(p.get("variants", [{}])[0].get("price", 0)) / 100,
            "image": p.get("images", [{}])[0].get("src", ""),
            "printifyProductId": p.get("id"),
            "blueprintId": p.get("blueprint_id"),
            "printProviderId": p.get("print_provider_id")
        })
    
    with open(PRODUCTS_PATH, 'w') as f:
        json.dump({"items": transformed}, f, indent=2)
    
    print(f"✅ Successfully pulled {len(transformed)} products into {PRODUCTS_PATH}")

def sync_local_to_printify():
    print("🌌 Initializing Cosmic Sync...")
    
    if not PRODUCTS_PATH.exists():
        print(f"❌ Error: {PRODUCTS_PATH} not found.")
        return False

    with open(PRODUCTS_PATH, 'r') as f:
        local_data = json.load(f)

    remote_products = fetch_printify_products()
    remote_map = {p['id']: p for p in remote_products}
    
    # Pre-upload Galaxy and Logo assets for layering
    galaxy_id = upload_image(GALAXY_PATH)
    logo_id = upload_image(LOGO_PATH)

    updates_made = False

    for item in local_data['items']:
        p_id = item.get('printifyProductId')
        if p_id in remote_map:
            print(f"✅ Linked: {item['title']} (ID: {p_id})")
        else:
            print(f"🚀 Product not on Printify: {item['title']}. Initiating creation with Galaxy Theme...")
            new_id = create_printify_product(item, galaxy_id, logo_id)
            if new_id:
                item['printifyProductId'] = new_id
                updates_made = True

    if updates_made:
        print("\n💾 Saving updated product IDs to local data...")
        with open(PRODUCTS_PATH, 'w') as f:
            json.dump(local_data, f, indent=2)
        return True

    print("\n✨ Sync complete.")
    return False

def check_connection():
    if not PRINTIFY_TOKEN or not SHOP_ID:
        print("❌ Error: Missing API keys in .env")
        return False

    url = f"{BASE_URL}/shops.json"
    response = requests.get(url, headers=get_headers())
    if response.status_code == 200:
        shops = response.json()
        print(f"✅ Connected to Printify! Found {len(shops)} shop(s).")
        for shop in shops:
            print(f"   - {shop['title']} (ID: {shop['id']})")
        return True
    else:
        print(f"❌ Connection failed: {response.status_code}")
        return False

if __name__ == "__main__":
    print("🌌 NLBL Printify Sync Tool v2.0")
    print("=" * 40)
    
    if check_connection():
        choice = input("Select Mode: [1] Pull Remote to Local, [2] Sync Local to Printify: ")
        if choice == "1":
            sync_remote_to_local()
        else:
            sync_local_to_printify()