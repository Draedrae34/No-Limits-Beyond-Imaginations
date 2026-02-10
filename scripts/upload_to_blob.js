const fs = require('fs/promises');
const path = require('path');
const { put } = require('@vercel/blob');

function contentTypeFor(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.gif') return 'image/gif';
    if (ext === '.mp4') return 'video/mp4';
    if (ext === '.mov') return 'video/quicktime';
    if (ext === '.mp3') return 'audio/mpeg';
    if (ext === '.m4a') return 'audio/mp4';
    if (ext === '.wav') return 'audio/wav';
    return 'application/octet-stream';
}

async function listFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await listFiles(abs)));
        } else if (entry.isFile()) {
            files.push(abs);
        }
    }
    return files;
}

async function uploadFile({ absPath, key }) {
    const body = await fs.readFile(absPath);
    const ct = contentTypeFor(absPath);
    const result = await put(key, body, {
        access: 'public',
        contentType: ct,
        addRandomSuffix: false,
    });
    return result.url;
}

async function run() {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('Missing BLOB_READ_WRITE_TOKEN. Add it to your environment variables before running this script.');
        process.exit(1);
    }

    const root = process.cwd();

    const photosDir = path.join(root, 'remembrance', 'photos');
    const songPath = path.join(root, 'uploads', 'Dedicated_Song.mov');

    const outManifest = path.join(root, 'remembrance', 'media_manifest.json');
    const outSong = path.join(root, 'remembrance', 'dedicated_song.json');

    const photos = await listFiles(photosDir);
    photos.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));

    const items = [];

    console.log(`Uploading ${photos.length} remembrance photos to Vercel Blob...`);
    for (const abs of photos) {
        const file = path.basename(abs);
        const key = `remembrance/photos/${file}`;
        const url = await uploadFile({ absPath: abs, key });
        const caption = file
            .replace(path.extname(file), '')
            .replace(/[\\-_]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        items.push({ src: url, caption, file });
        process.stdout.write('.');
    }
    process.stdout.write('\n');

    await fs.writeFile(outManifest, JSON.stringify({ items }, null, 2));
    console.log(`→ wrote ${path.relative(root, outManifest)} with ${items.length} entries`);

    try {
        await fs.access(songPath);
        console.log('Uploading dedicated song to Vercel Blob...');
        const songUrl = await uploadFile({ absPath: songPath, key: 'remembrance/dedicated_song/Dedicated_Song.mov' });
        await fs.writeFile(outSong, JSON.stringify({ src: songUrl }, null, 2));
        console.log(`→ wrote ${path.relative(root, outSong)} pointing to Blob URL`);
    } catch {
        await fs.writeFile(outSong, JSON.stringify({ src: 'uploads/Dedicated_Song.mov' }, null, 2));
        console.log(`→ wrote ${path.relative(root, outSong)} fallback to uploads/Dedicated_Song.mov (file missing locally?)`);
    }

    console.log('Done. Commit the updated manifests, then deploy.');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
