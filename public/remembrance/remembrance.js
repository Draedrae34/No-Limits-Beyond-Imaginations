/* REMEMBRANCE PAGE INTELLIGENCE */

const fallbackImages = [
    "images/brother1.jpg",
    "images/brother2.jpg",
    "images/brother3.jpg"
];
let images = [];

// TIMING PROFILE (cinematic)
const IMAGE_DURATION = 12000; // 12 seconds per image
const FADE_TIME = 1500;       // fade duration
const ZOOM_PEAK = 1.08;       // emotional swell

let currentIndex = 0;
const slideshow = document.getElementById("slideshow");
const replayBtn = document.getElementById("replaySong");

// Handle opening overlay click — start tribute song
const overlay = document.getElementById("opening-overlay");
if (overlay) {
    overlay.addEventListener("click", () => {
        overlay.style.opacity = "0";
        const audio = document.getElementById("tributeAudio");
        if (audio && audio.src) {
            audio.play().catch(e => console.log("Audio play failed:", e));
        }
        setTimeout(() => overlay.remove(), 1500);
    });
}

function showImage(index) {
    // Galaxy-themed transition: cosmic fade with particle burst
    slideshow.style.transition = `opacity ${FADE_TIME}ms ease-in-out, transform 8s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    slideshow.style.opacity = 0;
    slideshow.style.transform = 'scale(0.8) rotate(-2deg)'; // Start from a distant, tilted view

    // Trigger particle burst for galaxy effect
    triggerGalaxyBurst();

    setTimeout(() => {
        slideshow.style.backgroundImage = `url(${images[index]})`;
        slideshow.style.transform = `scale(${ZOOM_PEAK}) rotate(0deg)`; // Zoom into the memory
        slideshow.style.opacity = 1;
    }, FADE_TIME);

    setTimeout(() => {
        slideshow.style.transform = "scale(1) rotate(0deg)"; // Settle into place
    }, IMAGE_DURATION / 2);
}

function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    showImage(currentIndex);
}

async function startSlideshow() {
    if (!images.length) {
        console.warn("No remembrance images available, showing fallback.");
        images = fallbackImages;
    }
    currentIndex = 0;
    showImage(currentIndex);

    setInterval(() => {
        nextImage();
    }, IMAGE_DURATION);
}

replayBtn.addEventListener("click", () => {
    location.reload();
});

window.addEventListener("load", async () => {
    setTimeout(async () => {
        try {
            const manifest = await fetch("./media_manifest.json");
            if (manifest.ok) {
                const payload = await manifest.json();
                images = (payload.items || []).map((item) => item.src);
            } else {
                throw new Error("manifest fetch failed");
            }
        } catch (error) {
            console.warn("Unable to load media manifest, falling back:", error);
        }
        startSlideshow();
    }, 1500);

    // Load tribute song from JSON
    try {
        const songRes = await fetch("dedicated_song.json");
        if (songRes.ok) {
            const songData = await songRes.json();
            const audio = document.getElementById("tributeAudio");
            if (audio) {
                audio.src = songData.src;
                audio.title = songData.title || "";
                const replayBtn = document.getElementById("replaySong");
                if (replayBtn) {
                    replayBtn.onclick = () => {
                        audio.currentTime = 0;
                        audio.play().catch(e => console.log("Audio play failed:", e));
                    };
                }
            }
        }
    } catch (err) {
        console.error("Error loading tribute song:", err);
    }

    // Load stand‑still photos from JSON (grouped by person with tribute paragraphs)
    try {
        const photoRes = await fetch("ss_photos.json");
        if (photoRes.ok) {
            const photoData = await photoRes.json();
            const items = photoData.items || [];
            const grid = document.getElementById("standStillGrid");
            if (grid) {
                grid.innerHTML = "";

                // Tribute paragraphs per person/group
                const paragraphs = {
                    "RJ": {
                        title: "R.J. — The Eternal Spark",
                        text: "R.J. believed imagination had no limits. His energy, his laughter, his drive — all of it pushed the people around him to dream bigger. From his first photo to his last, his spark lives on in every step forward. His journey from innocence to legend is captured in these frames, each one a testament to a life fully lived and a legacy that will never fade."
                    },
                    "TM": {
                        title: "T‑Mainney — The Heart's Anchor",
                        text: "T‑Mainney rode for the ones he loved. His loyalty, his strength, his presence grounded everyone around him. From his first standstill to his last, his memory remains an anchor in the storm. These photos capture the beautiful evolution of a man who stood strong for his family, his partner, and his brothers — a legacy of love that transcends time."
                    },
                    "Both": {
                        title: "R.J. & T‑Mainney — Brothers Forever",
                        text: "Together they rode, together they lit the way. Their bond unbroken, their memories intertwined. R.J.'s spark and T‑Mainney's anchor remain with us always. In every photo together, we see the perfect balance of fire and foundation — two souls who rode as one, loved as brothers, and left a legacy that neither time nor death can dim."
                    },
                    "Family": {
                        title: "Family & Loved Ones",
                        text: "The ones we love never truly leave us. They live on in every memory, every ride, every moment we carry forward. These photos capture the foundation — parents, siblings, partners — the tapestry of love that raised R.J., supported T-Mainney, and continues to bind them all together across dimensions. Family is the heartbeat of every legacy."
                    }
                };

                // Group items by group field
                const groups = {};
                items.forEach(item => {
                    const g = item.group || 'Other';
                    if (!groups[g]) groups[g] = [];
                    groups[g].push(item);
                });

                // Render each group
                Object.keys(groups).forEach(groupId => {
                    const groupItems = groups[groupId];
                    const info = paragraphs[groupId] || { title: groupId, text: "" };

                    // Group section
                    const section = document.createElement("section");
                    section.className = "standstill-group";

                    // Group title
                    const titleEl = document.createElement("h3");
                    titleEl.className = "group-title";
                    titleEl.textContent = info.title;
                    section.appendChild(titleEl);

                    // Group paragraph
                    if (info.text) {
                        const paraEl = document.createElement("p");
                        paraEl.className = "group-paragraph";
                        paraEl.textContent = info.text;
                        section.appendChild(paraEl);
                    }

                    // Photo grid within group
                    const groupGrid = document.createElement("div");
                    groupGrid.className = "group-grid";
                    groupItems.forEach(p => {
                        const img = document.createElement("img");
                        img.src = p.src;
                        img.alt = p.alt || p.caption || "";
                        img.className = "standstill-photo";
                        groupGrid.appendChild(img);

                        if (p.caption) {
                            const caption = document.createElement("div");
                            caption.className = "photo-caption";
                            caption.textContent = p.caption;
                            groupGrid.appendChild(caption);
                        }

                        if (p.paragraph) {
                            const para = document.createElement("p");
                            para.className = "photo-paragraph";
                            para.textContent = p.paragraph;
                            groupGrid.appendChild(para);
                        }
                    });
                    section.appendChild(groupGrid);
                    grid.appendChild(section);
                });
            }
        }
    } catch (err) {
        console.error("Error loading stand‑still photos:", err);
    }
});

// GALAXY PARTICLE VISUALIZER
const canvas = document.createElement("canvas");
canvas.id = "visualizer";
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// New function for galaxy particle burst during transitions
function triggerGalaxyBurst() {
    // Temporarily increase particle density and add twinkling effect
    const burstParticles = 100;
    const burstDuration = FADE_TIME * 2;

    function burstDraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < burstParticles; i++) {
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            let radius = Math.random() * 3 + 1;
            let alpha = Math.random() * 0.8 + 0.2; // Brighter particles
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        }
    }

    // Burst animation
    let burstFrame = 0;
    const burstInterval = setInterval(() => {
        burstDraw();
        burstFrame++;
        if (burstFrame > burstDuration / 50) {
            clearInterval(burstInterval);
            drawParticles(); // Return to normal
        }
    }, 50);
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 50; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let radius = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
        ctx.fill();
    }
    requestAnimationFrame(drawParticles);
}

drawParticles();
