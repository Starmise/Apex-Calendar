# Apex Calendar

Calendario de trabajo en la web: muestra qué días se trabaja y cuáles se descansa según un rol fijo de 14 días, con domingos trabajados a paga x2 y festivos oficiales trabajados a paga x3.

- Vistas de **mes, semana y día**, cada una con su propia dirección (`#/mes/2026-10`, `#/semana/2026-10-04`, `#/dia/2026-10-07`).
- **Buscador**: ¿se trabaja tal día? Con horario, paga, próximo descanso, próximo festivo y fin de semana libre.
- **Recordatorios** con repetición (semana, 14 días, mes, año) y aviso a la hora indicada mientras la app está abierta.
- **Personalización**: modo claro/oscuro/automático, 5 paletas y colores propios.
- **Instalable y sin conexión** (PWA), usable solo con teclado y con lector de pantalla.

Todo lo personal se guarda **solo en el navegador** de cada persona (no hay servidor ni cuentas). Desde Ajustes → Tus datos se puede exportar un respaldo `.json` e importarlo en otro dispositivo.

**Sitio:** https://starmise.github.io/Apex-Calendar/

## Cómo funciona el rol

El ciclo se repite cada dos semanas a partir del domingo 2 de agosto de 2026:

| Semana | Dom | Lun | Mar | Mié | Jue | Vie | Sáb |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | Descanso | Descanso | 8–20 | 8–20 | 8–20 | 8–20 | Descanso |
| B | 8–21 | 8–21 | Descanso | Descanso | Descanso | Descanso | 8–21 |

- **Festivo trabajado:** paga x3 (también si cae en domingo).
- **Domingo trabajado:** paga x2.
- **Festivo o domingo en descanso:** se marca, sin paga.

Festivos: Ley Federal del Trabajo art. 74 + jornadas electorales federales y de Querétaro.

## Desarrollo

Requiere Node.js 22 o más reciente.

```bash
npm install      # una vez
npm run dev      # servidor local con recarga
npm test         # pruebas del motor del ciclo y festivos
npm run build    # genera dist/
```

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

## Publicación

Cada push a `main` corre las pruebas y publica el sitio con GitHub Actions (`.github/workflows/deploy.yml`).

Configuración única en GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Después de publicar, quien ya tenga la app abierta verá "Hay una versión nueva · Actualizar".

## Versiones

Versionado semántico. Los cambios de cada versión están en [CHANGELOG.md](CHANGELOG.md).
