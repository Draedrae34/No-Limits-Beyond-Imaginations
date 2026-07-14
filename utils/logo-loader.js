import fs from 'fs';
import path from 'path';

const LOGO_MANIFEST_PATH = path.join(process.cwd(), 'public', 'logo-manifest.json');

function loadManifest() {
  try {
    const raw = fs.readFileSync(LOGO_MANIFEST_PATH, 'utf8');
    const manifest = JSON.parse(raw);
    if (!Array.isArray(manifest)) return [];
    return manifest.filter(item => item && item.file && item.publicUrl);
  } catch (err) {
    console.error('Logo manifest load failed:', err.message);
    return [];
  }
}

export function loadLogos() {
  const logos = loadManifest();
  const baseUrl = process.env.BLOB_BASE_URL?.trim();
  if (!baseUrl) return logos;

  const normalizedBase = baseUrl.replace(/\/$/, '');
  return logos.map(logo => ({
    ...logo,
    publicUrl: `${normalizedBase}/${encodeURIComponent(path.basename(logo.file))}`,
  }));
}

export function getLogoByName(name) {
  const logos = loadLogos();
  return logos.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
}

export function getThemeAssets() {
  const logos = loadLogos();
  return logos.filter(asset => asset.sourceDir.includes('galaxy-theme-assets'));
}

export function getLogoNames() {
  const logos = loadLogos();
  return logos.map(l => l.name);
}
