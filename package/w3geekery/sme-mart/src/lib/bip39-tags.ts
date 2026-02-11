/**
 * BIP39-style engagement tag generator.
 *
 * Generates human-readable tags in the format: ENG-word-word
 * (e.g., ENG-ocean-tiger, ENG-amber-falcon)
 *
 * Uses a curated subset of short, memorable, non-offensive English words.
 */

const WORDS = [
  // Animals
  'tiger', 'falcon', 'otter', 'raven', 'cobra', 'panda', 'eagle', 'shark',
  'bison', 'crane', 'viper', 'finch', 'moose', 'gecko', 'heron', 'manta',
  'lynx', 'quail', 'stoat', 'swift', 'trout', 'wren', 'ibis', 'dingo',
  // Colors & materials
  'amber', 'azure', 'coral', 'ivory', 'onyx', 'ruby', 'slate', 'jade',
  'pearl', 'brass', 'cedar', 'steel', 'frost', 'ember', 'cobalt', 'crimson',
  // Nature
  'ocean', 'ridge', 'delta', 'maple', 'storm', 'grove', 'cliff', 'brook',
  'crest', 'stone', 'thorn', 'bloom', 'flint', 'marsh', 'blaze', 'drift',
  'peak', 'vale', 'reef', 'dune', 'fern', 'moss', 'pine', 'birch',
  // Objects & concepts
  'prism', 'vault', 'forge', 'latch', 'nexus', 'relay', 'shard', 'spark',
  'tower', 'anvil', 'orbit', 'pulse', 'helix', 'gauge', 'lever', 'pivot',
  'badge', 'crest', 'blade', 'crown', 'arrow', 'lance', 'shield', 'helm',
  // Abstract
  'bold', 'swift', 'keen', 'calm', 'true', 'brave', 'clear', 'prime',
  'noble', 'stern', 'vivid', 'stark', 'lunar', 'solar', 'astral', 'nova',
  // Tech-ish
  'pixel', 'sigma', 'theta', 'omega', 'gamma', 'alpha', 'delta', 'kappa',
  'logic', 'vector', 'cipher', 'proxy', 'macro', 'micro', 'qubit', 'fiber',
  // Places & geography
  'mesa', 'fjord', 'basin', 'ledge', 'cavern', 'inlet', 'summit', 'strait',
  'harbor', 'glade', 'oasis', 'tundra', 'canyon', 'lagoon', 'shoal', 'knoll',
  // Misc memorable
  'atlas', 'tempo', 'chord', 'forge', 'grain', 'hatch', 'lotus', 'plume',
  'relic', 'scope', 'token', 'vigil', 'chalk', 'flare', 'glyph', 'knack',
];

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

/**
 * Generate a BIP39-style engagement tag: ENG-word-word
 */
export function generateEngagementTag(): string {
  const w1 = randomWord();
  let w2 = randomWord();
  // Ensure two different words
  while (w2 === w1) {
    w2 = randomWord();
  }
  return `ENG-${w1}-${w2}`;
}

/**
 * Generate a unique engagement tag that isn't in the existing set.
 * Falls back after 50 attempts (collision extremely unlikely with ~200^2 combos).
 */
export function generateUniqueEngagementTag(existingTags: string[]): string {
  const existing = new Set(existingTags);
  for (let i = 0; i < 50; i++) {
    const tag = generateEngagementTag();
    if (!existing.has(tag)) return tag;
  }
  // Fallback: append random digits
  return `${generateEngagementTag()}-${Math.floor(Math.random() * 1000)}`;
}
