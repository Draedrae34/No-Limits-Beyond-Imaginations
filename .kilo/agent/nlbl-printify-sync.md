# NLBL Printify Sync - Locked System

This system is the **ONLY** correct way to sync NLBL products to Printify. DO NOT MODIFY these files.

## Core Files (LOCKED)

### 1. Blueprint/Provider Mapping
- `blueprint_provider_map.json` - Maps blueprint IDs to working providers
- `test_key_providers.py` - Tests blueprint/provider combinations

### 2. Catalog Generation
- `get_printify_catalog.py` - Generates product catalog with valid blueprints
- Uses blueprint IDs: 5, 12, 49, 66, 77, 91, 68

### 3. Design Generation
- `create_galaxy_designs.py` - Creates galaxy-themed designs with NLBL logo
- `galaxy_designs.json` - Design mapping file
- `galaxy_designs/` - Directory containing PNG designs

### 4. Sync to Printify
- `nlbl_galaxy_sync_v2.py` - Main sync script (uses provider map)
- Loads `blueprint_provider_map.json` for correct provider IDs
- Uploads designs via base64 encoding
- Creates products in Printify shop

### 5. Website Feed
- `nlbl_galaxy_shop.json` - Generated website product feed

## Working Blueprints

| ID | Product | Provider | Variants |
|----|---------|----------|----------|
| 5 | Unisex Cotton Crew Tee | 29 (Monster Digital) | 110 |
| 12 | Unisex Jersey Short Sleeve Tee | 51 (Stylus) | 520 |
| 49 | Unisex Heavy Blend Crewneck Sweatshirt | 66 (Prima Printing) | 20 |
| 66 | Unisex Heavy Blend Full Zip Hoodie | 99 (Printify Choice) | 24 |
| 77 | Unisex Heavy Blend Hooded Sweatshirt | 66 (Prima Printing) | 24 |
| 91 | Unisex Full Zip Hoodie | 6 (T Shirt and Sons) | 50 |
| 68 | Mug 11oz | 1 (SPOKE Custom) | 1 |

## Usage

```bash
# 1. Generate catalog
uv run python get_printify_catalog.py

# 2. Create designs (if needed)
uv run python create_galaxy_designs.py

# 3. Sync to Printify
uv run python nlbl_galaxy_sync_v2.py
```

## DO NOT MODIFY

- Blueprint IDs in `get_printify_catalog.py`
- Provider mappings in `blueprint_provider_map.json`
- Image upload method (base64) in `nlbl_galaxy_sync_v2.py`
- Variant endpoint: `/catalog/blueprints/{id}/print_providers/{provider_id}/variants.json`

## Last Verified

2026-04-03 - 10/10 products synced successfully
