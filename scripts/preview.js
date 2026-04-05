#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
};

const respond = (res, status, body, headers = {}) => {
    res.writeHead(status, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        ...headers,
    });
    res.end(body);
};

const serveFile = async (filePath, res) => {
    const data = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
    });
    res.end(data);
};

const handleRequest = async (req, res) => {
    try {
        const url = new URL(req.url, "http://localhost");
        let pathname = decodeURIComponent(url.pathname);
        if (pathname.endsWith("/")) {
            pathname += "index.html";
        }
        const requestedPath = path.normalize(path.join(projectRoot, pathname));
        if (!requestedPath.startsWith(projectRoot)) {
            respond(res, 403, "Forbidden");
            return;
        }

        let stats;
        try {
            stats = await fs.promises.stat(requestedPath);
        } catch (err) {
            if (err.code === "ENOENT" && !path.extname(requestedPath)) {
                await serveFile(path.join(projectRoot, "index.html"), res);
                return;
            }
            throw err;
        }

        const fileToServe = stats.isDirectory()
            ? path.join(requestedPath, "index.html")
            : requestedPath;
        await serveFile(fileToServe, res);
    } catch (err) {
        if (err.code === "ENOENT") {
            respond(res, 404, "Not found");
            return;
        }
        console.error("Preview server error:", err);
        respond(res, 500, "Internal server error");
    }
};

const server = http.createServer(handleRequest);

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(
            `Port ${port} is already in use. Set PORT to a different value or stop the occupying process.`
        );
    } else if (err.code === "EPERM") {
        console.error(
            `Permission denied when binding to ${host}:${port}. Try HOST=127.0.0.1 or a different PORT.`
        );
    } else {
        console.error("Preview server error:", err);
    }
    process.exit(1);
});

server.listen(port, host, () =>
    console.log(`Local preview server ➜ http://${host}:${port}`)
);
