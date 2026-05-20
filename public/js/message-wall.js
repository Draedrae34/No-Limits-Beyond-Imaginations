(function () {
    // --- Helper Functions (Moved from workshop.js for public use) ---
    function escapeHTML(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    async function fetchJSON(url, options = {}) {
        const response = await fetch(url, options);
        const text = await response.text();
        let data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { raw: text };
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || `Request failed: ${response.status}`);
        }
        return data;
    }

    function resolveGalleryImageUrl(item) {
        if (!item) return "";
        if (item.image_url) return item.image_url;
        if (item.filename && /^https?:\/\//i.test(item.filename)) return item.filename;
        if (item.filename) return `/remembrance/Stand_Still_photos/${item.filename}`; // Adjust path if needed
        return "";
    }

    // --- Honor Wall Specific Logic (Moved from workshop.js) ---
    async function loadTributeElements() {
        try {
            const data = await fetchJSON("/api/gallery"); // Assuming /api/gallery provides tribute items
            const items = data.items || [];
            const tributeItems = items.filter(item =>
                item.category === "tribute" ||
                item.cosmic_text?.toLowerCase().includes("rj") ||
                item.cosmic_text?.toLowerCase().includes("mainney")
            );

            const grid = document.getElementById("honor-grid");

            if (grid) {
                grid.innerHTML = tributeItems.map(item => `
                    <div class="honor-card">
                        <p>${escapeHTML(item.cosmic_text || "")}</p>
                        ${item.image_url ? `<img src="${escapeHTML(resolveGalleryImageUrl(item))}" alt="Legacy">` : ''}
                    </div>`).join("");
            }
        } catch (err) {
            console.error(`Sacred Archive Sync Error: ${err.message}`);
        }
    }

    function initTributeInteractions() {
        const textEl = document.getElementById('tribute-text');
        const fontEl = document.getElementById('tribute-font');
        const colorEl = document.getElementById('tribute-color');
        const styleEl = document.getElementById('tribute-style');
        const imageEl = document.getElementById('tribute-image');
        const preview = document.getElementById('tribute-preview');
        const previewText = preview?.querySelector('.preview-text');
        const previewImage = document.getElementById('preview-image');
        const submitBtn = document.getElementById('submit-tribute');

        if (!textEl || !previewText || !submitBtn) return;

        function applyStyle() {
            const text = textEl.value.trim() || 'Your tribute will appear here.';
            previewText.textContent = text;
            previewText.style.fontFamily = fontEl.value;
            previewText.style.color = colorEl.value;
            previewText.style.textShadow = 'none';
            previewText.style.webkitTextStroke = '0';

            const style = styleEl.value;
            if (style === 'glow') {
                previewText.style.textShadow = `0 0 12px ${colorEl.value}`;
            } else if (style === 'shadow') {
                previewText.style.textShadow = '0 2px 8px rgba(15,23,42,0.9)';
            } else if (style === 'outline') {
                previewText.style.webkitTextStroke = `1px ${colorEl.value}`;
            }
        }

        [textEl, fontEl, colorEl, styleEl].forEach(el => {
            el.addEventListener('input', applyStyle);
            el.addEventListener('change', applyStyle);
        });

        imageEl?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                previewImage.style.display = 'none';
                previewImage.src = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                previewImage.src = ev.target.result;
                previewImage.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });

        applyStyle(); // Initial application of styles

        submitBtn.addEventListener('click', async () => {
            const previewCard = document.getElementById('tribute-preview');
            const dogTags = document.querySelector('.honor-dogtags'); // Target the specific dog tag image
            if (!previewCard || !dogTags) return;

            console.log("Launching Dog Tags and Message to the Heavens...");

            // 1. Create a "Vessel" container for the firework flight
            const vessel = document.createElement('div');
            vessel.className = 'firework-launch';

            // Clone tags and message into the vessel
            const tagsClone = dogTags.cloneNode(true);
            const messageClone = previewCard.cloneNode(true);

            // Ensure clones aren't animating while in flight
            tagsClone.style.animation = 'none';
            vessel.appendChild(tagsClone);
            vessel.appendChild(messageClone);

            // Position at the message center
            const rect = previewCard.getBoundingClientRect();
            vessel.style.top = (rect.top + rect.height / 2 - vessel.offsetHeight / 2) + 'px'; // Center vertically
            vessel.style.left = (rect.left + rect.width / 2 - 150) + 'px'; // Adjust left for vessel width
            vessel.style.width = '300px'; // Explicit width for vessel

            document.body.appendChild(vessel);

            // Simulate Lil Mystic's gaze (if Lil Mystic is present on this public page, otherwise remove)
            // window.lilMystic?.performGesture("spiritGaze");

            // 2. Explosion & Spirit Presence (Placeholder for actual spirit image)
            setTimeout(() => {
                console.log("Celestial explosion... Spirits are present.");

                // In a public page, you might have a static spirit image or a simpler effect
                const spirit = document.createElement('img'); // Create a temporary spirit image
                spirit.src = '/img/brothers-outline.png'; // Ensure this path is correct
                spirit.className = 'spirit-presence'; // Apply spirit-presence styles
                document.body.appendChild(spirit);

                setTimeout(() => {
                    if (spirit) {
                        spirit.style.opacity = '0';
                        spirit.style.transform = 'translateX(-50%) translateY(0)';
                        spirit.remove(); // Remove after fade out
                    }
                    console.log("Message immortalized on the Honor Wall.");
                    vessel.remove();
                    alert('Your tribute has been accepted by the stars.');
                    loadTributeElements(); // Refresh the grid with the new tribute
                }, 4500); // Duration for spirit presence
            }, 1500); // Delay before explosion
        });
    }

    // --- Initialization ---
    window.addEventListener('DOMContentLoaded', () => {
        // Initialize Starfield (assuming starfield.js has an init function)
        if (typeof initStarfield === 'function') {
            initStarfield();
        }

        // Generate Floating Roses
        const rosesContainer = document.getElementById('roses-container');
        const colors = ['purple', 'pink', 'red', 'lavender', 'blue', 'black'];
        if (rosesContainer) {
            for (let i = 0; i < 24; i++) {
                const rose = document.createElement('div');
                rose.className = `rose ${colors[Math.floor(Math.random() * colors.length)]}`;
                rose.innerHTML = '🌹';
                rose.style.left = `${Math.random() * 100}%`;
                rose.style.animationDelay = `${Math.random() * 80}s`;
                rose.style.fontSize = `${Math.random() * 10 + 10}px`;
                rosesContainer.appendChild(rose);
            }
        }

        // Initialize Honor Wall interactions and load existing tributes
        initTributeInteractions();
        loadTributeElements();
    });
})();