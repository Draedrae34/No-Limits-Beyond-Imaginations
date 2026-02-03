/* REMEMBRANCE PAGE INTELLIGENCE */

const images = [
  "images/brother1.jpg",
  "images/brother2.jpg",
  "images/brother3.jpg"
  // add more when ready
];

// TIMING PROFILE (cinematic)
const IMAGE_DURATION = 12000; // 12 seconds per image
const FADE_TIME = 1500;       // fade duration
const ZOOM_PEAK = 1.08;       // emotional swell

let currentIndex = 0;
const slideshow = document.getElementById("slideshow");
const replayBtn = document.getElementById("replay-button");

// AUDIO
const audio = new Audio();
audio.src = "music/remembrance_01.mp3";  // <- local track
audio.loop = true;
audio.volume = 0.6;  // very soft, emotional
audio.autoplay = true; // automatically starts after overlay

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

function startSlideshow() {
  currentIndex = 0;
  showImage(currentIndex);

  setInterval(() => {
    nextImage();
  }, IMAGE_DURATION);
}

replayBtn.addEventListener("click", () => {
  location.reload();
});

window.addEventListener("load", () => {
  setTimeout(() => {
    audio.play().catch(() => {});
    startSlideshow();
  }, 6000);
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
    for(let i=0;i<50;i++){
        let x = Math.random()*canvas.width;
        let y = Math.random()*canvas.height;
        let radius = Math.random()*2 + 1;
        ctx.beginPath();
        ctx.arc(x,y,radius,0,Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${Math.random()})`;
        ctx.fill();
    }
    requestAnimationFrame(drawParticles);
}

drawParticles();