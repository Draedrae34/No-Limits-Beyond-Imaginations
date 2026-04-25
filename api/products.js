import pool from "../src/utils/db.js";
import { ensureProductsSchema, mapProductRow, pickIncomingImageUrl } from "../src/utils/products.js";

await ensureProductsSchema(pool);

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const productId = req.query?.id;
      if (productId) {
        const single = await pool.query("SELECT * FROM products WHERE id = $1", [productId]);
        if (!single.rows.length) {
          return res.status(404).json({ success: false, error: "Product not found" });
        }
        return res.status(200).json({ success: true, product: mapProductRow(single.rows[0]) });
      }

      const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
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
      if (!name || price == null) {
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

  if (req.method === "PUT") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const productId = req.query?.id || body.id;
      if (!productId) {
        return res.status(400).json({ success: false, error: "Product id required." });
      }

      const { name, description, price, category, active } = body;
      const { imageUrl } = pickIncomingImageUrl(body);
      const result = await pool.query(
        `UPDATE products SET name = $1, description = $2, price = $3, category = $4, image_url = $5, image_filename = $5, active = $6
         WHERE id = $7 RETURNING *`,
        [name, description || "", price, category || null, imageUrl || null, active ?? true, productId]
      );

      if (!result.rows.length) {
        return res.status(404).json({ success: false, error: "Product not found." });
      }

      return res.status(200).json({ success: true, product: mapProductRow(result.rows[0]) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: "Unable to update product" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const productId = req.query?.id || (typeof req.body === "string" ? JSON.parse(req.body)?.id : req.body?.id);
      if (!productId) {
        return res.status(400).json({ success: false, error: "Product id required." });
      }

      await pool.query("DELETE FROM products WHERE id = $1", [productId]);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: "Unable to delete product" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed." });
}
