(function () {
    const textEl = document.getElementById('tribute-text');
    const fontEl = document.getElementById('tribute-font');
    const colorEl = document.getElementById('tribute-color');
    const styleEl = document.getElementById('tribute-style');
    const imageEl = document.getElementById('tribute-image');
    const preview = document.getElementById('tribute-preview');
    const previewText = preview.querySelector('.preview-text');
    const previewImage = document.getElementById('preview-image');
    const submitBtn = document.getElementById('submit-tribute');

    // Function to apply styles to the live preview
    function applyStyle() {
        const text = textEl.value.trim() || 'Your tribute will appear here.';
        previewText.textContent = text;
        previewText.style.fontFamily = fontEl.value;
        previewText.style.color = colorEl.value;

        // Reset styles before applying new ones
        previewText.style.textShadow = 'none';
        previewText.style.webkitTextStroke = '0';

        const style = styleEl.value;
        if (style === 'glow') {
            previewText.style.textShadow = `0 0 12px ${colorEl.value}`;
        } else if (style === 'shadow') {
            previewText.style.textShadow = '0 2px 8px rgba(15,23,42,0.9)';
        } else if (style === 'outline') {
            previewText.style.webkitTextStroke = `1px ${colorEl.value}`; // Use selected color for outline
        }
    }

    // Event listeners for live preview updates
    textEl.addEventListener('input', applyStyle);
    fontEl.addEventListener('change', applyStyle);
    colorEl.addEventListener('input', applyStyle);
    styleEl.addEventListener('change', applyStyle);

    // Event listener for image upload preview
    imageEl.addEventListener('change', (e) => {
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

    // Initial style application on load
    applyStyle();

    // --- Tribute Submission Logic (Placeholder for API interaction) ---
    submitBtn.addEventListener('click', async () => {
        const tributeData = {
            message: textEl.value.trim(),
            font: fontEl.value,
            color: colorEl.value,
            style: styleEl.value,
            // image: imageEl.files[0] // This would require FormData and a backend upload endpoint
        };

        if (!tributeData.message) {
            alert('Please write a message for your tribute.');
            return;
        }

        // In a real scenario, you would send this data to your /api/messages endpoint
        // For now, we'll simulate the "firework" effect and add to the grid
        console.log('Tribute submitted:', tributeData);
        alert('Your tribute has been sent to the stars! (Submission logic to API is pending)');
        // You would then call a function to add this tribute to the honor-grid dynamically
    });

    // --- Cosmic Environment Initialization (from previous message-wall.html) ---
    window.addEventListener('DOMContentLoaded', () => {
        // Generate Floating Roses (if you want them on this page)
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
    });
})();