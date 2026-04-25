// scripts/test-sync.mjs
import { fullSyncEngine } from '../api/sync-engine.js';

// Mock env vars for testing
process.env.PRINTIFY_API_KEY = 'test_key';
process.env.PRINTIFY_SHOP_ID = 'test_shop';

console.log('Testing sync engine...');

fullSyncEngine({ dryRun: true, limitBlueprints: 2, limitLogos: 3 })
  .then(results => {
    console.log('\n=== TEST COMPLETE ===');
    console.log(`Total combinations: ${results.stats.totalCombinations}`);
    console.log(`Generated: ${results.generated?.length || 0}`);
    console.log(`Errors: ${results.stats.errors}`);
  })
  .catch(err => {
    console.error('Test failed:', err.message);
    process.exit(1);
  });
