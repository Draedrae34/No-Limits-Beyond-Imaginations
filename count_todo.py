import os, re
excluded = ['node_modules', '.git', 'photos', 'My_story_Page', 'Clothing_Product', 'hoodies', 'node_modules_dist']
count = 0
for root, dirs, files in os.walk('.'):
    # Modify dirs in-place to skip excluded directories
    dirs[:] = [d for d in dirs if not any(ex in os.path.join(root, d).replace('\\\\', '/') for ex in excluded)]
    for f in files:
        if f.endswith(('.js', '.py', '.html', '.css', '.md')):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                    c = fp.read()
                    count += len(re.findall(r'(?i)(TODO|FIXME)', c))
            except:
                pass
print(count)
