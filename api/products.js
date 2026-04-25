import pool from "../src/utils/db.js";
import { ensureProductsSchema, mapProductRow, pickIncomingImageUrl } from "../src/utils/products.js";

await ensureProductsSchema(pool);

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const result = await pool.query(
        "SELECT * FROM products ORDER BY created_at DESC"
      );
      return res.status(200).json({ success: true, products: result.rows.map(mapProductRow) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: "Unable to load products" });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, description, price, category, active } = req.body || {};
      const { imageUrl } = pickIncomingImageUrl(req.body || {});
      if (!name || !price) {
        return res.status(400).json({ success: false, error: "Name and price required." });
      }

      const result = await pool.query(
        `INSERT INTO products (name, description, price, category, image_url, image_filename, active)
         VALUES ($1,$2,$3,$4,$5,$5,$6) RETURNING *`,
        [name, description || "", price, category || null, imageUrl || null, active ?? true]
      );

      return res.status(201).json({ success: true, product: mapProductRow(result.rows[0]) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: "Unable to create product" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed." });
}
