/**
 * periodUtils.js
 * Utilidades para gestionar los periodos académicos de TiLoApp
 * Configuración personalizada según requerimiento del usuario
 */

export const ACADEMIC_PERIODS = [
  { id: 1, name: '1er Periodo', start: '02-02', end: '04-26', color: 'bg-blue-400/30' },
  { id: 2, name: '2do Periodo', start: '04-27', end: '08-16', color: 'bg-green-400/30' },
  { id: 3, name: '3er Periodo', start: '08-17', end: '11-30', color: 'bg-orange-400/30' },
  { id: 0, name: 'Receso Académico', start: '12-01', end: '02-01', color: 'bg-slate-400/30' }
];

/**
 * Retorna el periodo académico actual basado en la fecha del sistema
 */
export const getCurrentPeriod = () => {
  const now = new Date();
  const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Caso especial para el receso que cruza el fin de año
  const current = ACADEMIC_PERIODS.find(p => {
    if (p.id === 0) { 
      return monthDay >= '12-01' || monthDay <= '02-01';
    }
    return monthDay >= p.start && monthDay <= p.end;
  });

  return current || ACADEMIC_PERIODS[0];
};

/**
 * Retorna el periodo académico para una fecha específica
 * @param {string|Date} dateParam - Fecha a evaluar
 */
export const getPeriodByDate = (dateParam) => {
  const date = new Date(dateParam);
  if (isNaN(date.getTime())) return ACADEMIC_PERIODS[0]; // Fallback if invalid date

  const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const current = ACADEMIC_PERIODS.find(p => {
    if (p.id === 0) { 
      return monthDay >= '12-01' || monthDay <= '02-01';
    }
    return monthDay >= p.start && monthDay <= p.end;
  });

  return current || ACADEMIC_PERIODS[0];
};

/**
 * Retorna las fechas de inicio y fin del periodo académico actual en formato YYYY-MM-DD
 */
export const getCurrentPeriodDates = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentPeriod = getCurrentPeriod();

  let startYear = currentYear;
  let endYear = currentYear;

  if (currentPeriod.id === 0) {
    const month = now.getMonth() + 1; // 1-indexed
    if (month <= 2) {
      // Si estamos en enero o febrero, el receso comenzó en diciembre del año anterior
      startYear = currentYear - 1;
    } else {
      // Si estamos en diciembre, el receso termina en febrero del año siguiente
      endYear = currentYear + 1;
    }
  }

  return {
    startDate: `${startYear}-${currentPeriod.start}`,
    endDate: `${endYear}-${currentPeriod.end}`
  };
};

/**
 * Formatea la fecha actual para el encabezado
 */
export const getFormattedDate = () => {
  return new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

