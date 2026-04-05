#!/usr/bin/env python3
"""
Find valid blueprints for NLBL galaxy products
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("Fetching all blueprints from Printify...")

resp = requests.get(
    "https://api.printify.com/v1/catalog/blueprints.json", headers=headers, timeout=30
)

if resp.status_code != 200:
    print(f"Failed: {resp.status_code}")
    exit(1)

blueprints = resp.json()
print(f"Found {len(blueprints)} blueprints")

# Filter for apparel/accessories we want
keywords = [
    "t-shirt",
    "tee",
    "hoodie",
    "sweatshirt",
    "jacket",
    "pants",
    "shorts",
    "dress",
    "skirt",
    "leggings",
    "shoes",
    "hat",
    "cap",
    "beanie",
    "socks",
    "backpack",
    "bag",
    "tank",
    "mug",
]

print("\nFILTERING FOR RELEVANT PRODUCTS:")
print("=" * 70)

relevant = []
for bp in blueprints:
    title_lower = bp["title"].lower()
    desc_lower = bp.get("description", "").lower()

    if any(kw in title_lower or kw in desc_lower for kw in keywords):
        relevant.append(bp)
        print(f"  [{bp['id']}] {bp['title']}")

print(f"\nFound {len(relevant)} relevant blueprints")

# For each relevant blueprint, find a working provider
print("\n" + "=" * 70)
print("TESTING PROVIDERS FOR EACH BLUEPRINT:")
print("=" * 70)

valid_products = []

for bp in relevant:
    bp_id = bp["id"]
    bp_title = bp["title"]

    print(f"\nBlueprint {bp_id}: {bp_title}")

    # Get print providers
    prov_resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers.json",
        headers=headers,
        timeout=10,
    )

    if prov_resp.status_code != 200:
        print(f"  Could not get providers")
        continue

    providers = prov_resp.json()
    if not providers:
        print(f"  No providers available")
        continue

    # Try first provider
    prov_id = providers[0]["id"]
    prov_title = providers[0].get("title", "Unknown")

    var_resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{prov_id}/variants.json",
        headers=headers,
        timeout=10,
    )

    if var_resp.status_code == 200:
        variants = var_resp.json().get("variants", [])
        print(f"  Provider {prov_id} ({prov_title}): {len(variants)} variants")

        valid_products.append(
            {
                "blueprint_id": bp_id,
                "blueprint_title": bp_title,
                "provider_id": prov_id,
                "provider_title": prov_title,
                "variant_count": len(variants),
                "variants": variants[:5],  # Save first 5 for reference
            }
        )
    else:
        print(f"  Provider {prov_id} failed, trying next...")
        # Try other providers
        for prov in providers[1:4]:
            prov_id = prov["id"]
            var_resp = requests.get(
                f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{prov_id}/variants.json",
                headers=headers,
                timeout=10,
            )
            if var_resp.status_code == 200:
                variants = var_resp.json().get("variants", [])
                print(
                    f"  Provider {prov_id} ({prov.get('title')}): {len(variants)} variants"
                )
                valid_products.append(
                    {
                        "blueprint_id": bp_id,
                        "blueprint_title": bp_title,
                        "provider_id": prov_id,
                        "provider_title": prov.get("title"),
                        "variant_count": len(variants),
                        "variants": variants[:5],
                    }
                )
                break

print("\n" + "=" * 70)
print(f"VALID PRODUCTS: {len(valid_products)}")
print("=" * 70)

for vp in valid_products:
    print(
        f"  [{vp['blueprint_id']}] {vp['blueprint_title']} - Provider {vp['provider_id']} ({vp['variant_count']} variants)"
    )

# Save to file
with open("valid_nlbl_products.json", "w") as f:
    json.dump(valid_products, f, indent=2)

print(f"\nSaved to valid_nlbl_products.json")

# Create blueprint to provider mapping
blueprint_provider_map = {}
for vp in valid_products:
    blueprint_provider_map[vp["blueprint_id"]] = vp["provider_id"]

with open("blueprint_provider_map.json", "w") as f:
    json.dump(blueprint_provider_map, f, indent=2)

print(f"Blueprint->Provider map saved to blueprint_provider_map.json")
