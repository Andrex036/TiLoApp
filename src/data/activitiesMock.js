/**
 * @typedef {"Programada" | "En curso" | "Completada" | "Reprogramada" | "Cancelada" | "Vencida"} ActivityStatus
 * @typedef {"Baja" | "Media" | "Alta" | "Prioritaria"} ActivityPriority
 */

export const allActivities = [
  {
    id: "act-001",
    titulo: "Reunión con padre de familia",
    tipo: "Reunión con padre de familia",
    fecha: "2026-04-29",
    horaInicio: "08:00",
    horaFin: "08:45",
    sede: "Santa Mónica jornada mañana",
    prioridad: "Alta",
    estado: "Completada",
    responsable: "Orientación escolar",
    descripcion: "Reunión para seguimiento del caso.",
    casoRelacionado: "Caso #101",
    estudianteRelacionado: "Juan Pérez",
    lugar: "Sala de orientación",
    recordatorio: "1 hora antes",
    repeticion: "No se repite",
    color: "green"
  },
  {
    id: "act-002",
    titulo: "Seguimiento caso #102",
    tipo: "Seguimiento de caso",
    fecha: "2026-04-29",
    horaInicio: "10:30",
    horaFin: "11:15",
    sede: "Villa Flor jornada mañana",
    prioridad: "Alta",
    estado: "En curso",
    responsable: "Orientación escolar",
    descripcion: "Evaluación de progreso escolar.",
    estudianteRelacionado: "María Gómez",
    lugar: "Sala de orientación",
    recordatorio: "10 minutos antes",
    color: "purple"
  },
  {
    id: "act-003",
    titulo: "Comité de convivencia escolar",
    tipo: "Comité de convivencia escolar",
    fecha: "2026-04-29",
    horaInicio: "12:00",
    horaFin: "13:30",
    sede: "Todas las sedes",
    prioridad: "Prioritaria",
    estado: "Programada",
    responsable: "Rectoría",
    descripcion: "Reunión ordinaria del comité.",
    lugar: "Sala de reuniones",
    color: "red"
  },
  {
    id: "act-004",
    titulo: "Cita con estudiante",
    tipo: "Cita con estudiante",
    fecha: "2026-04-30",
    horaInicio: "08:00",
    horaFin: "08:30",
    sede: "Santa Mónica jornada mañana",
    prioridad: "Media",
    estado: "Programada",
    responsable: "Orientación escolar",
    estudianteRelacionado: "Carlos Ruiz (Grado 5°)",
    lugar: "Sala de orientación",
    color: "blue"
  },
  {
    id: "act-005",
    titulo: "Reunión con docente",
    tipo: "Reunión con docente",
    fecha: "2026-04-30",
    horaInicio: "11:00",
    horaFin: "11:45",
    sede: "El Carmen",
    prioridad: "Media",
    estado: "Programada",
    responsable: "Orientación escolar",
    descripcion: "Estrategias de aula.",
    docenteRelacionado: "Docente tutor",
    color: "blue"
  },
  {
    id: "act-006",
    titulo: "Taller habilidades sociales",
    tipo: "Taller grupal",
    fecha: "2026-04-30",
    horaInicio: "14:00",
    horaFin: "15:30",
    sede: "Santa Mónica jornada tarde",
    prioridad: "Alta",
    estado: "Programada",
    responsable: "Orientación escolar",
    estudianteRelacionado: "Grupo 4°A",
    lugar: "Salón de audiovisuales",
    color: "orange"
  },
  {
    id: "act-007",
    titulo: "Visita sede Canchala",
    tipo: "Visita a sede",
    fecha: "2026-05-01",
    horaInicio: "09:00",
    horaFin: "11:00",
    sede: "Canchala",
    prioridad: "Media",
    estado: "Programada",
    responsable: "Orientación escolar",
    descripcion: "Acompañamiento semanal.",
    color: "blue"
  },
  {
    id: "act-008",
    titulo: "Escuela de familia",
    tipo: "Escuela de familia",
    fecha: "2026-05-02",
    horaInicio: "08:00",
    horaFin: "10:00",
    sede: "Santa Mónica jornada mañana",
    prioridad: "Alta",
    estado: "Programada",
    responsable: "Orientación escolar",
    lugar: "Coliseo",
    color: "orange"
  },
  {
    id: "act-009",
    titulo: "Revisión informe convivencia",
    tipo: "Gestión administrativa",
    fecha: "2026-04-28",
    horaInicio: "14:00",
    horaFin: "15:00",
    sede: "Todas las sedes",
    prioridad: "Prioritaria",
    estado: "Vencida",
    responsable: "Orientación escolar",
    descripcion: "Entregar informe a rectoría.",
    color: "gray"
  },
  {
    id: "act-010",
    titulo: "Activación ruta de salud",
    tipo: "Activación de ruta",
    fecha: "2026-05-03",
    horaInicio: "10:00",
    horaFin: "11:00",
    sede: "Puerres",
    prioridad: "Prioritaria",
    estado: "Programada",
    responsable: "Orientación escolar",
    descripcion: "Acompañamiento a EPS.",
    casoRelacionado: "Caso #105",
    color: "red"
  }
];

// Datos derivados para Dashboard principal
export const todayActivities = [
  { id: 1, time: '08:00', title: 'Reunión con padre de familia', detail: 'Caso #101 – Juan Pérez' },
  { id: 2, time: '10:30', title: 'Seguimiento caso #102', detail: 'Estudiante grado 3°' },
  { id: 3, time: '12:00', title: 'Comité de convivencia escolar', detail: 'Sala de reuniones' },
];

export const tomorrowActivities = [
  { id: 1, time: '08:00', title: 'Cita con estudiante', detail: 'Caso #105 – Grado 5°' },
  { id: 2, time: '11:00', title: 'Reunión con docente', detail: 'Caso #98 – Docente tutor' },
  { id: 3, time: '02:00', title: 'Taller habilidades sociales', detail: 'Grupo 4°A' },
];

export const calendarEvents = [
  { id: 1, day: 'MAR 28', time: '08:00', title: 'Reunión Padre de familia', bg: 'bg-green-100', text: 'text-green-800' },
  { id: 2, day: 'MIÉ 29', time: '08:00', title: 'Cita con estudiante', bg: 'bg-blue-100', text: 'text-blue-800' },
  { id: 3, day: 'MIÉ 29', time: '10:30', title: 'Seguimiento caso #102', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { id: 4, day: 'MIÉ 29', time: '12:00', title: 'Comité de convivencia', bg: 'bg-red-100', text: 'text-red-800' },
  { id: 5, day: 'JUE 30', time: '11:00', title: 'Reunión con docente', bg: 'bg-purple-100', text: 'text-purple-800' },
  { id: 6, day: 'JUE 30', time: '14:00', title: 'Taller habilidades sociales', bg: 'bg-green-100', text: 'text-green-800' },
];
