#!/usr/bin/env python3
"""Generate the canonical NLBL Printify catalog from the logo/design folder."""

from nlbl_pipeline import build_catalog_from_design_folder


def main() -> None:
    print("NLBL PRINTIFY CATALOG GENERATOR")
    print("=" * 40)

    catalog = build_catalog_from_design_folder(
        base_dir="Logo_N_Galaxy_Fill_Space",
        output_file="nlbl_galaxy_catalog.json",
    )

    print(f"Created {catalog['total_products']} products.")
    print("Saved catalog to: nlbl_galaxy_catalog.json")


if __name__ == "__main__":
    main()
