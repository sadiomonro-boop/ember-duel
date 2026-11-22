// Ember Duel — configuration and shared constants.
// One clear job: every number and label the rest of the game reads.

export const VIEW_W = 1280;
export const VIEW_H = 800;

export const PLAYER_LIFE = 30;
export const RIVAL_LIFE = 30;
export const HAND_SIZE = 5;
export const MAX_ENERGY = 10;
export const MAX_HAND = 7;

// Four suits, told apart by colour AND shape, never by text alone.
export const SUITS = {
  flame: { label: 'Flame', color: '#e5484d', dark: '#8f1d22', shape: 'triangle', glyph: '▲' },
  leaf: { label: 'Leaf', color: '#46a758', dark: '#1d5c2e', shape: 'diamond', glyph: '◆' },
  wave: { label: 'Wave', color: '#3e8ef7', dark: '#174a94', shape: 'circle', glyph: '●' },
  star: { label: 'Star', color: '#f5a524', dark: '#8a5a00', shape: 'star', glyph: '★' },
};

export const EFFECTS = {
  strike: { label: 'Strike', verb: 'hits', detail: 'Deal attack damage to the rival.' },
  guard: { label: 'Guard', verb: 'shields', detail: 'Gain shield equal to attack. Shield soaks damage.' },
  draw: { label: 'Draw', verb: 'draws', detail: 'Deal half damage, then draw 2 cards.' },
};

export const RIVAL_NAMES = ['Ash', 'Bram', 'Cinder', 'Ember', 'Flint', 'Soot'];

// Seeded RNG (mulberry32) so ?shot= renders are reproducible.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, rng) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
