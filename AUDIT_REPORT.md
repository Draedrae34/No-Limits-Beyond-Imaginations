# Silent Spirits Legacy — Code Audit Report

## CRITICAL

1. **meditation-app/src/web/server.py (lines 14-16)** — Inconsistent error handling:
   - Calls `SimpleHTTPRequestHandler` when `http.server` import fails, but the Python 2 fallback import name (`BaseHTTPServer`) doesn't export `SimpleHTTPRequestHandler` — the fallback would crash with ImportError anyway. Since you're targeting Python 3.13/3.14, just drop the try/except.
   - `do_GET` at lines 62-70: `REPO_ROOT / path.lstrip("/")` — a path like `/DISCOVERY_COMPLETE/../.env` won't normalize here (no traversal in practice because of the startswith prefix check, but a request for `/DISCOVERY_COMPLETE/../../secrets` resolves lexically via `..` since you never call `.resolve()` — worth hardening before going global).

2. **Player's audio fallback is dead code** — `player.html` lines 2318-2322 falls back to `_preview.wav`, but 0 preview files exist in `outputs/audio/` (63 files, all full-length). On any audio error the user silently gets a second broken player.

3. **selectVariation card-highlight bug** — `player.html` lines 2214-2217 highlights card by position (`i + 1 == variation`), but `renderVariations` filters out skipped variations. If var 2 is skipped, selecting var 3 highlights the wrong card.

## IMPORTANT

4. **CORS wide open** — `Access-Control-Allow-Origin: *` on every response including `/api/sessions`. Fine for localhost, remove before deploying publicly.

5. **sw.js cache-first strategy** caches everything forever (`caches.match -> fetch`), and the manifest/audio aren't in `ASSETS_TO_CACHE` — a stale-cache trap once you ship updates. Use network-first for the manifest.

6. **CDN dependency for Three.js r128 + postprocessing scripts** (player.html lines 14-21) — breaks your offline/PWA goal and is a supply-chain risk; vendor them locally.

7. **server.py reads the manifest on every /api/sessions request** — cache it at startup or use mtime.

## GOOD / VERIFIED

- `master_manifest.json` is valid JSON, all 9 chakras present with correct locked frequencies (174/396/417/528/639/741/852/963/285), and all sampled filenames in the manifest exist on disk. ✅
- All 63 audio files match the 63-session catalog (9 chakras x 7 variations). ✅
- No `eval()`, no XSS sink fed by untrusted data (innerHTML only receives local manifest content you control).
- `cookies.txt` and `server-*.log` are NOT tracked in git.

## NEEDS YOUR CONFIRMATION

`.env.monocle` IS tracked in git and contains what looks like a live `OKAHU_API_KEY`. Rotate that key now and remove the file from the repo history (it may already be pushed to GitHub). History scrub with git filter-repo is available on request — rewriting history is destructive, so confirming first.

## NEXT STEP (optional)

Say the word and I'll fix code items 1, 2, 3, and 7.
