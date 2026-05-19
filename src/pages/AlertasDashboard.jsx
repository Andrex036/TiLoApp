import { useState, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  Calendar,
  UserX,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Filter,
  Search,
  Activity,
  ChevronRight
} from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import { getCurrentPeriod, getFormattedDate } from '../utils/periodUtils';

export default function AlertasDashboard({ onNavigate }) {
  const currentPeriod = getCurrentPeriod();
  const { alerts, markAsAttended, triggerAlertGeneration } = useAlerts();
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('Todas');
  const [sedeFilter, setSedeFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState('Activas y Pendientes');
  
  // Calculate dynamic summary based on local state (to reflect "Atendida" changes)
  const activeAlerts = alerts.filter(a => a.estado === 'Activa' || a.estado === 'Pendiente' || a.estado === 'Vencida' || a.estado === 'Programada');
  const priorityCount = alerts.filter(a => a.prioridad === 'Prioritaria' && a.estado !== 'Atendida').length;
  const pendingFollowups = alerts.filter(a => a.tipo === 'Seguimiento' && a.estado === 'Pendiente').length;
  const upcomingActs = alerts.filter(a => a.tipo === 'Actividad' && a.estado === 'Programada').length;
  const missedCitations = alerts.filter(a => a.tipo === 'Citación' && a.estado === 'Activa').length;
  const pendingRoutes = alerts.filter(a => a.tipo === 'Ruta externa' && a.estado === 'Pendiente').length;

  const priorityList = alerts.filter(a => a.prioridad === 'Prioritaria' && a.estado !== 'Atendida').slice(0, 3);

  const categories = ['Todas', 'Caso', 'Actividad', 'Seguimiento', 'Citación', 'Ruta externa', 'Vencimiento', 'Informativa'];

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      const matchesCategory = activeCategory === 'Todas' || a.tipo === activeCategory;
      const matchesSearch = !searchTerm || 
        a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === 'Todas' || a.prioridad === priorityFilter;
      const matchesSede = sedeFilter === 'Todas' || a.sede === sedeFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'Activas y Pendientes') {
        matchesStatus = a.estado !== 'Atendida';
      } else if (statusFilter !== 'Todos') {
        matchesStatus = a.estado === statusFilter;
      }
      
      return matchesCategory && matchesSearch && matchesPriority && matchesSede && matchesStatus;
    });
  }, [alerts, activeCategory, searchTerm, priorityFilter, sedeFilter, statusFilter]);

  const handleMarkAsAttended = (id) => {
    markAsAttended(id);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Prioritaria': return 'bg-red-100 text-red-700';
      case 'Alta': return 'bg-orange-100 text-orange-700';
      case 'Media': return 'bg-blue-100 text-blue-700';
      case 'Baja': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Activa': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Pendiente': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'Atendida': return 'bg-green-50 border-green-200 text-green-700';
      case 'Pospuesta': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'Vencida': return 'bg-red-50 border-red-200 text-red-700';
      case 'Informativa': return 'bg-slate-50 border-slate-200 text-slate-700';
      case 'Programada': return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Caso': return <AlertTriangle size={24} className="text-red-500" />;
      case 'Actividad': return <Calendar size={24} className="text-blue-500" />;
      case 'Seguimiento': return <Clock size={24} className="text-orange-500" />;
      case 'Citación': return <UserX size={24} className="text-purple-500" />;
      case 'Ruta externa': return <ExternalLink size={24} className="text-indigo-500" />;
      case 'Vencimiento': return <AlertTriangle size={24} className="text-red-500" />;
      default: return <Bell size={24} className="text-slate-500" />;
    }
  };

  return (
    <div className="w-full pb-8 bg-slate-50 min-h-screen">
      
      {/* 2. Encabezado del módulo */}
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
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                <Bell size={28} className="text-white" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl md:text-2xl font-bold tracking-wide">Centro de Alertas</h1>
              <p className="text-blue-200 text-xs md:text-sm">Notificaciones y acciones prioritarias del sistema</p>
            </div>
          </div>
          <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-1 mt-2 md:mt-0">
            <span className="text-sm font-medium">{getFormattedDate()}</span>
            <span className={`${currentPeriod.color} text-white text-xs px-3 py-1 rounded-full font-medium`}>{currentPeriod.name}</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-8 max-w-5xl mx-auto">

        {/* 10. Prioridad inmediata (Alertas críticas destacadas) */}
        {priorityList.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <AlertTriangle size={16} className="text-red-600"/> Prioridad Inmediata
            </h2>
            <div className="flex flex-col gap-3">
              {priorityList.map(alert => (
                <div key={alert.id} className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-red-100">
                    <AlertTriangle size={24} className="text-red-600"/>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-900 font-bold text-base">{alert.titulo}</h3>
                    <p className="text-red-700/80 text-xs font-medium leading-tight mt-0.5">{alert.descripcion}</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (onNavigate) {
                        const params = alert.caseId ? { caseId: alert.caseId } : null;
                        onNavigate(alert.rutaDestino || 'inicio', params);
                      }
                    }} 
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm shrink-0"
                  >
                    Revisar ahora
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Resumen estadístico de alertas */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard count={activeAlerts.length} title="Alertas activas" desc="Requieren revisión" color="text-red-600 bg-red-50" icon={<Bell size={20}/>} />
            <StatCard count={priorityCount} title="Alto riesgo" desc="Casos prioritarios" color="text-red-700 bg-red-100" icon={<AlertTriangle size={20}/>} />
            <StatCard count={pendingFollowups} title="Seguimientos ptes." desc="Estudiante, familia..." color="text-orange-600 bg-orange-50" icon={<Clock size={20}/>} />
            <StatCard count={upcomingActs} title="Actividades próx." desc="Programadas hoy" color="text-blue-600 bg-blue-50" icon={<Calendar size={20}/>} />
            <StatCard count={missedCitations} title="Citaciones incump." desc="Posible reporte" color="text-rose-600 bg-rose-50" icon={<UserX size={20}/>} />
            <StatCard count={pendingRoutes} title="Rutas pendientes" desc="Salud o apoyo ext." color="text-purple-600 bg-purple-50" icon={<ExternalLink size={20}/>} />
          </div>
        </section>

        {/* 11. Acciones rápidas */}
        <section>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                setPriorityFilter('Prioritaria');
                setActiveCategory('Caso');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-colors bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm"
            >
              <AlertTriangle size={14} className="text-red-500"/> Casos alto riesgo
            </button>
            <button 
              onClick={() => setActiveCategory('Seguimiento')}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-colors bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm"
            >
              <Clock size={14} className="text-orange-500"/> Seguimientos ptes
            </button>
            <button 
              onClick={() => setActiveCategory('Citación')}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-colors bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm"
            >
              <UserX size={14} className="text-rose-500"/> Citaciones
            </button>
          </div>
        </section>

        {/* 4 & 8. Clasificación y Filtros */}
        <section>
          <h2 className="text-base font-bold text-slate-800 mb-3">Clasificación y Filtros</h2>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                  activeCategory === cat ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título o descripción..." 
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl text-[10px] px-3 py-2 text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todas">Prioridad (Todas)</option>
                <option value="Prioritaria">Prioritaria</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
              </select>
              <select 
                value={sedeFilter}
                onChange={(e) => setSedeFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl text-[10px] px-3 py-2 text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todas">Sede (Todas)</option>
                <option value="Santa Mónica (JM)">Santa Mónica (JM)</option>
                <option value="Santa Mónica (JT)">Santa Mónica (JT)</option>
                <option value="Villa Flor (JM)">Villa Flor (JM)</option>
                <option value="Villa Flor (JT)">Villa Flor (JT)</option>
                <option value="Canchala">Canchala</option>
                <option value="Puerres">Puerres</option>
                <option value="El Carmen">El Carmen</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl text-[10px] px-3 py-2 text-slate-600 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todos">Estado (Todos)</option>
                <option value="Activas y Pendientes">Activas y Pendientes</option>
                <option value="Activa">Activa</option>
                <option value="Atendida">Atendida</option>
                <option value="Vencida">Vencida</option>
              </select>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setPriorityFilter('Todas');
                  setSedeFilter('Todas');
                  setStatusFilter('Todos');
                  setActiveCategory('Todas');
                }}
                className="bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] px-3 py-2 font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </section>

        {/* 9. Listado principal de alertas */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-800">Alertas registradas ({filteredAlerts.length})</h2>
          </div>
          
          <div className="space-y-4">
            {filteredAlerts.map(alert => (
              <div key={alert.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col md:flex-row ${alert.estado === 'Atendida' ? 'opacity-70 grayscale-[30%] border-slate-200' : 'border-slate-200'}`}>
                
                {/* Icon Section */}
                <div className="p-4 md:border-r border-slate-100 shrink-0 flex flex-col items-center justify-center min-w-[80px] bg-slate-50/50">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 mb-2">
                    {getTypeIcon(alert.tipo)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{alert.tipo}</span>
                </div>
                
                {/* Main Content */}
                <div className="p-4 flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-tight">{alert.titulo}</h3>
                      <p className="text-xs text-slate-500 mt-1 mb-2">{alert.descripcion}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${getPriorityColor(alert.prioridad)}`}>{alert.prioridad}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getStatusColor(alert.estado)}`}>{alert.estado}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-[10px] font-medium mb-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{alert.fecha} {alert.hora && `• ${alert.hora}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{alert.sede}</span>
                    {alert.grado && <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Grado: {alert.grado}</span>}
                    {alert.codigoCaso && (
                      <span 
                        className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md cursor-pointer hover:underline" 
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate('casos', { caseId: alert.caseId });
                          }
                        }}
                      >
                        {alert.codigoCaso}
                      </span>
                    )}
                    {alert.estudiante && (
                      <span className="bg-slate-100 text-slate-800 font-bold px-2 py-1 rounded-md">
                        {alert.estudiante}
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 border-t border-slate-100 pt-3">
                    <div className="flex-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl flex items-center">
                      <span className="text-slate-400 mr-2 uppercase text-[9px]">Sugerencia:</span> {alert.accionSugerida}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {alert.estado !== 'Atendida' && (
                        <button onClick={() => handleMarkAsAttended(alert.id)} className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                          <CheckCircle2 size={14}/> Atender
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (onNavigate) {
                            const params = alert.caseId ? { caseId: alert.caseId } : 
                                         alert.activityId ? { activityId: alert.activityId } : null;
                            onNavigate(alert.rutaDestino || 'inicio', params);
                          }
                        }} 
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1"
                      >
                        Ir al módulo <ChevronRight size={14}/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredAlerts.length === 0 && (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
                <Bell size={40} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-slate-500 font-medium">No hay alertas para esta categoría.</h3>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

function StatCard({ count, title, desc, color, icon }) {
  return (
    <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${color}`}>
        {icon}
      </div>
      <span className="text-2xl font-bold text-slate-800 leading-none">{count}</span>
      <h3 className="text-[11px] font-bold mt-1.5 text-slate-700 leading-tight">{title}</h3>
      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{desc}</p>
    </div>
  );
}
