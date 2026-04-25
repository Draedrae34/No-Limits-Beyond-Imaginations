let ordersSchemaReadyPromise;

export function ensureOrdersSchema(pool) {
  if (!ordersSchemaReadyPromise) {
    ordersSchemaReadyPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          paypal_order_id TEXT NOT NULL,
          product_id TEXT,
          amount NUMERIC,
          buyer_email TEXT,
          buyer_name TEXT,
          fulfillment_status TEXT DEFAULT 'pending',
          fulfillment_notes TEXT,
          fulfilled_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'pending'`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT`);
      await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ`);
      await pool.query(
        `UPDATE orders SET fulfillment_status = 'pending' WHERE fulfillment_status IS NULL`
      );
    })();
  }

  return ordersSchemaReadyPromise;
}
