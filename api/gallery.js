import fs from "fs";
import path from "path";
import { del } from "@vercel/blob";
import pool from "../src/utils/db.js";
import { getRawBody, rawBodyConfig, uploadMultipartFileToBlob } from "../src/utils/uploads.js";

await pool.query(`
  CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    image_url TEXT,
    original_name TEXT,
    cosmic_text TEXT,
    category TEXT DEFAULT 'memories',
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
  )
`);
await pool.query(`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS cosmic_text TEXT`);
await pool.query(`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'memories'`);
await pool.query(`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS image_url TEXT`);

export const config = rawBodyConfig;

function toGalleryImageUrl(filename) {
  if (!filename) return null;
  if (/^https?:\/\//i.test(filename)) return filename;
  return `/remembrance/Stand_Still_photos/${filename}`;
}

function deleteLegacyLocalFile(filename) {
  const filePath = path.join(process.cwd(), "public", "remembrance", "Stand_Still_photos", filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth for write operations
  if (req.method === 'POST' || req.method === 'DELETE') {
    const cookies = req.headers.cookie || '';
    const isAuth = cookies.split(';').some(c => c.trim() === 'nlbl_auth=authenticated');
    if (!isAuth) return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.method === "GET") {
    try {
      const result = await pool.query(
        "SELECT id, filename, image_url, original_name, cosmic_text, category, uploaded_at FROM gallery ORDER BY id DESC"
      );

      const items = result.rows.map((row) => ({
        ...row,
        image_url: toGalleryImageUrl(row.image_url || row.filename),
      }));

      return res.status(200).json(items);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to fetch gallery items" });
    }
  }

  if (req.method === "POST") {
    try {
      const { blob, parts, filePart } = await uploadMultipartFileToBlob({
        req,
        folder: "gallery",
        fallbackContentType: "image/jpeg",
      });
      const categoryPart = parts.find((part) => part.name === "category");
      const category = categoryPart?.data.toString("utf8").trim() || "memories";
      const originalName = filePart.filename || "upload.bin";
      const cosmicText = "A moment frozen in time, echoing through the silent cosmos...";

      await pool.query(
        "INSERT INTO gallery (filename, image_url, original_name, cosmic_text, category) VALUES ($1, $1, $2, $3, $4)",
        [blob.url, originalName, cosmicText, category]
      );

      return res.status(200).json({
        success: true,
        filename: blob.url,
        image_url: blob.url,
        original_name: originalName,
        category,
        cosmic_text: cosmicText,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Upload failed" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const rawBody = await getRawBody(req);
      const body = JSON.parse(rawBody.toString("utf8"));
      const { id } = body || {};

      if (!id) {
        return res.status(400).json({ error: "Missing id" });
      }

      const result = await pool.query("SELECT filename, image_url FROM gallery WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Not found" });
      }

      const storedImage = result.rows[0].image_url || result.rows[0].filename;
      if (storedImage && /^https?:\/\//i.test(storedImage)) {
        try {
          await del(storedImage);
        } catch (blobError) {
          console.error("Blob delete failed:", blobError);
        }
      } else if (storedImage) {
        deleteLegacyLocalFile(storedImage);
      }

      await pool.query("DELETE FROM gallery WHERE id = $1", [id]);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Delete failed" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
