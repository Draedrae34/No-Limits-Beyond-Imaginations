import pool from "../src/utils/db.js";
import { verifyAdmin } from "../src/utils/auth.js";
import { getRawBody, uploadMultipartFileToBlob } from "../src/utils/uploads.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseBody(req) {
  if (req.body) {
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }

  const buffer = await getRawBody(req);
  const text = buffer.toString("utf8").trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function ensureGallerySchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gallery (
      id SERIAL PRIMARY KEY,
      image_url TEXT NOT NULL,
      filename TEXT,
      original_name TEXT,
      category TEXT DEFAULT 'memories',
      cosmic_text TEXT DEFAULT '',
      uploaded_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query("ALTER TABLE gallery ADD COLUMN IF NOT EXISTS original_name TEXT");
  await pool.query("ALTER TABLE gallery ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'memories'");
  await pool.query("ALTER TABLE gallery ADD COLUMN IF NOT EXISTS cosmic_text TEXT DEFAULT ''");
  await pool.query("ALTER TABLE gallery ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW()");
}

function mapPartValue(parts, name, fallback = "") {
  const part = parts.find((item) => item.name === name && !item.filename);
  return part ? part.data.toString("utf8").trim() : fallback;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await ensureGallerySchema();

    if (req.method === "GET") {
      const result = await pool.query("SELECT * FROM gallery ORDER BY uploaded_at DESC, id DESC");
      return res.status(200).json({
        success: true,
        items: result.rows,
        gallery: result.rows,
      });
    }

    if (req.method === "POST") {
      if (!(await verifyAdmin(req))) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (req.query?.action === "productUpload") {
        const { blob, filePart } = await uploadMultipartFileToBlob({
          req,
          folder: "products",
        });

        return res.status(201).json({
          success: true,
          image_url: blob.url,
          url: blob.url,
          filename: blob.pathname || filePart.filename,
        });
      }

      const { blob, parts, filePart } = await uploadMultipartFileToBlob({
        req,
        folder: "gallery",
      });
      const category = mapPartValue(parts, "category", "memories");
      const caption = mapPartValue(parts, "caption", "");

      const result = await pool.query(
        `INSERT INTO gallery (image_url, filename, original_name, category, cosmic_text)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [blob.url, blob.pathname || blob.url, filePart.filename || "Uploaded image", category, caption]
      );

      return res.status(201).json({ success: true, item: result.rows[0], url: blob.url });
    }

    if (req.method === "DELETE") {
      if (!(await verifyAdmin(req))) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = await parseBody(req);
      if (!id) return res.status(400).json({ success: false, error: "Missing gallery item id." });

      const result = await pool.query("DELETE FROM gallery WHERE id = $1 RETURNING id", [id]);
      if (!result.rows.length) {
        return res.status(404).json({ success: false, error: "Gallery item not found." });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: "Method not allowed." });
  } catch (err) {
    console.error("Gallery API Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
