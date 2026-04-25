import { fullSyncEngine } from './sync-engine.js';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const options = req.body || {};
    const results = await fullSyncEngine(options);

    return res.status(200).json({
      ok: true,
      ...results,
      message: `Sync completed: ${results.stats.productsCreated} created, ${results.stats.errors} errors.`
    });
  } catch (err) {
    console.error("Sync error:", err);
    return res.status(500).json({ error: "Sync failed", message: err.message });
  }
}
