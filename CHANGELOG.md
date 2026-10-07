# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado semántico.

## [0.1.0] - 2026-10-07

### Agregado
- Motor del ciclo de 14 días (`getDayInfo`) con ancla el 2 de agosto de 2026; funciona para cualquier fecha, pasada o futura.
- Festivos de México por regla anual (LFT art. 74), 1 de octubre sexenal y lista manual de jornadas electorales (6 de junio de 2027, federal y Querétaro).
- Paga por día: x1 normal, x2 domingo trabajado, x3 festivo trabajado (no se acumula).
- Vista mes con colores de trabajo/descanso, horario, etiquetas x2/x3, nombre del festivo y día de hoy marcado.
- Resumen del mes: días de trabajo, horas, domingos x2 y festivos x3.
- Navegación entre meses con botones, flechas del teclado y URL (`#/mes/AAAA-MM`).
- Modo oscuro automático y diseño para celular.
- Pruebas con los 61 días de referencia de agosto y septiembre de 2026.
- Despliegue automático a GitHub Pages.
