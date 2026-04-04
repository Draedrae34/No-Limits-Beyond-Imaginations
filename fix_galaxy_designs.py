#!/usr/bin/env python3
"""
Fix NLBL Galaxy Designs - Overlay logo on galaxy backgrounds
Creates proper designs with NLBL logo + galaxy fill
"""

from PIL import Image, ImageEnhance
import os

print("=" * 70)
print("NLBL GALAXY DESIGN FIXER")
print("Combining NLBL logo with galaxy backgrounds")
print("=" * 70)

# Check for required files
logo_path = "textures/logo_main.png"
galaxy_dir = "galaxy_designs"
output_dir = "galaxy_designs_fixed"

if not os.path.exists(logo_path):
    print(f"\nERROR: Logo not found at {logo_path}")
    exit(1)

if not os.path.exists(galaxy_dir):
    print(f"\nERROR: Galaxy designs not found at {galaxy_dir}")
    exit(1)

# Create output directory
os.makedirs(output_dir, exist_ok=True)

# Load logo
print(f"\nLoading logo: {logo_path}")
logo = Image.open(logo_path).convert("RGBA")
print(f"  Logo size: {logo.size}")

# Resize logo to appropriate size (keep aspect ratio)
logo_base_size = 800  # pixels
if logo.size[0] > logo.size[1]:
    new_width = logo_base_size
    new_height = int(logo.size[1] * (logo_base_size / logo.size[0]))
else:
    new_height = logo_base_size
    new_width = int(logo.size[0] * (logo_base_size / logo.size[1]))

logo = logo.resize((new_width, new_height), Image.Resampling.LANCZOS)
print(f"  Resized logo: {logo.size}")

# Process each galaxy background
galaxy_files = [f for f in os.listdir(galaxy_dir) if f.endswith(".png")]
print(f"\nProcessing {len(galaxy_files)} galaxy backgrounds...")

for galaxy_file in galaxy_files:
    galaxy_path = os.path.join(galaxy_dir, galaxy_file)
    output_path = os.path.join(output_dir, galaxy_file)

    print(f"\n  Processing: {galaxy_file}")

    # Open galaxy background
    galaxy = Image.open(galaxy_path).convert("RGBA")
    galaxy = galaxy.resize((2000, 2000), Image.Resampling.LANCZOS)

    # Create a new image with galaxy background
    result = galaxy.copy()

    # Calculate position to center the logo
    logo_x = (galaxy.size[0] - logo.size[0]) // 2
    logo_y = (galaxy.size[1] - logo.size[1]) // 2

    # Paste logo on top of galaxy background
    result.paste(logo, (logo_x, logo_y), logo)

    # Save
    result.save(output_path, "PNG")
    print(f"    Saved: {output_path}")

print("\n" + "=" * 70)
print(f"FIXED DESIGNS CREATED: {len(galaxy_files)}")
print(f"Output directory: {output_dir}/")
print("=" * 70)
print("\nNext steps:")
print("1. Backup old galaxy_designs/")
print("2. Replace with galaxy_designs_fixed/")
print("3. Re-upload to Printify")
