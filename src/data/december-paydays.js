// Diciembre no sigue la regla del 15 y el 30: la empresa adelanta los pagos y además
// paga el aguinaldo. Las fechas salen del calendario de pagos que publica la empresa
// cada año ("Calendar Support Services"), así que se agregan a mano aquí.
//
// Son las fechas de la empresa (cuenta en otro banco). Con BBVA el depósito llega
// un día antes, como el resto del año (lo calcula src/core/paydays.js).
// Si un año no está en la tabla, diciembre se muestra "pendiente de confirmar".

/** año → { aguinaldo, quincenas: [la del 15, la del 30] } en formato 'YYYY-MM-DD'. */
export const DECEMBER_PAYDAYS = {
  2026: { aguinaldo: '2026-12-04', quincenas: ['2026-12-11', '2026-12-18'] },
};
