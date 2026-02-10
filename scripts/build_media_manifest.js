const fs = require('fs/promises');
const path = require('path');

const configs = [
    {
        label: 'remembrance',
        dir: path.join(process.cwd(), 'remembrance', 'photos'),
        out: path.join(process.cwd(), 'remembrance', 'media_manifest.json'),
    },
    {
        label: 'story',
        dir: path.join(process.cwd(), 'uploads', 'my-story'),
        out: path.join(process.cwd(), 'uploads', 'story_manifest.json'),
    },
];

function normalizePosix(p) {
    return p.split(path.sep).join('/');
}

async function buildConfig({ dir, out }) {
    try {
        await fs.mkdir(path.dirname(out), { recursive: true });
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = entries
            .filter((entry) => entry.isFile())
            .sort((a, b) => a.name.localeCompare(b.name));

        const mediaBase = process.env.MEDIA_BASE_URL
            ? process.env.MEDIA_BASE_URL.replace(/\/$/, "")
            : null;

        const items = files.map((entry) => {
            const absPath = path.join(dir, entry.name);
            const relative = normalizePosix(path.relative(process.cwd(), absPath));
            const caption = entry.name
                .replace(path.extname(entry.name), "")
                .replace(/[\\-_]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            const src = mediaBase ? `${mediaBase}/${relative}` : relative;
            return { src, caption, file: entry.name };
        });

        await fs.writeFile(out, JSON.stringify({ items }, null, 2));
        console.log(`→ manifest written to ${path.relative(process.cwd(), out)} with ${items.length} entries`);
    } catch (error) {
        console.error(`Failed to build manifest for ${dir}:`, error);
        process.exitCode = 1;
    }
}

async function run() {
    for (const config of configs) {
        await buildConfig(config);
    }
}

run();
