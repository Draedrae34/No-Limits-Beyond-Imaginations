import os, re
# Directories to exclude
excluded_dirs = ['node_modules', '.git', 'photos', 'My_story_Page', 'Clothing_Product', 'hoodies', 'netlify/node_modules_dist']
# Files to exclude (our temporary scripts)
excluded_files = {'count_todo.py', 'list_todo.py', 'find_todo.py', 'real_todo.py', 'actual_todos.py', 'final_todo.py', 'code_todo.py'}
count = 0
for root, dirs, files in os.walk('.'):
    # Skip excluded directories by modifying dirs in-place
    dirs[:] = [d for d in dirs if not any(ex in os.path.join(root, d).replace('\\\\', '/') for ex in excluded_dirs)]
    for f in files:
        # Only consider code files: .js, .py, .html, .css (exclude .md for now)
        if f.endswith(('.js', '.py', '.html', '.css')):
            # Skip excluded files by base name
            if f in excluded_files:
                continue
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                    lines = fp.readlines()
                    for i, line in enumerate(lines, 1):
                        if re.search(r'(?i)(TODO|FIXME)', line):
                            print(f'{p}:{i}: {line.strip()}')
                            count += 1
            except:
                pass
print(f'Total: {count}')
