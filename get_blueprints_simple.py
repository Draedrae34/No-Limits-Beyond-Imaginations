#!/usr/bin/env python3
"""Quick test - just get blueprints list"""

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("Getting blueprints...")
resp = requests.get(
    "https://api.printify.com/v1/catalog/blueprints.json", headers=headers, timeout=30
)

if resp.status_code == 200:
    blueprints = resp.json()
    print(f"Got {len(blueprints)} blueprints")

    # Save all
    with open("all_blueprints.json", "w") as f:
        json.dump(blueprints, f, indent=2)

    # Filter for what we want
    keywords = [
        "hoodie",
        "sweatshirt",
        "t-shirt",
        "tee",
        "dress",
        "leggings",
        "beanie",
        "hat",
        "socks",
        "backpack",
        "jacket",
        "pants",
        "shorts",
        "skirt",
        "shoes",
        "tank",
        "mug",
    ]

    filtered = []
    for bp in blueprints:
        title = bp["title"].lower()
        if any(k in title for k in keywords):
            filtered.append(bp)

    print(f"\nFiltered to {len(filtered)} relevant products:")
    for bp in filtered[:30]:
        print(f"  [{bp['id']}] {bp['title']}")

    with open("filtered_blueprints.json", "w") as f:
        json.dump(filtered, f, indent=2)

    print("\nSaved to all_blueprints.json and filtered_blueprints.json")
else:
    print(f"Failed: {resp.status_code}")
