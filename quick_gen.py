#!/usr/bin/env python3
"""
Quick product generation - only use working categories, batch process
"""

import os, json, requests, base64, time
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ONLY categories that we know work (from earlier successful tests)
WORKING_CATEGORIES = {
    "Hoodies": {"blueprint": 77, "provider": 66, "price": 4499},
    "Sweats": {"blueprint": 49, "provider": 66, "price": 3999},
    "Shirts": {"blueprint": 5, "provider": 29, "price": 2699},
    "Tee's": {"blueprint": 12, "provider": 51, "price": 2499},
}

# Get ALL designs from Logo_N_Galaxy_Fill_Space (including new ones)
designs_dir = "Logo_N_Galaxy_Fill_Space"
design_files = [
    f for f in os.listdir(designs_dir) if f.lower().endswith((".png", ".jpg", ".jpeg"))
]

print(f"NLBL QUICK PRODUCT GENERATOR")
print(f"Using {len(design_files)} designs from {designs_dir}/")
print(f"Creating for {len(WORKING_CATEGORIES)} categories")
print(f"Total products: {len(design_files) * len(WORKING_CATEGORIES)}")
print("=" * 70)

# Upload all designs first
print("\nUploading designs...")
uploaded = {}
for f in design_files:
    path = os.path.join(designs_dir, f)
    with open(path, "rb") as img:
        b64 = base64.b64encode(img.read()).decode("utf-8")

    resp = requests.post(
        "https://api.printify.com/v1/uploads/images.json",
        headers=headers,
        json={"file_name": f, "contents": b64},
        timeout=60,
    )

    if resp.status_code in [200, 201]:
        uploaded[f] = resp.json()["id"]
        print(f"  OK: {f}")
    else:
        print(f"  FAIL: {f}")

print(f"\nUploaded {len(uploaded)}/{len(design_files)} designs")

# Get existing products (to avoid duplicates)
existing = set()
page = 1
while True:
    try:
        resp = requests.get(
            f"https://api.printify.com/v1/shops/{shop_id}/products.json?limit=100&page={page}",
            headers=headers,
            timeout=30,
        )
        if resp.status_code != 200:
            break
        data = resp.json().get("data", [])
        for p in data:
            existing.add(p.get("title", ""))
        if len(data) < 100:
            break
        page += 1
    except:
        break

print(f"\nExisting products: {len(existing)}")

# Create products - category by category with delays
created = 0
failed = 0

for cat_name, config in WORKING_CATEGORIES.items():
    bp_id = config["blueprint"]
    prov_id = config["provider"]
    price = config["price"]

    print(f"\n--- {cat_name} (Blueprint {bp_id}) ---")

    # Get variants
    try:
        var_resp = requests.get(
            f"https://api.printify.com/v1/catalog/blueprints/{bp_id}/print_providers/{prov_id}/variants.json",
            headers=headers,
            timeout=30,
        )
        if var_resp.status_code != 200:
            print(f"  No variants available ({var_resp.status_code})")
            continue

        variants = var_resp.json().get("variants", [])
        if not variants:
            print(f"  No variants found")
            continue

        # Map sizes
        size_map = {}
        for v in variants:
            opts = v.get("options", {})
            sz = opts.get("size", "")
            if sz:
                size_map[sz] = v["id"]

        if size_map:
            sizes = list(size_map.keys())[:4]  # Limit to 4 sizes max
        else:
            default_vid = variants[0]["id"]
            sizes = ["One Size"]
    except Exception as e:
        print(f"  Error getting variants: {e}")
        continue

    # Create products for each design
    for design_file, image_id in uploaded.items():
        design_name = (
            os.path.splitext(design_file)[0].replace("_", " ").replace("-", " ").title()
        )

        if size_map:
            for size in sizes:
                variant_id = size_map[size]
                title = f"NLBL {design_name} {cat_name} - {size}"

                if title in existing:
                    continue

                data = {
                    "title": title[:255],
                    "description": f"NLBL {design_name} on {cat_name}. No Limits Beyond Limitations.",
                    "blueprint_id": bp_id,
                    "print_provider_id": prov_id,
                    "variants": [
                        {"id": variant_id, "price": price, "is_enabled": True}
                    ],
                    "print_areas": [
                        {
                            "variant_ids": [variant_id],
                            "placeholders": [
                                {
                                    "position": "front",
                                    "images": [
                                        {
                                            "id": image_id,
                                            "x": 0.5,
                                            "y": 0.5,
                                            "scale": 1.0,
                                            "angle": 0,
                                        }
                                    ],
                                }
                            ],
                        }
                    ],
                    "tags": ["NLBL", "Galaxy", cat_name],
                    "visible": True,
                }

                try:
                    resp = requests.post(
                        f"https://api.printify.com/v1/shops/{shop_id}/products.json",
                        headers=headers,
                        json=data,
                        timeout=30,
                    )

                    if resp.status_code in [200, 201]:
                        created += 1
                        existing.add(title)
                        if created % 5 == 0:
                            print(f"    Created: {created}")
                    else:
                        failed += 1
                        if failed <= 3:
                            print(f"    FAIL: {title[:40]} - {resp.status_code}")
                except Exception as e:
                    failed += 1

                # Small delay to avoid rate limiting
                time.sleep(0.5)
        else:
            title = f"NLBL {design_name} {cat_name}"
            if title in existing:
                continue

            data = {
                "title": title[:255],
                "description": f"NLBL {design_name} on {cat_name}. No Limits Beyond Limitations.",
                "blueprint_id": bp_id,
                "print_provider_id": prov_id,
                "variants": [{"id": default_vid, "price": price, "is_enabled": True}],
                "print_areas": [
                    {
                        "variant_ids": [default_vid],
                        "placeholders": [
                            {
                                "position": "front",
                                "images": [
                                    {
                                        "id": image_id,
                                        "x": 0.5,
                                        "y": 0.5,
                                        "scale": 1.0,
                                        "angle": 0,
                                    }
                                ],
                            }
                        ],
                    }
                ],
                "tags": ["NLBL", "Galaxy", cat_name],
                "visible": True,
            }

            try:
                resp = requests.post(
                    f"https://api.printify.com/v1/shops/{shop_id}/products.json",
                    headers=headers,
                    json=data,
                    timeout=30,
                )
                if resp.status_code in [200, 201]:
                    created += 1
                else:
                    failed += 1
            except:
                failed += 1

            time.sleep(0.5)

print("\n" + "=" * 70)
print("FINISHED")
print("=" * 70)
print(f"Created: {created}")
print(f"Failed: {failed}")
print("=" * 70)
