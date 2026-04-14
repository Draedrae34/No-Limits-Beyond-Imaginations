#!/usr/bin/env python3
"""Compatibility shop feed generator that now uses the canonical NLBL pipeline."""

from nlbl_pipeline import build_website_feed


def main() -> None:
    print("NLBL SHOP FEED GENERATOR")
    print("=" * 60)

    feed = build_website_feed(
        catalog_file="products_catalog.json",
        output_file="shop-products.json",
    )

    print(f"\nShop feed generated: shop-products.json")
    print(f"Total products: {feed['total_products']}")
    print("\nReady to display on your website!")
    print("Use this in your shop.html:")
    print("   <script src='js/shop-loader.js'></script>")


if __name__ == "__main__":
    main()
