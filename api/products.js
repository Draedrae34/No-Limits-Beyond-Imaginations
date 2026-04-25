import pool from "../src/utils/db.js";

await pool.query(`
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    image_filename TEXT,
    category TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
      return res.status(200).json({ success: true, products: result.rows });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: "Unable to load products" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, description, price, category, image_filename, active } = body || {};

      if (!name || price == null) {
        return res.status(400).json({ success: false, error: "Name and price required." });
      }

      const result = await pool.query(
        `INSERT INTO products (name, description, price, category, image_filename, active)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          name,
          description || "",
          price,
          category || null,
          image_filename || null,
          active ?? true,
        ]
      );

      return res.status(201).json({ success: true, product: result.rows[0] });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: "Unable to create product" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed." });
}
