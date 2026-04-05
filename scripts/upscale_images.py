import io
import os

import requests
from PIL import Image

# ---------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------
# 1. Get an API key from https://platform.stability.ai/account/keys
# 2. Set it in your terminal: export STABILITY_API_KEY="your_key"
#    Or add it to your .env file
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")

API_HOST = "https://api.stability.ai"
ENGINE_ID = "esrgan-v1-x2plus"  # 'esrgan-v1-x2plus' preserves fidelity well

# Folders to scan for images to upscale
FOLDERS_TO_SCAN = [
    "Printful_All_Over_Print_HQ",
    "Logo",
    "Clothing_Product",
]


def upscale_image(image_path, target_width=4096):
    """
    Sends an image to Stability AI's upscaling API.
    Returns the binary content of the upscaled image.
    """
    if not STABILITY_API_KEY:
        print("   ❌ Error: STABILITY_API_KEY not found in environment variables.")
        print("      Please set it in your .env file or terminal.")
        return None

    url = f"{API_HOST}/v1/generation/{ENGINE_ID}/image-to-image/upscale"

    headers = {"Accept": "image/png", "Authorization": f"Bearer {STABILITY_API_KEY}"}

    # Prepare the file
    try:
        files = {"image": open(image_path, "rb")}
    except FileNotFoundError:
        print(f"   ❌ File not found: {image_path}")
        return None

    # Parameters: We request a target width suitable for high-quality printing
    data = {
        "width": target_width,
    }

    print(f"   🚀 Sending to Stability AI (Target: {target_width}px wide)...")
    try:
        response = requests.post(
            url, headers=headers, files=files, data=data, timeout=60
        )
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Network error: {e}")
        return None

    if response.status_code != 200:
        print(f"   ❌ API Error ({response.status_code}): {str(response.content)}")
        return None

    return response.content


def process_folders():
    print("==================================================")
    print("   NO LIMITS - AI IMAGE UPSCALER (300 DPI)        ")
    print("==================================================")

    processed_count = 0

    for folder in FOLDERS_TO_SCAN:
        # Handle relative paths check
        if not os.path.exists(folder):
            if os.path.exists(os.path.join(".", folder)):
                folder = os.path.join(".", folder)
            else:
                continue

        print(f"\n📂 Scanning: {folder}")

        for filename in os.listdir(folder):
            if filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                file_path = os.path.join(folder, filename)

                # Skip already processed files to avoid loops
                if "_upscaled" in filename:
                    continue

                try:
                    with Image.open(file_path) as img:
                        width, height = img.size
                        dpi = img.info.get("dpi", (72, 72))
                        current_dpi = int(dpi[0])

                        # Criteria: Upscale if width < 3000px OR DPI < 300
                        # Printful suggests 3000px+ width for good shirt prints
                        if width < 3000 or current_dpi < 300:
                            print(f"\n📄 Found: {filename}")
                            print(f"   Stats: {width}x{height} px @ {current_dpi} DPI")

                            # Perform Upscale
                            upscaled_data = upscale_image(file_path, target_width=4096)

                            if upscaled_data:
                                # Save new image
                                name, ext = os.path.splitext(filename)
                                new_filename = (
                                    f"{name}_upscaled.png"  # PNG is better for print
                                )
                                new_path = os.path.join(folder, new_filename)

                                with Image.open(io.BytesIO(upscaled_data)) as new_img:
                                    # Save with explicit 300 DPI metadata
                                    new_img.save(new_path, dpi=(300, 300))
                                    print(
                                        f"   ✅ Saved: {new_filename} (300 DPI, {new_img.width}x{new_img.height} px)"
                                    )
                                    processed_count += 1

                except Exception as e:
                    print(f"   ⚠️ Error processing {filename}: {e}")

    if processed_count > 0:
        print(f"\n✨ Successfully upscaled {processed_count} images to 300 DPI.")


if __name__ == "__main__":
    process_folders()
