// Recordatorios: formulario, lista de próximos y panel de un día.

import { formatLong, formatShort, isValidISO } from '../core/dates.js';
import {
  MAX_TEXT, REPEATS, nextOccurrence, remindersOn, repeatLabel, upcoming,
} from '../core/reminders.js';
import { relativeDays } from '../core/search.js';
import { el } from './common.js';
import { capitalize } from './day.js';

let formCount = 0;

function field(labelText, control, hint) {
  const wrap = el('div', 'field');
  const label = el('label', null, labelText);
  label.htmlFor = control.id;
  wrap.append(label, control);
  if (hint) {
    const h = el('span', 'field-hint', hint);
    h.id = `${control.id}-hint`;
    control.setAttribute('aria-describedby', h.id);
    wrap.append(h);
  }
  return wrap;
}

/**
 * Formulario de recordatorio (nuevo o edición).
 * @param {{initial?: object, date: string, compact?: boolean, showNotify?: boolean, idPrefix?: string,
 *          onSubmit: (data: object) => void, onCancel?: () => void}} opts
 */
export function reminderForm({ initial = null, date, compact = false, showNotify = false, onSubmit, onCancel, idPrefix }) {
  // Ids estables: al volver a dibujar la vista el foco regresa al mismo control.
  const n = idPrefix ?? `rem${++formCount}`;
  const form = el('form', `reminder-form${compact ? ' compact' : ''}`);
  form.noValidate = true;

  const text = el('input');
  text.id = `${n}-text`;
  text.name = 'text';
  text.required = true;
  text.maxLength = MAX_TEXT;
  text.autocomplete = 'off';
  text.placeholder = 'Ej. Hoy nos traen comida a la oficina';
  text.value = initial?.text ?? '';

  const dateInput = el('input');
  dateInput.type = 'date';
  dateInput.id = `${n}-date`;
  dateInput.name = 'date';
  dateInput.required = true;
  dateInput.value = initial?.date ?? date;

  const time = el('input');
  time.type = 'time';
  time.id = `${n}-time`;
  time.name = 'time';
  time.value = initial?.time ?? '';

  const repeat = el('select');
  repeat.id = `${n}-repeat`;
  repeat.name = 'repeat';
  for (const [id, label] of REPEATS) {
    const o = el('option', null, label);
    o.value = id;
    o.selected = (initial?.repeat ?? 'none') === id;
    repeat.append(o);
  }

  const error = el('p', 'form-error');
  error.id = `${n}-error`;
  error.setAttribute('role', 'alert');
  error.hidden = true;

  form.append(field('Recordatorio', text));
  const row = el('div', 'field-row');
  if (!compact) row.append(field('Fecha', dateInput));
  row.append(field('Hora (opcional)', time));
  if (!compact) row.append(field('Repetir', repeat));
  form.append(row);

  let notify = null;
  if (showNotify) {
    notify = el('input');
    notify.type = 'checkbox';
    notify.id = `${n}-notify`;
    notify.name = 'notify';
    notify.checked = initial?.notify ?? false;
    const label = el('label', 'choice');
    label.append(notify, el('span', null, 'Avisarme a esa hora (con Apex Calendar abierto)'));
    form.append(label);
  }

  form.append(error);

  const actions = el('div', 'form-actions');
  const save = el('button', 'primary', initial ? 'Guardar cambios' : compact ? 'Agregar' : 'Agregar recordatorio');
  save.type = 'submit';
  save.id = `${n}-submit`;
  actions.append(save);
  if (onCancel) {
    const cancel = el('button', null, 'Cancelar');
    cancel.type = 'button';
    cancel.addEventListener('click', onCancel);
    actions.append(cancel);
  }
  form.append(actions);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const problems = [];
    if (!text.value.trim()) problems.push([text, 'Escribe qué quieres recordar.']);
    if (!compact && !isValidISO(dateInput.value)) problems.push([dateInput, 'Elige una fecha válida.']);
    if (notify?.checked && !time.value) problems.push([time, 'Para avisarte, el recordatorio necesita una hora.']);
    for (const c of [text, dateInput, time]) c.removeAttribute('aria-invalid');
    if (problems.length) {
      error.textContent = problems.map(([, msg]) => msg).join(' ');
      error.hidden = false;
      for (const [c] of problems) {
        c.setAttribute('aria-invalid', 'true');
        c.setAttribute('aria-errormessage', error.id);
      }
      problems[0][0].focus();
      return;
    }
    error.hidden = true;
    onSubmit({
      id: initial?.id,
      text: text.value,
      date: compact ? date : dateInput.value,
      time: time.value || null,
      repeat: compact ? 'none' : repeat.value,
      notify: notify ? notify.checked : initial?.notify ?? false,
    });
  });
  return form;
}

/** Elemento de lista de un recordatorio con botones Editar / Borrar. */
function reminderItem(r, { onEdit, onDelete, showDate = null }) {
  const li = el('li', 'reminder-item');
  const main = el('div', 'reminder-main');
  const when = [];
  if (showDate) when.push(capitalize(formatLong(showDate, { withYear: false })));
  when.push(r.time ?? 'Todo el día');
  main.append(el('span', 'reminder-when', when.join(' · ')));
  main.append(el('span', 'reminder-text', r.text));
  const meta = [];
  if (r.repeat !== 'none') meta.push(repeatLabel(r.repeat));
  if (r.notify) meta.push('Con aviso');
  if (meta.length) main.append(el('span', 'reminder-meta', meta.join(' · ')));
  li.append(main);

  const actions = el('div', 'reminder-actions');
  if (onEdit) {
    const edit = el('button', 'small', 'Editar');
    edit.type = 'button';
    edit.setAttribute('aria-label', `Editar: ${r.text}`);
    edit.addEventListener('click', () => onEdit(r.id));
    actions.append(edit);
  }
  const del = el('button', 'small danger', 'Borrar');
  del.type = 'button';
  del.setAttribute('aria-label', `Borrar: ${r.text}`);
  del.addEventListener('click', () => onDelete(r.id));
  actions.append(del);
  li.append(actions);
  return li;
}

/** Panel de recordatorios de un día (vista día). */
export function dayRemindersPanel(iso, { reminders, onSave, onDelete, onEdit, showNotify }) {
  const panel = el('section', 'panel');
  panel.setAttribute('aria-labelledby', 'day-reminders-title');
  const h = el('h3', null, 'Recordatorios');
  h.id = 'day-reminders-title';
  panel.append(h);

  const list = remindersOn(reminders, iso);
  if (list.length) {
    const ul = el('ul', 'reminder-list');
    for (const r of list) ul.append(reminderItem(r, { onEdit, onDelete }));
    panel.append(ul);
  } else {
    panel.append(el('p', 'empty-note', 'Nada para este día.'));
  }

  panel.append(reminderForm({ date: iso, compact: true, showNotify, onSubmit: onSave, idPrefix: 'day-rem' }));
  return panel;
}

/**
 * Pantalla #/recordatorios.
 * @param {HTMLElement} root
 * @param {{date: string|null, today: string, reminders: object[], editId?: string|null, showNotify?: boolean,
 *          onSave: (data: object) => void, onDelete: (id: string) => void, onEdit: (id: string|null) => void}} opts
 */
export function renderReminders(root, { date, today, reminders, editId = null, showNotify = false, onSave, onDelete, onEdit }) {
  root.replaceChildren();
  const title = el('h2', 'view-title', 'Recordatorios');
  title.id = 'view-title';
  title.tabIndex = -1;
  root.append(title);
  root.append(el('p', 'settings-intro', 'Se guardan solo en este navegador. Usa Ajustes → Tus datos para respaldarlos o pasarlos a otro dispositivo.'));

  const editing = editId ? reminders.find((r) => r.id === editId) ?? null : null;
  const formPanel = el('section', 'panel');
  const fh = el('h3', null, editing ? 'Editar recordatorio' : 'Nuevo recordatorio');
  fh.id = 'reminder-form-title';
  fh.tabIndex = -1;
  formPanel.append(fh);
  formPanel.append(
    reminderForm({
      initial: editing,
      idPrefix: editing ? 'edit-rem' : 'new-rem',
      date: date ?? today,
      showNotify,
      onSubmit: onSave,
      onCancel: editing ? () => onEdit(null) : null,
    }),
  );
  root.append(formPanel);

  // Próximos 60 días
  const next = upcoming(reminders, today, 60);
  const up = el('section', 'panel');
  up.append(el('h3', null, 'Próximos 60 días'));
  if (next.length) {
    const ul = el('ul', 'reminder-list');
    for (const { date: iso, reminder } of next.slice(0, 50)) {
      const li = reminderItem(reminder, { onEdit, onDelete, showDate: iso });
      const link = el('a', 'reminder-day', relativeDays(today, iso));
      link.href = `#/dia/${iso}`;
      link.append(el('span', 'visually-hidden', ` — ver el día ${formatShort(iso)}`));
      li.querySelector('.reminder-main').append(link);
      ul.append(li);
    }
    up.append(ul);
    if (next.length > 50) up.append(el('p', 'empty-note', `Y ${next.length - 50} más.`));
  } else {
    up.append(el('p', 'empty-note', 'No tienes recordatorios en los próximos 60 días.'));
  }
  root.append(up);

  // Todos
  const all = el('section', 'panel');
  all.append(el('h3', null, `Todos (${reminders.length})`));
  if (reminders.length) {
    const sorted = [...reminders].sort((a, b) => {
      const na = nextOccurrence(a, today) ?? `~${a.date}`;
      const nb = nextOccurrence(b, today) ?? `~${b.date}`;
      return na < nb ? -1 : na > nb ? 1 : 0;
    });
    const ul = el('ul', 'reminder-list');
    for (const r of sorted) {
      const nextDate = nextOccurrence(r, today);
      const li = reminderItem(r, { onEdit, onDelete, showDate: nextDate ?? r.date });
      if (!nextDate) li.classList.add('past');
      ul.append(li);
    }
    all.append(ul);
  } else {
    all.append(el('p', 'empty-note', 'Aún no tienes recordatorios.'));
  }
  root.append(all);
}
