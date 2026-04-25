// scripts/full-sync.mjs
// Run: node scripts/full-sync.mjs
// Options: --dry-run, --limit-blueprints=5, --limit-logos=10, --types="Hoodies,T-Shirts"

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env.local') });

const { default: fullSyncEngine } = await import('../api/sync-engine.js');

const args = process.argv.slice(2);
const options = {};

// Parse arguments
args.forEach(arg => {
  if (arg === '--dry-run') options.dryRun = true;
  if (arg.startsWith('--limit-blueprints=')) {
    options.limitBlueprints = parseInt(arg.split('=')[1]);
  }
  if (arg.startsWith('--limit-logos=')) {
    options.limitLogos = parseInt(arg.split('=')[1]);
  }
  if (arg.startsWith('--types=')) {
    options.specificTypes = arg.split('=')[1].split(',');
  }
});

console.log('Starting full sync engine...');
console.log('Options:', options);

fullSyncEngine(options)
  .then(results => {
    console.log('\n=== SYNC COMPLETE ===');
    console.log(`Total combinations: ${results.stats.totalCombinations}`);
    console.log(`Products created: ${results.stats.productsCreated}`);
    console.log(`Errors: ${results.stats.errors}`);

    if (results.generated?.length > 0) {
      console.log('\nFirst 5 products:');
      results.generated.slice(0, 5).forEach(p => {
        console.log(`  - ${p.title} (Blueprint: ${p.blueprint}, Logo: ${p.logo})`);
      });
    }

    if (results.errors?.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(e => {
        console.log(`  - ${e.title}: ${e.error}`);
      });
    }
  })
  .catch(err => {
    console.error('Sync failed:', err.message);
    process.exit(1);
  });
