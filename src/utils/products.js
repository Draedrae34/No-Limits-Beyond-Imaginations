let schemaReadyPromise;

export function ensureProductsSchema(pool) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          price NUMERIC NOT NULL,
          category TEXT,
          image_filename TEXT,
          image_url TEXT,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_filename TEXT`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);
    })();
  }

  return schemaReadyPromise;
}

export function mapProductRow(row) {
  if (!row) return row;
  const imageUrl = row.image_url || row.image_filename || null;
  return {
    ...row,
    image_url: imageUrl,
    image_filename: row.image_filename || imageUrl,
  };
}

export function pickIncomingImageUrl(body = {}) {
  const hasImageField =
    Object.prototype.hasOwnProperty.call(body, "image_url") ||
    Object.prototype.hasOwnProperty.call(body, "image_filename");

  if (!hasImageField) {
    return { hasImageField: false, imageUrl: null };
  }

  const raw = body.image_url ?? body.image_filename ?? null;
  const imageUrl = typeof raw === "string" ? raw.trim() || null : raw;
  return { hasImageField: true, imageUrl };
}
