#!/usr/bin/env python3
"""
Fix blueprint/provider mappings for all product types
Tests which providers work with which blueprints
"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Blueprints from catalog
blueprints = [
    {"id": 0, "title": "Basic T-Shirt"},
    {"id": 10, "title": "Basic Hoodie"},
    {"id": 4, "title": "Basic Jacket"},
    {"id": 1, "title": "Basic Sweatshirt"},
    {"id": 2, "title": "Basic Pants"},
    {"id": 3, "title": "Basic Shorts"},
    {"id": 18, "title": "Basic Dress"},
    {"id": 19, "title": "Basic Skirt"},
    {"id": 20, "title": "Basic Leggings"},
    {"id": 23, "title": "Basic Shoes"},
    {"id": 25, "title": "Basic Hat"},
    {"id": 26, "title": "Basic Beanie"},
    {"id": 27, "title": "Basic Socks"},
    {"id": 28, "title": "Basic Backpack"},
]

print("Testing blueprint/provider combinations...")
print("=" * 70)

valid_mappings = {}

for bp in blueprints:
    bp_id = bp["id"]
    print(f"\nBlueprint {bp_id}: {bp['title']}")

    # Get available print providers
    prov_resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers.json",
        headers=headers,
        timeout=10,
    )

    if prov_resp.status_code != 200:
        print(f"  Could not get providers (status {prov_resp.status_code})")
        continue

    providers = prov_resp.json()
    if not providers:
        print(f"  No providers found")
        continue

    print(f"  Available providers: {len(providers)}")
    for prov in providers[:3]:  # Check first 3 providers
        prov_id = prov["id"]
        prov_title = prov.get("title", "Unknown")

        # Test variants endpoint
        var_resp = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{prov_id}/variants.json",
            headers=headers,
            timeout=10,
        )

        if var_resp.status_code == 200:
            variants = var_resp.json().get("variants", [])
            print(f"    Provider {prov_id} ({prov_title}): {len(variants)} variants OK")

            if bp_id not in valid_mappings:
                valid_mappings[bp_id] = []
            valid_mappings[bp_id].append(
                {
                    "provider_id": prov_id,
                    "provider_title": prov_title,
                    "variant_count": len(variants),
                }
            )
        else:
            print(
                f"    Provider {prov_id} ({prov_title}): FAILED ({var_resp.status_code})"
            )

# Save valid mappings
print("\n" + "=" * 70)
print("VALID MAPPINGS FOUND:")
print("=" * 70)

for bp_id, providers in valid_mappings.items():
    bp = next((b for b in blueprints if b["id"] == bp_id), None)
    bp_title = bp["title"] if bp else "Unknown"
    print(f"\nBlueprint {bp_id} ({bp_title}):")
    for p in providers:
        print(
            f"  - Provider {p['provider_id']} ({p['provider_title']}): {p['variant_count']} variants"
        )

# Save to file
with open("blueprint_provider_mappings.json", "w") as f:
    json.dump(valid_mappings, f, indent=2)

print(f"\nMappings saved to blueprint_provider_mappings.json")

# Find best provider for each blueprint (most variants)
best_mappings = {}
for bp_id, providers in valid_mappings.items():
    best = max(providers, key=lambda x: x["variant_count"])
    best_mappings[bp_id] = best["provider_id"]

print("\nBEST PROVIDER FOR EACH BLUEPRINT:")
print("=" * 70)
for bp_id, prov_id in best_mappings.items():
    bp = next((b for b in blueprints if b["id"] == bp_id), None)
    bp_title = bp["title"] if bp else "Unknown"
    print(f"  Blueprint {bp_id} ({bp_title}): Provider {prov_id}")

with open("best_provider_mappings.json", "w") as f:
    json.dump(best_mappings, f, indent=2)

print(f"\nBest mappings saved to best_provider_mappings.json")
