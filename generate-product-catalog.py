#!/usr/bin/env python3
"""Compatibility catalog generator that now uses the canonical NLBL pipeline."""

from nlbl_pipeline import build_catalog_from_design_folder


def main() -> None:
    print("NLBL PRODUCT CATALOG GENERATOR")
    print("=" * 60)

    catalog = build_catalog_from_design_folder(
        base_dir="Logo_N_Galaxy_Fill_Space",
        output_file="products_catalog.json",
    )

    print(f"Generated {catalog['total_products']} products.")
    print("Saved to: products_catalog.json")


if __name__ == "__main__":
    main()
