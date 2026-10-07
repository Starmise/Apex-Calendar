# Apex Calendar — notas para desarrollo

Este archivo es para quien mantiene el proyecto. La guía para usuarios está en [README.md](README.md).

## Requisitos

Node.js 22 o más reciente.

```bash
npm install      # una vez
npm run dev      # servidor local con recarga
npm test         # pruebas (ciclo, festivos, rutas, búsquedas, recordatorios, colores, almacenamiento)
npm run build    # genera dist/
```

## El rol

El ciclo de 14 días empieza el domingo 2 de agosto de 2026 y está en `src/data/default-schedule.json`:

| Semana | Dom | Lun | Mar | Mié | Jue | Vie | Sáb |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | Descanso | Descanso | 8–20 | 8–20 | 8–20 | 8–20 | Descanso |
| B | 8–21 | 8–21 | Descanso | Descanso | Descanso | Descanso | 8–21 |

- Festivo trabajado: paga x3 (también si cae en domingo; no se suma al x2).
- Domingo trabajado: paga x2.
- Festivo o domingo en descanso: se marca, sin paga.

Festivos: Ley Federal del Trabajo art. 74 (se calculan solos cada año) + jornadas electorales federales y de Querétaro, que se agregan a mano en `MANUAL_HOLIDAYS` (`src/data/holidays-mx.js`) cuando se publican.

## Estructura

```
src/core/     lógica pura y probada (ciclo, festivos, búsquedas, recordatorios, colores, ajustes)
src/data/     rol de 14 días, festivos, paletas
src/store/    localStorage con prefijo apex. y migraciones
src/app/      router, tema, avisos, PWA, notificaciones
src/views/    pantallas (DOM puro, sin framework)
src/pwa/sw.js plantilla del service worker (vite.config.js la completa al compilar)
public/       manifiesto e íconos
```

Más detalle (decisiones, claves de localStorage, accesibilidad) en [CLAUDE.md](CLAUDE.md).

## Publicación

Cada push a `main` corre las pruebas y publica el sitio con GitHub Actions (`.github/workflows/deploy.yml`).

Configuración única en GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Después de publicar, quien ya tenga la app abierta verá "Hay una versión nueva · Actualizar".

## Versiones

Versionado semántico. Los cambios de cada versión están en [CHANGELOG.md](CHANGELOG.md).
