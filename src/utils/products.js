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

      // Routine logs for scheduled runs
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

      // Extend orders table for Stripe payments (only once)
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id)`);

      // Adaptive config table (single row, id=1)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS adaptive_config (
          id SERIAL PRIMARY KEY CHECK (id = 1),
          config JSONB NOT NULL,
          cache_mode_enabled BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_adaptive_config_id ON adaptive_config(id)`);

      // Default config and schedule objects
      const defaultConfig = {
        name: "adaptive-config",
        version: "1.0.0",
        description: "NLBL Adaptive Optimization Layer configuration",
        thresholds: {
          autoFixEscalatePerHour: 10,
          costSpikePercentage: 50,
          predictionConfidence: 0.8,
          routineDurationIncreasePercent: 30,
          latencyIncreasePercent: 50
        },
        safeRanges: {
          batchSize: { min: 1, max: 10, default: 5 },
          scheduleShiftHours: { max: 2 },
          catalogThrottleThresholdMs: 5000,
          routineDurationThresholdMs: 30000
        },
        optimization: {
          enableAutoTuning: true,
          enablePredictiveAlerts: true,
          enableAdaptiveScheduling: true,
          enableResourceTracking: true,
          enableAIProductOptimization: true
        },
        cost: {
          vercelRatePerMs: 0.0000002,
          monthlyBudgetAlertUSD: 10.00
        }
      };

      // Insert default config if none exists (safe for concurrent initialization)
      await pool.query(
        `INSERT INTO adaptive_config (id, config, cache_mode_enabled) VALUES (1, $1, false)
         ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(defaultConfig)]
      );

      // Adaptive schedule table (single row, id=1)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS adaptive_schedule (
          id SERIAL PRIMARY KEY CHECK (id = 1),
          schedule JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_adaptive_schedule_id ON adaptive_schedule(id)`);

      // Default schedule object
      const defaultSchedule = {
        name: "adaptive-schedule",
        version: "1.0.0",
        description: "Dynamic schedule adjustments by NLBL adaptive engine",
        schedule: {
          hourly: {
            enabled: true,
            cron: "0 * * * *",
            original: "0 * * * *",
            lastAdjusted: null,
            adjustmentReason: null
          },
          nightly: {
            enabled: true,
            cron: "0 2 * * *",
            original: "0 2 * * *",
            lastAdjusted: null,
            adjustmentReason: null
          }
        },
        history: []
      };

      // Insert default schedule if none exists (safe for concurrent initialization)
      await pool.query(
        `INSERT INTO adaptive_schedule (id, schedule) VALUES (1, $1)
         ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(defaultSchedule)]
      );

      // Cached catalog table (single row, id=1)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS cached_catalog (
          id SERIAL PRIMARY KEY CHECK (id = 1),
          catalog JSONB,
          cached_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_cached_catalog_id ON cached_catalog(id)`);
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
