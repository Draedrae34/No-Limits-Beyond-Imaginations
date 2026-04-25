import fs from 'fs';
import path from 'path';

const LOGO_DIR = path.join(process.cwd(), 'Logo_N_Galaxy_Fill_Space');
const BLOB_BASE_URL = process.env.BLOB_BASE_URL || 'https://your-blob-or-cdn-domain/logos';

export function loadLogos() {
  try {
    const files = fs.readdirSync(LOGO_DIR);
    return files
      .filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f))
      .map(file => {
        const name = path.basename(file, path.extname(file));
        const publicUrl = `${BLOB_BASE_URL}/${encodeURIComponent(file)}`;
        return {
          file,
          name,
          path: path.join(LOGO_DIR, file),
          publicUrl,
        };
      });
  } catch (err) {
    console.error('Error reading logos:', err);
    return [];
  }
}

// Get logo by name (partial match)
export function getLogoByName(name) {
  const logos = loadLogos();
  return logos.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
}

// Get all logo names
export function getLogoNames() {
  const logos = loadLogos();
  return logos.map(l => l.name);
}
