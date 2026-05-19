import { useState, useMemo, useEffect } from 'react'
import {
  Users,
  UserPlus,
  History,
  CheckCircle2,
  AlertTriangle,
  School,
  ArrowLeft,
  Search,
  FileText,
  Calendar,
  Activity,
  MoreVertical,
  ChevronDown,
  X,
  Paperclip,
  TrendingUp,
  XCircle,
  Clock
} from 'lucide-react'
import { useCases } from '../hooks/useCases'
import CasoDetalle from './CasoDetalle'
import { getCurrentPeriod, getFormattedDate, getPeriodByDate } from '../utils/periodUtils'

// --- Mock Data ---

// Summary stats will be calculated dynamically inside the component

// Sede data will be calculated dynamically inside the component

// Alerts will be calculated dynamically inside the component

const quickFilters = [
  'Todos', 'Activos', 'Alto riesgo', 'Seg. Estudiante', 'Seg. Docente', 'Seg. Padre', 'Nuevos', 'Antiguos', 'Cerrados'
]

// --- Components ---

export default function CasosDashboard({ onNavigate, initialCaseId }) {
  const { cases, createCase, addSeguimiento, updateCase, deleteCase } = useCases()
  const currentPeriod = getCurrentPeriod();
  const [activeQuickFilter, setActiveQuickFilter] = useState('Todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [createdCase, setCreatedCase] = useState(null)
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId || null)
  const [isOldCaseModalOpen, setIsOldCaseModalOpen] = useState(false)
  const [editingCase, setEditingCase] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [foundCase, setFoundCase] = useState(null)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [selectedStat, setSelectedStat] = useState(null)
  const [selectedSede, setSelectedSede] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sedeFilter, setSedeFilter] = useState('Todas')
  const [gradoFilter, setGradoFilter] = useState('Todos')
  const [estadoFilter, setEstadoFilter] = useState('Todos')
  const [caseSource, setCaseSource] = useState('')

  useEffect(() => {
    const anyModalOpen = isModalOpen || isOldCaseModalOpen || !!selectedAlert || !!selectedStat || !!selectedSede;
    if (anyModalOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [isModalOpen, isOldCaseModalOpen, selectedAlert, selectedStat, selectedSede]);

  // Support deep linking from other modules (like Alertas)
  useEffect(() => {
    if (initialCaseId) {
      setSelectedCaseId(initialCaseId);
    }
  }, [initialCaseId]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Search Term Filter
      const matchesSearch = !searchTerm ||
        c.estudiante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.identificacion?.toString().includes(searchTerm);

      // Advanced Filters
      const matchesSede = sedeFilter === 'Todas' || c.sede === sedeFilter;
      const matchesGrado = gradoFilter === 'Todos' || c.grado === gradoFilter;
      const matchesEstado = estadoFilter === 'Todos' || c.estado === estadoFilter;

      // Quick Filters
      let matchesQuick = true;
      if (activeQuickFilter === 'Nuevos') matchesQuick = c.tipoCaso === 'Nuevo';
      if (activeQuickFilter === 'Antiguos') matchesQuick = c.tipoCaso !== 'Nuevo';
      if (activeQuickFilter === 'Activos') matchesQuick = c.estado === 'Activo' || c.estado === 'En seguimiento';
      if (activeQuickFilter === 'Alto riesgo') matchesQuick = c.nivelRiesgo === 'Alto' || c.nivelRiesgo === 'Prioritario';
      if (activeQuickFilter === 'Cerrados') matchesQuick = c.estado === 'Cerrado';

      // Filtros de Seguimiento Pendiente (en el periodo actual)
      const currentPeriodId = currentPeriod.id;
      const currentYear = new Date().getFullYear();

      const segsInCurrentPeriod = (c.seguimientos || []).filter(s => {
        if (s.eliminado) return false;
        const d = new Date(s.fecha);
        return d.getFullYear() === currentYear && getPeriodByDate(s.fecha).id === currentPeriodId;
      });

      if (activeQuickFilter === 'Seg. Estudiante') {
        matchesQuick = c.estado !== 'Cerrado' && !segsInCurrentPeriod.some(s => s.tipoSeguimiento === 'Estudiante');
      }
      if (activeQuickFilter === 'Seg. Docente') {
        matchesQuick = c.estado !== 'Cerrado' && !segsInCurrentPeriod.some(s => s.tipoSeguimiento === 'Docente');
      }
      if (activeQuickFilter === 'Seg. Padre') {
        matchesQuick = c.estado !== 'Cerrado' && !segsInCurrentPeriod.some(s => s.tipoSeguimiento === 'Padre de familia');
      }

      return matchesSearch && matchesSede && matchesGrado && matchesEstado && matchesQuick;
    })
  }, [cases, searchTerm, sedeFilter, gradoFilter, estadoFilter, activeQuickFilter])

  const dynamicStats = useMemo(() => [
    {
      id: 1,
      title: 'Casos activos',
      desc: 'En seguimiento',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      cases: cases.filter(c => c.estado !== 'Cerrado')
    },
    {
      id: 2,
      title: 'Casos nuevos',
      desc: 'Periodo actual',
      icon: UserPlus,
      color: 'text-green-600',
      bg: 'bg-green-50',
      cases: cases.filter(c => c.tipoCaso === 'Nuevo')
    },
    {
      id: 3,
      title: 'Casos antiguos',
      desc: 'Con seguimiento',
      icon: History,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      cases: cases.filter(c => c.tipoCaso !== 'Nuevo')
    },
    {
      id: 4,
      title: 'Casos cerrados',
      desc: 'Finalizados',
      icon: CheckCircle2,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      cases: cases.filter(c => c.estado === 'Cerrado')
    },
    {
      id: 5,
      title: 'Alto riesgo',
      desc: 'Atención prioritaria',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      cases: cases.filter(c => c.nivelRiesgo === 'Alto' || c.nivelRiesgo === 'Prioritario')
    },
    {
      id: 6,
      title: 'Sedes con casos',
      desc: 'Registros activos',
      icon: School,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      cases: cases
    },
  ], [cases])

  const dynamicAlerts = useMemo(() => [
    {
      id: 'high-risk',
      text: `${cases.filter(c => c.nivelRiesgo === 'Alto' || c.nivelRiesgo === 'Prioritario').length} casos en alto riesgo requieren revisión prioritaria.`,
      type: 'danger',
      cases: cases.filter(c => c.nivelRiesgo === 'Alto' || c.nivelRiesgo === 'Prioritario')
    },
    {
      id: 'family-pending',
      text: `${cases.filter(c => c.estado === 'Activo' && (!c.seguimientos || !c.seguimientos.some(s => s.tipoSeguimiento === 'Padre de familia'))).length} estudiantes sin seguimiento de acudiente registrado.`,
      type: 'warning',
      cases: cases.filter(c => c.estado === 'Activo' && (!c.seguimientos || !c.seguimientos.some(s => s.tipoSeguimiento === 'Padre de familia')))
    },
    {
      id: 'no-followup',
      text: `${cases.filter(c => c.estado === 'Activo' && (!c.seguimientos || c.seguimientos.length === 0)).length} casos nuevos sin primer seguimiento registrado.`,
      type: 'info',
      cases: cases.filter(c => c.estado === 'Activo' && (!c.seguimientos || c.seguimientos.length === 0))
    }
  ].filter(alert => alert.cases.length > 0), [cases])

  const dynamicSedes = useMemo(() => {
    const sedeConfig = {
      'Santa Mónica (JM)': { color: 'bg-blue-500' },
      'Santa Mónica (JT)': { color: 'bg-blue-400' },
      'Villa Flor (JM)': { color: 'bg-green-500' },
      'Villa Flor (JT)': { color: 'bg-green-400' },
      'Canchala': { color: 'bg-yellow-500' },
      'Puerres': { color: 'bg-orange-500' },
      'El Carmen': { color: 'bg-purple-500' },
    }

    const uniqueSedes = [...new Set(cases.map(c => c.sede))].filter(Boolean);

    return uniqueSedes.map(name => {
      const sedeCases = cases.filter(c => c.sede === name)
      return {
        name,
        cases: sedeCases,
        activos: sedeCases.filter(c => c.estado !== 'Cerrado').length,
        nuevos: sedeCases.filter(c => c.tipoCaso === 'Nuevo').length,
        color: sedeConfig[name]?.color || 'bg-slate-500'
      }
    })
  }, [cases])

  const handleCreateCase = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const identificacion = formData.get('identificacion') || '';
    const confirmIdentificacion = formData.get('confirmIdentificacion') || '';

    // Validar coincidencia de identificación si es nuevo Y se ingresó algo
    if (!editingCase && identificacion && identificacion !== confirmIdentificacion) {
      alert("Los números de identificación no coinciden. Por favor verifícalos.")
      return;
    }

    // Validar duplicidad (para creación y edición, excluyendo el caso actual)
    if (identificacion && cases.some(c => c.identificacion === identificacion && c.id !== editingCase?.id)) {
      alert("Ya existe un caso registrado para este número de identificación.");
      return;
    }

    const caseData = {
      identificacion: identificacion,
      identificacionOrigen: formData.get('identificacionOrigen'),
      estudiante: formData.get('estudiante'),
      genero: formData.get('genero'),
      grado: formData.get('grado'),
      sede: formData.get('sede'),
      motivoRemision: formData.get('motivoConsulta'),
      motivo: formData.get('motivoConsulta'),
      nivelRiesgo: formData.get('nivelRiesgo'),
      docenteRemitente: formData.get('docenteRemitente') || '',
      observaciones: formData.get('observaciones'),
    }

    if (editingCase) {
      updateCase(editingCase.id, caseData)
      setCreatedCase({ ...editingCase, ...caseData, isEdit: true })
      setEditingCase(null)
    } else {
      const savedCase = createCase(caseData)
      setCreatedCase({ ...savedCase, isEdit: false })
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCreatedCase(null)
    setEditingCase(null)
    setCaseSource('')
  }

  const handleSearchCase = (e) => {
    e.preventDefault()
    const found = cases.find(c =>
      c.identificacion === searchQuery ||
      c.id === searchQuery ||
      c.codigo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.estudiante?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (found) {
      setFoundCase(found)
    } else {
      alert("No se encontró ningún caso con esa identificación, código o nombre.")
    }
  }

  const handleOldCaseFollowUp = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    addSeguimiento(foundCase.id, {
      fecha: formData.get('fecha'),
      tipoSeguimiento: formData.get('tipoSeguimiento'),
      descripcion: formData.get('descripcion'),
      hasSoporte: formData.get('hasSoporte') === 'on',
      responsable: 'Orientación Escolar'
    })
    setIsOldCaseModalOpen(false)
    setFoundCase(null)
    setSearchQuery('')
    alert("Seguimiento registrado exitosamente.")
  }

  const handleCloseOldCaseModal = () => {
    setIsOldCaseModalOpen(false)
    setFoundCase(null)
    setSearchQuery('')
  }

  const handleUpdateCaseStatus = (id, updates) => {
    updateCase(id, updates)
    setActiveMenuId(null)
    alert("Caso actualizado correctamente")
  }

  const caseList = filteredCases.length === 0 ? (
    <div className="col-span-full py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
      <Search size={40} className="text-slate-200 mx-auto mb-3" />
      <p className="text-slate-500 font-medium text-sm">No se encontraron casos con los filtros aplicados</p>
      <button
        onClick={() => {
          setSearchTerm('');
          setSedeFilter('Todas');
          setGradoFilter('Todos');
          setEstadoFilter('Todos');
          setActiveQuickFilter('Todos');
        }}
        className="mt-3 text-blue-600 text-xs font-bold hover:underline"
      >
        Limpiar todos los filtros
      </button>
    </div>
  ) : filteredCases.map(c => (
    <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md">{c.codigo}</span>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${c.nivelRiesgo === 'Alto' || c.nivelRiesgo === 'Prioritario' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
            Riesgo {c.nivelRiesgo}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <MoreVertical size={18} />
          </button>

          {activeMenuId === c.id && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)}></div>
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 z-30 py-2 animate-[fadeIn_0.2s_ease-out]">
                <button
                  onClick={() => { 
                    setEditingCase(c); 
                    setCaseSource(c.identificacionOrigen || '');
                    setIsModalOpen(true); 
                    setActiveMenuId(null); 
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <FileText size={16} className="text-blue-500" /> Editar Información
                </button>
                <button
                  onClick={() => handleUpdateCaseStatus(c.id, { nivelRiesgo: 'Prioritario', estado: 'En seguimiento' })}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <TrendingUp size={16} className="text-orange-500" /> Priorizar Caso
                </button>

                <button
                  onClick={() => {
                    if (confirm('¿Cerrar este caso definitivamente?')) {
                      handleUpdateCaseStatus(c.id, { estado: 'Cerrado' })
                    }
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-3"
                >
                  <XCircle size={16} /> Cerrar Caso
                </button>
                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                <button
                  onClick={() => {
                    if (confirm('¿ESTÁS SEGURO? Esta acción eliminará el caso y todo su historial de forma permanente.')) {
                      deleteCase(c.id);
                      alert("Caso eliminado correctamente.");
                      setActiveMenuId(null);
                    }
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <X size={16} /> Eliminar Caso
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">{c.estudiante}</h3>
            <p className="text-xs text-slate-500">{c.grado} • {c.sede}</p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.estado === 'Activo' || c.estado === 'En seguimiento' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{c.estado}</span>
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-xs mb-4">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Motivo</span>
            <span className="font-medium text-slate-700">{c.motivoRemision}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipo</span>
            <span className="font-medium text-slate-700">{c.tipoCaso}</span>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-50 mt-1">
            <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1.5">Registros Relacionados</span>
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                {c.seguimientos?.filter(s => !s.tipoSeguimiento?.includes('Cita') && !s.tipoSeguimiento?.includes('Ruta')).length || 0} Seguimientos
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                {c.seguimientos?.filter(s => s.tipoSeguimiento?.includes('Cita')).length || 0} Citas
              </span>
              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                {c.rutaActivada ? (Array.isArray(c.rutaActivada) ? c.rutaActivada.length : 1) : 0} Rutas
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 border-t border-slate-100 pt-3">
          <button onClick={() => setSelectedCaseId(c.id)} className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2 rounded-xl transition-colors">Ver caso</button>
          <button onClick={() => setSelectedCaseId(c.id)} className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs py-2 rounded-xl transition-colors">Seguimiento</button>
        </div>
      </div>
    </div>
  ));

  if (selectedCaseId) {
    return (
      <CasoDetalle 
        caseId={selectedCaseId} 
        onBack={() => setSelectedCaseId(null)} 
        onEdit={(caseItem) => {
          setSelectedCaseId(null);
          setEditingCase(caseItem);
          setCaseSource(caseItem.identificacionOrigen || '');
          setIsModalOpen(true);
        }}
      />
    )
  }

  return (
    <div className="w-full pb-8 bg-slate-50 min-h-screen">

      {/* 1. Encabezado */}
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
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                <Users size={28} className="text-white" />
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl md:text-2xl font-bold tracking-wide">Gestión de Casos</h1>
              <p className="text-blue-200 text-xs md:text-sm">Seguimiento detallado de estudiantes y procesos</p>
            </div>
          </div>
          <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-1 mt-2 md:mt-0">
            <span className="text-sm font-medium">{getFormattedDate()}</span>
            <span className={`${currentPeriod.color} text-white text-xs px-3 py-1 rounded-full font-medium`}>{currentPeriod.name}</span>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-8 max-w-5xl mx-auto">

        {/* 2. Acciones principales */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex items-start gap-4 hover:border-blue-300 hover:shadow-md transition-all group text-left"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <UserPlus size={28} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Crear caso nuevo</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Registra por primera vez un estudiante remitido a orientación escolar.
              </p>
            </div>
          </button>

          <button
            onClick={() => setIsOldCaseModalOpen(true)}
            className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex items-start gap-4 hover:border-purple-300 hover:shadow-md transition-all group text-left"
          >
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <History size={28} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Seguimiento caso antiguo</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Busca un caso ya registrado y agrega una nueva atención o seguimiento.
              </p>
            </div>
          </button>
        </section>



        {/* 3. Resumen estadístico principal */}
        <section>
          <h2 className="text-base font-bold text-slate-800 mb-3">Resumen general</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {dynamicStats.map(stat => {
              const Icon = stat.icon;
              return (
                <button
                  key={stat.id}
                  onClick={() => setSelectedStat(stat)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${stat.bg} ${stat.color}`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-2xl font-bold text-slate-800 leading-none">{stat.id === 6 ? new Set(cases.map(c => c.sede)).size : stat.cases.length}</span>
                  <h3 className="text-[11px] font-bold mt-1.5 text-slate-700 leading-tight">{stat.title}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{stat.desc}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* 4. Casos por sede */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-slate-800">Casos por sede</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {dynamicSedes.map((sede, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSede(sede)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98] flex flex-col justify-between h-full"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${sede.color}`}>
                    <School size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 leading-tight">{sede.name}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <span className="block text-lg font-bold text-slate-800">{sede.activos}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Activos</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <span className="block text-lg font-bold text-slate-800">{sede.nuevos}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Nuevos</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>



        {/* 10 & 7. Filtros rápidos y Búsqueda */}
        <section>
          <h2 className="text-base font-bold text-slate-800 mb-3">Consultar Casos</h2>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {quickFilters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveQuickFilter(filter)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border ${activeQuickFilter === filter
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Search and Advanced Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-2 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código o nombre..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              <div className="relative">
                <select
                  value={sedeFilter}
                  onChange={(e) => setSedeFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-3 text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={gradoFilter}
                  onChange={(e) => setGradoFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-3 text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Todos">Grado</option>
                  <option value="Prejardín">Prejardín</option>
                  <option value="Jardín">Jardín</option>
                  <option value="Transición">Transición</option>
                  <option value="1°">1° Primero</option>
                  <option value="2°">2° Segundo</option>
                  <option value="3°">3° Tercero</option>
                  <option value="4°">4° Cuarto</option>
                  <option value="5°">5° Quinto</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-3 text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Todos">Estado</option>
                  <option value="Activo">Activo</option>
                  <option value="En seguimiento">En seguimiento</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSedeFilter('Todas');
                  setGradoFilter('Todos');
                  setEstadoFilter('Todos');
                  setActiveQuickFilter('Todos');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[10px] px-3 py-2.5 font-bold flex items-center justify-center gap-2 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </section>

        {/* 8. Listado de casos */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-800">Casos Registrados ({filteredCases.length})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caseList}
          </div>
        </section>

      </div>

      {/* Modal Crear Caso / Verificación de Éxito */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">

            {createdCase ? (
              <div className="p-8 text-center animate-[fadeIn_0.3s_ease-out]">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">{createdCase.isEdit ? '¡Caso Actualizado!' : '¡Caso Registrado Exitosamente!'}</h2>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                  El expediente de <strong>{createdCase.estudiante}</strong> ha sido {createdCase.isEdit ? 'actualizado' : 'creado'} correctamente bajo el código <span className="font-bold text-blue-600">{createdCase.codigo}</span>.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => { setSelectedCaseId(createdCase.id); handleCloseModal(); }}
                    className="w-full py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-600/30 flex justify-center items-center gap-2"
                  >
                    <FileText size={18} /> Ver caso completo
                  </button>
                  <button
                    onClick={() => { setSelectedCaseId(createdCase.id); handleCloseModal(); }}
                    className="w-full py-3.5 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all flex justify-center items-center gap-2"
                  >
                    <Calendar size={18} /> Agendar primera cita
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="w-full py-3 text-sm font-bold text-slate-500 bg-transparent hover:bg-slate-50 rounded-xl transition-all mt-2"
                  >
                    Cerrar y continuar después
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {editingCase ? <FileText size={20} className="text-blue-600" /> : <UserPlus size={20} className="text-blue-600" />}
                    {editingCase ? 'Editar información del caso' : 'Crear caso nuevo'}
                  </h2>
                  <button onClick={handleCloseModal} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100"><X size={18} /></button>
                </div>

                <form onSubmit={handleCreateCase} className="p-5 overflow-y-auto max-h-[75vh]">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Identificación (Opcional)</label>
                        <input name="identificacion" type="number" defaultValue={editingCase?.identificacion?.toString().startsWith('case-') ? '' : editingCase?.identificacion} placeholder="Número de documento" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      {!editingCase && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Identificación</label>
                          <input name="confirmIdentificacion" type="number" placeholder="Repite para verificar" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nombre *</label>
                        <input required name="estudiante" type="text" defaultValue={editingCase?.estudiante || ''} placeholder="Ej. Juan Pérez" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Género *</label>
                        <select required name="genero" defaultValue={editingCase?.genero || ''} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 appearance-none">
                          <option value="">Seleccione...</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Grado *</label>
                        <select required name="grado" defaultValue={editingCase?.grado || ''} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 appearance-none">
                          <option value="">Seleccione...</option>
                          <option value="Prejardín">Prejardín</option>
                          <option value="Jardín">Jardín</option>
                          <option value="Transición">Transición</option>
                          <option value="1°">1° Primero</option>
                          <option value="2°">2° Segundo</option>
                          <option value="3°">3° Tercero</option>
                          <option value="4°">4° Cuarto</option>
                          <option value="5°">5° Quinto</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Sede *</label>
                        <select required name="sede" defaultValue={editingCase?.sede || ''} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 appearance-none">
                          <option value="">Seleccione...</option>
                          <option value="Santa Mónica (JM)">Santa Mónica (JM)</option>
                          <option value="Santa Mónica (JT)">Santa Mónica (JT)</option>
                          <option value="Villa Flor (JM)">Villa Flor (JM)</option>
                          <option value="Villa Flor (JT)">Villa Flor (JT)</option>
                          <option value="Canchala">Canchala</option>
                          <option value="Puerres">Puerres</option>
                          <option value="El Carmen">El Carmen</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Motivo consulta *</label>
                        <select required name="motivoConsulta" defaultValue={editingCase?.motivo || ''} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 appearance-none">
                          <option value="">Seleccione...</option>
                          <option value="Académico">Académico (Aprendizaje/Rendimiento)</option>
                          <option value="Convivencia escolar">Convivencia escolar (Conflictos/Bullying)</option>
                          <option value="Pautas de crianza">Pautas de crianza / Apoyo familiar</option>
                          <option value="Riesgo psicosocial">Riesgo psicosocial (Violencia/Consumo)</option>
                          <option value="Salud mental">Salud mental / Regulación emocional</option>
                          <option value="Presunto maltrato">Presunto maltrato / Abuso</option>
                          <option value="Inasistencia">Inasistencia escolar / Absentismo</option>
                          <option value="Uso de dispositivos">Uso inadecuado de dispositivos / Redes</option>
                          <option value="Duelo">Duelo / Situaciones de crisis</option>
                          <option value="Orientación vocacional">Orientación vocacional</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nivel riesgo *</label>
                        <select required name="nivelRiesgo" defaultValue={editingCase?.nivelRiesgo || ''} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 appearance-none">
                          <option value="">Seleccione...</option>
                          <option value="Bajo">Bajo</option>
                          <option value="Medio">Medio</option>
                          <option value="Alto">Alto</option>
                          <option value="Prioritario">Prioritario</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">¿Cómo se identifica el caso? *</label>
                      <select 
                        required 
                        name="identificacionOrigen" 
                        defaultValue={editingCase?.identificacionOrigen || ''} 
                        onChange={(e) => setCaseSource(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 appearance-none"
                      >
                        <option value="">Seleccione...</option>
                        <option value="Por Estudiante">Por Estudiante</option>
                        <option value="Por Padre de Familia">Por Padre de Familia</option>
                        <option value="Por Docente">Por Docente</option>
                      </select>
                    </div>

                    <div className={caseSource === 'Por Docente' ? 'block' : 'hidden'}>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Docente que remite *</label>
                      <input 
                        required={caseSource === 'Por Docente'} 
                        name="docenteRemitente" 
                        type="text" 
                        defaultValue={editingCase?.docenteRemitente || ''} 
                        placeholder="Nombre del docente" 
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones iniciales (Opcional)</label>
                      <textarea name="observaciones" rows="3" defaultValue={editingCase?.observaciones || ''} placeholder="Detalles de la remisión..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                    </div>
                  </div>

                  <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
                    <button type="button" onClick={handleCloseModal} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-600/30">
                      {editingCase ? 'Guardar Cambios' : 'Registrar Caso'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      {isOldCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><History size={20} className="text-purple-600" /> Seguimiento caso antiguo</h2>
              <button onClick={handleCloseOldCaseModal} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!foundCase ? (
                <div className="p-5 space-y-4 py-4 text-center">
                  <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} />
                  </div>
                  <h3 className="font-bold text-slate-800">Buscar estudiante</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                    Ingresa el número de identificación, el código del caso o el nombre del estudiante para continuar con el seguimiento.
                  </p>
                  <form onSubmit={handleSearchCase} className="flex gap-2">
                    <input
                      required
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="No. Identificación, Código o Nombre"
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    />
                    <button type="submit" className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors">Buscar</button>
                  </form>
                </div>
              ) : (
                <form onSubmit={handleOldCaseFollowUp} className="p-5 space-y-4">
                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-50">
                      <Users size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{foundCase.estudiante}</h4>
                      <p className="text-[11px] text-slate-500">{foundCase.codigo} • {foundCase.grado} • {foundCase.sede}</p>
                    </div>
                    <button type="button" onClick={() => setFoundCase(null)} className="ml-auto text-xs font-bold text-purple-600 bg-white px-2 py-1 rounded-lg border border-purple-100">Cambiar</button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fecha *</label>
                      <input required name="fecha" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Seguimiento *</label>
                      <select required name="tipoSeguimiento" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                        <option value="Estudiante">Estudiante</option>
                        <option value="Padre de familia">Padre de familia</option>
                        <option value="Docente">Docente</option>
                        <option value="Externo">Externo</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Descripción del seguimiento *</label>
                    <textarea required name="descripcion" rows="4" placeholder="Describe los avances o compromisos..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"></textarea>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                        <Paperclip size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Soporte de atención</p>
                        <p className="text-[10px] text-slate-500">¿Se entregó documento?</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="hasSoporte" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2 mt-4">
                    <button type="button" onClick={handleCloseOldCaseModal} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-sm shadow-purple-600/30">Guardar Seguimiento</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle de Alertas */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${selectedAlert.type === 'danger' ? 'bg-red-100 text-red-600' :
                  selectedAlert.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                  <AlertTriangle size={20} />
                </div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Atención Sugerida</h2>
              </div>
              <button onClick={() => setSelectedAlert(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-sm text-slate-600 mb-4 font-medium italic border-l-4 border-slate-200 pl-3">"{selectedAlert.text}"</p>

              <div className="space-y-3">
                {selectedAlert.cases.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 border border-slate-100 font-bold text-xs shadow-sm">
                        {c.estudiante?.split(' ').filter(Boolean).map(n => n[0]).join('') || '?'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{c.estudiante}</h4>
                        <p className="text-[10px] text-slate-500 font-medium uppercase">{c.codigo} • {c.grado} • {c.sede}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCaseId(c.id);
                        setSelectedAlert(null);
                      }}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                      Gestionar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedAlert(null)} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {selectedStat && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${selectedStat.bg} ${selectedStat.color}`}>
                  {(() => {
                    const Icon = selectedStat.icon;
                    return <Icon size={20} />;
                  })()}
                </div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{selectedStat.title}</h2>
              </div>
              <button onClick={() => setSelectedStat(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs text-slate-500 mb-4 font-semibold uppercase tracking-wider">Listado de estudiantes en esta categoría:</p>

              <div className="space-y-3">
                {selectedStat.cases.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-400 italic">No hay casos registrados en esta categoría.</p>
                  </div>
                ) : (
                  selectedStat.cases.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 border border-slate-100 font-bold text-xs shadow-sm">
                          {c.estudiante?.split(' ').filter(Boolean).map(n => n[0]).join('') || '?'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{c.estudiante}</h4>
                          <p className="text-[10px] text-slate-500 font-medium uppercase">{c.codigo} • {c.grado} • {c.sede}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCaseId(c.id);
                          setSelectedStat(null);
                        }}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Ver Detalle
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedStat(null)} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle por Sede */}
      {selectedSede && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg text-white ${selectedSede.color}`}>
                  <School size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{selectedSede.name}</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedSede.cases.length} Casos registrados</p>
                </div>
              </div>
              <button onClick={() => setSelectedSede(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-3">
                {selectedSede.cases.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 border border-slate-100 font-bold text-xs shadow-sm">
                        {c.estudiante?.split(' ').filter(Boolean).map(n => n[0]).join('') || '?'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{c.estudiante}</h4>
                        <p className="text-[10px] text-slate-500 font-medium uppercase">{c.codigo} • {c.grado}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${c.estado === 'Activo' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {c.estado}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedCaseId(c.id);
                          setSelectedSede(null);
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Ver Caso
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedSede(null)} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
