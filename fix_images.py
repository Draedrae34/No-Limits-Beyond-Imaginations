import re
import os

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
mockups_dir = '/home/aundrae/Desktop/My clothing mock ups'

# List of existing images to use as placeholders
productImages = [
    'Gemini_Generated_Image_1fe2901fe2901fe2.png',
    'Gemini_Generated_Image_105wa6105wa6105w.png',
    'Gemini_Generated_Image_dn8v9ydn8v9ydn8v.png',
    'Gemini_Generated_Image_p6dhspp6dhspp6dh.png',
    'Gemini_Generated_Image_w5z6r5w5z6r5w5z6.png',
    'Gemini_Generated_Image_xkz2arxkz2arxkz2.png',
    'IMG_1898.JPG',
    'IMG_1899.JPG',
    'IMG_1900.JPG',
    'IMG_1902.JPG',
    'IMG_1904.JPG',
    'IMG_1909.JPG',
    'IMG_2855.PNG',
    'IMG_2856.PNG',
    'IMG_2858.PNG',
    'IMG_2860.PNG',
    'IMG_2861.PNG',
    'IMG_2862.PNG',
    'IMG_2863.PNG',
    'IMG_2864.PNG',
]

script_path = os.path.join(script_dir, 'script.js')

content = open(script_path).read()

counter = 0

def replace_image(match):
    global counter
    image_path = '../My clothing mock ups/' + productImages[counter % len(productImages)]
    counter += 1
    return "image: '" + image_path + "'"

# Replace all image paths in the product catalog
content = re.sub(r"image: '[^']*'", replace_image, content)

with open(script_path, 'w') as f:
    f.write(content)

print(f"Fixed {counter} image paths in script.js")
