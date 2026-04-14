#!/usr/bin/env python3
"""Canonical Printify sync entrypoint for the NLBL pipeline."""

from __future__ import annotations

from pathlib import Path

from nlbl_pipeline import PrintifyPipeline


def _first_existing(*paths: str) -> str:
    for path in paths:
        if Path(path).exists():
            return path
    return paths[0]


def main() -> None:
    print("NLBL PRINTIFY MASTER SYNC")
    print("=" * 50)

    catalog_file = _first_existing(
        "products_catalog.json",
        "nlbl_galaxy_catalog.json",
        "data/catalog-metadata.json",
    )

    pipeline = PrintifyPipeline()
    stats = pipeline.sync_catalog(catalog_file=catalog_file)
    feed = pipeline._load_json(catalog_file, {})

    from nlbl_pipeline import build_website_feed

    build_website_feed(catalog_file=catalog_file, output_file="nlbl_galaxy_shop.json")

    print("\nSYNC COMPLETE")
    print("=" * 50)
    print(f"Catalog file: {catalog_file}")
    print(f"Created: {stats['created']}")
    print(f"Skipped: {stats['skipped']}")
    print(f"Failed: {stats['failed']}")
    print(f"Products in source catalog: {len(feed.get('products', [])) if isinstance(feed, dict) else 0}")


if __name__ == "__main__":
    main()
