// Utilidades de color: contraste WCAG y texto legible sobre un fondo elegido por el usuario.

/** '#abc' o '#aabbcc' → [r, g, b] (0–255), o null si no es un color válido. */
export function parseHex(hex) {
  const m = String(hex).trim().match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function isHex(hex) {
  return parseHex(hex) !== null;
}

export function toHex([r, g, b]) {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
}

/** Luminancia relativa (WCAG 2.x). */
export function luminance(hex) {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste entre dos colores: de 1 a 21. Texto normal necesita 4.5 (WCAG AA). */
export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Mezcla `a` hacia `b` (t = 0 → a, t = 1 → b). */
export function mix(a, b, t) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return toHex(ca.map((v, i) => v + (cb[i] - v) * t));
}

/**
 * Color de texto legible sobre `bg`, del mismo tono: oscurece (o aclara) el fondo hasta
 * llegar al contraste mínimo. Así un fondo naranja claro da texto café, no negro puro.
 * Va hacia negro o blanco, lo que dé más contraste; uno de los dos siempre supera 4.5.
 */
export function readableText(bg, min = 6) {
  const target = contrast('#000000', bg) >= contrast('#ffffff', bg) ? '#000000' : '#ffffff';
  for (let step = 11; step <= 20; step++) {
    const fg = mix(bg, target, step / 20); // de 55 % a 100 %
    if (contrast(fg, bg) >= min) return fg;
  }
  return target;
}
