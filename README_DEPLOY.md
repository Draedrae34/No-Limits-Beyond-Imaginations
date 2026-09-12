Deployment options for the public archive pages

This repository already includes a set of public-facing HTML pages and an archive ZIP. The pages are located in two places so they can be served locally by the project's local server and also published as a static site if desired.

Files to publish
- meditation-app/src/web/public/ss-landing.html
- meditation-app/src/web/public/ss-discovery.html
- meditation-app/src/web/public/ss-technical.html
- public/discovery_packet.html
- DISCOVERY_COMPLETE.md
- discovery_archive_20260906.zip

Quick notes
- The local server serves the player and API endpoints; the public pages are static and safe for publishing.
- Keep generated outputs (meditation-app/outputs/) out of git; the repository .gitignore already excludes them.

Start server without interactive prompts (Windows)
- Use the included launcher to avoid interactive permission dialogs when starting the server locally.
- Double-click start-server.bat in the repository root, or run it from cmd:

    start-server.bat

- The launcher prefers the .venv Python (if present) and falls back to any python on PATH.
- This avoids running detached background commands that may trigger host/approval prompts in some environments.

GitHub Pages (simple)
1) Create a branch named gh-pages and commit only the `public/` folder contents (or set the Pages source to the repository root and ensure the public pages are at the root).
2) In repository settings → Pages select the branch and folder, then wait for the site URL.

Vercel / Netlify
- Point the static host to the repository and set the build output directory to `/` (no build step required for plain static HTML). Deploy preview and production flows are supported.

Security & provenance
- Do not publish raw corpora or analysis notebooks without ensuring necessary permissions and redactions.
- Publish the checksums.sha256 and discovery_archive_20260906.zip along with DISCOVERY_COMPLETE.md so reviewers can verify integrity.

If you want, set up a GitHub Actions workflow to copy the `meditation-app/src/web/public` and `public/` contents into the `gh-pages` branch automatically on push. Tell me which deployment target you prefer and I will scaffold the workflow and commit it.
