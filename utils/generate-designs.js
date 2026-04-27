// ============================================
// NLBL COSMIC DESIGN GENERATOR v2.0
// Creates unworldly, full-wrap AOP designs
// ============================================

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const OUTPUT_DIR = path.join(__dirname, '..', 'Logo_N_Galaxy_Fill_Space');
const AOP_WIDTH = 4500;
const AOP_HEIGHT = 5100;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================
// DESIGN 1: BLACK HOLE MEMORIAL (Signature)
// Hourglass + Rose + Dog Tags in Purple Accretion Disk
// ============================================
function createBlackHoleMemorial() {
  const canvas = createCanvas(AOP_WIDTH, AOP_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Deep space background
  const bgGrad = ctx.createRadialGradient(AOP_WIDTH/2, AOP_HEIGHT/2, 0, AOP_WIDTH/2, AOP_HEIGHT/2, AOP_WIDTH/2);
  bgGrad.addColorStop(0, '#1a0a2e');
  bgGrad.addColorStop(0.3, '#0d0518');
  bgGrad.addColorStop(0.6, '#05020a');
  bgGrad.addColorStop(1, '#000000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, AOP_WIDTH, AOP_HEIGHT);
  
  // Purple accretion disk
  for (let i = 0; i < 50; i++) {
    const angle = (i / 50) * Math.PI * 2 + Date.now() * 0.0001;
    const radius = 800 + Math.sin(i * 0.5) * 200;
    const x = AOP_WIDTH/2 + Math.cos(angle) * radius;
    const y = AOP_HEIGHT/2 + Math.sin(angle) * radius * 0.6;
    const alpha = 0.3 + Math.sin(i * 0.3) * 0.2;
    
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(147, 51, 234, ${alpha})`;
    ctx.fill();
  }
  
  // Hourglass silhouette
  ctx.save();
  ctx.translate(AOP_WIDTH/2, AOP_HEIGHT/2 - 200);
  ctx.scale(3, 3);
  
  // Hourglass shape
  ctx.beginPath();
  ctx.moveTo(-20, -60);
  ctx.lineTo(-10, -60);
  ctx.lineTo(-5, -20);
  ctx.lineTo(-15, -20);
  ctx.closePath();
  ctx.fillStyle = '#d4af37';
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(-15, 20);
  ctx.lineTo(-5, 20);
  ctx.lineTo(-10, 60);
  ctx.lineTo(-20, 60);
  ctx.closePath();
  ctx.fillStyle = '#d4af37';
  ctx.fill();
  
  // Rose detail
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#e74c3c';
  ctx.fill();
  
  for (let i = 0; i < 8; i++) {
    const petalAngle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(
      Math.cos(petalAngle) * 12,
      Math.sin(petalAngle) * 12,
      6, 10, petalAngle, 0, Math.PI * 2
    );
    ctx.fillStyle = `rgba(231, 76, 60, 0.7)`;
    ctx.fill();
  }
  
  ctx.restore();
  
  // Dog tags
  ctx.save();
  ctx.translate(AOP_WIDTH/2 - 400, AOP_HEIGHT/2 + 300);
  ctx.scale(2.5, 2.5);
  
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fillStyle = '#c0c0c0';
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Tag text
  ctx.fillStyle = '#000';
  ctx.font = 'bold 12px serif';
  ctx.textAlign = 'center';
  ctx.fillText('R.J.', 0, -5);
  ctx.fillText('T-MAIN', 0, 8);
  ctx.fillText('NEY', 0, 20);
  
  ctx.restore();
  
  // Stars
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const size = Math.random() * 3 + 1;
    const alpha = Math.random() * 0.8 + 0.2;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }
  
  // NLBL text at bottom
  ctx.fillStyle = '#9b59b6';
  ctx.font = 'bold 120px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N.L.B.L.I.T.M.W.I.', AOP_WIDTH/2, AOP_HEIGHT - 150);
  
  return canvas.toBuffer('image/png');
}

// ============================================
// DESIGN 2: COSMIC STORM (Raw Energy)
// Lightning bolts + Crystal shards + Nebula
// ============================================
function createCosmicStorm() {
  const canvas = createCanvas(AOP_WIDTH, AOP_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Dark nebula base
  const nebulaGrad = ctx.createRadialGradient(AOP_WIDTH/2, AOP_HEIGHT/2, 0, AOP_WIDTH/2, AOP_HEIGHT/2, AOP_WIDTH/2);
  nebulaGrad.addColorStop(0, '#2d1b69');
  nebulaGrad.addColorStop(0.4, '#1a0a2e');
  nebulaGrad.addColorStop(0.7, '#0d0518');
  nebulaGrad.addColorStop(1, '#000000');
  ctx.fillStyle = nebulaGrad;
  ctx.fillRect(0, 0, AOP_WIDTH, AOP_HEIGHT);
  
  // Purple/red nebula clouds
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const radius = Math.random() * 300 + 100;
    const cloudGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    cloudGrad.addColorStop(0, `rgba(${120 + Math.random()*80}, ${50 + Math.random()*50}, ${180 + Math.random()*70}, 0.3)`);
    cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cloudGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Lightning bolts
  for (let i = 0; i < 15; i++) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`;
    ctx.lineWidth = Math.random() * 8 + 3;
    ctx.beginPath();
    let x = Math.random() * AOP_WIDTH;
    let y = -50;
    ctx.moveTo(x, y);
    
    while (y < AOP_HEIGHT + 50) {
      x += (Math.random() - 0.5) * 200;
      y += Math.random() * 100 + 50;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Glow
    ctx.strokeStyle = `rgba(147, 51, 234, ${Math.random() * 0.3})`;
    ctx.lineWidth = ctx.lineWidth * 3;
    ctx.stroke();
  }
  
  // Crystal shards
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const size = Math.random() * 40 + 10;
    const rotation = Math.random() * Math.PI * 2;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size/2, size/2);
    ctx.lineTo(-size/2, size/2);
    ctx.closePath();
    
    const crystalGrad = ctx.createLinearGradient(0, -size, 0, size);
    crystalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    crystalGrad.addColorStop(0.5, `rgba(${150 + Math.random()*100}, ${100 + Math.random()*100}, 255, 0.6)`);
    crystalGrad.addColorStop(1, 'rgba(100, 50, 200, 0.3)');
    ctx.fillStyle = crystalGrad;
    ctx.fill();
    
    ctx.restore();
  }
  
  // NLBL logo center
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 150px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Glow effect
  ctx.shadowColor = '#9b59b6';
  ctx.shadowBlur = 50;
  ctx.fillText('N.L.B.L.', AOP_WIDTH/2, AOP_HEIGHT/2 - 100);
  
  ctx.shadowColor = '#e74c3c';
  ctx.shadowBlur = 30;
  ctx.fillText('I.T.M.W.I.', AOP_WIDTH/2, AOP_HEIGHT/2 + 50);
  
  ctx.shadowBlur = 0;
  
  return canvas.toBuffer('image/png');
}

// ============================================
// DESIGN 3: AUNDRAE SIGNATURE (Personal Power)
// Skulls, wings, diamonds, electric purple
// ============================================
function createAundraeSignature() {
  const canvas = createCanvas(AOP_WIDTH, AOP_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Electric purple background
  const bgGrad = ctx.createLinearGradient(0, 0, AOP_WIDTH, AOP_HEIGHT);
  bgGrad.addColorStop(0, '#1a0033');
  bgGrad.addColorStop(0.3, '#2d0a4d');
  bgGrad.addColorStop(0.6, '#4a0080');
  bgGrad.addColorStop(1, '#1a0033');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, AOP_WIDTH, AOP_HEIGHT);
  
  // Electric lightning
  for (let i = 0; i < 20; i++) {
    ctx.strokeStyle = `rgba(147, 0, 211, ${Math.random() * 0.4 + 0.2})`;
    ctx.lineWidth = Math.random() * 15 + 5;
    ctx.beginPath();
    let x = Math.random() * AOP_WIDTH;
    let y = -50;
    ctx.moveTo(x, y);
    
    while (y < AOP_HEIGHT + 50) {
      x += (Math.random() - 0.5) * 300;
      y += Math.random() * 150 + 50;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  
  // Wings
  ctx.fillStyle = 'rgba(147, 51, 234, 0.3)';
  
  // Left wing
  ctx.beginPath();
  ctx.moveTo(AOP_WIDTH/2 - 200, AOP_HEIGHT/2);
  ctx.quadraticCurveTo(AOP_WIDTH/2 - 600, AOP_HEIGHT/2 - 400, AOP_WIDTH/2 - 500, AOP_HEIGHT/2 + 300);
  ctx.quadraticCurveTo(AOP_WIDTH/2 - 300, AOP_HEIGHT/2 + 100, AOP_WIDTH/2 - 200, AOP_HEIGHT/2);
  ctx.fill();
  
  // Right wing
  ctx.beginPath();
  ctx.moveTo(AOP_WIDTH/2 + 200, AOP_HEIGHT/2);
  ctx.quadraticCurveTo(AOP_WIDTH/2 + 600, AOP_HEIGHT/2 - 400, AOP_WIDTH/2 + 500, AOP_HEIGHT/2 + 300);
  ctx.quadraticCurveTo(AOP_WIDTH/2 + 300, AOP_HEIGHT/2 + 100, AOP_WIDTH/2 + 200, AOP_HEIGHT/2);
  ctx.fill();
  
  // Skull (simplified)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(AOP_WIDTH/2, AOP_HEIGHT/2 - 50, 80, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye sockets
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(AOP_WIDTH/2 - 30, AOP_HEIGHT/2 - 60, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(AOP_WIDTH/2 + 30, AOP_HEIGHT/2 - 60, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(AOP_WIDTH/2, AOP_HEIGHT/2 - 30);
  ctx.lineTo(AOP_WIDTH/2 - 10, AOP_HEIGHT/2);
  ctx.lineTo(AOP_WIDTH/2 + 10, AOP_HEIGHT/2);
  ctx.fill();
  
  // Mouth
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(AOP_WIDTH/2, AOP_HEIGHT/2 + 20, 30, 0, Math.PI);
  ctx.stroke();
  
  // Diamond above skull
  ctx.fillStyle = '#b9f2ff';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(AOP_WIDTH/2, AOP_HEIGHT/2 - 180);
  ctx.lineTo(AOP_WIDTH/2 + 30, AOP_HEIGHT/2 - 120);
  ctx.lineTo(AOP_WIDTH/2, AOP_HEIGHT/2 - 60);
  ctx.lineTo(AOP_WIDTH/2 - 30, AOP_HEIGHT/2 - 120);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // AUNDRAE text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 100px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#9b59b6';
  ctx.shadowBlur = 20;
  ctx.fillText('AUNDRAE', AOP_WIDTH/2, AOP_HEIGHT - 100);
  ctx.shadowBlur = 0;
  
  return canvas.toBuffer('image/png');
}

// ============================================
// DESIGN 4: PASTEL DREAMS (Feminine Cosmic)
// Soft clouds, shooting stars, dreamy
// ============================================
function createPastelDreams() {
  const canvas = createCanvas(AOP_WIDTH, AOP_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Soft gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, AOP_HEIGHT);
  bgGrad.addColorStop(0, '#ffeef8');
  bgGrad.addColorStop(0.3, '#f0e6ff');
  bgGrad.addColorStop(0.6, '#e6f3ff');
  bgGrad.addColorStop(1, '#fff5e6');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, AOP_WIDTH, AOP_HEIGHT);
  
  // Soft clouds
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const radius = Math.random() * 150 + 80;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + radius * 0.6, y - radius * 0.3, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x - radius * 0.5, y + radius * 0.2, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Shooting stars
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const length = Math.random() * 100 + 50;
    const angle = Math.random() * Math.PI * 2;
    
    ctx.strokeStyle = `rgba(${200 + Math.random()*55}, ${150 + Math.random()*100}, ${255}, ${Math.random() * 0.5 + 0.3})`;
    ctx.lineWidth = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
    
    // Star head
    ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // "No Limits" text in soft purple
  ctx.fillStyle = '#9b70d1';
  ctx.font = 'bold 120px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(155, 112, 209, 0.3)';
  ctx.shadowBlur = 20;
  ctx.fillText('NO LIMITS', AOP_WIDTH/2, AOP_HEIGHT/2 - 80);
  
  ctx.fillStyle = '#c490e4';
  ctx.font = 'bold 80px Georgia, serif';
  ctx.shadowColor = 'rgba(196, 144, 228, 0.3)';
  ctx.fillText('BEYOND', AOP_WIDTH/2, AOP_HEIGHT/2 + 20);
  
  ctx.fillStyle = '#d4b5f0';
  ctx.font = 'bold 60px Georgia, serif';
  ctx.shadowColor = 'rgba(212, 181, 240, 0.3)';
  ctx.fillText('LIMITATIONS', AOP_WIDTH/2, AOP_HEIGHT/2 + 100);
  
  ctx.shadowBlur = 0;
  
  // Small decorative elements
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const size = Math.random() * 8 + 3;
    
    ctx.fillStyle = `rgba(${200 + Math.random()*55}, ${150 + Math.random()*100}, ${200 + Math.random()*55}, ${Math.random() * 0.4 + 0.2})`;
    ctx.beginPath();
    
    if (Math.random() > 0.5) {
      // Circle
      ctx.arc(x, y, size, 0, Math.PI * 2);
    } else {
      // Heart
      ctx.moveTo(x, y + size * 0.3);
      ctx.bezierCurveTo(x, y - size, x - size, y - size, x, y);
      ctx.bezierCurveTo(x + size, y - size, x, y - size, x, y + size * 0.3);
    }
    ctx.fill();
  }
  
  return canvas.toBuffer('image/png');
}

// ============================================
// DESIGN 5: BIG BANG (Maximum Cosmic)
// Multicolor explosion radiating outward
// ============================================
function createBigBang() {
  const canvas = createCanvas(AOP_WIDTH, AOP_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Deep black center
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, AOP_WIDTH, AOP_HEIGHT);
  
  // Multiple explosion waves
  const centerX = AOP_WIDTH / 2;
  const centerY = AOP_HEIGHT / 2;
  
  for (let wave = 0; wave < 20; wave++) {
    const radius = wave * 150 + 100;
    const alpha = 1 - (wave / 25);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    
    const waveGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.2);
    
    const hue = (wave * 18) % 360;
    waveGrad.addColorStop(0, `hsla(${hue}, 100%, 60%, ${alpha * 0.3})`);
    waveGrad.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 100%, 50%, ${alpha * 0.2})`);
    waveGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = waveGrad;
    ctx.fill();
  }
  
  // Particle explosion
  for (let i = 0; i < 500; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * Math.min(AOP_WIDTH, AOP_HEIGHT) * 0.4;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    const size = Math.random() * 6 + 2;
    const alpha = Math.random() * 0.8 + 0.2;
    
    const hue = (Math.random() * 60 + 280) % 360;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
    ctx.fill();
    
    // Glow
    if (Math.random() > 0.7) {
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha * 0.3})`;
      ctx.fill();
    }
  }
  
  // Central burst
  for (let i = 0; i < 100; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 200;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    const size = Math.random() * 15 + 5;
    
    const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.3, 'rgba(255, 100, 255, 0.6)');
    grad.addColorStop(1, 'rgba(100, 200, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
  
  // "BIG BANG" text with glow
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 140px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff00ff';
  ctx.shadowBlur = 40;
  ctx.fillText('BIG BANG', centerX, centerY - 100);
  
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 30;
  ctx.fillText('COSMOS', centerX, centerY + 50);
  ctx.shadowBlur = 0;
  
  // Outer ring of energy
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const radius = Math.min(AOP_WIDTH, AOP_HEIGHT) * 0.45 + i * 30;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  return canvas.toBuffer('image/png');
}

// ============================================
// DESIGN 6: GALAXY ROSE (Memorial Tribute)
// Rose growing from cosmic dust
// ============================================
function createGalaxyRose() {
  const canvas = createCanvas(AOP_WIDTH, AOP_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Deep space
  const spaceGrad = ctx.createRadialGradient(AOP_WIDTH/2, AOP_HEIGHT/2, 0, AOP_WIDTH/2, AOP_HEIGHT/2, AOP_WIDTH/2);
  spaceGrad.addColorStop(0, '#0f0520');
  spaceGrad.addColorStop(0.5, '#050210');
  spaceGrad.addColorStop(1, '#000000');
  ctx.fillStyle = spaceGrad;
  ctx.fillRect(0, 0, AOP_WIDTH, AOP_HEIGHT);
  
  // Stardust
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const size = Math.random() * 3;
    const alpha = Math.random() * 0.5 + 0.1;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${200 + Math.random()*55}, ${180 + Math.random()*75}, ${255}, ${alpha})`;
    ctx.fill();
  }
  
  // Rose - center
  const roseX = AOP_WIDTH / 2;
  const roseY = AOP_HEIGHT / 2;
  
  // Stem
  ctx.strokeStyle = '#2d5a27';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(roseX, roseY + 150);
  ctx.quadraticCurveTo(roseX - 50, roseY + 300, roseX - 100, roseY + 450);
  ctx.stroke();
  
  // Leaves
  ctx.fillStyle = '#1a3a15';
  ctx.beginPath();
  ctx.ellipse(roseX - 120, roseY + 400, 30, 50, -0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Rose petals - layered
  const petalColors = [
    'rgba(220, 20, 60, 0.9)',   // Crimson
    'rgba(255, 20, 147, 0.8)',  // Deep pink
    'rgba(139, 0, 139, 0.7)',   // Dark violet
    'rgba(75, 0, 130, 0.6)',    // Indigo
  ];
  
  const petalCount = 12;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const radius = 60 + Math.sin(i * 0.5) * 20;
    const x = roseX + Math.cos(angle) * radius;
    const y = roseY + Math.sin(angle) * radius - 30;
    const size = 35 + Math.sin(i) * 10;
    
    ctx.fillStyle = petalColors[i % petalColors.length];
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 1.5, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Rose center detail
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(roseX, roseY - 30, 20, 0, Math.PI * 2);
  ctx.fill();
  
  // Gold dust around rose
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 150;
    const x = roseX + Math.cos(angle) * distance;
    const y = roseY - 30 + Math.sin(angle) * distance;
    const size = Math.random() * 4 + 1;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 215, 0, ${Math.random() * 0.6 + 0.2})`;
    ctx.fill();
  }
  
  // "In Memory" text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 80px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('In Memory', roseX, roseY - 180);
  
  ctx.fillStyle = 'rgba(180, 100, 255, 0.8)';
  ctx.font = 'italic 40px Georgia, serif';
  ctx.fillText('R.J. & T-Mainney', roseX, roseY - 120);
  
  // Floating particles
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const size = Math.random() * 5 + 2;
    const alpha = Math.random() * 0.4 + 0.1;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(147, 51, 234, ${alpha})`;
    ctx.fill();
  }
  
  return canvas.toBuffer('image/png');
}

// ============================================
// DESIGN 7: STELLAR WINGS (Celestial)
// Angelic wings made of stars
// ============================================
function createStellarWings() {
  const canvas = createCanvas(AOP_WIDTH, AOP_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Deep cosmic background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, AOP_WIDTH, AOP_HEIGHT);
  
  // Nebula clouds
  const nebulaColors = [
    ['rgba(120, 0, 200, 0.2)', 'rgba(60, 0, 100, 0.1)'],
    ['rgba(0, 100, 200, 0.2)', 'rgba(0, 50, 100, 0.1)'],
    ['rgba(200, 0, 150, 0.2)', 'rgba(100, 0, 75, 0.1)'],
  ];
  
  nebulaColors.forEach(([color1, color2]) => {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const radius = Math.random() * 400 + 200;
    
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Left wing
  ctx.fillStyle = 'rgba(100, 150, 255, 0.15)';
  ctx.beginPath();
  ctx.moveTo(AOP_WIDTH/2, AOP_HEIGHT/2);
  ctx.quadraticCurveTo(AOP_WIDTH/2 - 400, AOP_HEIGHT/2 - 300, AOP_WIDTH/2 - 600, AOP_HEIGHT/2);
  ctx.quadraticCurveTo(AOP_WIDTH/2 - 400, AOP_HEIGHT/2 + 300, AOP_WIDTH/2, AOP_HEIGHT/2);
  ctx.fill();
  
  // Right wing
  ctx.fillStyle = 'rgba(255, 100, 255, 0.15)';
  ctx.beginPath();
  ctx.moveTo(AOP_WIDTH/2, AOP_HEIGHT/2);
  ctx.quadraticCurveTo(AOP_WIDTH/2 + 400, AOP_HEIGHT/2 - 300, AOP_WIDTH/2 + 600, AOP_HEIGHT/2);
  ctx.quadraticCurveTo(AOP_WIDTH/2 + 400, AOP_HEIGHT/2 + 300, AOP_WIDTH/2, AOP_HEIGHT/2);
  ctx.fill();
  
  // Stars - varying sizes
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const size = Math.random() * 4 + 1;
    const alpha = Math.random() * 0.8 + 0.2;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    
    const starColors = ['#ffffff', '#ffd700', '#ff69b4', '#87ceeb'];
    ctx.fillStyle = starColors[Math.floor(Math.random() * starColors.length)];
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Twinkle effect for larger stars
    if (size > 2 && Math.random() > 0.7) {
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  
  // Constellation lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    let x = Math.random() * AOP_WIDTH;
    let y = Math.random() * AOP_HEIGHT;
    ctx.moveTo(x, y);
    
    for (let j = 0; j < 5; j++) {
      x += (Math.random() - 0.5) * 200;
      y += (Math.random() - 0.5) * 200;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  
  // Central figure silhouette
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  
  // Body
  ctx.beginPath();
  ctx.ellipse(AOP_WIDTH/2, AOP_HEIGHT/2 + 100, 80, 150, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Head
  ctx.beginPath();
  ctx.arc(AOP_WIDTH/2, AOP_HEIGHT/2 - 100, 60, 0, Math.PI * 2);
  ctx.fill();
  
  // "STELLAR" text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 100px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#87ceeb';
  ctx.shadowBlur = 30;
  ctx.fillText('STELLAR', AOP_WIDTH/2, AOP_HEIGHT - 150);
  
  ctx.shadowBlur = 0;
  
  return canvas.toBuffer('image/png');
}

// ============================================
// DESIGN 8: COSMIC GEOMETRY (Abstract)
// Sacred geometry patterns
// ============================================
function createCosmicGeometry() {
  const canvas = createCanvas(AOP_WIDTH, AOP_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, AOP_WIDTH, AOP_HEIGHT);
  
  // Grid pattern
  ctx.strokeStyle = 'rgba(100, 50, 200, 0.2)';
  ctx.lineWidth = 1;
  const gridSize = 100;
  
  for (let x = 0; x < AOP_WIDTH; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, AOP_HEIGHT);
    ctx.stroke();
  }
  
  for (let y = 0; y < AOP_HEIGHT; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(AOP_WIDTH, y);
    ctx.stroke();
  }
  
  // Concentric circles
  const centerX = AOP_WIDTH / 2;
  const centerY = AOP_HEIGHT / 2;
  
  for (let i = 0; i < 20; i++) {
    const radius = i * 80 + 50;
    const alpha = 1 - (i / 25);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${100 + i * 8}, ${50 + i * 5}, ${200 + i * 3}, ${alpha * 0.5})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Triangles
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const size = Math.random() * 100 + 50;
    const rotation = Math.random() * Math.PI * 2;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    ctx.beginPath();
    ctx.moveTo(0, -size/2);
    ctx.lineTo(-size/2, size/2);
    ctx.lineTo(size/2, size/2);
    ctx.closePath();
    
    ctx.fillStyle = `rgba(${150 + Math.random()*105}, ${100 + Math.random()*100}, ${200 + Math.random()*55}, 0.3)`;
    ctx.fill();
    
    ctx.restore();
  }
  
  // Hexagons
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const size = Math.random() * 60 + 30;
    
    ctx.beginPath();
    for (let j = 0; j < 6; j++) {
      const angle = (j / 6) * Math.PI * 2;
      const hx = x + Math.cos(angle) * size;
      const hy = y + Math.sin(angle) * size;
      
      if (j === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    
    ctx.fillStyle = `rgba(${100 + Math.random()*100}, ${50 + Math.random()*100}, ${200 + Math.random()*55}, 0.4)`;
    ctx.fill();
  }
  
  // Sacred geometry flower of life
  const flowerX = centerX;
  const flowerY = centerY;
  const flowerRadius = 200;
  
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const cx = flowerX + Math.cos(angle) * flowerRadius;
    const cy = flowerY + Math.sin(angle) * flowerRadius;
    
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  ctx.beginPath();
  ctx.arc(flowerX, flowerY, 60, 0, Math.PI * 2);
  ctx.stroke();
  
  // "COSMIC GEOMETRY" text
  ctx.fillStyle = '#9b59b6';
  ctx.font = 'bold 80px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#9b59b6';
  ctx.shadowBlur = 20;
  ctx.fillText('COSMIC', centerX, centerY - 150);
  
  ctx.fillStyle = '#e74c3c';
  ctx.shadowColor = '#e74c3c';
  ctx.fillText('GEOMETRY', centerX, centerY - 50);
  
  ctx.shadowBlur = 0;
  
  // Corner decorations
  const cornerSize = 150;
  
  // Top-left corner
  ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(50, 50);
  ctx.lineTo(50 + cornerSize, 50);
  ctx.lineTo(50, 50 + cornerSize);
  ctx.stroke();
  
  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(AOP_WIDTH - 50, AOP_HEIGHT - 50);
  ctx.lineTo(AOP_WIDTH - 50 - cornerSize, AOP_HEIGHT - 50);
  ctx.lineTo(AOP_WIDTH - 50, AOP_HEIGHT - 50 - cornerSize);
  ctx.stroke();
  
  return canvas.toBuffer('image/png');
}

// ============================================
// DESIGN 9: ETHEREAL MIST (Soft & Dreamy)
// Misty, ethereal, flowing
// ============================================
function createEtherealMist() {
  const canvas = createCanvas(AOP_WIDTH, AOP_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Soft gradient
  const grad = ctx.createLinearGradient(0, 0, 0, AOP_HEIGHT);
  grad.addColorStop(0, '#f8f0ff');
  grad.addColorStop(0.3, '#e6d5ff');
  grad.addColorStop(0.6, '#d4caff');
  grad.addColorStop(1, '#c9b8ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, AOP_WIDTH, AOP_HEIGHT);
  
  // Mist layers
  for (let layer = 0; layer < 5; layer++) {
    const y = layer * (AOP_HEIGHT / 5) - 100;
    const alpha = 0.1 + layer * 0.05;
    
    ctx.fillStyle = `rgba(200, 180, 255, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, y + 200);
    
    for (let x = 0; x <= AOP_WIDTH; x += 50) {
      const waveY = y + Math.sin(x * 0.01 + layer) * 100 + Math.sin(x * 0.02) * 50;
      ctx.lineTo(x, waveY);
    }
    
    ctx.lineTo(AOP_WIDTH, y + 400);
    ctx.lineTo(0, y + 400);
    ctx.closePath();
    ctx.fill();
  }
  
  // Soft orbs
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const radius = Math.random() * 200 + 100;
    
    const orbGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    orbGrad.addColorStop(0, 'rgba(200, 180, 255, 0.3)');
    orbGrad.addColorStop(0.5, 'rgba(180, 150, 255, 0.1)');
    orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Flowing ribbons
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(${150 + i * 20}, ${130 + i * 20}, ${200 + i * 10}, 0.3)`;
    ctx.lineWidth = 50;
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    let x = -100;
    let y = AOP_HEIGHT / 2 + (i - 2) * 100;
    ctx.moveTo(x, y);
    
    while (x < AOP_WIDTH + 100) {
      x += 100;
      y += Math.sin(x * 0.01 + i) * 50;
      ctx.lineTo(x, y);
    }
    
    ctx.stroke();
  }
  
  // Delicate flowers
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const size = Math.random() * 30 + 15;
    
    // Stem
    ctx.strokeStyle = 'rgba(150, 200, 150, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.quadraticCurveTo(x + 10, y + size + 30, x + 20, y + size + 50);
    ctx.stroke();
    
    // Petals
    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2;
      const px = x + Math.cos(angle) * size * 0.5;
      const py = y + Math.sin(angle) * size * 0.5;
      
      ctx.fillStyle = `rgba(${255}, ${200 + Math.random()*55}, ${255}, 0.6)`;
      ctx.beginPath();
      ctx.arc(px, py, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Center
    ctx.fillStyle = 'rgba(255, 150, 200, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // "ETHEREAL" text
  ctx.fillStyle = 'rgba(150, 100, 200, 0.8)';
  ctx.font = 'bold 100px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(200, 180, 255, 0.5)';
  ctx.shadowBlur = 30;
  ctx.fillText('ETHEREAL', AOP_WIDTH/2, AOP_HEIGHT/2 - 50);
  
  ctx.fillStyle = 'rgba(180, 150, 220, 0.6)';
  ctx.font = 'italic 50px Georgia, serif';
  ctx.shadowColor = 'rgba(200, 180, 255, 0.3)';
  ctx.fillText('MIST', AOP_WIDTH/2, AOP_HEIGHT/2 + 30);
  ctx.shadowBlur = 0;
  
  // Floating sparkles
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * AOP_WIDTH;
    const y = Math.random() * AOP_HEIGHT;
    const size = Math.random() * 4 + 1;
    const alpha = Math.random() * 0.5 + 0.2;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }
  
  return canvas.toBuffer('image/png');
}

// ============================================
// DESIGN 10: NEO-TRIBAL COSMIC
// Bold patterns, tribal meets space
// ============================================
function createNeoTribalCosmic() {
  const canvas = createCanvas(AOP_WIDTH, AOP_HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#0a0510';
  ctx.fillRect(0, 0, AOP_WIDTH, AOP_HEIGHT);
  
  // Tribal patterns
  const patterns = [
    // Zigzag
    () => {
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      for (let x = 0; x < AOP_WIDTH; x += 50) {
        const y = AOP_HEIGHT/2 + Math.sin(x * 0.02) * 100;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
    // Concentric diamonds
    () => {
      ctx.strokeStyle = 'rgba(255, 100, 200, 0.4)';
      ctx.lineWidth = 5;
      const centerX = AOP_WIDTH/2;
      const centerY = AOP_HEIGHT/2;
      for (let i = 0; i < 10; i++) {
        const size = i * 60 + 50;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - size);
        ctx.lineTo(centerX + size, centerY);
        ctx.lineTo(centerX, centerY + size);
        ctx.lineTo(centerX - size, centerY);
        ctx.closePath();
        ctx.stroke();
      }
    },
    // Wave patterns
    () => {
      for (let y = 0; y < AOP_HEIGHT; y += 100) {
        ctx.strokeStyle = `rgba(${100 + y/10}, ${50 + y/20}, ${200}, 0.3)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x < AOP_WIDTH; x += 10) {
          const waveY = y + Math.sin(x * 0.03) * 30;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }
    }
  ];
  
  patterns.forEach(p => p());
  
  // Bold tribal symbols
  const symbols = [
    { x: AOP_WIDTH/2, y: AOP_HEIGHT/2, size: 200 },
    { x: AOP_WIDTH/4, y: AOP_HEIGHT/4, size: 100 },
    { x: 3*AOP_WIDTH/4, y: 3*AOP_HEIGHT/4, size: 120 },
  ];
  
  symbols.forEach(sym => {
    // Sun symbol
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(sym.x, sym.y, sym.size/2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Rays
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(sym.x + Math.cos(angle) * sym.size/2, sym.y + Math.sin(angle) * sym.size/2);
      ctx.lineTo(sym.x + Math.cos(angle) * (sym.size/2 + 50), sym.y + Math.sin(angle) * (sym.size/2 + 50));
      ctx.stroke();
    }
    
    // Inner circle
    ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(sym.x, sym.y, sym.size/4, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // "NEO-TRIBAL" text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 90px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#9b59b6';
  ctx.shadowBlur = 20;
  ctx.fillText('NEO-TRIBAL', AOP_WIDTH/2, 150);
  
  ctx.fillStyle = '#e74c3c';
  ctx.shadowColor = '#e74c3c';
  ctx.fillText('COSMIC', AOP_WIDTH/2, 250);
  ctx.shadowBlur = 0;
  
  // Border
  ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)';
  ctx.lineWidth = 10;
  ctx.strokeRect(50, 50, AOP_WIDTH - 100, AOP_HEIGHT - 100);
  
  return canvas.toBuffer('image/png');
}

// ============================================
// GENERATE ALL DESIGNS
// ============================================
async function generateAllDesigns() {
  console.log('🚀 Generating unworldly cosmic designs...\n');
  
  const designs = [
    { name: 'black-hole-memorial', fn: createBlackHoleMemorial, desc: 'Signature hourglass + rose memorial' },
    { name: 'cosmic-storm', fn: createCosmicStorm, desc: 'Lightning crystal energy' },
    { name: 'aundrae-signature', fn: createAundraeSignature, desc: 'Skulls, wings, diamonds' },
    { name: 'pastel-dreams', fn: createPastelDreams, desc: 'Soft ethereal feminine' },
    { name: 'big-bang-cosmos', fn: createBigBang, desc: 'Maximum explosion energy' },
    { name: 'galaxy-rose', fn: createGalaxyRose, desc: 'Rose growing from stardust' },
    { name: 'stellar-wings', fn: createStellarWings, desc: 'Angel wings of stars' },
    { name: 'cosmic-geometry', fn: createCosmicGeometry, desc: 'Sacred geometry patterns' },
    { name: 'ethereal-mist', fn: createEtherealMist, desc: 'Soft dreamy mist' },
    { name: 'neo-tribal-cosmic', fn: createNeoTribalCosmic, desc: 'Bold tribal meets space' },
  ];
  
  for (const design of designs) {
    console.log(`🎨 Creating: ${design.name}`);
    console.log(`   ${design.desc}`);
    
    const buffer = design.fn();
    const filename = `${design.name}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    fs.writeFileSync(filepath, buffer);
    console.log(`   ✅ Saved: ${filename}\n`);
  }
  
  console.log('✨ All designs generated!');
  console.log(`📁 Location: ${OUTPUT_DIR}`);
  console.log(`📦 Total: ${designs.length} unworldly designs`);
}

// Run if called directly
if (require.main === module) {
  generateAllDesigns().catch(console.error);
}

module.exports = { generateAllDesigns };
