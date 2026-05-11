import {
  Users,
  Plus,
  Clock,
  Check,
  School,
  AlertTriangle,
  Search,
  ChevronDown,
  Calendar,
  BarChart2,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react';
import TiLoLogo from '../assets/TiLo_Logo.png';
import { useCases } from '../hooks/useCases';
import { getCurrentPeriod, getFormattedDate } from '../utils/periodUtils';
import { useActivities } from '../hooks/useActivities';
import { useAlerts } from '../hooks/useAlerts';

export default function HomeDashboard() {
  const { cases } = useCases();
  const { activities } = useActivities();
  const { alerts } = useAlerts();
  const currentPeriod = getCurrentPeriod();

  // Dynamic calculations for Cases
  const casosActivos = cases.filter(c => c.estado === 'Activo' || c.estado === 'En seguimiento').length;
  const casosNuevos = cases.filter(c => c.tipoCaso === 'Nuevo').length;
  const casosAntiguos = cases.filter(c => c.tipoCaso === 'Antiguo').length;
  const casosCerrados = cases.filter(c => c.estado === 'Cerrado').length;
  const casosAltoRiesgo = cases.filter(c => c.nivelRiesgo === 'Alto' || c.nivelRiesgo === 'Prioritario').length;

  // Calculate sedes with active cases
  const sedesConCasos = new Set(cases.filter(c => c.estado !== 'Cerrado').map(c => c.sede)).size;

  // Generate Sede Cards with all sedes initialized
  const sedesMap = {
    'Santa Mónica (JM)': 0,
    'Santa Mónica (JT)': 0,
    'Villa Flor (JM)': 0,
    'Villa Flor (JT)': 0,
    'Canchala': 0,
    'Puerres': 0,
    'El Carmen': 0
  };

  cases.forEach(c => {
    if (c.estado !== 'Cerrado') {
      let sedeName = c.sede;

      // Normalize previous or mock data formats to the standardized ones
      if (sedeName.includes('Santa Mónica') && (sedeName.includes('mañana') || sedeName.includes('JM'))) sedeName = 'Santa Mónica (JM)';
      else if (sedeName.includes('Santa Mónica') && (sedeName.includes('tarde') || sedeName.includes('JT'))) sedeName = 'Santa Mónica (JT)';
      else if (sedeName.includes('Villa Flor') && (sedeName.includes('mañana') || sedeName.includes('JM'))) sedeName = 'Villa Flor (JM)';
      else if (sedeName.includes('Villa Flor') && (sedeName.includes('tarde') || sedeName.includes('JT'))) sedeName = 'Villa Flor (JT)';
      // Fallback normalizations in case they just say "Santa Mónica" without jornada
      else if (sedeName === 'Santa Mónica') sedeName = 'Santa Mónica (JM)'; // Default to JM if missing
      else if (sedeName === 'Villa Flor') sedeName = 'Villa Flor (JM)'; // Default to JM if missing

      if (sedesMap[sedeName] !== undefined) {
        sedesMap[sedeName]++;
      } else {
        sedesMap[sedeName] = (sedesMap[sedeName] || 0) + 1;
      }
    }
  });

  const sedeCards = Object.entries(sedesMap).map(([name, count], index) => ({
    id: index + 1,
    name,
    count,
    color: ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-rose-600', 'text-teal-600', 'text-indigo-600'][index % 7]
  })).sort((a, b) => b.count - a.count);

  const summaryCards = [
    { id: 1, icon: Users, count: casosActivos, title: 'Casos activos', subtitle: 'Todas las sedes', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 2, icon: Plus, count: casosNuevos, title: 'Casos nuevos', subtitle: 'Todas las sedes', color: 'text-green-600', bg: 'bg-green-50' },
    { id: 3, icon: Clock, count: casosAntiguos, title: 'Casos antiguos', subtitle: 'Todas las sedes', color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 4, icon: Check, count: casosCerrados, title: 'Casos cerrados', subtitle: 'Todas las sedes', color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  const highlightedCards = [
    { id: 1, icon: School, count: sedesConCasos, title: 'Sedes con casos', subtitle: 'Activas', color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 2, icon: AlertTriangle, count: casosAltoRiesgo, title: 'Casos en alto riesgo', subtitle: 'Todas las sedes', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  // Dynamic calculations for Alerts
  const activeAlerts = alerts.filter(a => a.estado === 'Activa' || a.estado === 'Pendiente' || a.estado === 'Vencida' || a.estado === 'Programada').length;
  const priorityAlerts = alerts.filter(a => a.prioridad === 'Prioritaria' && a.estado !== 'Atendida').length;
  const pendingFollowups = alerts.filter(a => a.tipo === 'Seguimiento' && a.estado === 'Pendiente').length;

  // Activities for today & tomorrow
  const today = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrow = tomorrowObj.toISOString().split('T')[0];

  const todayActivities = activities.filter(a => a.fecha === today && a.estado !== 'Cancelada');
  const tomorrowActivities = activities.filter(a => a.fecha === tomorrow && a.estado !== 'Cancelada');
  const upcomingActivities = todayActivities.length;

  return (
    <div className="w-full pb-6 bg-slate-50">
      {/* 1. Encabezado superior */}
      <header className="bg-gradient-to-r from-[#0F4DB8] to-[#0B3F9C] text-white p-5 sm:rounded-t-2xl flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <div className="w-20 h-20 overflow-hidden shrink-0 transition-transform hover:scale-110 flex items-center justify-center">
            <img
              src={TiLoLogo}
              alt="TiLo"
              className="w-full h-full object-contain scale-[2.2] translate-y-[18%]"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-black tracking-tight leading-none">TiLo Te Escucha</h1>
            <p className="text-blue-100 text-sm mt-1 font-medium">Orientación Escolar • 2026</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm font-medium">{getFormattedDate()}</span>
          <span className={`${currentPeriod.color} text-white text-xs px-3 py-1 rounded-full font-medium`}>
            {currentPeriod.name}
          </span>
        </div>
      </header>

      <div className="px-5 py-6 space-y-8 max-w-4xl mx-auto">
        {/* 2. Tarjetas de resumen principal */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map((card) => (
            <div key={card.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${card.bg} ${card.color}`}>
                <card.icon size={24} />
              </div>
              <span className="text-2xl font-bold text-slate-800">{card.count}</span>
              <h3 className={`text-sm font-semibold mt-1 ${card.color}`}>{card.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{card.subtitle}</p>
            </div>
          ))}
        </section>

        {/* 3. Resumen de Alertas (Global) */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Bell size={20} className="text-blue-600" /> Resumen de Alertas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-2xl font-black text-red-600 leading-none">{priorityAlerts}</span>
              <span className="text-xs font-bold text-red-800 mt-1">Prioritarias</span>
            </div>
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-2xl font-black text-orange-600 leading-none">{pendingFollowups}</span>
              <span className="text-xs font-bold text-orange-800 mt-1">Seguimientos</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-2xl font-black text-blue-600 leading-none">{upcomingActivities}</span>
              <span className="text-xs font-bold text-blue-800 mt-1">Act. próximas</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-2xl font-black text-slate-800 leading-none">{activeAlerts}</span>
              <span className="text-xs font-bold text-slate-600 mt-1">Alertas totales</span>
            </div>
          </div>
        </section>

        {/* 4. Casos por sede */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Casos por sede</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sedeCards.map((sede) => (
              <div key={sede.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                <School size={28} className={`mb-2 ${sede.color}`} />
                <h4 className="text-xs font-medium text-slate-600 mb-2 leading-tight h-8 flex items-center justify-center">{sede.name}</h4>
                <span className="text-xl font-bold text-slate-800">{sede.count}</span>
                <span className="text-xs text-slate-400">casos</span>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Citas y actividades programadas */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Citas y actividades programadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Tarjeta Hoy */}
            <div className="bg-[#FFFBEB] rounded-2xl p-5 border border-yellow-100 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Calendar size={20} className="text-yellow-700" />
                <h3 className="font-bold text-yellow-900">Hoy</h3>
              </div>
              <div className="space-y-4">
                {todayActivities.length > 0 ? todayActivities.map(act => (
                  <div key={act.id} className="flex gap-4">
                    <div className="w-14 text-center shrink-0">
                      <span className="text-sm font-bold text-orange-600 bg-orange-100/50 px-2 py-1 rounded-md block">{act.horaInicio}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{act.titulo}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{act.tipo} • {act.sede}</p>
                    </div>
                  </div>
                )) : <p className="text-xs text-slate-500 font-medium">No hay actividades para hoy.</p>}
              </div>
            </div>

            {/* Tarjeta Mañana */}
            <div className="bg-[#EFF6FF] rounded-2xl p-5 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Calendar size={20} className="text-blue-700" />
                <h3 className="font-bold text-blue-900">Mañana</h3>
              </div>
              <div className="space-y-4">
                {tomorrowActivities.length > 0 ? tomorrowActivities.map(act => (
                  <div key={act.id} className="flex gap-4">
                    <div className="w-14 text-center shrink-0">
                      <span className="text-sm font-bold text-blue-600 bg-blue-100/50 px-2 py-1 rounded-md block">{act.horaInicio}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{act.titulo}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{act.tipo} • {act.sede}</p>
                    </div>
                  </div>
                )) : <p className="text-xs text-slate-500 font-medium">No hay actividades para mañana.</p>}
              </div>
            </div>

          </div>
        </section>



      </div>
    </div>
  )
}
