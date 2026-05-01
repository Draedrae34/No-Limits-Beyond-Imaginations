import pool from "../../src/utils/db.js";
import { ensureProductsSchema, mapProductRow, pickIncomingImageUrl } from "../../src/utils/products.js";

await ensureProductsSchema(pool);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
      if (!result.rows.length) {
        return res.status(404).json({ success: false, error: "Not found" });
      }
      return res.status(200).json({ success: true, product: mapProductRow(result.rows[0]) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: "Unable to load product" });
    }
  }

  if (req.method === "PUT") {
    try {
      const body = req.body || {};
      const { name, description, price, category, featured } = body;
      const active =
        typeof body.active === "boolean" ? body.active : null;
      const { imageUrl } = pickIncomingImageUrl(body);

      const result = await pool.query(
        `UPDATE products
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             price = COALESCE($3, price),
             category = COALESCE($4, category),
             image_url = COALESCE($5, image_url, image_filename),
             image_filename = COALESCE($5, image_filename, image_url),
             active = COALESCE($6, active),
             featured = COALESCE($7, featured)
         WHERE id = $8
         RETURNING *`,
        [
          name ?? null,
          description ?? null,
          price ?? null,
          category ?? null,
          imageUrl ?? null,
          active,
          featured,
          id,
        ]
      );

      if (!result.rows.length) {
        return res.status(404).json({ success: false, error: "Not found" });
      }

      return res.status(200).json({ success: true, product: mapProductRow(result.rows[0]) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: "Unable to update product" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await pool.query("DELETE FROM products WHERE id = $1", [id]);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: "Unable to delete product" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed." });
}
