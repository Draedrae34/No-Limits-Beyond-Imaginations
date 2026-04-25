import { put } from "@vercel/blob";
import path from "path";

export const rawBodyConfig = {
  api: {
    bodyParser: false,
  },
};

export async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function parseMultipart(buffer, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  const boundaryValue = boundaryMatch?.[1] || boundaryMatch?.[2];
  if (!boundaryValue) {
    throw new Error("Missing multipart boundary");
  }

  const boundary = Buffer.from(`--${boundaryValue}`);
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
    const nameMatch = /name="([^"]+)"/i.exec(header);
    const filenameMatch = /filename="([^"]*)"/i.exec(header);
    const contentTypeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(header);

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

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function extensionFromContentType(contentType) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
  };
  return map[contentType] || "";
}

function buildBlobPath(folder, originalName, contentType) {
  const cleanName = sanitizeFilename(originalName || "upload");
  const existingExt = path.extname(cleanName);
  const ext = existingExt || extensionFromContentType(contentType) || ".bin";
  const base = path.basename(cleanName, existingExt || undefined);
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${folder}/${stamp}-${base}${ext}`;
}

export async function uploadMultipartFileToBlob({
  req,
  folder,
  fileField = "file",
  fallbackContentType = "application/octet-stream",
}) {
  const contentType = req.headers["content-type"] || req.headers["Content-Type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    throw new Error("Invalid content type");
  }

  const buffer = await getRawBody(req);
  const parts = parseMultipart(buffer, contentType);
  const filePart =
    parts.find((part) => part.name === fileField && part.filename) ||
    parts.find((part) => part.filename);

  if (!filePart) {
    throw new Error("No file uploaded");
  }

  const blob = await put(
    buildBlobPath(folder, filePart.filename, filePart.contentType),
    filePart.data,
    {
      access: "public",
      contentType: filePart.contentType || fallbackContentType,
    }
  );

  return { blob, parts, filePart };
}
