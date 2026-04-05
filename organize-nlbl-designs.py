#!/usr/bin/env python3
"""
NLBL Design Catalog Organizer
Categorizes all 159+ clothing designs by type and creates upload batches
"""
import os
import json
from pathlib import Path
from collections import defaultdict

# Base directory
BASE_DIR = "/home/aundrae/Silent-Spirits-Legacy"

# Design directories to scan
DESIGN_DIRS = [
    "Clothing_Product/reve_images_2026-02-22_04-06-06",
    "Clothing_Product/Photos-3-001-2",
    "Clothing_Product/Photos-3-001-1",
    "Clothing_Product/reve_images_2026-02-22_03-50-24",
    "hoodies/NLBLITMWI_Hoodie_001/textures"
]

# Category keywords for classification
CATEGORY_KEYWORDS = {
    "shirts": ["tee", "shirt", "long sleeve", "tank", "polo", "crewneck"],
    "hoodies": ["hoodie", "sweatshirt"],
    "jackets": ["jacket", "bomber", "varsity", "denim", "windbreaker"],
    "pants": ["pants", "jogger", "short", "track"],
    "hats": ["hat", "beanie", "cap", "snapback"],
    "unknown": []
}

def categorize_design(filename):
    """Categorize a design based on filename"""
    filename_lower = filename.lower()

    for category, keywords in CATEGORY_KEYWORDS.items():
        if category != "unknown":
            for keyword in keywords:
                if keyword in filename_lower:
                    return category

    return "unknown"

def scan_designs():
    """Scan all design directories and categorize files"""
    all_designs = defaultdict(list)
    total_count = 0

    print("🔍 SCANNING ALL NLBL DESIGNS...")
    print("=" * 50)

    for design_dir in DESIGN_DIRS:
        full_path = os.path.join(BASE_DIR, design_dir)

        if not os.path.exists(full_path):
            print(f"⚠️  Directory not found: {design_dir}")
            continue

        print(f"\n📂 Scanning: {design_dir}")

        # Get all image files
        image_extensions = ['.png', '.jpg', '.jpeg', '.gif']
        design_files = []

        for file in os.listdir(full_path):
            if any(file.lower().endswith(ext) for ext in image_extensions):
                design_files.append(file)

        print(f"   Found {len(design_files)} design files")

        # Categorize each design
        for filename in design_files:
            category = categorize_design(filename)
            file_path = f"{design_dir}/{filename}"

            all_designs[category].append({
                'filename': filename,
                'path': file_path,
                'full_path': os.path.join(BASE_DIR, file_path),
                'category': category,
                'directory': design_dir
            })

            total_count += 1

    return all_designs, total_count

def generate_upload_scripts(designs_by_category):
    """Generate upload scripts for each category"""

    print("\n📝 GENERATING UPLOAD SCRIPTS...")
    print("=" * 50)

    scripts_created = []

    for category, designs in designs_by_category.items():
        if not designs:
            continue

        script_name = f"upload-{category}-designs.py"
        script_path = os.path.join(BASE_DIR, script_name)

        print(f"📄 Creating: {script_name} ({len(designs)} designs)")

        # Generate Python script for this category
        script_content = f'''#!/usr/bin/env python3
"""
Upload NLBL {category.title()} Designs to Printify
Uploads {len(designs)} {category} designs
"""
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

API_BASE = "https://api.printify.com/v1"
PRINTIFY_TOKEN = os.getenv("PRINTIFY_API_TOKEN")

if not PRINTIFY_TOKEN:
    print("❌ PRINTIFY_API_TOKEN not found in .env")
    exit(1)

HEADERS = {{
    "Authorization": f"Bearer {{PRINTIFY_TOKEN}}",
    "Content-Type": "application/json"
}}

# {category.upper()} DESIGN FILES
{category.upper()}_DESIGN_FILES = [
'''

        # Add file paths
        for design in designs:
            script_content += f'    "/home/aundrae/Silent-Spirits-Legacy/{design["path"]}",\n'

        script_content += f''']

def upload_image_to_printify(image_path):
    """Upload a single image to Printify"""
    if not os.path.exists(image_path):
        print(f"❌ File not found: {{image_path}}")
        return None

    filename = os.path.basename(image_path)
    print(f"📤 Uploading: {{filename}}")

    try:
        with open(image_path, 'rb') as img_file:
            files = {{'file': (filename, img_file, 'image/png')}}
            response = requests.post(
                f"{{API_BASE}}/uploads/images.json",
                headers={{"Authorization": f"Bearer {{PRINTIFY_TOKEN}}"}},
                files=files
            )

        if response.status_code == 201:
            data = response.json()
            print(f"✅ Uploaded: {{filename}} → ID: {{data['id']}}")
            return {{
                'filename': filename,
                'printify_id': data['id'],
                'url': data.get('url', ''),
                'category': '{category}'
            }}
        else:
            print(f"❌ Failed: {{filename}} - {{response.status_code}}: {{response.text[:100]}}")
            return None

    except Exception as e:
        print(f"❌ Error uploading {{filename}}: {{e}}")
        return None

def main():
    print("🎨 UPLOADING NLBL {category.upper()} DESIGNS TO PRINTIFY")
    print("=" * 60)
    print(f"📦 Total files to upload: {{len({category.upper()}_DESIGN_FILES)}}")
    print()

    uploaded_images = []

    for image_path in {category.upper()}_DESIGN_FILES:
        result = upload_image_to_printify(image_path)
        if result:
            uploaded_images.append(result)
        print()

    print("=" * 60)
    print(f"🎉 {category.upper()} UPLOAD COMPLETE!")
    print(f"✅ Successfully uploaded: {{len(uploaded_images)}}/{{len({category.upper()}_DESIGN_FILES)}} {category} designs")
    print()

    if uploaded_images:
        print(f"📋 UPLOADED {category.upper()} IMAGES:")
        for img in uploaded_images:
            print(f"  • {{img['filename']} → {{img['printify_id']}}")

        # Save results
        results_file = f"/home/aundrae/Silent-Spirits-Legacy/uploaded_{category}_designs.json"
        with open(results_file, 'w') as f:
            json.dump(uploaded_images, f, indent=2)
        print(f"\n💾 Saved to: uploaded_{category}_designs.json")

    else:
        print("❌ No images were uploaded successfully.")

if __name__ == "__main__":
    main()
'''

        # Write script file
        with open(script_path, 'w') as f:
            f.write(script_content)

        # Make executable
        os.chmod(script_path, 0o755)

        scripts_created.append({
            'category': category,
            'script': script_name,
            'designs_count': len(designs)
        })

    return scripts_created

def create_master_upload_script(all_scripts):
    """Create a master script to run all uploads"""

    master_script = f'''#!/bin/bash
"""
Master NLBL Design Upload Script
Runs all category upload scripts in sequence
"""
echo "🚀 STARTING MASTER NLBL DESIGN UPLOAD"
echo "====================================="

TOTAL_UPLOADED=0

'''

    for script_info in all_scripts:
        master_script += f'''
echo ""
echo "📤 UPLOADING {script_info['category'].upper()} DESIGNS..."
echo "----------------------------------------"
/usr/bin/python3 {script_info['script']}
if [ $? -eq 0 ]; then
    echo "✅ {script_info['category'].title()} upload completed"
else
    echo "❌ {script_info['category'].title()} upload failed"
fi
'''

    master_script += '''
echo ""
echo "🎉 MASTER UPLOAD COMPLETE!"
echo "=========================="
echo "All NLBL designs have been uploaded to Printify!"
echo "Check individual category JSON files for results."
'''

    master_path = os.path.join(BASE_DIR, "master-upload-all-designs.sh")
    with open(master_path, 'w') as f:
        f.write(master_script)

    os.chmod(master_path, 0o755)

    return master_path

def main():
    print("🎨 NLBL DESIGN CATALOG ORGANIZER")
    print("=" * 50)

    # Scan and categorize designs
    designs_by_category, total_count = scan_designs()

    print(f"\n📊 TOTAL DESIGNS FOUND: {total_count}")
    print("=" * 50)

    # Show breakdown by category
    for category, designs in designs_by_category.items():
        print(f"• {category.title()}: {len(designs)} designs")

    # Generate upload scripts
    upload_scripts = generate_upload_scripts(designs_by_category)

    # Create master script
    master_script = create_master_upload_script(upload_scripts)

    print("
📄 SCRIPTS CREATED:"    for script in upload_scripts:
        print(f"  • {script['script']} ({script['designs_count']} {script['category']} designs)")

    print("
🎯 MASTER SCRIPT:"    print(f"  • {os.path.basename(master_script)} (runs all uploads)")

    print("
🚀 TO UPLOAD EVERYTHING:"    print("  1. Run individual scripts: python3 upload-*-designs.py"    print("  2. Or run master script: ./master-upload-all-designs.sh"    print("
📋 NEXT STEPS:"    print("  1. Execute upload scripts"    print("  2. Create Printify products from uploaded images"    print("  3. Copy blueprint IDs for shop integration"    print("
🏆 READY FOR MASS PRODUCTION!"    # Save catalog data
    catalog_data = {
        'total_designs': total_count,
        'categories': {cat: len(designs) for cat, designs in designs_by_category.items()},
        'designs_by_category': designs_by_category,
        'upload_scripts': upload_scripts
    }

    with open(os.path.join(BASE_DIR, 'nlbl_design_catalog.json'), 'w') as f:
        json.dump(catalog_data, f, indent=2, default=str)

    print("
💾 Catalog saved to: nlbl_design_catalog.json"if __name__ == "__main__":
    main()
