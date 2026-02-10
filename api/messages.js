const fs = require("fs").promises;
const path = require("path");

const storeDir = path.join(process.cwd(), "data");
const storePath = path.join(storeDir, "messages.json");

async function ensureStore() {
    await fs.mkdir(storeDir, { recursive: true });
    try {
        await fs.access(storePath);
    } catch {
        await fs.writeFile(storePath, JSON.stringify([], null, 2));
    }
}

async function readMessages() {
    await ensureStore();
    const raw = await fs.readFile(storePath, "utf8").catch(() => "[]");
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

async function writeMessages(messages) {
    await fs.writeFile(storePath, JSON.stringify(messages, null, 2));
}

function sanitizePayload(body) {
    const { name, type, message, image } = body;
    if (!name || !type || !message) {
        throw new Error("Name, type, and message are required");
    }

    return {
        id: Date.now().toString(),
        name: name.trim(),
        type: type.trim(),
        message: message.trim(),
        image: image || null,
        date: new Date().toISOString().split("T")[0],
    };
}

async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const messages = await readMessages();

        if (req.method === "GET") {
            return res.status(200).json({ success: true, data: messages });
        }

        if (req.method === "POST") {
            const payload = sanitizePayload(req.body);
            messages.unshift(payload);
            await writeMessages(messages);
            return res.status(201).json({ success: true, data: payload });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        console.error("[Messages API] Error:", error.message);
        return res.status(500).json({ error: error.message });
    }
}

module.exports = handler;
module.exports.default = handler;
