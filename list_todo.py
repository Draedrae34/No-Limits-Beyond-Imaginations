import os, re
excluded = ['node_modules', '.git', 'photos', 'My_story_Page', 'Clothing_Product', 'hoodies', 'netlify/node_modules_dist']
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if not any(ex in os.path.join(root, d).replace('\\\\', '/') for ex in excluded)]
    for f in files:
        if f.endswith(('.js', '.py', '.html', '.css', '.md')):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                    lines = fp.readlines()
                    for i, line in enumerate(lines, 1):
                        if re.search(r'(?i)(TODO|FIXME)', line):
                            print(f'{p}:{i}: {line.strip()}')
            except:
                pass
