// Ember Duel — the deck.
// One clear job: the 24 original cards and how a fresh deck is built.
// Every card: an original name, a suit, a cost, an attack value, one effect.

import { SUITS } from './config.js';

// cost, attack, effect — balanced so a hand always offers a real choice:
// cheap strikes for tempo, guards to survive a big turn, draws to refill.
const CARD_DEFS = [
  // Flame — aggressive, high attack, mostly Strike.
  { name: 'Spark Imp', suit: 'flame', cost: 1, attack: 2, effect: 'strike' },
  { name: 'Ember Wisp', suit: 'flame', cost: 1, attack: 3, effect: 'strike' },
  { name: 'Cinder Hound', suit: 'flame', cost: 2, attack: 4, effect: 'strike' },
  { name: 'Flare Drake', suit: 'flame', cost: 3, attack: 6, effect: 'strike' },
  { name: 'Pyre Guard', suit: 'flame', cost: 2, attack: 3, effect: 'guard' },
  { name: 'Wildfire', suit: 'flame', cost: 4, attack: 8, effect: 'strike' },
  // Leaf — steady, guards and draws.
  { name: 'Thorn Sprout', suit: 'leaf', cost: 1, attack: 2, effect: 'guard' },
  { name: 'Moss Turtle', suit: 'leaf', cost: 2, attack: 3, effect: 'guard' },
  { name: 'Bramble Fox', suit: 'leaf', cost: 2, attack: 4, effect: 'strike' },
  { name: 'Seed Sage', suit: 'leaf', cost: 2, attack: 2, effect: 'draw' },
  { name: 'Oak Sentinel', suit: 'leaf', cost: 3, attack: 5, effect: 'guard' },
  { name: 'Vine Snare', suit: 'leaf', cost: 3, attack: 4, effect: 'draw' },
  // Wave — tempo, draws and mid strikes.
  { name: 'Rain Sprite', suit: 'wave', cost: 1, attack: 2, effect: 'draw' },
  { name: 'Tide Crab', suit: 'wave', cost: 2, attack: 3, effect: 'guard' },
  { name: 'Mist Eel', suit: 'wave', cost: 2, attack: 4, effect: 'strike' },
  { name: 'Coral Knight', suit: 'wave', cost: 3, attack: 5, effect: 'strike' },
  { name: 'Deep Oracle', suit: 'wave', cost: 3, attack: 3, effect: 'draw' },
  { name: 'Storm Surge', suit: 'wave', cost: 4, attack: 7, effect: 'strike' },
  // Star — big swings, costly.
  { name: 'Dusk Moth', suit: 'star', cost: 1, attack: 2, effect: 'strike' },
  { name: 'Comet Pup', suit: 'star', cost: 2, attack: 4, effect: 'draw' },
  { name: 'Lunar Wolf', suit: 'star', cost: 3, attack: 6, effect: 'guard' },
  { name: 'Nova Phoenix', suit: 'star', cost: 4, attack: 7, effect: 'draw' },
  { name: 'Meteor Giant', suit: 'star', cost: 5, attack: 10, effect: 'strike' },
  { name: 'Aurora Veil', suit: 'star', cost: 3, attack: 4, effect: 'guard' },
];

export function cardSuit(card) {
  return SUITS[card.suit];
}

export function cardText(card) {
  const suit = SUITS[card.suit];
  if (card.effect === 'strike') return `Deal ${card.attack} damage.`;
  if (card.effect === 'guard') return `Gain ${card.attack} shield.`;
  return `Deal ${Math.max(1, Math.floor(card.attack / 2))} damage, draw 2.`;
}

// A fresh deck: a copy of all 24 cards, each with a unique id.
export function buildDeck() {
  return CARD_DEFS.map((def, i) => ({ id: i + 1, ...def }));
}

// Deal a hand of n cards from a deck array, mutating the deck.
export function dealHand(deck, n) {
  const hand = [];
  while (hand.length < n && deck.length > 0) hand.push(deck.pop());
  return hand;
}
