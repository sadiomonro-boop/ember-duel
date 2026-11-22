// Ember Duel — game state, rules and the main loop.
// One clear job: own the state machine (title → play → win/loss), apply the
// rules, and drive the canvas. Rendering lives in render.js, input in input.js.

import { VIEW_W, VIEW_H, PLAYER_LIFE, RIVAL_LIFE, HAND_SIZE, MAX_ENERGY, MAX_HAND, makeRng, shuffle, RIVAL_NAMES } from './config.js';
import { buildDeck, dealHand } from './cards.js';
import { chooseRivalPlays, rivalTaunt } from './ai.js';
import { drawTitle, drawTable, drawEnd } from './render.js';
import { attachInput, hitTestCard, hitTestRect } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '1') || 1;
const shot = params.get('shot') || '';

function newState() {
  const rng = makeRng(seed * 7919 + 13);
  const playerDeck = shuffle(buildDeck(), rng);
  const rivalDeck = shuffle(buildDeck(), rng);
  const embers = [];
  for (let i = 0; i < 40; i++) {
    embers.push({
      x: rng() * VIEW_W,
      y: rng() * VIEW_H,
      r: 1 + rng() * 2.5,
      alpha: 0.15 + rng() * 0.4,
      color: rng() > 0.5 ? '#ffb347' : '#ff7b54',
    });
  }
  return {
    screen: 'title',
    phase: 'you',
    turn: 1,
    playerLife: PLAYER_LIFE,
    rivalLife: RIVAL_LIFE,
    playerShield: 0,
    rivalShield: 0,
    playerEnergy: 1,
    rivalEnergy: 1,
    playerDeck,
    rivalDeck,
    playerHand: dealHand(playerDeck, HAND_SIZE),
    rivalHand: dealHand(rivalDeck, HAND_SIZE),
    rivalName: RIVAL_NAMES[Math.floor(rng() * RIVAL_NAMES.length)],
    log: ['Welcome to Ember Duel. Your move, duelist.'],
    message: '',
    lastPlayed: null,
    lastPlayedBy: null,
    hoverIndex: -1,
    cardRects: [],
    endTurnRect: null,
    playAgainRect: null,
    embers,
    rng,
  };
}

let state = newState();

// Deterministic showcase states for screenshots (?shot=title|play|win|loss).
// These are real renders of the game's own code, with fixed hands and life.
function applyShot() {
  if (shot === 'title') {
    state.screen = 'title';
    return;
  }
  if (shot === 'play') {
    state.screen = 'play';
    state.turn = 4;
    state.playerEnergy = 4;
    state.rivalEnergy = 4;
    state.playerLife = 24;
    state.rivalLife = 19;
    state.playerShield = 3;
    state.rivalShield = 2;
    state.playerHand = [
      { id: 101, name: 'Flare Drake', suit: 'flame', cost: 3, attack: 6, effect: 'strike' },
      { id: 102, name: 'Oak Sentinel', suit: 'leaf', cost: 3, attack: 5, effect: 'guard' },
      { id: 103, name: 'Mist Eel', suit: 'wave', cost: 2, attack: 4, effect: 'strike' },
      { id: 104, name: 'Seed Sage', suit: 'leaf', cost: 2, attack: 2, effect: 'draw' },
      { id: 105, name: 'Comet Pup', suit: 'star', cost: 2, attack: 4, effect: 'draw' },
    ];
    state.rivalHand = [
      { id: 201, name: 'Cinder Hound', suit: 'flame', cost: 2, attack: 4, effect: 'strike' },
      { id: 202, name: 'Tide Crab', suit: 'wave', cost: 2, attack: 3, effect: 'guard' },
      { id: 203, name: 'Dusk Moth', suit: 'star', cost: 1, attack: 2, effect: 'strike' },
      { id: 204, name: 'Bramble Fox', suit: 'leaf', cost: 2, attack: 4, effect: 'strike' },
      { id: 205, name: 'Rain Sprite', suit: 'wave', cost: 1, attack: 2, effect: 'draw' },
    ];
    state.lastPlayed = state.playerHand[0];
    state.lastPlayedBy = 'you';
    state.log = [
      'Turn 1 — You played Ember Wisp for 3 damage.',
      'Turn 1 — Rival played Thorn Sprout, +2 shield.',
      'Turn 2 — You played Coral Knight for 5 damage.',
      'Turn 2 — Rival played Mist Eel for 4 damage.',
      'Turn 3 — You played Storm Surge for 7 damage!',
      'Turn 3 — Rival played Oak Sentinel, +5 shield.',
      'Turn 4 — Your move. Flare Drake can end this soon.',
    ];
    return;
  }
  if (shot === 'win') {
    state.screen = 'win';
    state.turn = 7;
    state.playerLife = 14;
    state.rivalLife = 0;
    return;
  }
  if (shot === 'loss') {
    state.screen = 'loss';
    state.turn = 8;
    state.playerLife = 0;
    state.rivalLife = 11;
    return;
  }
}

function dealDamage(target, amount) {
  if (target === 'rival') {
    const soaked = Math.min(state.rivalShield, amount);
    state.rivalShield -= soaked;
    state.rivalLife -= amount - soaked;
  } else {
    const soaked = Math.min(state.playerShield, amount);
    state.playerShield -= soaked;
    state.playerLife -= amount - soaked;
  }
}

function drawCards(who, n) {
  const deck = who === 'you' ? state.playerDeck : state.rivalDeck;
  const hand = who === 'you' ? state.playerHand : state.rivalHand;
  for (let i = 0; i < n && deck.length > 0 && hand.length < MAX_HAND; i++) {
    hand.push(deck.pop());
  }
}

function playCard(who, index) {
  const hand = who === 'you' ? state.playerHand : state.rivalHand;
  const card = hand[index];
  if (!card) return false;
  const energy = who === 'you' ? state.playerEnergy : state.rivalEnergy;
  if (card.cost > energy) {
    if (who === 'you') state.message = `Not enough energy — ${card.name} costs ${card.cost}.`;
    return false;
  }
  hand.splice(index, 1);
  if (who === 'you') state.playerEnergy -= card.cost;
  else state.rivalEnergy -= card.cost;
  state.lastPlayed = card;
  state.lastPlayedBy = who;
  const owner = who === 'you' ? 'You' : state.rivalName;
  if (card.effect === 'strike') {
    dealDamage(who === 'you' ? 'rival' : 'you', card.attack);
    state.log.push(`${owner} played ${card.name} — ${card.attack} damage!`);
  } else if (card.effect === 'guard') {
    if (who === 'you') state.playerShield += card.attack;
    else state.rivalShield += card.attack;
    state.log.push(`${owner} played ${card.name} — +${card.attack} shield.`);
  } else {
    dealDamage(who === 'you' ? 'rival' : 'you', Math.max(1, Math.floor(card.attack / 2)));
    drawCards(who, 2);
    state.log.push(`${owner} played ${card.name} — damage + drew 2 cards.`);
  }
  state.message = '';
  checkEnd();
  return true;
}

function checkEnd() {
  if (state.rivalLife <= 0) {
    state.screen = 'win';
    state.log.push('The rival falls. VICTORY!');
  } else if (state.playerLife <= 0) {
    state.screen = 'loss';
    state.log.push('Your embers fade. DEFEAT.');
  }
}

function rivalTurn() {
  state.phase = 'rival';
  state.message = `${state.rivalName} is playing…`;
  render();
  const plays = chooseRivalPlays(state);
  let delay = 500;
  // Play one card at a time so the player can follow the rival's choices.
  plays.forEach((index, step) => {
    setTimeout(() => {
      // Indices shift as cards leave the hand; re-resolve by stored id.
      const cardId = state.rivalHand[index] ? state.rivalHand[index].id : null;
      const current = state.rivalHand.findIndex((c) => c.id === cardId);
      if (current >= 0) playCard('rival', current);
      render();
      if (step === plays.length - 1) finishRivalTurn();
    }, delay);
    delay += 600;
  });
  if (plays.length === 0) {
    setTimeout(finishRivalTurn, 600);
  }
}

function finishRivalTurn() {
  if (state.screen !== 'play') return;
  state.log.push(rivalTaunt(state.rivalLife, state.playerLife));
  state.turn += 1;
  state.playerEnergy = Math.min(MAX_ENERGY, state.turn);
  state.rivalEnergy = Math.min(MAX_ENERGY, state.turn);
  drawCards('you', 1);
  drawCards('rival', 1);
  state.phase = 'you';
  state.message = `Turn ${state.turn} — your move.`;
  render();
}

function endTurn() {
  if (state.screen !== 'play' || state.phase !== 'you') return;
  state.log.push(`Turn ${state.turn} — You end your turn with ${state.playerEnergy} energy left.`);
  rivalTurn();
}

function restart() {
  state = newState();
  state.screen = 'play';
  state.message = 'A new duel begins. Your move.';
  render();
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'win') drawEnd(ctx, state, true);
  else if (state.screen === 'loss') drawEnd(ctx, state, false);
  else drawTable(ctx, state);
}

attachInput(canvas, {
  onHover(x, y) {
    if (state.screen !== 'play') return;
    const index = hitTestCard(state.cardRects, x, y);
    if (index !== state.hoverIndex) {
      state.hoverIndex = index;
      render();
    }
  },
  onClick(x, y) {
    if (state.screen === 'title') {
      state.screen = 'play';
      state.message = 'Your move — click a card to play it.';
      render();
      return;
    }
    if (state.screen === 'win' || state.screen === 'loss') {
      if (hitTestRect(state.playAgainRect, x, y)) restart();
      return;
    }
    if (state.phase !== 'you') return;
    if (hitTestRect(state.endTurnRect, x, y)) {
      endTurn();
      return;
    }
    const index = hitTestCard(state.cardRects, x, y);
    if (index >= 0) {
      playCard('you', index);
      render();
    }
  },
  onPlayCard(index) {
    if (state.screen === 'play' && state.phase === 'you') {
      playCard('you', index);
      render();
    }
  },
  onEndTurn() {
    endTurn();
  },
  onRestart() {
    if (state.screen !== 'title') restart();
  },
  onTitle() {
    state = newState();
    render();
  },
});

applyShot();
render();
