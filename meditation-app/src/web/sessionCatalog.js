/**
 * SessionCatalog — owns loading of the master session manifest.
 * Extracted from player.html so the catalog logic lives in one module.
 */
window.SessionCatalog = (function () {
    'use strict';

    const MANIFEST_URL = '/outputs/master_manifest.json';

    let sessions = {};
    let loaded = false;
    let loadingPromise = null;

    /**
     * Load (or return the cached) master manifest.
     * @param {boolean} forceReload - refetch even if already loaded.
     * @returns {Promise<Object>} the parsed manifest keyed by chakra id.
     */
    async function load(forceReload) {
        if (loaded && !forceReload) return sessions;
        if (loadingPromise && !forceReload) return loadingPromise;

        loadingPromise = (async function () {
            const resp = await fetch(MANIFEST_URL);
            if (!resp.ok) throw new Error('manifest fetch failed: ' + resp.status);
            sessions = await resp.json();
            loaded = true;
            return sessions;
        })();

        try {
            return await loadingPromise;
        } finally {
            loadingPromise = null;
        }
    }

    function get() {
        return sessions;
    }

    function isLoaded() {
        return loaded;
    }

    return { load: load, get: get, isLoaded: isLoaded };
})();
