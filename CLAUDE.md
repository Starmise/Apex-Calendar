# Contexto para Claude — Apex Calendar

Lee esto al iniciar cualquier sesión de trabajo en este repositorio. Mantenlo al día cuando cambie una decisión, la estructura o el estado del roadmap.

## Qué es

Sitio web estático (GitHub Pages, costo cero) donde los empleados consultan su calendario de trabajo. Todos los usuarios comparten el mismo rol. Lo personal (colores, recordatorios, excepciones) se guarda solo en el navegador de cada usuario (localStorage). No hay servidor ni base de datos.

- Repo: https://github.com/Starmise/Apex-Calendar (público)
- Sitio: https://starmise.github.io/Apex-Calendar/
- Plan completo: doc "Apex Calendar — Plan de estructura" en el proyecto de claude.ai "Apex Calendar".
- Idioma de la interfaz, código comentado y commits: español.

## Reglas de negocio (confirmadas por el dueño)

- **Ciclo de 14 días** anclado al domingo 2026-08-02 (índice 0). Datos en `src/data/default-schedule.json`.
  - Semana A: Dom descanso, Lun descanso, Mar–Vie 08:00–20:00, Sáb descanso (48 h).
  - Semana B: Dom 08:00–21:00, Lun 08:00–21:00, Mar–Vie descanso, Sáb 08:00–21:00 (39 h).
  - Verificado contra los 61 días reales de ago–sep 2026 (`tests/schedule.test.js`, objeto `REFERENCE`). Si una prueba de referencia falla, el error está en el código, no en la referencia.
- **Festivos** = días de descanso obligatorio de México (LFT art. 74) + jornadas electorales ordinarias federales y de **Querétaro**. NO son días libres: se trabaja si el ciclo lo marca.
  - Por regla anual: 1 ene, 1er lunes feb, 3er lunes mar, 1 may, 16 sep, 3er lunes nov, 25 dic; 1 oct cada 6 años desde 2024.
  - Manuales en `MANUAL_HOLIDAYS` (`src/data/holidays-mx.js`): elecciones. Próxima: 2027-06-06. Agregar las siguientes cuando se publiquen.
- **Paga** de un día trabajado: festivo x3 (aunque sea domingo, no se acumula) > domingo x2 > normal x1. Descanso = 0, pero el festivo/domingo se sigue marcando.
- "8–21" significa 08:00 a 21:00.

## Arquitectura

```
src/core/dates.js        fechas 'YYYY-MM-DD', aritmética en UTC (nunca usar fechas locales para el ciclo)
src/core/schedule.js     getDayInfo(iso) → { type, start, end, hours, holiday, isSunday, pay, cycleIndex }
src/core/search.js       findNext, nextRest, nextWork, nextFreeWeekend, nextHoliday, streak (límite 2 años)
src/core/colors.js       contraste WCAG, readableText(bg) para colores propios
src/core/settings.js     normalizeSettings: valida apex.settings (theme, palette, colors)
src/core/reminders.js    { id, date, time|null, text, repeat, notify }; occursOn, upcoming, respaldo (buildBackup/parseBackup)
src/store/storage.js     createStore(): apex.* en localStorage, migraciones (DATA_VERSION), memoria si falla
src/app/theme.js         buildThemeCSS/applyTheme: inyecta la paleta como <style id="apex-theme">
src/app/toast.js         avisos con aria-live (uno a la vez, con acción opcional)
src/app/pwa.js           registro del SW (solo en build), "versión nueva · Actualizar", instalar, online/offline
src/app/notifier.js      revisa cada 20 s dueReminders(); notificación del sistema + aviso en la app
src/pwa/sw.js            plantilla del SW; el plugin pwaPrecache de vite.config.js inserta la lista de archivos y la versión de caché
public/                  manifest.webmanifest, íconos 192/512/maskable, apple-touch-icon
src/data/                default-schedule.json, holidays-mx.js, palettes.js (cada paleta = juego completo de colores, incluidos fondo y texto; tests/colors.test.js verifica contraste AA y que sean distintas)
src/app/router.js        rutas por hash (puro, probado): parseRoute, routeHash, shiftRoute
src/app/swipe.js         deslizar con el dedo en mes/semana/día: swipeDirection/lockAxis/dragOffset (puros, probados) + attachSwipe (Pointer Events, solo touch)
src/views/               DOM puro, sin framework: common, month, week, day, search, settings, reminders, data
src/main.js              arranque, render por ruta, teclado: #/mes/AAAA-MM, #/semana/AAAA-MM-DD, #/dia/AAAA-MM-DD
src/styles/themes.css    neutros + valores por defecto; modo: sin atributo = sistema, html[data-theme=light|dark] = forzado
tests/                   Vitest
.github/workflows/deploy.yml  test + build en push/PR; publica en Pages solo desde main
```

Principios: `core/` no toca DOM ni localStorage. Sin framework. Vite 8 + Vitest 5, Node 22. `base: '/Apex-Calendar/'` en `vite.config.js` (necesario para Pages). La versión mostrada en el pie sale de `package.json`.

## Comandos

`npm install` · `npm run dev` · `npm test` · `npm run build`

## Flujo de trabajo

> **Regla del dueño — nunca hacer push sin permiso.** Claude puede hacer commits locales, pero antes de cualquier `git push` (ramas, tags o `--force`) y antes de abrir, actualizar o hacer merge de un pull request debe detenerse y pedir aprobación explícita en el chat. Al pedirla, mostrar: rama de destino, lista de commits (`git log --oneline origin/<rama>..HEAD`) y resumen de archivos cambiados. Solo un "sí" claro del dueño para ese push cuenta; una aprobación anterior no sirve para el siguiente.

- `main` = producción; cada push publica. Cambios grandes en ramas `feature/*` o `fix/*` + pull request.
- Al cerrar una versión: subir `version` en `package.json`, entrada en `CHANGELOG.md`, tag `vX.Y.Z`, actualizar el roadmap de abajo.
- Correr `npm test` antes de cada commit.

## Roadmap

- [x] **v0.1.0** — motor del ciclo y festivos con pruebas, vista mes con paga x2/x3, despliegue automático.
- [x] **v0.2.0** — vistas semana y día, URLs por fecha (`#/semana/…`, `#/dia/…`), navegación con teclado.
- [x] **v0.3.0** — buscador por fecha (`#/buscar/…`): trabajo/descanso, festivo, paga, próximo descanso, próximo fin de semana libre. Nota: el rol actual nunca tiene sábado y domingo libres seguidos; el buscador lo dice y ofrece el siguiente sábado y domingo libres por separado.
- [x] **v0.4.0** — personalización (`#/ajustes`): modo claro/oscuro/auto, 5 paletas (`src/data/palettes.js`), colores propios con texto calculado, contraste probado.
- [x] **v0.5.0** — recordatorios (`#/recordatorios`, `apex.reminders`) con repetición semana/14 días/mes/año; exportar/importar/borrar en Ajustes → Tus datos.
- [x] **v1.0.0** — PWA instalable y offline (SW propio en `src/pwa/sw.js`), avisos de recordatorios con la app abierta, accesibilidad revisada con axe-core (WCAG 2.2 AA, 0 incidencias).
- [x] **v1.1.0** — paletas rediseñadas y distintas entre sí (Pizarrón por defecto, Vino y menta, Cítrico, Lavanda, Alto contraste); README para usuarios sin experiencia técnica.
- [x] **v1.2.0** — deslizar con el dedo para cambiar de mes, semana o día (izquierda = siguiente); respeta scroll vertical, zoom y "reducir movimiento"; no mueve el foco.
- [ ] Después — excepciones por fecha (vacaciones, permisos) en `apex.overrides`; editor de ciclo.

Claves de localStorage: `apex.version` (DATA_VERSION de `src/store/storage.js`), `apex.settings`, `apex.reminders`; prevista `apex.overrides`. Al cambiar la forma de algo guardado: subir DATA_VERSION y agregar la migración en `MIGRATIONS`.

Accesibilidad: cada cambio de UI debe pasar axe-core sin incidencias (las pruebas manuales se hicieron con Playwright + axe en todas las vistas, paletas, modos claro/oscuro, 1100 px y 390 px). Los días del mes y la semana llevan su nombre accesible en un `span.visually-hidden` y lo visual va con `aria-hidden` (no usar `aria-label`, rompe "label in name"). Toda paleta nueva debe pasar `tests/colors.test.js`.

## Notas para sesiones de Claude

- Estética: el dueño rechazó la paleta original (fondo crema + naranja/verde pastel) por verse "hecha con IA". Evitar fondos crema, pasteles genéricos y acentos por defecto; cada paleta debe tener identidad propia.

- Avisos de recordatorios: solo con la app abierta (no hay servidor push). No prometer avisos con todo cerrado.
- El rol actual nunca tiene sábado y domingo libres seguidos; `nextFreeWeekend` devuelve null y la UI lo explica.

- GitHub ya está vinculado en claude.ai (app de Claude instalada en Apex-Calendar): Claude puede subir ramas y abrir PR (con `gh api` REST; GraphQL no está disponible). Subir tags desde la sesión da 403: los tags `vX.Y.Z` los crea el dueño después del merge.
- `node_modules/` no se sube; en Windows correr `npm install` antes de `npm run dev`.
