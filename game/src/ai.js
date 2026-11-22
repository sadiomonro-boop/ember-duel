// Ember Duel — the rival AI.
// One clear job: decide which cards the rival plays, in plain readable logic.
// The player can read the rival: it takes lethal when it sees it, otherwise
// it guards when hurt, draws when its hand is thin, and spends the rest on
// its biggest attacks first.

export function chooseRivalPlays(state) {
  const hand = state.rivalHand;
  const energy = state.rivalEnergy;
  const plays = [];
  let left = energy;

  const affordable = hand
    .map((card, index) => ({ card, index }))
    .filter((entry) => entry.card.cost <= left);

  // 1. Lethal check: the cheapest set of strikes that ends the player.
  const strikes = affordable
    .filter((entry) => entry.card.effect === 'strike')
    .sort((a, b) => a.card.cost - b.card.cost);
  let damage = 0;
  const lethal = [];
  for (const entry of strikes) {
    if (damage >= state.playerLife) break;
    lethal.push(entry);
    damage += entry.card.attack;
  }
  if (damage >= state.playerLife && lethal.length > 0) {
    return lethal.map((entry) => entry.index);
  }

  // 2. Guard when low on life and a guard is affordable.
  if (state.rivalLife <= 10) {
    const guards = affordable
      .filter((entry) => entry.card.effect === 'guard')
      .sort((a, b) => b.card.attack - a.card.attack);
    if (guards.length > 0) {
      plays.push(guards[0].index);
      left -= guards[0].card.cost;
    }
  }

  // 3. Draw when the hand is thin, so the rival keeps options next turn.
  if (hand.length <= 3) {
    const draws = affordable
      .filter((entry) => entry.card.effect === 'draw' && !plays.includes(entry.index))
      .sort((a, b) => a.card.cost - b.card.cost);
    if (draws.length > 0) {
      plays.push(draws[0].index);
      left -= draws[0].card.cost;
    }
  }

  // 4. Spend what is left on the biggest attacks first.
  const rest = hand
    .map((card, index) => ({ card, index }))
    .filter((entry) => !plays.includes(entry.index) && entry.card.cost <= left)
    .sort((a, b) => b.card.attack - a.card.attack || a.card.cost - b.card.cost);
  for (const entry of rest) {
    if (entry.card.cost > left) continue;
    plays.push(entry.index);
    left -= entry.card.cost;
  }
  return plays;
}

// The rival's opening line and its end-of-turn taunt, for the action log.
export function rivalTaunt(rivalLife, playerLife) {
  if (rivalLife <= 8) return 'The rival is cornered — it guards and swings hard.';
  if (playerLife <= 8) return 'The rival smells victory and presses the attack.';
  return 'The rival studies your hand and plays its cards.';
}
