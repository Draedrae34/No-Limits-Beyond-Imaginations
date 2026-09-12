import json
from pathlib import Path

MANIFEST = Path('meditation-app/outputs/master_manifest.json')
if not MANIFEST.exists():
    print('ERROR: manifest not found at', MANIFEST)
    raise SystemExit(1)

with open(MANIFEST, 'r', encoding='utf-8') as f:
    data = json.load(f)

OFFSET_VARIATIONS = [5, 10, 15, 20, 25, 30, 35]
HARMONICS_VARIATIONS = [2, 3, 4, 5, 3, 4, 2]
VOLUME_VARIATIONS = [0.4, 0.5, 0.6, 0.5, 0.45, 0.55, 0.5]

issues = []
summary = {}

for chakra_key, chakra_data in data.items():
    avs = chakra_data.get('audio_variations', [])
    summary[chakra_key] = {
        'total': len(avs),
        'skipped': sum(1 for a in avs if a.get('skipped')),
        'mismatches': []
    }
    # Build a map by variation
    var_map = {a.get('variation'): a for a in avs}
    for v in range(1, 8):
        expected_offset = OFFSET_VARIATIONS[(v-1) % len(OFFSET_VARIATIONS)]
        expected_harm = HARMONICS_VARIATIONS[(v-1) % len(HARMONICS_VARIATIONS)]
        expected_vol = VOLUME_VARIATIONS[(v-1) % len(VOLUME_VARIATIONS)]
        entry = var_map.get(v)
        if not entry:
            issues.append(f"{chakra_key}: missing variation {v}")
            summary[chakra_key]['mismatches'].append((v, 'missing'))
            continue
        skipped = entry.get('skipped', False)
        if skipped:
            # if skipped, still check filename pattern maybe
            continue
        # Check values
        got_offset = entry.get('binaural_offset')
        got_harm = entry.get('harmonics')
        got_vol = entry.get('volume')
        mism = []
        if got_offset is None:
            mism.append('offset_missing')
        elif float(got_offset) != float(expected_offset):
            mism.append(f'offset_expected_{expected_offset}_got_{got_offset}')
        if got_harm is None:
            mism.append('harmonics_missing')
        elif int(got_harm) != int(expected_harm):
            mism.append(f'harmonics_expected_{expected_harm}_got_{got_harm}')
        if got_vol is None:
            mism.append('volume_missing')
        else:
            # allow slight float differences
            if abs(float(got_vol) - float(expected_vol)) > 0.0001:
                mism.append(f'volume_expected_{expected_vol}_got_{got_vol}')
        # filename check
        fname = entry.get('filename','')
        if fname and f"offset{int(expected_offset)}" not in fname:
            mism.append(f'filename_offset_mismatch_expected_{expected_offset}')
        if fname and f"harm{int(expected_harm)}" not in fname:
            mism.append(f'filename_harm_mismatch_expected_{expected_harm}')
        if mism:
            issues.append(f"{chakra_key} var{v}: " + ','.join(mism))
            summary[chakra_key]['mismatches'].append((v, mism))

# Print summary
print('AUDIT REPORT: master_manifest vs generator expectations')
print('-----------------------------------------------------')
for key, s in summary.items():
    print(f"{key}: total_variations={s['total']}, skipped={s['skipped']}, mismatches={len(s['mismatches'])}")
print('\nDetailed issues:')
if not issues:
    print('No issues found — manifest matches generator patterns for present variations (skipped entries expected).')
else:
    for it in issues:
        print('-', it)

# Exit with non-zero if issues found
if issues:
    raise SystemExit(2)
else:
    raise SystemExit(0)
