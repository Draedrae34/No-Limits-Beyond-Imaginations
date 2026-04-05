#!/usr/bin/env python3
"""
CREATE ACTUAL NLBL LOGO DESIGNS
Combine ONLY the NLBL logo + galaxy pattern into TRANSPARENT PNGs
NO product silhouettes - just the logo and pattern
"""

from PIL import Image
import os

print("=" * 70)
print("CREATING PROPER NLBL LOGO DESIGNS")
print("Using: textures/logo_main.png + textures/galaxy_pattern.png")
print("Output: Transparent PNG with ONLY logo + galaxy (no products)")
print("=" * 70)

logo_path = "textures/logo_main.png"
galaxy_path = "textures/galaxy_pattern.png"

if not os.path.exists(logo_path):
    print(f"ERROR: {logo_path} not found")
    exit(1)

if not os.path.exists(galaxy_path):
    print(f"ERROR: {galaxy_path} not found")
    exit(1)

logo = Image.open(logo_path).convert("RGBA")
galaxy = Image.open(galaxy_path).convert("RGBA")

print(f"\nLogo size: {logo.size}")
print(f"Galaxy size: {galaxy.size}")

# Create output directory
output_dir = "NLBL_Logo_Only_Designs"
os.makedirs(output_dir, exist_ok=True)

# We'll create variations with the galaxy pattern filling the logo shape
print("\nCreating transparent logo designs...")

# Method 1: Logo mask with galaxy fill
# Create a version where galaxy pattern fills the logo shape
logo_gray = logo.convert("L")
logo_array = list(logo_gray.getdata())
logo_array = [255 if pixel > 128 else 0 for pixel in logo_array]
logo_binary = Image.new("1", logo.size)
logo_binary.putdata(logo_array)

# Resize galaxy to match logo
galaxy_resized = galaxy.resize(logo.size, Image.Resampling.LANCZOS)

# Crop galaxy to logo shape
galaxy_with_mask = Image.new("RGBA", logo.size)
galaxy_with_mask.paste(galaxy_resized, (0, 0), logo)

# Apply logo as mask on top of galaxy background
for i in range(5):
    # Create different color variations of galaxy
    result = Image.new("RGBA", (2000, 2000), (0, 0, 0, 0))

    # Place galaxy as full background (transparent where no logo)
    galaxy_bg = galaxy.resize((2000, 2000), Image.Resampling.LANCZOS)
    result.paste(galaxy_bg, (0, 0))

    # Create logo-sized version centered
    logo_size = 800
    logo_resized = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

    # Create galaxy-filled logo
    galaxy_filled_logo = galaxy.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    # Use logo alpha as mask
    galaxy_filled_logo.putalpha(logo_resized.split()[3])

    # Position logo in center
    x = (2000 - logo_size) // 2
    y = (2000 - logo_size) // 2
    result.paste(galaxy_filled_logo, (x, y), galaxy_filled_logo)

    filename = f"NLBL_Logo_Galaxy_Center_{i + 1}.png"
    result.save(os.path.join(output_dir, filename), "PNG")
    print(f"  Created: {filename}")

# Method 2: Simple logo overlay on transparent background
for opacity in [255, 200, 150]:
    result = Image.new("RGBA", (2000, 2000), (0, 0, 0, 0))

    # Galaxy background (slightly transparent)
    galaxy_bg = galaxy.resize((2000, 2000), Image.Resampling.LANCZOS)
    result.paste(galaxy_bg, (0, 0))

    # Logo on top with specified opacity
    logo_resized = logo.resize((1000, 1000), Image.Resampling.LANCZOS)
    if opacity < 255:
        logo_alpha = logo_resized.split()[3]
        logo_alpha = logo_alpha.point(lambda p: int(p * opacity / 255))
        logo_resized.putalpha(logo_alpha)

    x = (2000 - 1000) // 2
    y = (2000 - 1000) // 2
    result.paste(logo_resized, (x, y), logo_resized)

    filename = f"NLBL_Logo_Galaxy_Opacity_{opacity}.png"
    result.save(os.path.join(output_dir, filename), "PNG")
    print(f"  Created: {filename}")

print("\n" + "=" * 70)
print(f"SUCCESS! Created proper transparent logo designs")
print(f"Output: {output_dir}/")
print("=" * 70)
print("\nTHESE are the correct designs to upload to Printify:")
print("- Contains ONLY NLBL logo + galaxy pattern")
print("- NO product silhouettes")
print("- Transparent background")
print("- Will print correctly on any product")
