// Paletas de color. Cada una define los colores del rol para modo claro y oscuro.
// Los colores neutros (fondo, texto, líneas) viven en themes.css; una paleta puede
// sobrescribirlos si lo necesita (p. ej. alto contraste).
// tests/colors.test.js comprueba que todo el texto cumpla contraste WCAG AA (4.5:1).

export const PALETTES = [
  {
    id: 'clasico',
    name: 'Clásico',
    light: {
      'work-bg': '#fadfc0', 'work-fg': '#8a4a06',
      'rest-bg': '#e2efd3', 'rest-fg': '#3d6b1f',
      'x2-bg': '#8a4a06', 'x2-fg': '#ffffff',
      'x3-bg': '#b42318', 'x3-fg': '#ffffff',
      accent: '#1f5fd1', 'accent-fg': '#ffffff',
    },
    dark: {
      'work-bg': '#4a3317', 'work-fg': '#f6c58c',
      'rest-bg': '#26381c', 'rest-fg': '#a9d58a',
      'x2-bg': '#f6c58c', 'x2-fg': '#2a1a05',
      'x3-bg': '#ff8a7a', 'x3-fg': '#2b0905',
      accent: '#7aa7ff', 'accent-fg': '#0b1a33',
    },
  },
  {
    id: 'oceano',
    name: 'Océano',
    light: {
      'work-bg': '#cfe3fb', 'work-fg': '#0b4a8f',
      'rest-bg': '#e6eef2', 'rest-fg': '#38515f',
      'x2-bg': '#0b4a8f', 'x2-fg': '#ffffff',
      'x3-bg': '#b42318', 'x3-fg': '#ffffff',
      accent: '#0b62c4', 'accent-fg': '#ffffff',
    },
    dark: {
      'work-bg': '#12345a', 'work-fg': '#a9cdf7',
      'rest-bg': '#23292e', 'rest-fg': '#b4c2cc',
      'x2-bg': '#a9cdf7', 'x2-fg': '#0a1d33',
      'x3-bg': '#ff8a7a', 'x3-fg': '#2b0905',
      accent: '#6fb0ff', 'accent-fg': '#06203f',
    },
  },
  {
    id: 'lavanda',
    name: 'Lavanda',
    light: {
      'work-bg': '#e6dcfa', 'work-fg': '#4f2a96',
      'rest-bg': '#fdf1c7', 'rest-fg': '#634b07',
      'x2-bg': '#4f2a96', 'x2-fg': '#ffffff',
      'x3-bg': '#b42318', 'x3-fg': '#ffffff',
      accent: '#6a3fc2', 'accent-fg': '#ffffff',
    },
    dark: {
      'work-bg': '#33244f', 'work-fg': '#d3c2f5',
      'rest-bg': '#3a3215', 'rest-fg': '#f0d98a',
      'x2-bg': '#d3c2f5', 'x2-fg': '#1d1033',
      'x3-bg': '#ff8a7a', 'x3-fg': '#2b0905',
      accent: '#b39bf0', 'accent-fg': '#1d1033',
    },
  },
  {
    id: 'sobrio',
    name: 'Sobrio',
    light: {
      'work-bg': '#d9d9d2', 'work-fg': '#262624',
      'rest-bg': '#f6f6f2', 'rest-fg': '#55554f',
      'x2-bg': '#262624', 'x2-fg': '#ffffff',
      'x3-bg': '#8c1d18', 'x3-fg': '#ffffff',
      accent: '#3b3b37', 'accent-fg': '#ffffff',
    },
    dark: {
      'work-bg': '#3d3d39', 'work-fg': '#ecece6',
      'rest-bg': '#20201e', 'rest-fg': '#a9a9a2',
      'x2-bg': '#ecece6', 'x2-fg': '#1a1a18',
      'x3-bg': '#ff8a7a', 'x3-fg': '#2b0905',
      accent: '#d6d6cf', 'accent-fg': '#1a1a18',
    },
  },
  {
    id: 'contraste',
    name: 'Alto contraste',
    light: {
      bg: '#ffffff', surface: '#ffffff', text: '#000000', muted: '#3a3a3a', line: '#6b6b6b',
      'work-bg': '#0b3d91', 'work-fg': '#ffffff',
      'rest-bg': '#ffffff', 'rest-fg': '#000000',
      'x2-bg': '#ffd400', 'x2-fg': '#000000',
      'x3-bg': '#ffffff', 'x3-fg': '#a50000',
      accent: '#0b3d91', 'accent-fg': '#ffffff', focus: '#c40000',
    },
    dark: {
      bg: '#000000', surface: '#000000', text: '#ffffff', muted: '#d0d0d0', line: '#9a9a9a',
      'work-bg': '#ffd400', 'work-fg': '#000000',
      'rest-bg': '#000000', 'rest-fg': '#ffffff',
      'x2-bg': '#000000', 'x2-fg': '#ffffff',
      'x3-bg': '#000000', 'x3-fg': '#ff8a8a',
      accent: '#ffd400', 'accent-fg': '#000000', focus: '#00e5ff',
    },
  },
];

export const DEFAULT_PALETTE = 'clasico';

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
