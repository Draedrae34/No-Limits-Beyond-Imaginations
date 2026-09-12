// scripts/generate-catalog.mjs
// CLI to bulk-generate Printify products from the full blueprint catalog,
// compositing your logos + galaxy textures via sharp.
//
// Usage:
//   node scripts/generate-catalog.mjs --dry-run                    # plan only
//   node scripts/generate-catalog.mjs --aop-blueprints 5 --logos-limit 3
//   node scripts/generate-catalog.mjs --max-products 50 --publish
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateFullCatalog } from '../utils/catalog-engine-new.js';

// Load .env.local
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"#\r\n]+)"?/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
}

const args = process.argv.slice(2);
const opts = { dryRun: true, publish: false };
opts.dryRun = !args.includes('--live');
const getVal = (key) => {
  const idx = args.findIndex(a => a === `--${key}` || a.startsWith(`--${key}=`));
  if (idx < 0) return undefined;
  const [k, v] = args[idx].replace(/^--/, '').split('=');
  if (v !== undefined) return v;
  return args[idx + 1];
};
const n = (key) => { const v = getVal(key); return v !== undefined ? parseInt(v, 10) : undefined; };
if (n('aop-blueprints') !== undefined) opts.aopBlueprints = n('aop-blueprints');
if (n('regular-blueprints') !== undefined) opts.regularBlueprints = n('regular-blueprints');
if (n('logos-limit') !== undefined) opts.logosLimit = n('logos-limit');
if (n('max-products') !== undefined) opts.maxProducts = n('max-products');
if (n('aop-price') !== undefined) opts.aopPriceCents = n('aop-price');
if (n('regular-price') !== undefined) opts.regularPriceCents = n('regular-price');
if (args.includes('--publish')) opts.publish = true;

if (opts.dryRun) console.log('🔍 DRY RUN — no products will be created. Use --live to create for real.\n');
else console.log('🚀 LIVE RUN — creating products in your Printify shop.\n');

const start = Date.now();
const result = await generateFullCatalog(opts);
const seconds = ((Date.now() - start) / 1000).toFixed(1);

console.log(`\n✅ Done in ${seconds}s`);
console.log(`   Logos used:        ${result.logos}`);
console.log(`   Galaxy textures:   ${result.textures}`);
console.log(`   AOP blueprints:    ${result.aopBlueprints}`);
console.log(`   Regular garments:  ${result.regularBlueprints}`);
console.log(`   Products planned:  ${result.plannedProducts}`);
console.log(`   Products created:  ${result.createdCount ?? result.created.length}`);
console.log(`   Skipped:           ${result.skipped.length}`);
result.skipped.slice(0, 20).forEach(s => console.log(`     ⚠️ ${s.blueprint}: ${s.reason}`));