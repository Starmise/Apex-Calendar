// Avisos breves en pantalla ("Recordatorio borrado · Deshacer"). También los anuncia
// a lectores de pantalla mediante una región aria-live.

let region;

function ensureRegion() {
  if (region) return region;
  region = document.createElement('div');
  region.className = 'toasts';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  document.body.append(region);
  return region;
}

/**
 * @param {string} message
 * @param {{action?: {label: string, onClick: () => void}, timeout?: number, tone?: 'info'|'alert'}} [opts]
 */
export function showToast(message, { action, timeout = 6000, tone = 'info' } = {}) {
  const box = ensureRegion();
  // Solo un aviso a la vez: el nuevo reemplaza al anterior.
  box.replaceChildren();
  const toast = document.createElement('div');
  toast.className = `toast ${tone}`;
  const text = document.createElement('span');
  text.textContent = message;
  toast.append(text);

  const close = () => toast.remove();
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = action.label;
    b.addEventListener('click', () => {
      close();
      action.onClick();
    });
    toast.append(b);
  }
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'toast-close';
  x.setAttribute('aria-label', 'Cerrar aviso');
  x.textContent = '×';
  x.addEventListener('click', close);
  toast.append(x);

  box.append(toast);
  // No se cierra mientras el usuario está sobre él o tiene el foco dentro.
  let timer = setTimeout(close, timeout);
  const pause = () => clearTimeout(timer);
  const resume = () => {
    clearTimeout(timer);
    timer = setTimeout(close, timeout);
  };
  toast.addEventListener('mouseenter', pause);
  toast.addEventListener('focusin', pause);
  toast.addEventListener('mouseleave', resume);
  toast.addEventListener('focusout', resume);
  return close;
}
