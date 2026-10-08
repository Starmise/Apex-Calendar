// Deslizar con el dedo para cambiar de periodo (mes, semana o día).
//
// La parte pura (swipeDirection, lockAxis, dragOffset) decide qué gesto es un deslizamiento y se
// prueba en tests/swipe.test.js. attachSwipe() conecta esa lógica con los eventos del navegador.
//
// Reglas:
//   - Solo cuenta el dedo (pointerType 'touch'); el ratón no arrastra el calendario.
//   - El gesto debe ser claramente horizontal; si empieza vertical, se deja hacer scroll normal.
//   - Dedo hacia la izquierda → periodo siguiente; hacia la derecha → periodo anterior
//     (como pasar la página de un libro).
//   - Los botones ← Hoy → siguen funcionando: el gesto es un atajo, no la única forma (WCAG 2.5.1).

export const SWIPE = {
  /** Píxeles que el dedo debe moverse para fijar la dirección (horizontal o vertical). */
  lock: 10,
  /** Distancia mínima para cambiar de periodo con un arrastre lento. */
  distance: 60,
  /** Con un gesto rápido (≥ velocity px/ms) basta con esta distancia. */
  flickDistance: 30,
  velocity: 0.4,
  /** El movimiento vertical no puede pasar de esta fracción del horizontal. */
  slope: 0.6,
  /** Cuánto sigue el contenido al dedo (0–1) y tope del desplazamiento visible. */
  follow: 0.5,
  maxOffset: 120,
};

/**
 * Fija el eje del gesto cuando el dedo ya se movió lo suficiente.
 * @returns {'x'|'y'|null} null mientras no se pueda decidir
 */
export function lockAxis(dx, dy, opts = SWIPE) {
  if (Math.hypot(dx, dy) < opts.lock) return null;
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
}

/**
 * ¿El gesto terminado fue un deslizamiento?
 * @param {{dx: number, dy: number, dt: number}} g desplazamiento (px) y duración (ms)
 * @returns {-1|0|1} -1 periodo anterior, 1 periodo siguiente, 0 nada
 */
export function swipeDirection({ dx, dy, dt }, opts = SWIPE) {
  const ax = Math.abs(dx);
  if (ax === 0 || Math.abs(dy) > ax * opts.slope) return 0;
  const fast = dt > 0 && ax / dt >= opts.velocity;
  if (ax >= opts.distance || (fast && ax >= opts.flickDistance)) return dx < 0 ? 1 : -1;
  return 0;
}

/** Desplazamiento visual mientras se arrastra: sigue al dedo con resistencia y con tope. */
export function dragOffset(dx, opts = SWIPE) {
  const v = dx * opts.follow;
  return Math.max(-opts.maxOffset, Math.min(opts.maxOffset, v));
}

/** Elementos donde arrastrar debe hacer lo suyo (escribir, elegir, seleccionar). */
const IGNORE = 'input, textarea, select, [contenteditable], dialog, [data-no-swipe]';

/**
 * Activa el deslizamiento en `el`.
 * @param {HTMLElement} el
 * @param {{ enabled: () => boolean, onSwipe: (delta: -1|1) => void }} handlers
 * @returns {() => void} función para desactivarlo
 */
export function attachSwipe(el, { enabled, onSwipe }) {
  let start = null; // { id, x, y, t, axis }
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const setOffset = (px, animate) => {
    el.style.transition = animate && !reduceMotion.matches ? 'transform 180ms ease-out' : 'none';
    el.style.transform = px ? `translateX(${px}px)` : '';
  };

  const reset = (animate) => {
    start = null;
    setOffset(0, animate);
  };

  // Tras un deslizamiento, el navegador puede disparar un "click" en el día donde empezó el dedo.
  const swallowClick = () => {
    const block = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('click', block, { capture: true, once: true });
    setTimeout(() => el.removeEventListener('click', block, { capture: true }), 400);
  };

  const onDown = (e) => {
    if (e.pointerType !== 'touch') return;
    if (!e.isPrimary) {
      // Segundo dedo (pellizco para hacer zoom): no es un deslizamiento.
      reset(true);
      return;
    }
    if (!enabled() || e.target.closest?.(IGNORE)) return;
    start = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, axis: null };
  };

  const onMove = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start.axis ??= lockAxis(dx, dy);
    if (start.axis === 'y') {
      start = null; // es scroll vertical
      return;
    }
    if (start.axis === 'x' && !reduceMotion.matches) setOffset(dragOffset(dx), false);
  };

  const onUp = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const g = { dx: e.clientX - start.x, dy: e.clientY - start.y, dt: e.timeStamp - start.t };
    const delta = start.axis === 'x' ? swipeDirection(g) : 0;
    if (!delta) {
      reset(true);
      return;
    }
    start = null;
    setOffset(0, false);
    swallowClick();
    onSwipe(delta);
    // El contenido nuevo entra desde el lado hacia el que se deslizó.
    if (!reduceMotion.matches) {
      el.classList.remove('swipe-in-next', 'swipe-in-prev');
      void el.offsetWidth; // reinicia la animación si se desliza varias veces seguidas
      el.classList.add(delta > 0 ? 'swipe-in-next' : 'swipe-in-prev');
    }
  };

  const onCancel = (e) => {
    if (start && e.pointerId === start.id) reset(true);
  };
  const onAnimationEnd = () => el.classList.remove('swipe-in-next', 'swipe-in-prev');

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onCancel);
  el.addEventListener('animationend', onAnimationEnd);

  return () => {
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onCancel);
    el.removeEventListener('animationend', onAnimationEnd);
    reset(false);
  };
}
