// Arranque de la app y router por hash: #/mes/2026-08
import './styles/themes.css';
import './styles/base.css';
import { renderMonth } from './views/month.js';
import { todayISO } from './core/dates.js';

const view = document.getElementById('view');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const todayBtn = document.getElementById('today');
document.getElementById('version').textContent = `v${__APP_VERSION__}`;

function currentMonth() {
  const t = todayISO();
  return { year: Number(t.slice(0, 4)), month: Number(t.slice(5, 7)) };
}

function parseHash() {
  const m = location.hash.match(/^#\/mes\/(\d{4})-(\d{2})$/);
  if (m) {
    const month = Number(m[2]);
    if (month >= 1 && month <= 12) return { year: Number(m[1]), month };
  }
  return currentMonth();
}

function go({ year, month }) {
  location.hash = `#/mes/${year}-${String(month).padStart(2, '0')}`;
}

function shift(delta) {
  const { year, month } = parseHash();
  const index = year * 12 + (month - 1) + delta;
  go({ year: Math.floor(index / 12), month: (index % 12) + 1 });
}

function render() {
  renderMonth(view, { ...parseHash(), today: todayISO() });
}

prevBtn.addEventListener('click', () => shift(-1));
nextBtn.addEventListener('click', () => shift(1));
todayBtn.addEventListener('click', () => go(currentMonth()));
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select')) return;
  if (e.key === 'ArrowLeft') shift(-1);
  if (e.key === 'ArrowRight') shift(1);
});
window.addEventListener('hashchange', render);

render();
