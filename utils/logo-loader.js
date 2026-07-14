import fs from 'fs';
import path from 'path';

const CANDIDATE_DIRS = [
  path.join(process.cwd(), 'Logo_N_Galaxy_Fill_Space'),
  path.join(process.cwd(), 'public', 'Logo_N_Galaxy_Fill_Space'),
  path.join(process.cwd(), 'public', 'galaxy-theme-assets'),
];

function resolveLogoDirectories() {
  return CANDIDATE_DIRS.filter(dir => {
    try { return fs.existsSync(dir); } catch { return false; }
  });
}

function buildPublicUrl(file, sourceDir) {
  const configured = process.env.BLOB_BASE_URL?.trim();
  if (configured) {
    return `${configured.replace(/\/$/, '')}/${encodeURIComponent(file)}`;
  }

  const relativeDir = path.relative(process.cwd(), sourceDir);
  const publicPath = relativeDir.startsWith('public')
    ? `/${relativeDir.replace(/\\/g, '/')}/${encodeURIComponent(file)}`
    : `/${relativeDir.replace(/\\/g, '/')}/${encodeURIComponent(file)}`;

  return publicPath;
}

export function loadLogos() {
  try {
    const dirs = resolveLogoDirectories();
    if (!dirs.length) return [];

    const seen = new Set();
    const logos = [];

    dirs.forEach(dir => {
      const files = fs.readdirSync(dir);
      files
        .filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
        .forEach(file => {
          if (seen.has(file)) return;
          seen.add(file);
          const name = path.basename(file, path.extname(file));
          logos.push({
            file,
            name,
            path: path.join(dir, file),
            publicUrl: buildPublicUrl(file, dir),
            sourceDir: dir,
          });
        });
    });

    return logos;
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

export function getThemeAssets() {
  const logos = loadLogos();
  return logos.filter(asset => asset.sourceDir.includes('galaxy-theme-assets'));
}

// Get all logo names
export function getLogoNames() {
  const logos = loadLogos();
  return logos.map(l => l.name);
}
