#!/usr/bin/env python3
"""
Simple HTTP server for the meditation app.
Serves the player, audio files, and visualization HTML.
Run: python meditation-app/src/web/server.py
"""

import sys
import json
import os
from pathlib import Path

try:
    from http.server import HTTPServer, SimpleHTTPRequestHandler
except ImportError:
    from BaseHTTPServer import HTTPServer, SimpleHTTPRequestHandler

# server.py is at meditation-app/src/web/server.py
# parent = web/, parent.parent = src/, parent.parent.parent = meditation-app/
APP_DIR = Path(__file__).resolve().parent.parent.parent  # meditation-app/
REPO_ROOT = APP_DIR.parent  # repository root (contains public/, DISCOVERY_COMPLETE.md, ZIPs)
MANIFEST_PATH = APP_DIR / "outputs" / "master_manifest.json"
OUTPUT_DIR = APP_DIR / "outputs"

def get_session_list():
    """Load session list from manifest."""
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH) as f:
            return json.load(f)
    return {}

class MeditationHandler(SimpleHTTPRequestHandler):
    """Serve files + inject session data."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    def guess_type(self, path, *args, **kwargs):
        ctype = super().guess_type(path, *args, **kwargs)
        if ctype and ctype.startswith("text/html") and "charset" not in ctype:
            ctype += "; charset=utf-8"
        return ctype

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self):
        from urllib.parse import urlsplit

        path = urlsplit(self.path).path
        if path == "/api/sessions":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            data = get_session_list()
            self.wfile.write(json.dumps(data).encode("utf-8"))
            return

        if path in ("/", "/index.html"):
            redirect_path = "/src/web/player.html?mode=journey"
            self.send_response(302)
            self.send_header("Location", redirect_path)
            self.end_headers()
            return

        repo_root_path = REPO_ROOT / path.lstrip("/")
        if path.startswith("/public/") or path.startswith("/DISCOVERY_COMPLETE") or path.startswith("/discovery_archive_"):
            if repo_root_path.exists() and repo_root_path.is_file():
                self.send_response(200)
                self.send_header("Content-Type", self.guess_type(str(repo_root_path)))
                self.end_headers()
                with open(repo_root_path, "rb") as f:
                    self.wfile.write(f.read())
                return

        super().do_GET()

if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 8888))
    bind_addr = os.environ.get("HOST", "127.0.0.1")
    os.chdir(str(APP_DIR))
    print(f"Serving meditation app at http://{bind_addr}:{PORT}")
    print(f"App dir: {APP_DIR}")
    print(f"Output dir: {OUTPUT_DIR}")
    print(f"Master manifest: {MANIFEST_PATH}")
    print(f"Player: http://{bind_addr}:{PORT}/src/web/player.html")
    server = HTTPServer((bind_addr, PORT), MeditationHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()
