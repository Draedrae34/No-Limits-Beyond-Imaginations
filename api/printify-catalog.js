import { printifyRequest } from './printify-client.js';

// Cache for catalog data
let catalogCache = null;
let catalogExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCatalog(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && catalogCache && now < catalogExpiry) {
    return catalogCache;
  }

  try {
    const [blueprints, providers] = await Promise.all([
      printifyRequest('/catalog/blueprints.json'),
      printifyRequest('/catalog/print_providers.json')
    ]);

    // Check if we got valid data (not an error)
    if (!blueprints || !providers) {
      throw new Error('Invalid catalog response');
    }

    catalogCache = {
      blueprints: blueprints.data || [],
      providers: providers.data || [],
      fetchedAt: now
    };
    catalogExpiry = now + CACHE_TTL;

    return catalogCache;
  } catch (error) {
    console.error('Catalog fetch error:', error);
    throw error;
  }
}

export async function getBlueprintDetails(blueprintId) {
  try {
    const [blueprint, providers] = await Promise.all([
      printifyRequest(`/catalog/blueprints/${blueprintId}.json`),
      printifyRequest(`/catalog/blueprints/${blueprintId}/print_providers.json`)
    ]);

    return {
      blueprint,
      providers: providers.data || []
    };
  } catch (error) {
    console.error(`Blueprint ${blueprintId} details error:`, error);
    throw error;
  }
}

export async function getProviderVariants(blueprintId, providerId) {
  try {
    const res = await printifyRequest(
      `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`
    );
    return res.data || [];
  } catch (error) {
    console.error(`Provider ${providerId} variants error:`, error);
    throw error;
  }
}

export async function getAllCatalogData() {
  try {
    const catalog = await getCatalog(true);
    const blueprintDetails = [];

    for (const blueprint of catalog.blueprints) {
      try {
        const details = await getBlueprintDetails(blueprint.id);
        const providersWithVariants = [];

        for (const provider of details.providers) {
          try {
            const variants = await getProviderVariants(blueprint.id, provider.id);
            providersWithVariants.push({
              ...provider,
              variants
            });
          } catch (err) {
            console.warn(`Skip provider ${provider.id}:`, err.message);
          }
        }

        blueprintDetails.push({
          blueprint,
          providers: providersWithVariants
        });
      } catch (err) {
        console.warn(`Skip blueprint ${blueprint.id}:`, err.message);
      }
    }

    return {
      blueprints: blueprintDetails,
      allProviders: catalog.providers,
      fetchedAt: Date.now()
    };
  } catch (error) {
    console.error('Full catalog fetch error:', error);
    throw error;
  }
}
