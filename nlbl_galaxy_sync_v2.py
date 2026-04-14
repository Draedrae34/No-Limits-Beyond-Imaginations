#!/usr/bin/env python3
"""Compatibility sync wrapper that now uses the canonical NLBL pipeline."""

from __future__ import annotations

import argparse
from pathlib import Path

from nlbl_pipeline import PrintifyPipeline, build_website_feed


def _first_existing(*paths: str) -> str:
    for path in paths:
        if Path(path).exists():
            return path
    return paths[0]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--debug", action="store_true", help="Print detailed failure reasons")
    parser.add_argument("--limit", type=int, default=None, help="Only sync first N products")
    args = parser.parse_args()

    print("NLBL GALAXY COMPLETE SYNC")
    print("=" * 50)

    catalog_file = _first_existing(
        "nlbl_galaxy_catalog.json",
        "products_catalog.json",
        "data/catalog-metadata.json",
    )

    pipeline = PrintifyPipeline(debug=args.debug)
    stats = pipeline.sync_catalog(catalog_file=catalog_file, limit=args.limit)
    build_website_feed(catalog_file=catalog_file, output_file="nlbl_galaxy_shop.json")

    print("\n" + "=" * 50)
    print("NLBL GALAXY SYNC COMPLETE!")
    print("=" * 50)
    print(f"Catalog file: {catalog_file}")
    print(f"Created: {stats['created']}")
    print(f"Skipped: {stats['skipped']}")
    print(f"Failed: {stats['failed']}")


if __name__ == "__main__":
    main()
