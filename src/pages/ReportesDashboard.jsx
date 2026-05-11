import { useState, useMemo, useEffect } from 'react';
import {
  BarChart2,
  ArrowLeft,
  Calendar,
  School,
  Filter,
  RefreshCw,
  FileText,
  Download,
  Printer,
  Users,
  CheckCircle2,
  Clock,
  Bell,
  Info,
  Shield,
  Heart,
  FileBox,
  ChevronDown
} from 'lucide-react';
import { 
  exportReportToCSV, 
  exportReportToExcel, 
  exportReportToPDF, 
  printReport 
} from '../utils/exportReports';
import { useCases } from '../hooks/useCases';
import { useActivities } from '../hooks/useActivities';
import { useAlerts } from '../hooks/useAlerts';
import { getCurrentPeriod, getFormattedDate } from '../utils/periodUtils';

export default function ReportesDashboard({ onNavigate }) {
  const currentPeriod = getCurrentPeriod();
  const { cases } = useCases();
  const { activities } = useActivities();
  const { alerts } = useAlerts();

  const [sedeFilter, setSedeFilter] = useState('Todas las sedes');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2026-05-31');
  const [categoryFilter, setCategoryFilter] = useState('Todas las categorías');
  const [isSearching, setIsSearching] = useState(false);

  // --- Real Data Processing & Filtering ---
  const reportData = useMemo(() => {
    // 1. Filter raw data by Sede and Date
    const filteredCases = cases.filter(c => {
      const matchesSede = sedeFilter === 'Todas las sedes' || c.sede === sedeFilter;
      const caseDate = c.createdAt ? c.createdAt.split('T')[0] : '2026-04-01';
      const matchesDate = caseDate >= startDate && caseDate <= endDate;
      return matchesSede && matchesDate;
    });

    const filteredActs = activities.filter(a => {
      const matchesSede = sedeFilter === 'Todas las sedes' || a.sede === sedeFilter;
      const matchesDate = a.fecha >= startDate && a.fecha <= endDate;
      return matchesSede && matchesDate;
    });

    const filteredAlerts = alerts.filter(al => {
      const matchesSede = sedeFilter === 'Todas las sedes' || al.sede === sedeFilter;
      const alertDate = al.createdAt ? al.createdAt.split('T')[0] : '2026-04-01';
      const matchesDate = alertDate >= startDate && alertDate <= endDate;
      return matchesSede && matchesDate;
    });

    // 2. Aggregate Data
    const totalCases = filteredCases.length;
    const closedCases = filteredCases.filter(c => c.estado === 'Cerrado').length;
    const followUpCases = filteredCases.filter(c => c.estado === 'En seguimiento' || c.estado === 'Abierto').length;
    const activeAlerts = filteredAlerts.filter(al => al.estado !== 'Atendida').length;

    // Cases by Reason
    const reasonMap = {};
    filteredCases.forEach(c => {
      const reason = c.motivo || 'Otros';
      reasonMap[reason] = (reasonMap[reason] || 0) + 1;
    });
    const dynamicByReason = Object.entries(reasonMap).map(([name, value], idx) => ({
      name,
      value,
      percentage: totalCases > 0 ? `${((value / totalCases) * 100).toFixed(1)}%` : '0%',
      color: ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#64748B'][idx % 7]
    })).sort((a, b) => b.value - a.value);

    // Cases by Gender
    const genderMap = { 'Masculino': 0, 'Femenino': 0, 'Otro': 0 };
    filteredCases.forEach(c => {
      if (genderMap[c.genero] !== undefined) genderMap[c.genero]++;
      else genderMap['Otro']++;
    });
    const dynamicByGender = Object.entries(genderMap).map(([name, value], idx) => ({
      name,
      value,
      percentage: totalCases > 0 ? `${((value / totalCases) * 100).toFixed(1)}%` : '0%',
      color: name === 'Masculino' ? '#3B82F6' : name === 'Femenino' ? '#EC4899' : '#64748B'
    }));

    // Route Activations
    const icbfCount = filteredCases.filter(c => c.rutaActivada?.includes('ICBF')).length;
    const saludCount = filteredCases.filter(c => c.rutaActivada?.includes('Salud')).length;
    const ambasCount = filteredCases.filter(c => c.rutaActivada?.includes('ICBF') && c.rutaActivada?.includes('Salud')).length;

    // Cases by Grade
    const gradesList = ['Transición', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°'];
    const dynamicByGrade = gradesList.map(grade => {
      const gCases = filteredCases.filter(c => c.grado === grade).length;
      return {
        grade,
        cases: gCases,
        percentage: totalCases > 0 ? `${((gCases / totalCases) * 100).toFixed(1)}%` : '0%'
      };
    });

    // Consolidated Table
    const sedesList = ['Santa Mónica (JM)', 'Santa Mónica (JT)', 'Villa Flor (JM)', 'Villa Flor (JT)', 'Canchala', 'Puerres', 'El Carmen'];
    const consolidated = sedesList.map(s => {
      const sCases = filteredCases.filter(c => c.sede === s);
      const sActs = filteredActs.filter(a => a.sede === s);
      const sAlerts = filteredAlerts.filter(al => al.sede === s);
      return {
        sede: s,
        total: sCases.length,
        activos: sCases.filter(c => c.estado !== 'Cerrado').length,
        cerrados: sCases.filter(c => c.estado === 'Cerrado').length,
        alertas: sAlerts.length,
        icbf: sCases.filter(c => c.rutaActivada?.includes('ICBF')).length,
        salud: sCases.filter(c => c.rutaActivada?.includes('Salud')).length,
        acts: sActs.length,
        segPendientes: sActs.filter(a => a.estado === 'Pendiente').length
      };
    }).filter(row => sedeFilter === 'Todas las sedes' || row.sede === sedeFilter);

    return {
      summary: { totalCases, closedCases, followUpCases, activeAlerts },
      byReason: dynamicByReason,
      byGender: dynamicByGender,
      byGrade: dynamicByGrade,
      routes: {
        icbf: { count: icbfCount, percentage: totalCases > 0 ? `${((icbfCount / totalCases) * 100).toFixed(1)}%` : '0%' },
        salud: { count: saludCount, percentage: totalCases > 0 ? `${((saludCount / totalCases) * 100).toFixed(1)}%` : '0%' },
        ambas: { count: ambasCount, percentage: totalCases > 0 ? `${((ambasCount / totalCases) * 100).toFixed(1)}%` : '0%' }
      },
      actsSummary: {
        realizadas: filteredActs.filter(a => a.estado === 'Realizada').length,
        pendientes: filteredActs.filter(a => a.estado === 'Pendiente').length,
        citaciones: filteredActs.filter(a => a.tipo === 'Citación' && a.estado === 'No asistió').length,
        estudiante: filteredActs.filter(a => a.tipo === 'Seguimiento' && a.subtipo === 'Estudiante').length,
        familia: filteredActs.filter(a => a.tipo === 'Seguimiento' && a.subtipo === 'Familia').length,
        docente: filteredActs.filter(a => a.tipo === 'Seguimiento' && a.subtipo === 'Docente').length
      },
      alertsSummary: {
        activas: filteredAlerts.filter(al => al.estado === 'Activa').length,
        atendidas: filteredAlerts.filter(al => al.estado === 'Atendida').length,
        prioritarias: filteredAlerts.filter(al => al.prioridad === 'Prioritaria').length,
        vencidas: filteredAlerts.filter(al => al.estado === 'Vencida').length
      },
      table: consolidated
    };
  }, [cases, activities, alerts, sedeFilter, startDate, endDate]);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 600);
  };

  const subtitle = sedeFilter === 'Todas las sedes' ? 'Todas las sedes' : `Sede ${sedeFilter}`;

  return (
    <div className="w-full pb-8 bg-slate-50 min-h-screen">
      
      {/* 1. Encabezado superior */}
      <header className="bg-[#0F4DB8] text-white px-5 py-6 sm:rounded-t-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate && onNavigate('inicio')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors no-print shrink-0"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                <BarChart2 size={28} className="text-white" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl md:text-2xl font-bold tracking-wide">Reportes por sede</h1>
              <p className="text-blue-200 text-xs md:text-sm">{subtitle}</p>
            </div>
          </div>
          <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-1 mt-2 md:mt-0">
            <span className="text-sm font-medium">{getFormattedDate()}</span>
            <span className={`${currentPeriod.color} text-white text-xs px-3 py-1 rounded-full font-medium`}>{currentPeriod.name}</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-6xl mx-auto">
        
        {/* Encabezado para impresión */}
        <div className="print-only mb-6 border-b-2 border-blue-900 pb-4">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Reporte Consolidado TiLo</h1>
              <p className="text-slate-600 font-medium">{subtitle}</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Fecha de consulta: {new Date().toLocaleDateString()}</p>
              <p>Rango: {startDate} a {endDate}</p>
              <p>Categoría: {categoryFilter}</p>
            </div>
          </div>
        </div>

        {/* 2 & 3. Panel superior de filtros y exportación */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex flex-col md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Calendar size={12}/> Rango de fechas (Inicio - Fin)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <School size={12}/> Filtrar por sede
              </label>
              <div className="relative">
                <select 
                  value={sedeFilter}
                  onChange={(e) => setSedeFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Todas las sedes</option>
                  <option>Santa Mónica (JM)</option>
                  <option>Santa Mónica (JT)</option>
                  <option>Villa Flor (JM)</option>
                  <option>Villa Flor (JT)</option>
                  <option>Canchala</option>
                  <option>Puerres</option>
                  <option>El Carmen</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Filter size={12}/> Filtrar por categoría
              </label>
              <div className="relative">
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Todas las categorías</option>
                  <option>Casos</option>
                  <option>Actividades</option>
                  <option>Alertas</option>
                  <option>Seguimientos</option>
                  <option>Citaciones</option>
                  <option>Activaciones de ruta</option>
                  <option>Casos cerrados</option>
                  <option>Casos en seguimiento</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 h-[38px] text-xs uppercase tracking-wider"
              >
                <RefreshCw size={16} className={isSearching ? "animate-spin" : ""} />
                Buscar
              </button>
            </div>
          </div>
          
          {/* Botones de exportación */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            <button onClick={() => exportReportToPDF()} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm">
              <FileText size={14} className="text-red-500"/> Exportar PDF
            </button>
            <button onClick={() => exportReportToExcel(reportData.table, `Reporte_TiLo_${sedeFilter}_${startDate}_a_${endDate}.xlsx`)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm">
              <Download size={14} className="text-green-600"/> Exportar Excel
            </button>
            <button onClick={() => exportReportToCSV(reportData.table, `Reporte_TiLo_${sedeFilter}_${startDate}_a_${endDate}.csv`)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm">
              <Download size={14} className="text-blue-600"/> Exportar CSV
            </button>
            <button onClick={printReport} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm ml-auto">
              <Printer size={14} className="text-slate-600"/> Imprimir informe
            </button>
          </div>
        </div>

        {/* 4. Tarjetas estadísticas principales */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard 
            title="Casos totales" 
            count={reportData.summary.totalCases} 
            comparative="Según filtros aplicados" 
            icon={<Users size={24}/>} 
            color="text-blue-600" 
            bgIcon="bg-blue-100" 
            className="print-card"
          />
          <StatCard 
            title="Casos cerrados" 
            count={reportData.summary.closedCases} 
            comparative={`${((reportData.summary.closedCases / (reportData.summary.totalCases || 1)) * 100).toFixed(0)}% del total`} 
            icon={<CheckCircle2 size={24}/>} 
            color="text-green-600" 
            bgIcon="bg-green-100" 
            className="print-card"
          />
          <StatCard 
            title="En seguimiento" 
            count={reportData.summary.followUpCases} 
            comparative="Activos actualmente" 
            icon={<Clock size={24}/>} 
            color="text-orange-600" 
            bgIcon="bg-orange-100" 
            className="print-card"
          />
          <StatCard 
            title="Alertas activas" 
            count={reportData.summary.activeAlerts} 
            comparative="Requieren atención" 
            icon={<Bell size={24}/>} 
            color="text-purple-600" 
            bgIcon="bg-purple-100" 
            className="print-card"
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 5. Casos por motivo de consulta */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm print-card flex flex-col min-h-[320px]">
            <div className="flex items-center gap-2 mb-8">
              <Users size={20} className="text-slate-600"/>
              <h2 className="text-base font-bold text-slate-800">Casos por motivo de consulta</h2>
              <Info size={16} className="text-slate-400 ml-auto"/>
            </div>
            <div className="flex-1 flex flex-col xl:flex-row items-center justify-around gap-6">
              <div className="flex-1 w-full space-y-3 order-2 xl:order-1">
                {reportData.byReason.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: item.color}}></div>
                      <span className="text-slate-700 font-bold truncate max-w-[140px]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-800">{item.value}</span>
                      <span className="text-slate-400 font-medium">{item.percentage}</span>
                    </div>
                  </div>
                ))}
                {reportData.byReason.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Sin datos registrados</p>}
              </div>
              <div className="w-44 h-44 rounded-full flex items-center justify-center relative shrink-0 order-1 xl:order-2 shadow-sm" 
                   style={{
                     background: reportData.byReason.length > 0 ? `conic-gradient(${
                       reportData.byReason.map((item, idx) => {
                         const total = reportData.summary.totalCases;
                         const prevSum = reportData.byReason.slice(0, idx).reduce((acc, curr) => acc + curr.value, 0);
                         const start = (prevSum / total) * 100;
                         const end = ((prevSum + item.value) / total) * 100;
                         return `${item.color} ${start}% ${end}%`;
                       }).join(', ')
                     })` : '#f1f5f9'
                   }}>
                <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-2xl font-black text-slate-800">{reportData.summary.totalCases}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Casos</span>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Casos por género */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm print-card flex flex-col min-h-[320px]">
            <div className="flex items-center gap-2 mb-8">
              <Users size={20} className="text-slate-600"/>
              <h2 className="text-base font-bold text-slate-800">Casos por género</h2>
              <Info size={16} className="text-slate-400 ml-auto"/>
            </div>
            <div className="flex-1 flex flex-col xl:flex-row items-center justify-around gap-6 h-full">
              <div className="w-44 h-44 rounded-full flex items-center justify-center relative shrink-0 shadow-sm" 
                   style={{
                     background: reportData.byGender.length > 0 ? `conic-gradient(${
                       reportData.byGender.map((item, idx) => {
                         const total = reportData.summary.totalCases;
                         const prevSum = reportData.byGender.slice(0, idx).reduce((acc, curr) => acc + curr.value, 0);
                         const start = (prevSum / total) * 100;
                         const end = ((prevSum + item.value) / total) * 100;
                         return `${item.color} ${start}% ${end}%`;
                       }).join(', ')
                     })` : '#f1f5f9'
                   }}>
                <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-2xl font-black text-slate-800">{reportData.summary.totalCases}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Total Casos</span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-4">
                {reportData.byGender.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: item.color}}></div>
                      <span className="text-slate-700 font-bold">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-800">{item.value}</span>
                      <span className="text-slate-400 font-medium w-12 text-right">{item.percentage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* 6. Casos por grado */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm print-card">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 size={20} className="text-slate-600"/>
            <h2 className="text-base font-bold text-slate-800">Casos por grado</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-end gap-2 h-56 border-b border-slate-200 pb-2 px-2 bg-slate-50/30 rounded-xl">
              {reportData.byGrade.map((item, idx) => {
                const percentage = (item.cases / (reportData.summary.totalCases || 1)) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                    <span className={`text-[10px] font-bold mb-1 transition-all ${item.cases > 0 ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
                      {item.cases}
                    </span>
                    <div className="w-full bg-slate-200/50 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-40">
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-700 ease-out shadow-sm ${
                          item.cases > 0 ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-slate-200'
                        }`} 
                        style={{ height: `${item.cases > 0 ? Math.max(percentage, 5) : 0}%` }}
                      >
                        {item.cases > 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-white/20"></div>}
                      </div>
                    </div>
                    <span className="text-[7px] sm:text-[10px] font-bold text-slate-500 mt-2 rotate-45 sm:rotate-0 origin-left sm:origin-center truncate w-full text-center">
                      {item.grade}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 rounded-tl-xl">Grado</th>
                    <th className="px-4 py-2">N° de casos</th>
                    <th className="px-4 py-2 rounded-tr-xl">% del total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.byGrade.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-medium text-slate-700">{item.grade}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-800">{item.cases}</td>
                      <td className="px-4 py-2.5 text-slate-500">{item.percentage}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50/50">
                    <td className="px-4 py-3 font-bold text-blue-900 rounded-bl-xl">Total</td>
                    <td className="px-4 py-3 font-black text-blue-900">{reportData.summary.totalCases}</td>
                    <td className="px-4 py-3 font-bold text-blue-900 rounded-br-xl">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 8. Número de activaciones de ruta */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm print-card">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={20} className="text-slate-600"/>
            <h2 className="text-base font-bold text-slate-800">Número de activaciones de ruta</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RouteCard 
              title="ICBF" 
              count={reportData.routes.icbf.count} 
              desc="activaciones" 
              subtext={`${reportData.routes.icbf.percentage} de los casos`} 
              icon={<Users size={24}/>} 
              color="text-rose-600" 
              bg="bg-rose-50" 
              border="border-rose-100" 
            />
            <RouteCard 
              title="Salud" 
              count={reportData.routes.salud.count} 
              desc="activaciones" 
              subtext={`${reportData.routes.salud.percentage} de los casos`} 
              icon={<Heart size={24}/>} 
              color="text-green-600" 
              bg="bg-green-50" 
              border="border-green-100" 
            />
            <RouteCard 
              title="Ambas rutas" 
              count={reportData.routes.ambas.count} 
              desc="activaciones" 
              subtext={`${reportData.routes.ambas.percentage} de los casos`} 
              icon={<FileBox size={24}/>} 
              color="text-purple-600" 
              bg="bg-purple-50" 
              border="border-purple-100" 
            />
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
              <Info size={20} className="text-blue-500 shrink-0 mt-0.5"/>
              <div>
                <h3 className="font-bold text-blue-900 text-sm mb-1">Información</h3>
                <p className="text-xs text-blue-800/80 leading-relaxed">Un mismo caso puede tener activación de una o ambas rutas de atención.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 9 & 10. Actividades, seguimientos y alertas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <section className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm print-card">
            <h2 className="text-base font-bold text-slate-800 mb-4">Actividades y seguimientos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <SmallStat label="Actividades realizadas" value={reportData.actsSummary.realizadas} />
              <SmallStat label="Actividades pendientes" value={reportData.actsSummary.pendientes} />
              <SmallStat label="Citaciones incumplidas" value={reportData.actsSummary.citaciones} color="text-red-600" />
              <SmallStat label="Seguimientos estudiante" value={reportData.actsSummary.estudiante} />
              <SmallStat label="Seguimientos familia" value={reportData.actsSummary.familia} />
              <SmallStat label="Seguimientos docente" value={reportData.actsSummary.docente} />
            </div>
          </section>
          
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col print-card">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2"><Bell size={18}/> Alertas del período</h2>
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600">Activas</span>
                <span className="font-bold text-slate-800">{reportData.alertsSummary.activas}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600">Atendidas</span>
                <span className="font-bold text-slate-800">{reportData.alertsSummary.atendidas}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600">Prioritarias</span>
                <span className="font-bold text-red-600">{reportData.alertsSummary.prioritarias}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-slate-600">Vencidas</span>
                <span className="font-bold text-orange-600">{reportData.alertsSummary.vencidas}</span>
              </div>
            </div>
          </section>
        </div>

        {/* 11. Tabla resumen para exportación */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-card">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between no-print">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileBox size={18} className="text-blue-600"/> Resumen consolidado por sede
            </h2>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Desliza para ver más →
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap min-w-[900px]">
              <thead>
                <tr className="bg-white text-slate-500 uppercase font-bold border-b border-slate-100">
                  <th className="px-5 py-4 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10">Sede</th>
                  <th className="px-4 py-4 text-center">Total Casos</th>
                  <th className="px-4 py-4 text-center">Activos</th>
                  <th className="px-4 py-4 text-center">Cerrados</th>
                  <th className="px-4 py-4 text-center bg-red-50/30 text-red-700">Alertas</th>
                  <th className="px-4 py-4 text-center">Ruta ICBF</th>
                  <th className="px-4 py-4 text-center">Ruta Salud</th>
                  <th className="px-4 py-4 text-center">Actividades</th>
                  <th className="px-4 py-4 text-center bg-orange-50/30 text-orange-700">Seg. Ptes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.table.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-5 py-3.5 font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-blue-50/30 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10">
                      {row.sede}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">{row.total}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-600 font-medium">{row.activos}</td>
                    <td className="px-4 py-3.5 text-center text-slate-500 font-medium">{row.cerrados}</td>
                    <td className="px-4 py-3.5 text-center bg-red-50/20">
                      <span className={`px-2.5 py-1 rounded-full font-bold ${row.alertas > 0 ? 'bg-red-100 text-red-700' : 'text-slate-400'}`}>
                        {row.alertas}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-600">{row.icbf}</td>
                    <td className="px-4 py-3.5 text-center text-slate-600">{row.salud}</td>
                    <td className="px-4 py-3.5 text-center text-slate-600 font-medium">{row.acts}</td>
                    <td className="px-4 py-3.5 text-center bg-orange-50/20">
                      <span className={`px-2.5 py-1 rounded-full font-bold ${row.segPendientes > 0 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'}`}>
                        {row.segPendientes}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {reportData.table.length > 1 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="px-5 py-4 sticky left-0 bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] z-10 rounded-bl-2xl">
                      TOTAL GENERAL
                    </td>
                    <td className="px-4 py-4 text-center text-base font-black">{reportData.summary.totalCases}</td>
                    <td className="px-4 py-4 text-center opacity-80">{reportData.summary.followUpCases}</td>
                    <td className="px-4 py-4 text-center opacity-80">{reportData.summary.closedCases}</td>
                    <td className="px-4 py-4 text-center text-red-400 font-black">{reportData.summary.activeAlerts}</td>
                    <td className="px-4 py-4 text-center opacity-80">{reportData.routes.icbf.count}</td>
                    <td className="px-4 py-4 text-center opacity-80">{reportData.routes.salud.count}</td>
                    <td className="px-4 py-4 text-center opacity-80">{reportData.actsSummary.realizadas + reportData.actsSummary.pendientes}</td>
                    <td className="px-4 py-4 text-center text-orange-400 font-black rounded-br-2xl">{reportData.actsSummary.pendientes}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

function StatCard({ title, count, comparative, icon, color, bgIcon, className = "" }) {
  return (
    <div className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center ${className}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${color} ${bgIcon}`}>
        {icon}
      </div>
      <span className="text-3xl font-black text-slate-800 leading-none">{count}</span>
      <h3 className="text-sm font-bold mt-1 text-slate-700">{title}</h3>
      <p className="text-[10px] font-semibold text-slate-400 mt-1">{comparative}</p>
    </div>
  );
}

function RouteCard({ title, count, desc, subtext, icon, color, bg, border }) {
  return (
    <div className={`p-4 rounded-xl border ${bg} ${border} flex flex-col`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={color}>{icon}</div>
        <h3 className={`font-bold ${color}`}>{title}</h3>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-slate-800">{count}</span>
        <span className="text-xs font-medium text-slate-600">{desc}</span>
      </div>
      <p className="text-[10px] text-slate-500 mt-1 font-medium">{subtext}</p>
    </div>
  );
}

function SmallStat({ label, value, color = "text-slate-800" }) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-center">
      <span className={`text-xl font-bold leading-none ${color}`}>{value}</span>
      <span className="text-[10px] font-semibold text-slate-500 mt-1">{label}</span>
    </div>
  );
}
