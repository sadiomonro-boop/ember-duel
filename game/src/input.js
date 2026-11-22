// Ember Duel — mouse and keyboard input.
// One clear job: turn pointer and key events into game actions.
// The game logic never reads the DOM directly; input only calls callbacks.

function inside(rect, x, y) {
  return rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function attachInput(canvas, handlers) {
  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 800,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const pos = toGameCoords(event);
    handlers.onHover(pos.x, pos.y);
  });

  canvas.addEventListener('click', (event) => {
    const pos = toGameCoords(event);
    handlers.onClick(pos.x, pos.y);
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '7') {
      handlers.onPlayCard(Number(key) - 1);
    } else if (key === 'enter' || key === ' ') {
      event.preventDefault();
      handlers.onEndTurn();
    } else if (key === 'r') {
      handlers.onRestart();
    } else if (key === 'escape') {
      handlers.onTitle();
    }
  });
}

export function hitTestCard(cardRects, x, y) {
  for (let i = cardRects.length - 1; i >= 0; i--) {
    if (inside(cardRects[i], x, y)) return i;
  }
  return -1;
}

export function hitTestRect(rect, x, y) {
  return inside(rect, x, y);
}
