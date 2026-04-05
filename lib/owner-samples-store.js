const fs = require('fs').promises;
const path = require('path');

const storeDir = path.join(process.cwd(), 'data');
const storePath = path.join(storeDir, 'owner-samples.json');

async function ensureStore() {
    await fs.mkdir(storeDir, { recursive: true });
    try {
        await fs.access(storePath);
    } catch {
        await fs.writeFile(storePath, JSON.stringify([], null, 2));
    }
}

async function readSamples() {
    await ensureStore();
    const raw = await fs.readFile(storePath, 'utf8').catch(() => '[]');
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

async function writeSamples(samples) {
    await fs.writeFile(storePath, JSON.stringify(samples, null, 2));
}

async function addSample(sample) {
    const samples = await readSamples();
    samples.unshift(sample);
    await writeSamples(samples);
    return sample;
}

async function updateSample(id, updates) {
    const samples = await readSamples();
    const idx = samples.findIndex((row) => row.id === id);
    if (idx < 0) return null;
    samples[idx] = { ...samples[idx], ...updates, updatedAt: new Date().toISOString() };
    await writeSamples(samples);
    return samples[idx];
}

module.exports = {
    readSamples,
    addSample,
    updateSample,
};
