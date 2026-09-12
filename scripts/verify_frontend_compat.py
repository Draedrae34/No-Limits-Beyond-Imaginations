import re
import json
from pathlib import Path

ROOT = Path('D:/Projects/Silent-Spirits-Legacy')
PLAYER = ROOT / 'meditation-app' / 'src' / 'web' / 'player.html'
MANIFEST = ROOT / 'meditation-app' / 'outputs' / 'master_manifest.json'

if not PLAYER.exists():
    print('ERROR: player.html not found at', PLAYER)
    raise SystemExit(1)
if not MANIFEST.exists():
    print('ERROR: master_manifest.json not found at', MANIFEST)
    raise SystemExit(1)

player_text = PLAYER.read_text(encoding='utf-8')
manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))

# Extract chakraData keys from player.html
m = re.search(r"const chakraData\s*=\s*\{([\s\S]*?)\};", player_text)
if not m:
    print('ERROR: Could not find chakraData in player.html')
    raise SystemExit(2)
block = m.group(1)
# find keys like base:, root:, third_eye:
keys = re.findall(r"\b([a-zA-Z0-9_]+)\s*:\s*\{", block)
keys = [k.strip() for k in keys]

print('Found chakraData keys in player.html:', keys)

manifest_keys = list(manifest.keys())
print('Manifest keys:', manifest_keys)

# Check that every chakraData key is present in manifest and has 7 non-skipped variations
problems = []
for k in keys:
    if k not in manifest:
        problems.append(f"Key '{k}' present in player.html but missing in manifest")
        continue
    avs = manifest[k].get('audio_variations', [])
    total = len(avs)
    non_skipped = sum(1 for a in avs if not a.get('skipped'))
    if total != 7:
        problems.append(f"{k}: manifest has {total} audio_variations (expected 7)")
    if non_skipped != 7:
        problems.append(f"{k}: {non_skipped} non-skipped variations (expected 7)")

# Check that manifest keys align with chakraData
for mk in manifest_keys:
    if mk not in keys:
        print(f"Warning: manifest contains '{mk}' not present in player chakraData — this may be intentional")

if problems:
    print('\nPROBLEMS FOUND:')
    for p in problems:
        print('- ', p)
    raise SystemExit(3)
else:
    print('\nAll chakras present and have 7 non-skipped audio variations. Front-end keys match manifest.')
    print('Next steps: You can open the player at http://127.0.0.1:8888/src/web/player.html to interactively test playback and visuals.')
