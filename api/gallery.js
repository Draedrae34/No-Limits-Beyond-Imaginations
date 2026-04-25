import fs from "fs";
import path from "path";
import pool from "../src/utils/db.js";

await pool.query(`
  CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseMultipart(buffer, contentType) {
  const boundaryMatch = /boundary=(.+)$/.exec(contentType);
  if (!boundaryMatch) {
    throw new Error("Missing multipart boundary");
  }

  const boundary = Buffer.from(`--${boundaryMatch[1]}`);
  const parts = [];
  let start = buffer.indexOf(boundary);
  if (start === -1) {
    throw new Error("Invalid multipart body");
  }

  start += boundary.length + 2;

  while (start < buffer.length) {
    const end = buffer.indexOf(boundary, start);
    if (end === -1) break;

    const part = buffer.slice(start, end - 2);
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      start = end + boundary.length + 2;
      continue;
    }

    const header = part.slice(0, headerEnd).toString("utf8");
    const body = part.slice(headerEnd + 4);
    const nameMatch = /name="([^"]+)"/.exec(header);
    const filenameMatch = /filename="([^"]+)"/.exec(header);
    const contentTypeMatch = /Content-Type: (.+)/i.exec(header);

    parts.push({
      name: nameMatch?.[1] || null,
      filename: filenameMatch?.[1] || null,
      contentType: contentTypeMatch?.[1] || null,
      data: body,
    });

    start = end + boundary.length + 2;
  }

  return parts;
}

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const result = await pool.query(
        "SELECT id, filename, original_name, uploaded_at FROM gallery ORDER BY id DESC"
      );
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Unable to fetch gallery items" });
    }
  }

  if (req.method === "POST") {
    const contentType = req.headers["content-type"] || req.headers["Content-Type"];
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    try {
      const buffer = await getRawBody(req);
      const parts = parseMultipart(buffer, contentType);
      const filePart = parts.find((part) => part.filename);

      if (!filePart) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const originalName = filePart.filename || "upload.bin";
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const finalName = `${Date.now()}-${safeName}`;
      const uploadDir = path.join(process.cwd(), "remembrance", "Stand_Still_photos");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uploadPath = path.join(uploadDir, finalName);
      fs.writeFileSync(uploadPath, filePart.data);

      await pool.query(
        `INSERT INTO gallery (filename, original_name) VALUES ($1, $2)`,
        [finalName, originalName]
      );

      return res.status(200).json({ success: true, filename: finalName, original_name: originalName });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Upload failed" });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
