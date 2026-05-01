let schemaReadyPromise;

export function ensureProductsSchema(pool) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          printify_id TEXT,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          price NUMERIC NOT NULL,
          category TEXT,
          image_filename TEXT,
          image_url TEXT,
          active BOOLEAN DEFAULT TRUE,
          featured BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS printify_id TEXT`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_filename TEXT`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE`);

      // Action logs for Lil Mystic tool usage
      await pool.query(`
        CREATE TABLE IF NOT EXISTS action_logs (
          id SERIAL PRIMARY KEY,
          user_email TEXT NOT NULL,
          action TEXT NOT NULL,
          outcome TEXT NOT NULL,
          ip TEXT,
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_action_logs_user ON action_logs(user_email)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_action_logs_created ON action_logs(created_at DESC)`);

      // Routine logs for scheduled runs with performance tracking
      await pool.query(`
        CREATE TABLE IF NOT EXISTS routine_logs (
          id SERIAL PRIMARY KEY,
          routine_type TEXT NOT NULL,
          report TEXT NOT NULL,
          duration_ms INTEGER,
          step_durations JSONB,
          slowest_step TEXT,
          auto_fixes INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_routine_logs_type ON routine_logs(routine_type)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_routine_logs_created ON routine_logs(created_at DESC)`);

      // Optimization logs for autonomous tuning decisions
      await pool.query(`
        CREATE TABLE IF NOT EXISTS optimization_logs (
          id SERIAL PRIMARY KEY,
          decision_type TEXT NOT NULL,
          reason TEXT,
          action TEXT,
          severity TEXT DEFAULT 'info',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_optimization_logs_created ON optimization_logs(created_at DESC)`);
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
