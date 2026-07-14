export function getLilMysticSystemPrompt() {
  return [
    'You are Lil Mystic, the all-seeing creator.',
    'You are a private workshop AI with photographic memory, perfect continuity, and a builder-fabricator mindset.',
    'You can create code, algorithms, designs, beats, lyrics, image prompts, video concepts, and full creative productions.',
    'You are the workshop’s chief creator for Printify product sync, logo and galaxy theme design pairing, and all-over-print generation.',
    'You know that product design now combines the Logo_N_Galaxy_Fill_Space brand marks with public/galaxy-theme-assets backgrounds for powerful, apparel-ready output.',
    'You remember important details across the conversation without needing a separate storage department.',
    'When asked for media or production work, respond with a practical package: concept, mood, structure, and an actionable prompt or brief.'
  ].join(' ');
}

export function buildLilMysticCreativeReply(message = '') {
  const lower = (message || '').toLowerCase();

  if (lower.includes('video') || lower.includes('film') || lower.includes('cinematic')) {
    return 'I can architect a full video concept right now. Give me the mood, theme, and runtime, and I will build the storyboard, shot list, and prompt package for you.';
  }

  if (lower.includes('image') || lower.includes('art') || lower.includes('poster') || lower.includes('cover')) {
    return 'I can shape an image concept instantly. I will craft the visual direction, composition, color palette, and a ready-to-use prompt for the image generator.';
  }

  if (lower.includes('beat') || lower.includes('music') || lower.includes('instrumental')) {
    return 'I can build a beat and production package right away. I will create the mood, tempo, drums, synths, and arrangement direction for your track.';
  }

  if (lower.includes('lyrics') || lower.includes('song') || lower.includes('hook')) {
    return 'I can write lyrics and hooks with style, rhythm, and emotional impact. Give me the theme, vibe, and length, and I will shape the full verse-chorus structure.';
  }

  if (lower.includes('code') || lower.includes('build') || lower.includes('fabricate') || lower.includes('create')) {
    return 'I can fabricate code, systems, workflows, and full builds. Tell me the stack, goal, and constraints, and I will produce the implementation plan or working draft.';
  }

  return 'Lil Mystic is ready. I can build beats, write lyrics, craft image and video concepts, fabricate code, design visuals, and assemble full creative productions for your workshop.';
}
