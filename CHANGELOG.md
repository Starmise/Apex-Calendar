# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado semántico.

## [0.2.0] - 2026-10-07

### Agregado
- Vista semana (domingo a sábado) con horario, horas, paga y festivos de cada día, y resumen de la semana.
- Vista día con horario, horas, explicación de la paga, festivo y posición en el rol (semana A/B).
- URLs por fecha: `#/semana/AAAA-MM-DD` y `#/dia/AAAA-MM-DD`; las fechas inválidas regresan al mes actual.
- Pestañas Mes / Semana / Día que conservan la fecha que se está viendo.
- Cada día del mes y de la semana abre su vista día.
- Teclado: flechas para moverse entre días (cambia de mes o semana al llegar al borde), Re Pág / Av Pág para cambiar de periodo, Inicio / Fin.

### Cambiado
- La vista mes ahora es una tabla con encabezados de columna, más clara para lectores de pantalla.

 - 2026-10-07

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
