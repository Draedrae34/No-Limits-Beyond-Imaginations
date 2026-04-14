#!/usr/bin/env python3
"""Generate metadata for every image in the logo/design folder."""

from __future__ import annotations

from pathlib import Path

from nlbl_pipeline import build_catalog_from_design_folder


BASE_DIR = Path("Logo_N_Galaxy_Fill_Space")
OUTPUT_FILE = Path("data/catalog-metadata.json")


def generate_metadata() -> None:
    print(f"Scanning {BASE_DIR} for product art...")

    catalog = build_catalog_from_design_folder(BASE_DIR, OUTPUT_FILE)

    print(f"\nCatalog generated: {catalog['total_products']} products ready for sync.")
    print(f"Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    generate_metadata()
