#!/usr/bin/env python3
"""
CREATE PROPER NLBL DESIGNS
Combines your NLBL logo with galaxy pattern to create TRANSPARENT designs
"""

from PIL import Image
import os

print("=" * 70)
print("CREATING PROPER NLBL TRANSPARENT DESIGNS")
print("=" * 70)

logo_path = "textures/logo_main.png"
galaxy_path = "textures/galaxy_pattern.png"

# Check files exist
if not os.path.exists(logo_path):
    print(f"ERROR: Logo not found at {logo_path}")
    exit(1)

if not os.path.exists(galaxy_path):
    print(f"ERROR: Galaxy pattern not found at {galaxy_path}")
    exit(1)

# Load images
print("\nLoading logo and galaxy pattern...")
logo = Image.open(logo_path).convert("RGBA")
galaxy = Image.open(galaxy_path).convert("RGBA")

print(f"Logo size: {logo.size}")
print(f"Galaxy size: {galaxy.size}")

# Create 10 different variations with different galaxy fills and logo placements
variations = [
    ("centered", (0.5, 0.5), 1.0),
    ("top_center", (0.5, 0.3), 0.8),
    ("bottom_center", (0.5, 0.7), 0.8),
    ("left_center", (0.3, 0.5), 0.9),
    ("right_center", (0.7, 0.5), 0.9),
    ("small_center", (0.5, 0.5), 0.7),
    ("large_center", (0.5, 0.5), 1.2),
    ("top_left", (0.3, 0.25), 0.85),
    ("top_right", (0.7, 0.25), 0.85),
    ("bottom_left", (0.3, 0.75), 0.85),
]

# Create output directory
output_dir = "NLBL_Transparent_Designs"
os.makedirs(output_dir, exist_ok=True)

print(f"\nCreating {len(variations)} transparent designs...")

for i, (name, pos, scale) in enumerate(variations):
    # Start with a transparent canvas (2000x2000)
    result = Image.new("RGBA", (2000, 2000), (0, 0, 0, 0))

    # Resize galaxy to fill background
    galaxy_resized = galaxy.resize((2000, 2000), Image.Resampling.LANCZOS)

    # Paste galaxy as background
    result.paste(galaxy_resized, (0, 0), galaxy_resized)

    # Resize logo according to scale
    logo_size = int(800 * scale)
    logo_resized = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

    # Calculate position
    x = int((2000 - logo_size) * pos[0])
    y = int((2000 - logo_size) * pos[1])

    # Paste logo on top (preserving logo's transparency)
    result.paste(logo_resized, (x, y), logo_resized)

    # Save
    filename = f"NLBL_Galaxy_{name}.png"
    result.save(os.path.join(output_dir, filename), "PNG")
    print(f"  Created: {filename}")

print("\n" + "=" * 70)
print(f"SUCCESS! Created {len(variations)} transparent designs")
print(f"Output directory: {output_dir}/")
print("=" * 70)
print("\nTHESE are the proper designs to upload to Printify!")
print("They contain ONLY your logo + galaxy pattern on transparent background.")
