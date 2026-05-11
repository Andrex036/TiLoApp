export const reportSummary = {
  totalCases: 38,
  closedCases: 14,
  followUpCases: 24,
  activeAlerts: 7,
  previousPeriodComparison: {
    totalCases: 12,
    closedCases: 8,
    followUpCases: 18,
    activeAlerts: 5
  }
};

export const casesByReason = [
  { name: 'Desempeño académico', value: 12, percentage: '31.6%', color: '#3B82F6' },
  { name: 'Convivencia escolar', value: 8, percentage: '21.1%', color: '#F59E0B' },
  { name: 'Dificultades emocionales', value: 7, percentage: '18.4%', color: '#10B981' },
  { name: 'Problemas familiares', value: 4, percentage: '10.5%', color: '#8B5CF6' },
  { name: 'Sospecha de maltrato', value: 3, percentage: '7.9%', color: '#EF4444' },
  { name: 'Sospecha de SPA', value: 2, percentage: '5.3%', color: '#EC4899' },
  { name: 'Otros', value: 2, percentage: '5.3%', color: '#64748B' }
];

export const casesByGrade = [
  { grade: '6°', cases: 5, percentage: '13.2%' },
  { grade: '7°', cases: 6, percentage: '15.8%' },
  { grade: '8°', cases: 9, percentage: '23.7%' },
  { grade: '9°', cases: 8, percentage: '21.1%' },
  { grade: '10°', cases: 6, percentage: '15.8%' },
  { grade: '11°', cases: 4, percentage: '10.5%' }
];

export const casesByGender = [
  { name: 'Femenino', value: 20, percentage: '52.6%', color: '#3B82F6' },
  { name: 'Masculino', value: 16, percentage: '42.1%', color: '#EC4899' },
  { name: 'Otro / No binario', value: 2, percentage: '5.3%', color: '#64748B' }
];

export const routeActivations = {
  icbf: { count: 6, percentage: '15.8%' },
  salud: { count: 5, percentage: '13.2%' },
  ambas: { count: 3, percentage: '7.9%' }
};

export const activitiesAndFollowUps = {
  realizadas: 18,
  pendientes: 5,
  estudiante: 12,
  familia: 9,
  docente: 7,
  citaciones: 3
};

export const alertsPeriodSummary = {
  activas: 7,
  atendidas: 5,
  prioritarias: 2,
  vencidas: 1
};

export const sedeConsolidatedReport = [
  { sede: 'Santa Mónica JM', total: 10, activos: 6, cerrados: 4, seguimiento: 5, alertas: 2, icbf: 1, salud: 2, acts: 5, segPendientes: 3 },
  { sede: 'Santa Mónica JT', total: 8, activos: 5, cerrados: 3, seguimiento: 4, alertas: 1, icbf: 1, salud: 1, acts: 4, segPendientes: 2 },
  { sede: 'Villa Flor JM', total: 6, activos: 4, cerrados: 2, seguimiento: 4, alertas: 1, icbf: 2, salud: 1, acts: 3, segPendientes: 1 },
  { sede: 'Villa Flor JT', total: 5, activos: 3, cerrados: 2, seguimiento: 3, alertas: 1, icbf: 1, salud: 0, acts: 2, segPendientes: 1 },
  { sede: 'Canchala', total: 4, activos: 2, cerrados: 2, seguimiento: 4, alertas: 0, icbf: 1, salud: 0, acts: 2, segPendientes: 0 },
  { sede: 'Puerres', total: 3, activos: 2, cerrados: 1, seguimiento: 2, alertas: 1, icbf: 0, salud: 1, acts: 1, segPendientes: 1 },
  { sede: 'El Carmen', total: 2, activos: 2, cerrados: 0, seguimiento: 2, alertas: 1, icbf: 0, salud: 0, acts: 1, segPendientes: 1 },
];
