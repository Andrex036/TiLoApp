import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowLeft,
  Bell,
  Search,
  Filter,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  RefreshCw
} from 'lucide-react';
import { useActivities } from '../hooks/useActivities';
import { getCurrentPeriod, getFormattedDate } from '../utils/periodUtils';


// --- Constants ---
const quickFilters = ['Todas', 'Hoy', 'Mañana', 'Esta semana', 'Vencidas', 'Prioritarias', 'Completadas'];

export default function ActividadesDashboard({ onNavigate, initialActivityId }) {
  const currentPeriod = getCurrentPeriod();
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarView, setCalendarView] = useState('Semana');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdActivity, setCreatedActivity] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [repeatWeeks, setRepeatWeeks] = useState(1);

  const { activities, createActivity, updateStatus, deleteActivity, deleteRecurrenceSeries, updateActivity } = useActivities();

  // Support deep linking from Alertas
  useEffect(() => {
    if (initialActivityId && activities.length > 0) {
      const target = activities.find(a => a.id === initialActivityId);
      if (target) {
        setEditingActivity(target);
        setIsModalOpen(true);
      }
    }
  }, [initialActivityId, activities]);

  const calendarRef = useRef(null);
  const alertsRef = useRef(null);
  const listRef = useRef(null);

  const filteredActivities = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return activities.filter(act => {
      const matchesSearch = !searchTerm || act.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || act.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'Todos' || act.tipo === typeFilter;

      if (!matchesSearch || !matchesType) return false;

      if (activeFilter === 'Todas') return true;
      if (activeFilter === 'Hoy') return act.fecha === today;
      if (activeFilter === 'Mañana') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return act.fecha === tomorrow.toISOString().split('T')[0];
      }
      if (activeFilter === 'Vencidas') return act.estado === 'Vencida';
      if (activeFilter === 'Prioritarias') return act.prioridad === 'Prioritaria';
      if (activeFilter === 'Completadas') return act.estado === 'Completada';
      if (activeFilter === 'Pendientes') return act.estado === 'Programada' || act.estado === 'En curso';
      return true;
    });
  }, [activities, activeFilter, searchTerm, typeFilter]);

  // --- Dynamic Stats Calculation ---
  const dynamicStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Simple week calculation for summary
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = new Date(monday);
    weekEnd.setDate(monday.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    return [
      { id: 1, title: 'Actividades hoy', count: activities.filter(a => a.fecha === today).length, desc: 'Programadas', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
      { id: 2, title: 'Pendientes', count: activities.filter(a => a.estado === 'Programada' || a.estado === 'En curso' || a.estado === 'Pendiente').length, desc: 'Sin completar', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
      { id: 3, title: 'Completadas', count: activities.filter(a => a.estado === 'Realizada' || a.estado === 'Completada').length, desc: 'Finalizadas', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
      { id: 4, title: 'Prioritarias', count: activities.filter(a => a.prioridad === 'Prioritaria' && a.estado !== 'Realizada' && a.estado !== 'Completada').length, desc: 'Atención urgente', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
      { id: 5, title: 'Esta semana', count: activities.filter(a => a.fecha >= weekStart && a.fecha <= weekEndStr).length, desc: 'Próximas', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
      { id: 6, title: 'Vencidas', count: activities.filter(a => a.estado === 'Vencida').length, desc: 'No realizadas', icon: AlertTriangle, color: 'text-slate-600', bg: 'bg-slate-100' },
    ];
  }, [activities]);

  const dynamicAlerts = useMemo(() => {
    const alerts = [];
    const today = new Date().toISOString().split('T')[0];
    const todayActs = activities.filter(a => a.fecha === today);
    const priority = activities.filter(a => a.prioridad === 'Prioritaria' && a.estado !== 'Realizada' && a.estado !== 'Completada');
    const overdue = activities.filter(a => a.estado === 'Vencida');

    if (todayActs.length > 0) {
      alerts.push({ id: 'a1', text: `Hoy tienes ${todayActs.length} actividades programadas.`, color: 'blue' });
    }
    if (priority.length > 0) {
      alerts.push({ id: 'a2', text: `Tienes ${priority.length} actividades prioritarias pendientes.`, color: 'red' });
    }
    if (overdue.length > 0) {
      alerts.push({ id: 'a3', text: `Tienes ${overdue.length} actividades vencidas sin completar.`, color: 'orange' });
    }
    
    if (alerts.length === 0) {
      alerts.push({ id: 'a4', text: 'No tienes alertas críticas pendientes.', color: 'slate' });
    }
    
    alerts.push({ id: 'a5', text: 'Recuerda registrar observaciones al finalizar cada actividad.', color: 'slate' });
    return alerts;
  }, [activities]);

  const weekDays = useMemo(() => {
    const days = [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const range = calendarView === 'Mes' ? 42 : 7;

    for (let i = 0; i < range; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      if (calendarView === 'Mes') {
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const dayOfFirst = firstOfMonth.getDay();
        const diff = dayOfFirst === 0 ? -6 : 1 - dayOfFirst;
        const startGrid = new Date(firstOfMonth);
        startGrid.setDate(firstOfMonth.getDate() + diff);

        const gridDate = new Date(startGrid);
        gridDate.setDate(startGrid.getDate() + i);

        days.push({
          full: gridDate.toISOString().split('T')[0],
          num: gridDate.getDate(),
          label: gridDate.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', ''),
          month: gridDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', ''),
          isCurrentMonth: gridDate.getMonth() === now.getMonth()
        });
      } else {
        days.push({
          full: d.toISOString().split('T')[0],
          num: d.getDate(),
          label: d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', ''),
          month: d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', ''),
          isCurrentMonth: true
        });
      }
    }
    return days;
  }, [calendarView]);

  const activitiesForSelectedDate = useMemo(() => {
    return activities
      .filter(act => act.fecha === selectedCalendarDate)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }, [activities, selectedCalendarDate]);

  const handleChangeStatus = (id, newStatus) => {
    updateStatus(id, newStatus);
    setOpenMenuId(null);
  };

  const handleDelete = (act) => {
    if (act.recurrenceId) {
      const choice = confirm('Esta actividad es parte de una serie recurrente.\n\nPresiona Aceptar para eliminar TODA LA SERIE.\nPresiona Cancelar para eliminar SOLO ESTA ACTIVIDAD.');
      if (choice) {
        deleteRecurrenceSeries(act.recurrenceId);
      } else {
        deleteActivity(act.id);
      }
    } else {
      if (confirm('¿Estás seguro de eliminar esta actividad?')) {
        deleteActivity(act.id);
      }
    }
    setOpenMenuId(null);
  };

  const handleOpenEdit = (act) => {
    setEditingActivity(act);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const activityCards = useMemo(() => {
    const statusColors = {
      'Programada': 'bg-blue-50 text-blue-700 border-blue-200',
      'En curso': 'bg-purple-50 text-purple-700 border-purple-200',
      'Realizada': 'bg-green-50 text-green-700 border-green-200',
      'Completada': 'bg-green-50 text-green-700 border-green-200',
      'Pendiente': 'bg-orange-50 text-orange-700 border-orange-200',
      'Vencida': 'bg-red-50 text-red-700 border-red-200',
      'Cancelada': 'bg-slate-50 text-slate-700 border-slate-200',
      'No asistió': 'bg-slate-50 text-slate-700 border-slate-200'
    };

    if (filteredActivities.length === 0) {
      return (
        <div className="bg-white py-12 rounded-2xl border border-dashed border-slate-200 text-center col-span-full">
          <Search size={32} className="text-slate-200 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-medium">No hay actividades que coincidan con el filtro</p>
        </div>
      );
    }

    return filteredActivities.map(act => (
      <div
        key={act.id}
        onClick={() => handleOpenEdit(act)}
        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative group hover:border-blue-300 hover:shadow-md transition-all animate-[fadeIn_0.3s_ease-out] cursor-pointer"
      >
        <div className="bg-slate-50/50 py-3 border-b border-slate-100 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-400 mb-1">{act.fecha.slice(8, 10)}/{act.fecha.slice(5, 7)}</span>
          <span className={`text-xl font-black text-${act.color}-600 leading-none tracking-tight`}>{act.horaInicio}</span>
          <span className="text-[9px] text-slate-400 mt-0.5">a {act.horaFin}</span>
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start gap-4 mb-2">
            <h3 className="font-extrabold text-slate-800 text-base leading-tight flex-1">{act.titulo}</h3>
            <span className={`text-[9px] font-bold px-3 py-1 rounded-full border shrink-0 ${statusColors[act.estado] || statusColors['Programada']}`}>
              {act.estado}
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-4 font-medium">{act.tipo} • Sede {act.sede}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            <div className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-100/50">
              <User size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold">{act.responsable}</span>
            </div>

            <div className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 border ${act.prioridad === 'Prioritaria' ? 'bg-red-50 border-red-100 text-red-600' :
                act.prioridad === 'Alta' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                  'bg-blue-50 border-blue-100 text-blue-600'
              }`}>
              <AlertTriangle size={12} />
              <span className="text-[10px] font-bold">Prioridad {act.prioridad}</span>
            </div>

            {act.estudianteRelacionado && (
              <div className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-100/50">
                <span className="text-[10px] font-bold">Estudiante: {act.estudianteRelacionado}</span>
              </div>
            )}

            {act.recurrenceId && (
              <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-purple-100/50">
                <RefreshCw size={12} />
                <span className="text-[10px] font-bold">Recurrente</span>
              </div>
            )}

            {act.casoRelacionado && (
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-blue-100/50">
                <span className="text-[10px] font-bold">Caso #{act.id.slice(-3)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-start relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === act.id ? null : act.id);
              }}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 rounded-xl transition-all shadow-sm"
            >
              <MoreVertical size={18} />
            </button>

            {openMenuId === act.id && (
              <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-10 animate-[fadeIn_0.2s_ease-out]">
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(act); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  Editar Actividad
                </button>

                <div className="h-px bg-slate-100 my-1 mx-2"></div>

                <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Cambiar Estado</div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleChangeStatus(act.id, 'Realizada'); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-green-600 hover:bg-green-50 flex items-center gap-2"
                >
                  Marcar como Realizada
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); handleChangeStatus(act.id, 'En curso'); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                >
                  En curso / Taller
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); handleChangeStatus(act.id, 'Pendiente'); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                >
                  Requiere Seguimiento
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); handleChangeStatus(act.id, 'Cancelada'); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 flex items-center gap-2"
                >
                  No asistió / Cancelada
                </button>

                <div className="h-px bg-slate-100 my-1 mx-2"></div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(act); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    ));
  }, [filteredActivities, openMenuId, handleChangeStatus]);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [isModalOpen]);

  const handleCreateActivity = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const recurrenceId = isRecurring ? `rec-${Date.now()}` : null;
    
    const baseActivity = {
      titulo: formData.get('titulo'),
      sede: formData.get('sede'),
      horaInicio: formData.get('horaInicio'),
      horaFin: formData.get('horaFin'),
      tipo: formData.get('tipo'),
      descripcion: formData.get('descripcion'),
      prioridad: formData.get('prioridad') || 'Media',
      responsable: 'Orientación Escolar',
      estudianteRelacionado: formData.get('estudiante'),
      color: formData.get('prioridad') === 'Prioritaria' ? 'red' :
        formData.get('prioridad') === 'Alta' ? 'orange' : 'blue',
      recurrenceId
    };

    if (editingActivity) {
      updateActivity(editingActivity.id, { ...baseActivity, fecha: formData.get('fecha') });
      setCreatedActivity({ ...baseActivity, fecha: formData.get('fecha'), id: editingActivity.id });
    } else if (isRecurring) {
      // Recurrence logic
      const startDate = new Date(formData.get('fecha'));
      const instances = [];
      
      // Week days mapping (0 = Sunday, 1 = Monday, etc.)
      const dayMap = { 'L': 1, 'M': 2, 'Mi': 3, 'J': 4, 'V': 5 };
      const selectedDayNums = selectedDays.map(d => dayMap[d]);

      for (let w = 0; w < repeatWeeks; w++) {
        selectedDayNums.forEach(dayNum => {
          const current = new Date(startDate);
          // Calculate target date for this week and day
          const diff = dayNum - startDate.getDay();
          current.setDate(startDate.getDate() + (w * 7) + diff);
          
          // Only if it's not in the past relative to the start date (optional check)
          if (current >= startDate || w > 0) {
            const dateStr = current.toISOString().split('T')[0];
            const saved = createActivity({ ...baseActivity, fecha: dateStr });
            instances.push(saved);
          }
        });
      }
      setCreatedActivity({ ...baseActivity, fecha: 'Múltiples fechas', count: instances.length });
    } else {
      const saved = createActivity({ ...baseActivity, fecha: formData.get('fecha') });
      setCreatedActivity(saved);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCreatedActivity(null);
    setEditingActivity(null);
    setIsRecurring(false);
    setSelectedDays([]);
    setRepeatWeeks(1);
  };

  return (
    <div className="w-full pb-8 bg-slate-50 min-h-screen" onClick={() => setOpenMenuId(null)}>
      <header className="bg-[#0F4DB8] text-white px-5 py-6 sm:rounded-t-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate && onNavigate('inicio')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors shrink-0"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                <Calendar size={28} className="text-white" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl md:text-2xl font-bold tracking-wide">Agenda de Actividades</h1>
              <p className="text-blue-200 text-xs md:text-sm">Programación y control de la jornada escolar</p>
            </div>
          </div>
          <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-1 mt-2 md:mt-0">
            <span className="text-sm font-medium">{getFormattedDate()}</span>
            <span className={`${currentPeriod.color} text-white text-xs px-3 py-1 rounded-full font-medium`}>{currentPeriod.name}</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-8 max-w-5xl mx-auto">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="col-span-1 sm:col-span-1 bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex items-start gap-4 hover:border-blue-300 hover:shadow-md transition-all group text-left"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Plus size={28} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Agendar Actividad</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Programa citas, talleres o seguimientos en tu agenda escolar.
              </p>
            </div>
          </button>

          <button 
            onClick={() => scrollTo(calendarRef)}
            className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex items-start gap-4 hover:border-purple-300 hover:shadow-md transition-all group text-left"
          >
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Calendar size={28} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Ver Calendario</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Consulta tu disponibilidad y organiza tu semana de forma visual.
              </p>
            </div>
          </button>

          <button 
            onClick={() => { setActiveFilter('Hoy'); scrollTo(listRef); }}
            className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm flex items-start gap-4 hover:border-orange-300 hover:shadow-md transition-all group text-left"
          >
            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Bell size={28} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Alertas del día</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Revisa las actividades prioritarias y compromisos para hoy.
              </p>
            </div>
          </button>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-800 mb-3">Resumen de actividades</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {dynamicStats.map(stat => (
              <button
                key={stat.id}
                onClick={() => {
                  if (stat.title === 'Actividades hoy') setActiveFilter('Hoy');
                  else if (stat.title === 'Pendientes') setActiveFilter('Pendientes');
                  else if (stat.title === 'Completadas') setActiveFilter('Completadas');
                  else if (stat.title === 'Prioritarias') setActiveFilter('Prioritarias');
                  else if (stat.title === 'Vencidas') setActiveFilter('Vencidas');
                  scrollTo(listRef);
                }}
                className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-blue-200 hover:shadow-md transition-all active:scale-95"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${stat.bg} ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <span className="text-2xl font-bold text-slate-800 leading-none">
                  {stat.count}
                </span>
                <h3 className="text-[11px] font-bold mt-1.5 text-slate-700 leading-tight">{stat.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{stat.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section ref={alertsRef}>
          <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Bell size={18} className="text-blue-500" /> Alertas de actividades
          </h2>
          <div className="flex flex-col gap-2.5">
            {dynamicAlerts.map(alert => {
              const colors = {
                blue: 'bg-blue-50 border-blue-100 text-blue-800 icon-blue-500',
                red: 'bg-red-50 border-red-100 text-red-800 icon-red-500',
                orange: 'bg-orange-50 border-orange-100 text-orange-800 icon-orange-500',
                purple: 'bg-purple-50 border-purple-100 text-purple-800 icon-purple-500',
                slate: 'bg-slate-50 border-slate-100 text-slate-800 icon-slate-500',
              };
              const colorClass = colors[alert.color] || colors.slate;
              const Icon = alert.color === 'red' || alert.color === 'orange' ? AlertTriangle : Bell;

              return (
                <div key={alert.id} className={`p-3 rounded-xl border flex justify-between items-center gap-3 ${colorClass.split(' ').slice(0, 3).join(' ')}`}>
                  <div className="flex items-start gap-3">
                    <Icon size={16} className={`shrink-0 mt-0.5 text-${alert.color}-500`} />
                    <p className="text-sm font-medium leading-tight">{alert.text}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (alert.text.includes('vencida')) setActiveFilter('Vencidas');
                      else if (alert.text.includes('Hoy') || alert.text.includes('hora')) setActiveFilter('Hoy');
                      else if (alert.text.includes('prioritaria')) setActiveFilter('Prioritarias');
                      scrollTo(listRef);
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 transition-colors"
                  >
                    Revisar
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section ref={calendarRef}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-slate-800">Agenda {calendarView.toLowerCase()}</h2>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex justify-center">
              <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                {['Día', 'Semana', 'Mes'].map((view) => (
                  <button key={view} onClick={() => setCalendarView(view)} className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${calendarView === view ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>{view}</button>
                ))}
              </div>
            </div>
            <div className="p-4 border-b border-slate-100">
              {calendarView === 'Mes' ? (
                <div className="grid grid-cols-7 gap-1">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                    <div key={i} className="text-[8px] font-black text-slate-300 text-center mb-1">{d}</div>
                  ))}
                  {weekDays.map((day) => {
                    const isSelected = day.full === selectedCalendarDate;
                    const isToday = day.full === new Date().toISOString().split('T')[0];
                    const hasActivities = activities.some(a => a.fecha === day.full);
                    return (
                      <button key={day.full} onClick={() => setSelectedCalendarDate(day.full)} className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all relative ${isSelected ? 'bg-blue-600 text-white shadow-md' : day.isCurrentMonth ? 'bg-white text-slate-700 hover:bg-slate-50' : 'bg-slate-50/30 text-slate-300'}`}>
                        <span className="text-[10px] font-bold">{day.num}</span>
                        {hasActivities && !isSelected && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-blue-600' : 'bg-slate-300'}`}></div>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex overflow-x-auto gap-2.5 pb-2 scrollbar-hide snap-x">
                  {weekDays.filter(d => calendarView !== 'Día' || d.full === new Date().toISOString().split('T')[0] || d.full === selectedCalendarDate).map((day) => {
                    const isSelected = day.full === selectedCalendarDate;
                    return (
                      <button key={day.full} onClick={() => setSelectedCalendarDate(day.full)} className={`flex flex-col items-center min-w-[48px] py-2.5 rounded-xl transition-all snap-center ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-500 border border-slate-100'}`}>
                        <span className={`text-[8px] font-bold mb-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{day.label}</span>
                        <span className="text-sm font-black leading-tight">{day.num}</span>
                        <span className={`text-[7px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-300'}`}>{day.month}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actividades {selectedCalendarDate === new Date().toISOString().split('T')[0] ? 'de hoy' : ''}</h3>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{selectedCalendarDate.split('-').reverse().join('/')}</span>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {activitiesForSelectedDate.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Calendar size={20} className="text-slate-300 mb-2" />
                    <p className="text-[10px] text-slate-400 font-medium px-4">No hay actividades para esta fecha</p>
                  </div>
                ) : (
                  activitiesForSelectedDate.map((act) => (
                    <div key={act.id} className="flex gap-3 group cursor-pointer" onClick={() => { setSearchTerm(act.titulo); scrollTo(listRef); }}>
                      <div className="flex flex-col items-center py-1">
                        <span className="text-[10px] font-black text-blue-600 leading-none">{act.horaInicio}</span>
                        <div className="w-px h-full bg-slate-100 my-1 group-last:bg-transparent"></div>
                      </div>
                      <div className="flex-1">
                        <div className={`p-3 rounded-xl border transition-all ${act.prioridad === 'Prioritaria' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100 group-hover:border-blue-100'}`}>
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{act.titulo}</h4>
                            {act.prioridad === 'Prioritaria' && <span className="text-[7px] bg-red-600 text-white px-1 py-0.5 rounded ml-1">!</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-slate-500">{act.tipo}</span>
                            <span className="text-[9px] text-slate-400">•</span>
                            <span className="text-[9px] text-slate-500">{act.sede}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section ref={listRef}>
          <h2 className="text-base font-bold text-slate-800 mb-3">Actividades programadas</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {quickFilters.map(filter => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${activeFilter === filter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{filter}</button>
            ))}
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar actividad..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Todos">Tipo de actividad</option>
                <option value="Cita con estudiante">Cita Estudiante</option>
                <option value="Reunión con padre">Reunión Padre</option>
                <option value="Seguimiento de caso">Seguimiento</option>
                <option value="Taller grupal">Taller</option>
              </select>
              <button onClick={() => { setSearchTerm(''); setTypeFilter('Todos'); setActiveFilter('Todas'); }} className="bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs px-3 py-2 font-bold flex items-center justify-center gap-2">Limpiar</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activityCards}
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[90vh]">
            {createdActivity ? (
              <div className="p-8 text-center animate-[fadeIn_0.3s_ease-out]">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5"><CheckCircle2 size={32} /></div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">¡Actividad Registrada!</h2>
                {createdActivity.count ? (
                   <p className="text-sm text-slate-500 mb-8 leading-relaxed">Se han programado <strong>{createdActivity.count}</strong> instancias de la actividad <strong>{createdActivity.titulo}</strong>.</p>
                ) : (
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed">La actividad <strong>{createdActivity.titulo}</strong> ha sido programada para el <strong>{createdActivity.fecha}</strong> a las <strong>{createdActivity.horaInicio}</strong>.</p>
                )}
                <div className="space-y-3"><button onClick={handleCloseModal} className="w-full py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-600/30">Entendido, ir al listado</button></div>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                  <h2 className="text-lg font-bold text-slate-800">{editingActivity ? 'Editar actividad' : 'Nueva actividad'}</h2>
                  <button onClick={handleCloseModal} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100"><X size={18} /></button>
                </div>
                <form onSubmit={handleCreateActivity} className="flex flex-col min-h-0">
                  <div className="p-5 overflow-y-auto space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Título de la actividad *</label>
                      <input
                        required
                        name="titulo"
                        type="text"
                        defaultValue={editingActivity?.titulo || ''}
                        placeholder="Ej. Reunión de seguimiento..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">{isRecurring ? 'Fecha Inicio' : 'Fecha'} *</label>
                        <input
                          required
                          name="fecha"
                          type="date"
                          defaultValue={editingActivity?.fecha || ''}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Prioridad *</label>
                        <select
                          required
                          name="prioridad"
                          defaultValue={editingActivity?.prioridad || 'Media'}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 appearance-none"
                        >
                          <option value="Media">Prioridad: Media</option>
                          <option value="Baja">Prioridad: Baja</option>
                          <option value="Alta">Prioridad: Alta</option>
                          <option value="Prioritaria">Prioridad: Prioritaria 🚨</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Hora Inicio *</label>
                        <input
                          required
                          name="horaInicio"
                          type="time"
                          defaultValue={editingActivity?.horaInicio || ''}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Hora Fin *</label>
                        <input
                          required
                          name="horaFin"
                          type="time"
                          defaultValue={editingActivity?.horaFin || ''}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Sede *</label>
                        <input
                          required
                          name="sede"
                          type="text"
                          defaultValue={editingActivity?.sede || ''}
                          placeholder="Ej. Principal, Sede A..."
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tipo *</label>
                        <select
                          required
                          name="tipo"
                          defaultValue={editingActivity?.tipo || 'Cita con estudiante'}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 appearance-none"
                        >
                          <option value="Cita con estudiante">Cita con estudiante</option>
                          <option value="Reunión acudiente">Reunión acudiente</option>
                          <option value="Cita con docente">Cita con docente</option>
                          <option value="Taller grupal">Taller grupal</option>
                          <option value="Comité convivencia">Comité convivencia</option>
                          <option value="Visita domiciliaria">Visita domiciliaria</option>
                          <option value="Otra">Otra actividad</option>
                        </select>
                      </div>
                    </div>

                    {!editingActivity && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isRecurring} 
                              onChange={(e) => setIsRecurring(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            ¿Es una actividad recurrente?
                          </label>
                          {isRecurring && <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider animate-pulse">Programación Semanal</span>}
                        </div>

                        {isRecurring && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Repetir durante (Semanas)</label>
                              <input 
                                type="number" 
                                min="1" 
                                max="12" 
                                value={repeatWeeks} 
                                onChange={(e) => setRepeatWeeks(parseInt(e.target.value))}
                                className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Días de la semana</label>
                              <div className="flex gap-2">
                                {['L', 'M', 'Mi', 'J', 'V'].map(day => (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                                    className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all ${selectedDays.includes(day) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                  >
                                    {day}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Estudiante (Si aplica)</label>
                      <input
                        name="estudiante"
                        type="text"
                        defaultValue={editingActivity?.estudianteRelacionado || ''}
                        placeholder="Nombre completo del estudiante"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                      <textarea
                        name="descripcion"
                        rows="3"
                        defaultValue={editingActivity?.descripcion || ''}
                        placeholder="Detalles de la actividad..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      ></textarea>
                    </div>
                  </div>
                  <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
                    <button type="button" onClick={handleCloseModal} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-600/30">
                      {editingActivity ? 'Guardar Cambios' : 'Agendar Actividad'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}} />
    </div>
  );
}
