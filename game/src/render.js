// Ember Duel — canvas rendering.
// One clear job: draw every screen (title, table, victory, defeat) from state.
// All art is drawn in code: no images, no fonts beyond the system stack.

import { VIEW_W, VIEW_H, SUITS, EFFECTS, MAX_ENERGY } from './config.js';
import { cardText } from './cards.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSuitShape(ctx, suitKey, cx, cy, size) {
  const suit = SUITS[suitKey];
  ctx.fillStyle = suit.color;
  ctx.strokeStyle = suit.dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (suit.shape === 'triangle') {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy + size * 0.8);
    ctx.lineTo(cx - size, cy + size * 0.8);
  } else if (suit.shape === 'diamond') {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
  } else if (suit.shape === 'circle') {
    ctx.arc(cx, cy, size * 0.85, 0, Math.PI * 2);
  } else {
    // star: 5-point, drawn as two overlapping triangles for a bold mark
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
      const px = cx + Math.cos(a) * size;
      const py = cy + Math.sin(a) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawCard(ctx, card, x, y, w, h, opts) {
  const suit = SUITS[card.suit];
  const hover = opts && opts.hover;
  const dim = opts && opts.dim;
  const yy = hover ? y - 18 : y;
  ctx.save();
  if (dim) ctx.globalAlpha = 0.92;
  // Card body with a soft shadow so the hand has weight.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, x + 4, yy + 6, w, h, 12);
  ctx.fill();
  const grad = ctx.createLinearGradient(x, yy, x, yy + h);
  grad.addColorStop(0, '#fff8ec');
  grad.addColorStop(1, '#f3e2c2');
  ctx.fillStyle = grad;
  roundRect(ctx, x, yy, w, h, 12);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = hover ? '#ffd166' : suit.color;
  roundRect(ctx, x, yy, w, h, 12);
  ctx.stroke();
  // Suit band across the top.
  ctx.fillStyle = suit.color;
  roundRect(ctx, x + 3, yy + 3, w - 6, h * 0.24, 9);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(h * 0.085)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(suit.label.toUpperCase(), x + w / 2 + 12, yy + h * 0.155);
  // Cost orb, tucked in the top-left corner so it never covers the suit name.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(x + 17, yy + 17, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold ${Math.round(h * 0.08)}px Georgia, serif`;
  ctx.fillText(String(card.cost), x + 17, yy + 22);
  // Big suit shape in the middle.
  drawSuitShape(ctx, card.suit, x + w / 2, yy + h * 0.46, w * 0.2);
  // Name.
  ctx.fillStyle = '#2b2118';
  ctx.font = `bold ${Math.round(h * 0.075)}px Georgia, serif`;
  ctx.fillText(card.name, x + w / 2, yy + h * 0.68);
  // Effect line.
  ctx.fillStyle = '#5a4632';
  ctx.font = `${Math.round(h * 0.06)}px Georgia, serif`;
  wrapText(ctx, cardText(card), x + w / 2, yy + h * 0.78, w - 16, h * 0.075);
  // Attack value, bottom-left; effect tag, bottom-right.
  ctx.fillStyle = suit.dark;
  ctx.font = `bold ${Math.round(h * 0.11)}px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.fillText('⚔ ' + card.attack, x + 12, yy + h - 12);
  ctx.textAlign = 'right';
  ctx.font = `bold ${Math.round(h * 0.058)}px Georgia, serif`;
  ctx.fillText(EFFECTS[card.effect].label.toUpperCase(), x + w - 12, yy + h - 14);
  ctx.restore();
  return { x, y: yy, w, h };
}

function wrapText(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  ctx.textAlign = 'center';
  lines.forEach((ln, i) => ctx.fillText(ln, cx, y + i * lineH));
}

function drawLifeBar(ctx, x, y, w, label, life, maxLife, shield, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, x - 6, y - 26, w + 12, 58, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y);
  ctx.textAlign = 'right';
  ctx.fillText(`♥ ${life} / ${maxLife}` + (shield > 0 ? `   🛡 ${shield}` : ''), x + w, y);
  ctx.fillStyle = '#3a2a1a';
  roundRect(ctx, x, y + 8, w, 14, 7);
  ctx.fill();
  ctx.fillStyle = color;
  const frac = Math.max(0, life / maxLife);
  if (frac > 0) {
    roundRect(ctx, x, y + 8, w * frac, 14, 7);
    ctx.fill();
  }
  if (shield > 0) {
    ctx.fillStyle = '#7fb3ff';
    roundRect(ctx, x, y + 8, Math.min(w, w * (shield / maxLife)), 14, 7);
    ctx.fill();
  }
}

function drawEnergy(ctx, x, y, energy, max) {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ENERGY', x, y);
  for (let i = 0; i < max; i++) {
    ctx.beginPath();
    ctx.arc(x + 92 + i * 26, y - 6, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < energy ? '#ffd166' : 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawBackground(ctx, embers) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, '#1c2b1e');
  grad.addColorStop(0.5, '#274d33');
  grad.addColorStop(1, '#16241a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Felt table oval.
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath();
  ctx.ellipse(VIEW_W / 2, VIEW_H / 2, 560, 330, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,209,102,0.35)';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Drifting embers, fixed positions so screenshots are reproducible.
  for (const ember of embers) {
    ctx.fillStyle = ember.color;
    ctx.globalAlpha = ember.alpha;
    ctx.beginPath();
    ctx.arc(ember.x, ember.y, ember.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawLog(ctx, x, y, w, h, lines) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('BATTLE LOG', x + 14, y + 24);
  ctx.fillStyle = '#f5ead2';
  ctx.font = '15px Georgia, serif';
  const shown = lines.slice(-9);
  shown.forEach((line, i) => {
    ctx.fillText(line, x + 14, y + 50 + i * 22, w - 28);
  });
}

export function drawTitle(ctx, state) {
  drawBackground(ctx, state.embers);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 96px Georgia, serif';
  ctx.fillText('EMBER DUEL', VIEW_W / 2, 250);
  ctx.fillStyle = '#fff';
  ctx.font = 'italic 30px Georgia, serif';
  ctx.fillText('A turn-based card duel of flame, leaf, wave and star', VIEW_W / 2, 300);
  // Four suit shapes in a row under the title.
  const keys = ['flame', 'leaf', 'wave', 'star'];
  keys.forEach((key, i) => {
    const cx = VIEW_W / 2 - 135 + i * 90;
    drawSuitShape(ctx, key, cx, 360, 26);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText(SUITS[key].label, cx, 410);
  });
  ctx.fillStyle = '#f5ead2';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('30 life each · energy grows every turn · play cards, break the rival', VIEW_W / 2, 460);
  ctx.fillText('Strike deals damage · Guard builds shield · Draw refills your hand', VIEW_W / 2, 492);
  // Play button.
  ctx.fillStyle = '#e5484d';
  roundRect(ctx, VIEW_W / 2 - 150, 540, 300, 72, 14);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  roundRect(ctx, VIEW_W / 2 - 150, 540, 300, 72, 14);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px Georgia, serif';
  ctx.fillText('▶  CLICK TO PLAY', VIEW_W / 2, 586);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '17px Georgia, serif';
  ctx.fillText('Mouse or keys 1–5 to play a card · Enter to end turn · R to restart', VIEW_W / 2, 660);
  ctx.fillText('An original game — no copied cards, art or rules.', VIEW_W / 2, 690);
}

export function drawTable(ctx, state) {
  drawBackground(ctx, state.embers);
  // Top bar.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, VIEW_W, 56);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('EMBER DUEL', 24, 37);
  ctx.fillStyle = '#fff';
  ctx.font = '20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Turn ${state.turn}  ·  You vs ${state.rivalName}`, VIEW_W / 2, 37);
  ctx.textAlign = 'right';
  ctx.fillText(state.phase === 'rival' ? 'Rival thinking…' : 'Your turn — play a card', VIEW_W - 24, 37);

  // Rival side (top): portrait, life, hand of face-up cards.
  drawLifeBar(ctx, 60, 108, 420, `RIVAL — ${state.rivalName}`, state.rivalLife, 30, state.rivalShield, '#e5484d');
  const rivalCardW = 104;
  const rivalGap = 12;
  const rivalTotal = state.rivalHand.length * rivalCardW + (state.rivalHand.length - 1) * rivalGap;
  const rivalX0 = 60;
  state.rivalHand.forEach((card, i) => {
    drawCard(ctx, card, rivalX0 + i * (rivalCardW + rivalGap), 140, rivalCardW, 148, { dim: true });
  });
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Rival deck: ${state.rivalDeck.length} cards   ·   Rival energy: ${state.rivalEnergy} ⚡`, 60, 316);

  // Centre: last played card + battle log.
  drawLog(ctx, 940, 130, 300, 260, state.log);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('LAST PLAYED', 660, 150);
  if (state.lastPlayed) {
    drawCard(ctx, state.lastPlayed, 680, 165, 150, 210, {});
    ctx.fillStyle = '#ffd166';
    ctx.font = '17px Georgia, serif';
    ctx.fillText(state.lastPlayedBy === 'you' ? 'You played it.' : 'Rival played it.', 660, 400);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText('No card played yet —', 660, 200);
    ctx.fillText('your move, duelist.', 660, 226);
  }

  // Player side (bottom): life, energy, hand.
  drawLifeBar(ctx, 60, 520, 420, 'YOU', state.playerLife, 30, state.playerShield, '#46a758');
  drawEnergy(ctx, 540, 520, state.playerEnergy, MAX_ENERGY);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Your deck: ${state.playerDeck.length} cards`, 540, 552);
  const cardW = 150;
  const cardH = 210;
  const gap = 14;
  const total = state.playerHand.length * cardW + (state.playerHand.length - 1) * gap;
  const x0 = (VIEW_W - total) / 2;
  state.playerHand.forEach((card, i) => {
    const hover = state.hoverIndex === i;
    const affordable = card.cost <= state.playerEnergy && state.phase === 'you';
    const rect = drawCard(ctx, card, x0 + i * (cardW + gap), 560, cardW, cardH, {
      hover,
      dim: !affordable,
    });
    state.cardRects[i] = rect;
    if (!affordable && state.phase === 'you') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`needs ${card.cost} ⚡`, rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
  });
  // End Turn button.
  ctx.fillStyle = state.phase === 'you' ? '#3e8ef7' : '#555';
  roundRect(ctx, 1080, 700, 160, 56, 12);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  roundRect(ctx, 1080, 700, 160, 56, 12);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('END TURN ⏎', 1160, 736);
  state.endTurnRect = { x: 1080, y: 700, w: 160, h: 56 };

  if (state.message) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, VIEW_W / 2, 545);
  }
}

export function drawEnd(ctx, state, won) {
  drawBackground(ctx, state.embers);
  ctx.textAlign = 'center';
  if (won) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 110px Georgia, serif';
    ctx.fillText('VICTORY!', VIEW_W / 2, 280);
    ctx.fillStyle = '#fff';
    ctx.font = 'italic 30px Georgia, serif';
    ctx.fillText('The rival’s embers fade. The table is yours.', VIEW_W / 2, 330);
  } else {
    ctx.fillStyle = '#e5484d';
    ctx.font = 'bold 110px Georgia, serif';
    ctx.fillText('DEFEAT', VIEW_W / 2, 280);
    ctx.fillStyle = '#fff';
    ctx.font = 'italic 30px Georgia, serif';
    ctx.fillText('Your embers fade — the rival takes the table.', VIEW_W / 2, 330);
  }
  ctx.fillStyle = '#f5ead2';
  ctx.font = '26px Georgia, serif';
  ctx.fillText(
    `Final life — You ${Math.max(0, state.playerLife)}  ·  ${state.rivalName} ${Math.max(0, state.rivalLife)}`,
    VIEW_W / 2,
    400,
  );
  ctx.fillText(`The duel lasted ${state.turn} turn${state.turn === 1 ? '' : 's'}.`, VIEW_W / 2, 440);
  ctx.fillStyle = won ? '#46a758' : '#3e8ef7';
  roundRect(ctx, VIEW_W / 2 - 170, 500, 340, 72, 14);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  roundRect(ctx, VIEW_W / 2 - 170, 500, 340, 72, 14);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('↻  PLAY AGAIN', VIEW_W / 2, 546);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '17px Georgia, serif';
  ctx.fillText('Click Play Again or press R for a new duel.', VIEW_W / 2, 630);
  state.playAgainRect = { x: VIEW_W / 2 - 170, y: 500, w: 340, h: 72 };
}
