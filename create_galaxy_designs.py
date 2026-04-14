#!/usr/bin/env python3
"""
Create galaxy-themed designs with NLBL logo overlay
"""
import os
import json
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

class GalaxyDesignGenerator:
    def __init__(self):
        self.galaxy_themes = [
            "cosmic_nebula", "stellar_dust", "galactic_core", "milky_way",
            "aurora_borealis", "meteor_shower", "black_hole", "solar_flare",
            "supernova", "eclipse"
        ]

        # Colors for galaxy themes
        self.theme_colors = {
            "cosmic_nebula": ["#4A0E4E", "#1A1A2E", "#16213E", "#0F3460"],
            "stellar_dust": ["#2C1810", "#8B4513", "#D2691E", "#CD853F"],
            "galactic_core": ["#000000", "#1C1C1C", "#FF4500", "#FFD700"],
            "milky_way": ["#191970", "#000080", "#4169E1", "#87CEEB"],
            "aurora_borealis": ["#000000", "#001122", "#00FF7F", "#00FFFF"],
            "meteor_shower": ["#000000", "#2F2F2F", "#FF6347", "#FFA500"],
            "black_hole": ["#000000", "#0F0F0F", "#1C1C1C", "#FFD700"],
            "solar_flare": ["#FFFF00", "#FFA500", "#FF4500", "#FF0000"],
            "supernova": ["#FFFFFF", "#FFD700", "#FFA500", "#FF6347"],
            "eclipse": ["#000000", "#2F2F2F", "#FFD700", "#FFFFFF"]
        }

    def create_galaxy_background(self, width, height, theme):
        """Create a galaxy-themed background"""
        # Create base image
        img = Image.new('RGBA', (width, height), (0, 0, 0, 255))
        draw = ImageDraw.Draw(img)

        colors = self.theme_colors.get(theme, ["#000000", "#FFFFFF"])

        # Create starfield
        for _ in range(200):
            x = random.randint(0, width)
            y = random.randint(0, height)
            brightness = random.randint(100, 255)
            color = (brightness, brightness, brightness, 255)
            draw.point((x, y), fill=color)

        # Create nebula effect
        for _ in range(50):
            x = random.randint(0, width)
            y = random.randint(0, height)
            radius = random.randint(20, 100)
            color = random.choice(colors)
            if isinstance(color, str):
                color = color.lstrip('#')
                color = tuple(int(color[i:i+2], 16) for i in (0, 2, 4)) + (30,)

            # Draw soft circles for nebula
            for r in range(radius, 0, -5):
                alpha = int(30 * (r / radius))
                nebula_color = color[:3] + (alpha,)
                draw.ellipse([x-r, y-r, x+r, y+r], fill=nebula_color)

        # Apply blur for galaxy effect
        img = img.filter(ImageFilter.GaussianBlur(2))

        return img

    def add_nlbl_logo(self, img, logo_path=None):
        """Add NLBL logo to the image"""
        width, height = img.size
        draw = ImageDraw.Draw(img)

        # If we have a logo file, use it; otherwise create text logo
        if logo_path and os.path.exists(logo_path):
            try:
                logo = Image.open(logo_path).convert('RGBA')
                logo = logo.resize((int(width * 0.3), int(height * 0.2)))
                logo_x = (width - logo.width) // 2
                logo_y = height - logo.height - 50
                img.paste(logo, (logo_x, logo_y), logo)
            except Exception as e:
                print(f"Could not load logo: {e}")
                self._draw_text_logo(draw, width, height)
        else:
            self._draw_text_logo(draw, width, height)

        return img

    def _draw_text_logo(self, draw, width, height):
        """Draw NLBL text logo"""
        try:
            # Try to use a nice font, fallback to default
            font_size = int(height * 0.08)
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()

        text = "NLBL"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        x = (width - text_width) // 2
        y = height - text_height - 30

        # Draw text with glow effect
        for offset in [(1,1), (-1,-1), (1,-1), (-1,1)]:
            draw.text((x + offset[0], y + offset[1]), text, font=font, fill=(255, 255, 255, 100))

        draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))

        # Add subtitle
        subtitle = "LEGACY"
        try:
            small_font = ImageFont.truetype("arial.ttf", int(font_size * 0.4))
        except:
            small_font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), subtitle, font=small_font)
        sub_width = bbox[2] - bbox[0]
        sub_x = (width - sub_width) // 2
        sub_y = y + text_height + 5

        draw.text((sub_x, sub_y), subtitle, font=small_font, fill=(200, 200, 200, 200))

    def create_design(self, theme, output_path, logo_path=None):
        """Create a complete galaxy design"""
        print(f"Creating {theme} design...")

        # Create galaxy background
        img = self.create_galaxy_background(2000, 2000, theme)

        # Add NLBL logo
        img = self.add_nlbl_logo(img, logo_path)

        # Save the design
        img.save(output_path, 'PNG')
        print(f"Saved: {output_path}")

        return img

    def generate_all_designs(self, output_dir="galaxy_designs", logo_path=None):
        """Generate all galaxy-themed designs"""
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        designs = {}

        for theme in self.galaxy_themes:
            output_path = os.path.join(output_dir, f"{theme}.png")
            self.create_design(theme, output_path, logo_path)
            designs[theme] = output_path

        print(f"\nGenerated {len(designs)} galaxy designs in {output_dir}/")
        return designs

def main():
    """Main function"""
    print("NLBL GALAXY DESIGN GENERATOR")
    print("=" * 40)

    generator = GalaxyDesignGenerator()

    # Look for NLBL logo in common locations
    logo_paths = [
        "Logo/NLBL_Logo.png",
        "Logo/logo.png",
        "logo.png",
        "NLBL_Logo.png",
        "Logo_N_Galaxy_Fill_Space/No_Limits_Logo.png",
        "Logo_N_Galaxy_Fill_Space/No_Limits_Logo_2.png",
    ]

    logo_path = None
    for path in logo_paths:
        if os.path.exists(path):
            logo_path = path
            print(f"Found logo: {path}")
            break

    if not logo_path and os.path.exists("Logo_N_Galaxy_Fill_Space"):
        folder_matches = sorted(
            [
                os.path.join("Logo_N_Galaxy_Fill_Space", name)
                for name in os.listdir("Logo_N_Galaxy_Fill_Space")
                if name.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
            ]
        )
        if folder_matches:
            logo_path = folder_matches[0]
            print(f"Found logo asset in folder: {logo_path}")

    # Generate all designs
    designs = generator.generate_all_designs(logo_path=logo_path)

    # Save design mapping
    mapping = {
        "designs": designs,
        "description": "NLBL galaxy-themed designs for Printify products"
    }

    with open("galaxy_designs.json", "w") as f:
        json.dump(mapping, f, indent=2)

    print("\nDesign mapping saved to galaxy_designs.json")
    print("\nReady to use these designs with your NLBL galaxy catalog!")

if __name__ == "__main__":
    main()
