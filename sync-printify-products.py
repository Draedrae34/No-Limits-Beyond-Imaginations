#!/usr/bin/env python3
"""Compatibility sync tool that now uses the canonical NLBL pipeline."""

from nlbl_pipeline import PrintifyPipeline


def main() -> None:
    print("NLBL PRINTIFY SYNC TOOL")
    print("=" * 40)

    try:
        pipeline = PrintifyPipeline()
    except RuntimeError as exc:
        print(f"❌ {exc}")
        return

    stats = pipeline.sync_catalog(catalog_file="products_catalog.json")
    print("\n✨ Sync complete.")
    print(f"Created: {stats['created']}")
    print(f"Skipped: {stats['skipped']}")
    print(f"Failed: {stats['failed']}")


if __name__ == "__main__":
    main()
