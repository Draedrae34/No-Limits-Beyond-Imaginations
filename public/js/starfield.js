(() => {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let stars = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.min(180, Math.max(70, Math.floor((width * height) / 9000)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.7 + 0.3,
      a: Math.random() * 0.6 + 0.25,
      v: Math.random() * 0.18 + 0.04,
    }));
  }

  function frame() {
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      star.y += star.v;
      if (star.y > height + 4) {
        star.y = -4;
        star.x = Math.random() * width;
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${star.a})`;
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  frame();
})();
