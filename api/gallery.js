async function loadGalleryAdmin() {
  const res = await fetch("/api/gallery");
  const items = await res.json();
  const container = document.getElementById("gallery-admin");
  container.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.innerHTML = `
      <img src="/remembrance/Stand_Still_Photos/${item.filename}" width="100">
      <button onclick="deleteImage(${item.id})">Delete</button>
    `;
    container.appendChild(div);
  });
}

async function deleteImage(id) {
  if(!confirm("Are you sure you want to remove this memory?")) return;
  await fetch("/api/gallery", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });
  loadGalleryAdmin();
}
<select id="gallery-category">
  <option value="childhood">Childhood</option>
  <option value="memories">Memories</option>
  <option value="legacy">Legacy</option>
</select>
<input type="file" id="image-upload" />
<button onclick="uploadImage()">Upload to Legacy</button>

<div id="gallery-admin"></div> <!-- Where the images with delete buttons will appear -->
#fullscreen-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.95);
  display: none; justify-content: center; align-items: center;
  z-index: 20000; cursor: pointer;
}
#fullscreen-overlay img { max-width: 90%; max-height: 90%; box-shadow: 0 0 50px rgba(139,92,246,0.5); }
import fs from "fs";
import path from "path";
import pool from "../src/utils/db.js";

await pool.query(`
  CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT,
    cosmic_text TEXT,
    category TEXT DEFAULT 'memories',
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
  )
`);
await pool.query(`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS cosmic_text TEXT`);
await pool.query(`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'memories'`);

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
        "SELECT id, filename, original_name, cosmic_text, category, uploaded_at FROM gallery ORDER BY id DESC"
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
      const categoryPart = parts.find((part) => part.name === "category");

      if (!filePart) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const originalName = filePart.filename || "upload.bin";
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const finalName = `${Date.now()}-${safeName}`;
      const category = categoryPart?.data.toString("utf8").trim() || "memories";
      const cosmicText = `A moment frozen in time, echoing through the silent cosmos...`; // Placeholder for AI
      const uploadDir = path.join(process.cwd(), "public", "remembrance", "Stand_Still_Photos");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uploadPath = path.join(uploadDir, finalName);
      fs.writeFileSync(uploadPath, filePart.data);

      await pool.query(
        `INSERT INTO gallery (filename, original_name, cosmic_text, category) VALUES ($1, $2, $3, $4)`,
        [finalName, originalName, cosmicText, category]
      );

      return res.status(200).json({ success: true, filename: finalName, original_name: originalName, category, cosmic_text: cosmicText });
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

      const result = await pool.query(
        "SELECT filename FROM gallery WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Not found" });
      }

      const filename = result.rows[0].filename;
      const filePath = path.join(process.cwd(), "public", "remembrance", "Stand_Still_Photos", filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await pool.query("DELETE FROM gallery WHERE id = $1", [id]);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Delete failed" });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
