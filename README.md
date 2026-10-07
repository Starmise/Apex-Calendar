# Apex Calendar

Calendario de trabajo en la web: muestra qué días se trabaja y cuáles se descansa según un rol fijo de 14 días, con domingos trabajados a paga x2 y festivos oficiales trabajados a paga x3.

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

## Publicación

Cada push a `main` corre las pruebas y publica el sitio con GitHub Actions (`.github/workflows/deploy.yml`).

Configuración única en GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Versiones

Versionado semántico. Los cambios de cada versión están en [CHANGELOG.md](CHANGELOG.md).
