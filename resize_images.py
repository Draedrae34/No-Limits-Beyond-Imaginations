import os
import shutil
from PIL import Image

# Base directory
base_dir = '.'

# Create directories
reference_dir = os.path.join(base_dir, 'reference')
textures_dir = os.path.join(base_dir, 'textures')
os.makedirs(reference_dir, exist_ok=True)
os.makedirs(textures_dir, exist_ok=True)

# Source files
logo_src = 'Logo.JPG'
galaxy_src = 'galaxy_pattern.png'

# Copy originals to reference
shutil.copy(logo_src, os.path.join(reference_dir, logo_src))
shutil.copy(galaxy_src, os.path.join(reference_dir, galaxy_src))

# Function to resize and save
def resize_and_save(src, dst, size=(2048, 2048)):
    with Image.open(src) as img:
        # Resize to fit within size, maintaining aspect ratio if needed, but since crop, perhaps resize to size
        img = img.resize(size, Image.Resampling.LANCZOS)
        img.save(dst, 'PNG')

# Resize and save to textures
resize_and_save(logo_src, os.path.join(textures_dir, 'logo_main.png'))
resize_and_save(galaxy_src, os.path.join(textures_dir, 'galaxy_pattern.png'))

print("Images resized and saved.")