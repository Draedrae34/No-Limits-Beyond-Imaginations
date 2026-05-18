import pool from "../src/utils/db.js";
import { verifyAdmin } from "../src/utils/auth.js";
import {
  ensureProductsSchema,
  mapProductRow,
  pickIncomingImageUrl,
} from "../src/utils/products.js";

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

async function listProducts(req, res) {
  if (!(await verifyAdmin(req))) {
    return res.status(401).json({ error: "Authentication required" });
  }

  await ensureProductsSchema(pool);
  const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC, id DESC");
  return res.status(200).json({
    success: true,
    products: result.rows.map(mapProductRow),
  });
}

async function createProduct(req, res) {
  if (!(await verifyAdmin(req))) {
    return res.status(401).json({ error: "Authentication required" });
  }

  await ensureProductsSchema(pool);
  const body = parseBody(req);
  const { name, description = "", price, category = "", active = true, featured = false } = body;
  const { imageUrl } = pickIncomingImageUrl(body);

  if (!name || price === undefined || price === null || price === "") {
    return res.status(400).json({ success: false, error: "Name and price are required." });
  }

  const result = await pool.query(
    `INSERT INTO products (name, description, price, category, image_url, image_filename, active, featured)
     VALUES ($1, $2, $3, $4, $5, $5, $6, $7)
     RETURNING *`,
    [name, description, price, category, imageUrl, Boolean(active), Boolean(featured)]
  );

  return res.status(201).json({ success: true, product: mapProductRow(result.rows[0]) });
}

export async function handleProductById(req, res, id) {
  if (!(await verifyAdmin(req))) {
    return res.status(401).json({ error: "Authentication required" });
  }

  await ensureProductsSchema(pool);
  const body = parseBody(req);

  if (req.method === "GET") {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }
    return res.status(200).json({ success: true, product: mapProductRow(result.rows[0]) });
  }

  if (req.method === "PUT") {
    const { name, description, price, category, featured } = body;
    const active = typeof body.active === "boolean" ? body.active : null;
    const { imageUrl } = pickIncomingImageUrl(body);

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           category = COALESCE($4, category),
           image_url = COALESCE($5, image_url),
           image_filename = COALESCE($5, image_filename),
           active = COALESCE($6, active),
           featured = COALESCE($7, featured)
       WHERE id = $8
       RETURNING *`,
      [name ?? null, description ?? null, price ?? null, category ?? null, imageUrl ?? null, active, featured ?? null, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }
    return res.status(200).json({ success: true, product: mapProductRow(result.rows[0]) });
  }

  if (req.method === "DELETE") {
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: "Method not allowed." });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const id = req.query?.id;
    if (id) return handleProductById(req, res, id);
    if (req.method === "GET") return listProducts(req, res);
    if (req.method === "POST") return createProduct(req, res);
    return res.status(405).json({ success: false, error: "Method not allowed." });
  } catch (err) {
    console.error("Products API Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
