// utils/discord-alerts.js - Unified Discord notification system for NLBL
// Centralized alert utility with cosmic theming

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const COLORS = {
  success: 0x00ff88,      // Green — payments, orders, syncs
  warning: 0xffaa00,      // Orange — latency, cache mode, predictions
  error: 0xff4444,        // Red — failures, crashes, timeouts
  info: 0x00ffff,         // Cyan — routine runs, optimizations
  cosmic: 0xff9cfb,       // Pink — Lil Mystic actions
  payment: 0xffd700       // Gold — money matters
};

const ICONS = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
  cosmic: '🌌',
  payment: '💳'
};

export async function sendDiscordAlert(type, title, fields = [], embedDescription = '') {
  if (!WEBHOOK_URL) {
    console.warn('[Discord] Webhook URL not configured — alert skipped');
    return;
  }

  const color = COLORS[type] || COLORS.info;
  const icon = ICONS[type] || 'ℹ️';
  
  const embed = {
    title: `${icon} ${title}`,
    description: embedDescription || '',
    color,
    timestamp: new Date().toISOString(),
    fields: fields.map(f => ({
      name: f.name,
      value: String(f.value),
      inline: f.inline ?? false
    })),
    footer: {
      text: 'NLBL Autonomous System •
    icon_url: 'https://cdn.cosmic/icon.png' // Placeholder
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    if (!response.ok) {
      console.error('[Discord] Alert failed:', response.status, response.statusText);
    }
  } catch (err) {
    console.error('[Discord] Alert error:', err.message);
  }
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function formatLatency(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
