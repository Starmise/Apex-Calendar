// Paletas de color. Cada una es un juego completo (fondo, texto, líneas y colores del rol)
// para modo claro y oscuro, así que se ven distintas entre sí y no solo cambian dos tonos.
// tests/colors.test.js comprueba que todo el texto cumpla contraste WCAG AA (4.5:1).

export const PALETTES = [
  {
    // Verde pizarrón para trabajar, blanco para descansar, ámbar para el domingo. Fondo gris frío.
    id: 'pizarron',
    name: 'Pizarrón',
    light: {
      bg: '#e6eaee', surface: '#ffffff', text: '#17202a', muted: '#4f5b66', line: '#c3ccd4',
      'work-bg': '#2e4a3e', 'work-fg': '#ffffff',
      'rest-bg': '#f7f9fa', 'rest-fg': '#33404c',
      'x2-bg': '#f2b134', 'x2-fg': '#2b1d00',
      'x3-bg': '#cf3540', 'x3-fg': '#ffffff',
      accent: '#2e4a3e', 'accent-fg': '#ffffff', focus: '#c06f00', danger: '#b4232a',
    },
    dark: {
      bg: '#10161c', surface: '#18212a', text: '#e6edf3', muted: '#9aa7b3', line: '#2c3946',
      'work-bg': '#7fb59b', 'work-fg': '#0a1c14',
      'rest-bg': '#1d2731', 'rest-fg': '#b8c4cf',
      'x2-bg': '#f2b134', 'x2-fg': '#2b1d00',
      'x3-bg': '#ff6b70', 'x3-fg': '#2a0405',
      accent: '#9fd0b6', 'accent-fg': '#0a1c14', focus: '#f2b134', danger: '#ff8a8e',
    },
  },
  {
    // Vino para trabajar y menta para descansar.
    id: 'vino',
    name: 'Vino y menta',
    light: {
      bg: '#eef5f1', surface: '#ffffff', text: '#1b2621', muted: '#4c5c54', line: '#c6d8ce',
      'work-bg': '#7a1f3d', 'work-fg': '#ffffff',
      'rest-bg': '#cfeedd', 'rest-fg': '#1d4d36',
      'x2-bg': '#ffd166', 'x2-fg': '#3a2a00',
      'x3-bg': '#ffffff', 'x3-fg': '#7a1f3d',
      accent: '#7a1f3d', 'accent-fg': '#ffffff', focus: '#1f8a5b', danger: '#a3123a',
    },
    dark: {
      bg: '#111816', surface: '#18211d', text: '#e7efe9', muted: '#9fb0a7', line: '#2b3a33',
      'work-bg': '#e88aa6', 'work-fg': '#2a0a15',
      'rest-bg': '#1f3a2d', 'rest-fg': '#a9e0c3',
      'x2-bg': '#ffd166', 'x2-fg': '#3a2a00',
      'x3-bg': '#ffffff', 'x3-fg': '#7a1f3d',
      accent: '#e88aa6', 'accent-fg': '#2a0a15', focus: '#6fd3a2', danger: '#ff8fa8',
    },
  },
  {
    // Amarillo limón para trabajar sobre gris neutro; acento verde azulado.
    id: 'citrico',
    name: 'Cítrico',
    light: {
      bg: '#efefef', surface: '#ffffff', text: '#1e1e1e', muted: '#575757', line: '#cfcfcf',
      'work-bg': '#ffd23f', 'work-fg': '#3a2e00',
      'rest-bg': '#ffffff', 'rest-fg': '#4a4a4a',
      'x2-bg': '#00777a', 'x2-fg': '#ffffff',
      'x3-bg': '#d7263d', 'x3-fg': '#ffffff',
      accent: '#00777a', 'accent-fg': '#ffffff', focus: '#d7263d', danger: '#b51d31',
    },
    dark: {
      bg: '#1d1f20', surface: '#26292a', text: '#f0f0ee', muted: '#a9adaf', line: '#3a3e40',
      'work-bg': '#ffd23f', 'work-fg': '#3a2e00',
      'rest-bg': '#2c3032', 'rest-fg': '#cfd2d3',
      'x2-bg': '#00777a', 'x2-fg': '#ffffff',
      'x3-bg': '#d7263d', 'x3-fg': '#ffffff',
      accent: '#3fc1c4', 'accent-fg': '#002a2b', focus: '#ffd23f', danger: '#ff6b7c',
    },
  },
  {
    // Morado intenso para trabajar, lila claro para descansar; rosa y coral para la paga extra.
    id: 'lavanda',
    name: 'Lavanda',
    light: {
      bg: '#f3f0fa', surface: '#ffffff', text: '#221a33', muted: '#5a5070', line: '#d6cfe8',
      'work-bg': '#5b3fa8', 'work-fg': '#ffffff',
      'rest-bg': '#ebe5f7', 'rest-fg': '#43386a',
      'x2-bg': '#ffb3c7', 'x2-fg': '#4a0d22',
      'x3-bg': '#ff7a59', 'x3-fg': '#2b0b00',
      accent: '#5b3fa8', 'accent-fg': '#ffffff', focus: '#d63c78', danger: '#b3243f',
    },
    dark: {
      bg: '#15121e', surface: '#1e1a2a', text: '#ece8f6', muted: '#a69fbd', line: '#332d47',
      'work-bg': '#b9a3ff', 'work-fg': '#1d1240',
      'rest-bg': '#262036', 'rest-fg': '#c9bfe6',
      'x2-bg': '#ffb3c7', 'x2-fg': '#4a0d22',
      'x3-bg': '#ff9a80', 'x3-fg': '#2b0b00',
      accent: '#b9a3ff', 'accent-fg': '#1d1240', focus: '#ff8fb8', danger: '#ff8fa3',
    },
  },
  {
    // Máximo contraste para leer con poca vista o con mucho sol.
    id: 'contraste',
    name: 'Alto contraste',
    light: {
      bg: '#ffffff', surface: '#ffffff', text: '#000000', muted: '#3a3a3a', line: '#6b6b6b',
      'work-bg': '#0b3d91', 'work-fg': '#ffffff',
      'rest-bg': '#ffffff', 'rest-fg': '#000000',
      'x2-bg': '#ffd400', 'x2-fg': '#000000',
      'x3-bg': '#ffffff', 'x3-fg': '#a50000',
      accent: '#0b3d91', 'accent-fg': '#ffffff', focus: '#c40000', danger: '#a50000',
    },
    dark: {
      bg: '#000000', surface: '#000000', text: '#ffffff', muted: '#d0d0d0', line: '#9a9a9a',
      'work-bg': '#ffd400', 'work-fg': '#000000',
      'rest-bg': '#000000', 'rest-fg': '#ffffff',
      'x2-bg': '#000000', 'x2-fg': '#ffffff',
      'x3-bg': '#000000', 'x3-fg': '#ff8a8a',
      accent: '#ffd400', 'accent-fg': '#000000', focus: '#00e5ff', danger: '#ff8a8a',
    },
  },
];

export const DEFAULT_PALETTE = 'pizarron';

export function getPalette(id) {
  return PALETTES.find((p) => p.id === id) ?? PALETTES.find((p) => p.id === DEFAULT_PALETTE);
}

/** Colores que el usuario puede cambiar a mano (solo el fondo; el texto se calcula). */
export const CUSTOM_COLORS = [
  { key: 'work', label: 'Trabajo', bg: 'work-bg', fg: 'work-fg' },
  { key: 'rest', label: 'Descanso', bg: 'rest-bg', fg: 'rest-fg' },
  { key: 'x2', label: 'Domingo x2', bg: 'x2-bg', fg: 'x2-fg' },
  { key: 'x3', label: 'Festivo x3', bg: 'x3-bg', fg: 'x3-fg' },
  { key: 'accent', label: 'Acento (botones y hoy)', bg: 'accent', fg: 'accent-fg' },
];
