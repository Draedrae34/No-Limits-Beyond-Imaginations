import json
from pathlib import Path
from collections import Counter
p = Path('c:/Users/aundr/Desktop/OneDrive/Silent-Spirits-Legacy/shop-products.json')
if not p.exists():
    print('missing file')
    raise SystemExit(1)
with p.open('r', encoding='utf-8') as f:
    d = json.load(f)
ps = d.get('products', [])
print('total', len(ps))
print('categories', Counter([str(x.get('category','')).strip() for x in ps]).most_common(20))
