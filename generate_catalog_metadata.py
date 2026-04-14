#!/usr/bin/env python3
import json
from pathlib import Path
from datetime import datetime

# Configuration: Map your folder names to Printify Blueprint IDs
# You can find more IDs using `python scripts/printify_catalog_info.py --list-blueprints`
CATEGORY_MAPPING = {
    "Shorts": {"blueprint_id": 249, "provider_id": 39},
    "Hoodies": {"blueprint_id": 77, "provider_id": 66},
    "Jackets": {"blueprint_id": 433, "provider_id": 54},
    "Tee's": {"blueprint_id": 12, "provider_id": 51},
    "Leggings": {"blueprint_id": 49, "provider_id": 16},
    "Dresses": {"blueprint_id": 431, "provider_id": 39},
    "Tank Tops": {"blueprint_id": 39, "provider_id": 51},
    "Onesie": {"blueprint_id": 568, "provider_id": 16},
}

BASE_DIR = Path("Logo_N_Galaxy_Fill_Space")
OUTPUT_FILE = Path("data/catalog-metadata.json")


def generate_metadata():
    catalog = []
    print(f"Scanning {BASE_DIR} for cosmic designs...")

    if not BASE_DIR.exists():
        print(f"Error: {BASE_DIR} directory not found.")
        return

    # Check if BASE_DIR has subdirectories matching categories
    category_dirs = [
        d for d in BASE_DIR.iterdir() if d.is_dir() and d.name in CATEGORY_MAPPING
    ]

    if category_dirs:
        # Process each category directory
        for folder in category_dirs:
            mapping = CATEGORY_MAPPING[folder.name]
            print(f"Processing category: {folder.name}")

            for img_path in folder.glob("*.png"):
                clean_name = img_path.stem.replace("-", " ").title()

                product_entry = {
                    "id": f"{folder.name.lower()}-{img_path.stem}",
                    "title": f"NLBL {folder.name[:-1] if folder.name.endswith('s') else folder.name} - {img_path.stem[:8].upper()}",
                    "description": f"A unique piece from the {folder.name} collection. Designed in the No Limits Beyond Limitations Lab.",
                    "folder": folder.name,
                    "local_path": str(img_path.absolute()),
                    "price": 6200,
                    "blueprint_id": mapping["blueprint_id"],
                    "provider_id": mapping["provider_id"],
                    "variants": [],
                    "print_areas": [],
                    "createdAt": datetime.utcnow().isoformat() + "Z",
                }
                catalog.append(product_entry)
    else:
        # If no category subdirectories, treat all PNG files in BASE_DIR as belonging to the first category (Shorts)
        print(
            "No category subdirectories found. Processing all PNG files as 'Shorts' category."
        )
        mapping = CATEGORY_MAPPING["Shorts"]
        for img_path in BASE_DIR.glob("*.png"):
            clean_name = img_path.stem.replace("-", " ").title()

            product_entry = {
                "id": f"shorts-{img_path.stem}",
                "title": f"NLBL Shorts - {img_path.stem[:8].upper()}",
                "description": f"A unique piece from the Shorts collection. Designed in the No Limits Beyond Limitations Lab.",
                "folder": "Shorts",
                "local_path": str(img_path.absolute()),
                "price": 6200,
                "blueprint_id": mapping["blueprint_id"],
                "provider_id": mapping["provider_id"],
                "variants": [],
                "print_areas": [],
                "createdAt": datetime.utcnow().isoformat() + "Z",
            }
            catalog.append(product_entry)

    # Preserve existing metadata if it exists (like manual story edits)
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE, "r") as f:
                old_data = json.load(f)
                old_map = {item["id"]: item for item in old_data}
                for item in catalog:
                    if item["id"] in old_map:
                        item["story"] = old_map[item["id"]].get(
                            "story", item["description"]
                        )
        except Exception:
            pass

    # Create directory if missing
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, "w") as f:
        json.dump(catalog, f, indent=2)

    print(f"\nCatalog generated: {len(catalog)} products ready for sync.")
    print(f"Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    generate_metadata()
