const canvas = document.getElementById("cosmic-canvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  let width, height, stars;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    stars = Array.from({ length: 140 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 0.8 + 0.2,
      r: Math.random() * 1.2 + 0.3
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#02010a";
    ctx.fillRect(0, 0, width, height);

    const time = t * 0.00005;

    for (const s of stars) {
      const offsetX = Math.sin(time + s.y * 0.002) * 12 * s.z;
      const offsetY = Math.cos(time + s.x * 0.002) * 12 * s.z;

      const x = s.x + offsetX;
      const y = s.y + offsetY;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, s.r * 4);
      gradient.addColorStop(0, `rgba(148, 163, 184, ${0.8 * s.z})`);
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, s.r * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}
