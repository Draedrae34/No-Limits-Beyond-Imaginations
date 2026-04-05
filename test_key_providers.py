#!/usr/bin/env python3
"""Quick provider test for key blueprints only"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Key blueprints we want (from the filtered list)
key_blueprints = [
    5,  # Unisex Cotton Crew Tee
    12,  # Unisex Jersey Short Sleeve Tee
    49,  # Unisex Heavy Blend Crewneck Sweatshirt
    66,  # Unisex Heavy Blend Full Zip Hooded Sweatshirt
    77,  # Unisex Heavy Blend Hooded Sweatshirt
    68,  # Mug 11oz
    91,  # Unisex Full Zip Hoodie
]

print("Testing key blueprints...")
print("=" * 70)

valid = []

for bp_id in key_blueprints:
    print(f"\nTesting blueprint {bp_id}...")

    # Get providers
    prov_resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers.json",
        headers=headers,
        timeout=10,
    )

    if prov_resp.status_code != 200:
        print(f"  Failed to get providers: {prov_resp.status_code}")
        continue

    providers = prov_resp.json()
    print(f"  Found {len(providers)} providers")

    # Try each provider
    for prov in providers[:3]:
        prov_id = prov["id"]
        prov_title = prov.get("title", "Unknown")

        var_resp = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{prov_id}/variants.json",
            headers=headers,
            timeout=10,
        )

        if var_resp.status_code == 200:
            variants = var_resp.json().get("variants", [])
            if variants:
                print(
                    f"  Provider {prov_id} ({prov_title}): {len(variants)} variants OK"
                )
                valid.append(
                    {
                        "blueprint_id": bp_id,
                        "provider_id": prov_id,
                        "provider_title": prov_title,
                        "variant_count": len(variants),
                    }
                )
                break  # Use first working provider
            else:
                print(f"  Provider {prov_id} ({prov_title}): 0 variants")
        else:
            print(f"  Provider {prov_id} ({prov_title}): FAILED")

print("\n" + "=" * 70)
print("VALID MAPPINGS:")
print("=" * 70)

for v in valid:
    print(
        f"  Blueprint {v['blueprint_id']} -> Provider {v['provider_id']} ({v['provider_title']}) - {v['variant_count']} variants"
    )

# Save mapping
mapping = {v["blueprint_id"]: v["provider_id"] for v in valid}
with open("blueprint_provider_map.json", "w") as f:
    json.dump(mapping, f, indent=2)

print("\nSaved to blueprint_provider_map.json")
