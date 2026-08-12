import { uploadMultipartFileToBlob } from '../src/utils/uploads.js';

function setCors(res, origin) {
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  try {
    setCors(res, req.headers.origin);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const result = await uploadMultipartFileToBlob({ req, folder: 'uploads', fileField: 'file' });
    // Return the blob metadata so the client can reference the uploaded file
    return res.status(201).json({ success: true, blob: result.blob, filename: result.filePart?.filename });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
}

// For serverless platforms that support disabling body parsing via exported config
export const rawBodyConfig = {
  api: {
    bodyParser: false,
  },
};
