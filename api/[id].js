import pool from "../../src/utils/db.js";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: "Not found" });
    return res.status(200).json({ success: true, product: result.rows[0] });
  }

  if (req.method === "PUT") {
    try {
      const { name, description, price, category, image_filename, active } = req.body || {};
      const result = await pool.query(
        `UPDATE products
         SET name=$1, description=$2, price=$3, category=$4, image_filename=$5, active=$6
         WHERE id=$7 RETURNING *`,
        [name, description, price, category, image_filename, active, id]
      );
      if (!result.rows.length) return res.status(404).json({ success: false, error: "Not found" });
      return res.status(200).json({ success: true, product: result.rows[0] });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === "DELETE") {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: "Method not allowed." });
}