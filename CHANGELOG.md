# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versionado semántico.

## [1.0.0] - 2026-10-07

### Agregado
- App instalable (PWA): manifiesto, íconos (incluido maskable para Android y ícono para iPhone) y accesos directos a Hoy, Buscar y Recordatorios.
- Funciona sin conexión: un service worker propio (sin dependencias) guarda la app al primer uso; la página se pide primero a la red y, sin conexión, se usa la copia guardada.
- Aviso "Hay una versión nueva · Actualizar" cuando se publica un cambio; avisos de conexión perdida y recuperada.
- Avisos de recordatorios a la hora indicada (opción "Avisarme" en cada recordatorio), con notificación del sistema si se da permiso y aviso dentro de la app siempre. Solo funcionan con la app abierta; si la computadora estuvo suspendida, solo se avisa lo de los últimos 15 minutos.
- Ajustes → Aplicación (instalar, estado sin conexión, instrucciones para iPhone), Avisos (permiso y aviso de prueba) y Atajos de teclado.
- Accesibilidad: enlace "Saltar al contenido", foco al título al cambiar de vista, navegación completa con teclado, nombres accesibles completos en cada día, errores de formulario anunciados, respeto a "reducir movimiento". Revisado con axe-core (WCAG 2.2 AA) en todas las vistas, paletas y modos, en escritorio y celular: sin incidencias.

### Cambiado
- En celular las pestañas se acomodan en una cuadrícula de 3 × 2.

 - 2026-10-07

### Agregado
- Recordatorios (`#/recordatorios`) con texto, fecha, hora opcional y repetición: una vez, cada semana, cada 14 días (como el rol), cada mes o cada año.
- Lista de los próximos 60 días y de todos los recordatorios, con editar y borrar (con "Deshacer").
- Panel de recordatorios en la vista día para agregar rápido; marcas en el mes y lista en la semana.
- Ajustes → Tus datos: exportar un respaldo `.json`, importarlo (combinar o reemplazar) y borrar todos los datos.
- Los recordatorios se guardan en `apex.reminders`; los datos importados o dañados se validan antes de usarse.
- Avisos en pantalla accesibles (región `aria-live`).
- Si cambias datos en otra pestaña, esta se actualiza sola.

 - 2026-10-07

### Agregado
- Pantalla de ajustes (`#/ajustes`).
- Modo claro, oscuro o automático (sigue al sistema), sin parpadeo al abrir.
- Cinco paletas: Clásico, Océano, Lavanda, Sobrio y Alto contraste, cada una con versión clara y oscura.
- Colores propios para trabajo, descanso, domingo x2, festivo x3 y acento; el color del texto se calcula solo para que siempre se lea.
- Los ajustes se guardan en `apex.settings` (solo en el navegador), con versión de datos y migraciones (`apex.version`).
- Si el navegador no deja guardar, la app sigue funcionando y lo avisa.
- Pruebas de contraste: todo el texto de todas las paletas cumple WCAG AA (4.5:1).

### Cambiado
- El día de hoy se marca con doble anillo para verse sobre cualquier color.

 - 2026-10-07

### Agregado
- Buscador por fecha (`#/buscar/AAAA-MM-DD`): dice si ese día se trabaja o se descansa, el horario, si es festivo y la paga, con atajos para hoy, mañana, en una semana y en un mes.
- Panel "Lo que sigue" en el buscador y en la vista día: próximo descanso o regreso al trabajo, bloque de días seguidos, próximo festivo y si se trabaja.
- Próximo fin de semana libre (sábado y domingo). Con el rol actual nunca coinciden, así que se indica y se muestran el siguiente sábado libre y el siguiente domingo libre.
- Motor de búsquedas (`src/core/search.js`) con límite de dos años y pruebas.

 - 2026-10-07

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
