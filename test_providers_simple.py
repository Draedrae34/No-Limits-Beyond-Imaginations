#!/usr/bin/env python3
"""Test providers for filtered blueprints"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Load filtered blueprints
with open("filtered_blueprints.json", "r") as f:
    blueprints = json.load(f)

print(f"Testing {len(blueprints)} blueprints for valid providers...")
print("=" * 70)

valid = []
tested = 0

for bp in blueprints:
    bp_id = bp["id"]
    bp_title = bp["title"]

    tested += 1
    if tested % 50 == 0:
        print(f"Tested {tested}/{len(blueprints)}...")

    # Get providers
    prov_resp = requests.get(
        f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers.json",
        headers=headers,
        timeout=5,
    )

    if prov_resp.status_code != 200:
        continue

    providers = prov_resp.json()
    if not providers:
        continue

    # Try first provider
    for prov in providers[:2]:
        prov_id = prov["id"]

        var_resp = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{prov_id}/variants.json",
            headers=headers,
            timeout=5,
        )

        if var_resp.status_code == 200:
            variants = var_resp.json().get("variants", [])
            if len(variants) > 0:
                valid.append(
                    {
                        "blueprint_id": bp_id,
                        "blueprint_title": bp_title,
                        "provider_id": prov_id,
                        "provider_title": prov.get("title"),
                        "variant_count": len(variants),
                    }
                )
                print(
                    f"  OK [{bp_id}] {bp_title} - Provider {prov_id} ({len(variants)} variants)"
                )
                break

print("\n" + "=" * 70)
print(f"VALID PRODUCTS: {len(valid)}")
print("=" * 70)

for vp in valid:
    print(
        f"  [{vp['blueprint_id']}] {vp['blueprint_title']} - Provider {vp['provider_id']} ({vp['variant_count']} variants)"
    )

with open("valid_products_final.json", "w") as f:
    json.dump(valid, f, indent=2)

# Create mapping
mapping = {vp["blueprint_id"]: vp["provider_id"] for vp in valid}
with open("blueprint_provider_map.json", "w") as f:
    json.dump(mapping, f, indent=2)

print("\nSaved to valid_products_final.json and blueprint_provider_map.json")
