import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Calendar as CalendarIcon, FileText, CheckCircle2, AlertTriangle, User, MapPin, Activity, Paperclip, MoreVertical, TrendingUp, XCircle, Clock, Edit2, X } from 'lucide-react'
import { useCases } from '../hooks/useCases'
import { useActivities } from '../hooks/useActivities'
import { useAlerts } from '../hooks/useAlerts'

export default function CasoDetalle({ caseId, onBack }) {
  const { cases, addSeguimiento, updateCase, updateSeguimiento, deleteSeguimiento, closeCase } = useCases()
  const { createActivity } = useActivities()
  const { alerts } = useAlerts()
  const [activeTab, setActiveTab] = useState('seguimientos') // seguimientos, info
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false)
  const [showCitaModal, setShowCitaModal] = useState(false)
  const [showRutaModal, setShowRutaModal] = useState(false)
  const [showConfirmCitaModal, setShowConfirmCitaModal] = useState(false)
  const [citaParaConfirmar, setCitaParaConfirmar] = useState(null)
  const [editingSeguimiento, setEditingSeguimiento] = useState(null)
  const [showConfigMenu, setShowConfigMenu] = useState(false)

  const caseData = cases.find(c => c.id === caseId)

  useEffect(() => {
    if (showSeguimientoModal || showCitaModal || showRutaModal || showConfirmCitaModal) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [showSeguimientoModal, showCitaModal, showRutaModal, showConfirmCitaModal]);

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-500">
        <p>Caso no encontrado.</p>
        <button onClick={onBack} className="mt-4 text-blue-600 font-bold">Volver</button>
      </div>
    )
  }

  const handleAddSeguimiento = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    if (editingSeguimiento) {
      updateSeguimiento(caseId, editingSeguimiento.id, {
        fecha: formData.get('fecha'),
        tipoSeguimiento: formData.get('tipoSeguimiento'),
        descripcion: formData.get('descripcion'),
        hasSoporte: formData.get('hasSoporte') === 'on'
      })
      setEditingSeguimiento(null)
    } else {
      addSeguimiento(caseId, {
        fecha: formData.get('fecha'),
        tipoSeguimiento: formData.get('tipoSeguimiento'),
        descripcion: formData.get('descripcion'),
        hasSoporte: formData.get('hasSoporte') === 'on',
        responsable: 'Orientación Escolar'
      })
    }
    setShowSeguimientoModal(false)
  }

  const handleDeleteSeguimiento = (segId) => {
    if (confirm('¿Estás seguro de eliminar este seguimiento? Quedará un registro de la eliminación.')) {
      deleteSeguimiento(caseId, segId)
    }
  }

  const handleEditSeguimiento = (seg) => {
    setEditingSeguimiento(seg)
    setShowSeguimientoModal(true)
  }

  const handleAddCita = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const horaInicio = formData.get('horaInicio')
    const horaFin = formData.get('horaFin')
    if (horaFin <= horaInicio) {
      alert('La hora de fin debe ser posterior a la hora de inicio.')
      return
    }
    createActivity({
      titulo: `Cita: ${caseData.estudiante}`,
      fecha: formData.get('fecha'),
      horaInicio: formData.get('horaInicio'),
      horaFin: formData.get('horaFin'),
      sede: caseData.sede,
      tipo: formData.get('tipoCita'),
      descripcion: formData.get('descripcion'),
      responsable: 'Orientación',
      prioridad: caseData.nivelRiesgo === 'Alto' || caseData.nivelRiesgo === 'Prioritario' ? 'Alta' : 'Media',
      color: 'blue'
    })
    
    // Add tracking record for the Cita
    addSeguimiento(caseId, {
      fecha: new Date().toISOString().split('T')[0],
      tipoSeguimiento: `Cita: ${formData.get('tipoCita')}`,
      descripcion: `Agendada para: ${formData.get('fecha')} de ${formData.get('horaInicio')} a ${formData.get('horaFin')}\nDetalles: ${formData.get('descripcion') || 'N/A'}`,
      responsable: 'Orientación Escolar',
      esCita: true,
      requiereSoporte: formData.get('requiereSoporte') === 'on',
      citaConfirmada: false,
      citaResultadoId: null
    })

    setShowCitaModal(false)
    alert("Cita agendada exitosamente. Podrás verla en el módulo de Actividades.")
  }

  const handleConfirmarCita = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const asistio = formData.get('asistio') === 'si'
    const trajoSoporte = formData.get('trajoSoporte') === 'si'
    const observaciones = formData.get('observaciones')

    const lineas = [
      `Asistió: ${asistio ? 'Sí' : 'No'}`,
      citaParaConfirmar.requiereSoporte ? `Trajo soporte: ${trajoSoporte ? 'Sí' : 'No'}` : null,
      observaciones ? `Observaciones: ${observaciones}` : null
    ].filter(Boolean).join('\n')

    addSeguimiento(caseId, {
      fecha: new Date().toISOString().split('T')[0],
      tipoSeguimiento: 'Resultado de cita',
      descripcion: lineas,
      responsable: 'Orientación Escolar',
      esCitaResultado: true,
      asistio,
      trajoSoporte: citaParaConfirmar.requiereSoporte ? trajoSoporte : null
    })

    updateSeguimiento(caseId, citaParaConfirmar.id, { citaConfirmada: true })

    setShowConfirmCitaModal(false)
    setCitaParaConfirmar(null)
  }

  const handleAddRuta = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const entidad = formData.get('entidad')
    
    // 1. Add follow-up record
    addSeguimiento(caseId, {
      fecha: new Date().toISOString().split('T')[0],
      tipoSeguimiento: `Activación Ruta: ${entidad}`,
      descripcion: `Entidad: ${entidad}\nMotivo: ${formData.get('motivo')}\nObservaciones: ${formData.get('descripcion')}`,
      responsable: 'Orientación Escolar'
    })

    // 2. Update case's activated routes for reporting
    const currentRoutes = caseData.rutaActivada 
      ? (Array.isArray(caseData.rutaActivada) ? caseData.rutaActivada : [caseData.rutaActivada])
      : [];
    
    if (!currentRoutes.includes(entidad)) {
      updateCase(caseId, { 
        rutaActivada: [...currentRoutes, entidad] 
      });
    }
    
    setShowRutaModal(false)
    alert(`Ruta con ${entidad} activada exitosamente.`)
  }

  const handleUpdateStatus = (updates) => {
    updateCase(caseId, updates)
    setShowConfigMenu(false)
    alert("Caso actualizado correctamente")
  }

  return (
    <div className="w-full bg-slate-50 h-full flex flex-col relative overflow-hidden">
      {/* Encabezado */}
      <header className="bg-white px-5 py-4 border-b border-slate-200 sticky top-0 z-10 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-tight">{caseData.estudiante}</h1>
          <div className="flex gap-2 items-center mt-1">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{caseData.codigo}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              caseData.estado === 'Activo' || caseData.estado === 'En seguimiento' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
            }`}>{caseData.estado}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              caseData.nivelRiesgo === 'Alto' || caseData.nivelRiesgo === 'Prioritario' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            }`}>Riesgo {caseData.nivelRiesgo}</span>
          </div>
        </div>
        
        {/* Botón de Configuración (Tres Puntos) */}
        <div className="ml-auto relative">
          <button 
            onClick={() => setShowConfigMenu(!showConfigMenu)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <MoreVertical size={22} />
          </button>

          {showConfigMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowConfigMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-30 py-2 animate-[fadeIn_0.2s_ease-out]">
                <button 
                  onClick={() => handleUpdateStatus({ nivelRiesgo: 'Prioritario', estado: 'En seguimiento' })}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <TrendingUp size={18} className="text-orange-500" /> Priorizar Caso
                </button>
                <button 
                  onClick={() => handleUpdateStatus({ estado: 'En seguimiento' })}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <Clock size={18} className="text-blue-500" /> Mover a Seguimiento
                </button>
                <button 
                  onClick={() => {
                    if (confirm('¿Cerrar este caso definitivamente?')) {
                      handleUpdateStatus({ estado: 'Cerrado' })
                    }
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <XCircle size={18} /> Cerrar Caso
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 pb-20 space-y-6 max-w-4xl mx-auto w-full">
        {/* Info rápida */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <User size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Identificación</p>
              <p className="text-sm font-semibold text-slate-700">{caseData.identificacion || 'No registrada'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Sede y Grado</p>
              <p className="text-sm font-semibold text-slate-700">{caseData.sede} • {caseData.grado}</p>
            </div>
          </div>
          <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Motivo de la consulta</p>
            <p className="text-sm font-semibold text-slate-700">{caseData.motivo || caseData.motivoRemision}</p>
            {caseData.observaciones && (
              <p className="text-xs text-slate-500 mt-2">{caseData.observaciones}</p>
            )}
          </div>
        </div>

        {/* Alertas de seguimiento del caso */}
        {alerts.filter(a => a.caseId === caseId && a.tipo === 'Seguimiento' && a.estado !== 'Atendida').length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-600" /> Alertas de seguimiento
            </h2>
            <div className="space-y-2">
              {alerts.filter(a => a.caseId === caseId && a.tipo === 'Seguimiento' && a.estado !== 'Atendida').map(alert => (
                <div key={alert.id} className="bg-white/60 border border-orange-100 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-orange-900">{alert.titulo}</p>
                    <p className="text-[10px] text-orange-700">{alert.descripcion}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowSeguimientoModal(true);
                      // Pre-fill type if possible (logic would need state but let's keep it simple for now)
                    }}
                    className="text-[10px] font-bold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors shrink-0"
                  >
                    Registrar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('seguimientos')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'seguimientos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Seguimientos ({caseData.seguimientos?.filter(s => !s.eliminado).length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Info Adicional
          </button>
        </div>

        {/* Contenido Tabs */}
        {activeTab === 'seguimientos' && (
          <div className="space-y-4">
            {(!caseData.seguimientos || caseData.seguimientos.length === 0) ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
                <FileText size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">No hay seguimientos registrados</p>
                <p className="text-xs text-slate-400 mt-1">Presiona "Nuevo Seguimiento" para agregar uno.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-4 mt-2">
                {[...caseData.seguimientos].reverse().map((seg, idx) => (
                  <div key={seg.id || idx} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${seg.eliminado ? 'bg-slate-100 border-slate-300' : 'bg-blue-100 border-blue-500'}`}></div>
                    <div className={`bg-white p-4 rounded-xl border shadow-sm ${seg.eliminado ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
                      {seg.eliminado ? (
                        <div className="flex flex-col gap-1 italic text-slate-400 py-1">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase">
                            <X size={14} /> Registro Eliminado
                          </div>
                          <p className="text-[11px]">Este seguimiento fue eliminado el {new Date(seg.fechaEliminacion).toLocaleDateString()} a las {new Date(seg.fechaEliminacion).toLocaleTimeString()}</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2 items-center">
                              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">{seg.tipoSeguimiento}</span>
                              {seg.hasSoporte && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">
                                  <Paperclip size={10} /> Soporte
                                </span>
                              )}
                              {seg.editado && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded-md">
                                  <Edit2 size={10} /> Editado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-medium">{seg.fecha}</span>
                              <div className="flex gap-1 ml-2">
                                <button onClick={() => handleEditSeguimiento(seg)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDeleteSeguimiento(seg.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{seg.descripcion}</p>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mt-3 gap-1">
                             <div className="text-[9px] text-slate-400 italic">
                                {seg.editado && `Última edición: ${new Date(seg.ultimaEdicion).toLocaleString()}`}
                             </div>
                             <p className="text-[10px] text-slate-400 font-medium border-t border-slate-50 pt-2 sm:border-0 sm:pt-0">Por: {seg.responsable}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Tipo de Caso</p>
              <p className="text-sm font-semibold text-slate-700">{caseData.tipoCaso}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Docente que remite</p>
              <p className="text-sm font-semibold text-slate-700">{caseData.docenteRemitente}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Género</p>
                <p className="text-sm font-semibold text-slate-700">{caseData.genero || 'No registrado'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-bold text-slate-400 uppercase">Motivo de la Consulta</p>
                <p className="text-sm font-semibold text-slate-700">{caseData.motivo || caseData.motivoRemision}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Fecha de remisión</p>
              <p className="text-sm font-semibold text-slate-700">{new Date(caseData.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={() => {
                  if (confirm('¿Estás seguro de cerrar este caso?')) {
                    closeCase(caseId)
                    alert('Caso cerrado.')
                  }
                }}
                className="w-full py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                disabled={caseData.estado === 'Cerrado'}
              >
                {caseData.estado === 'Cerrado' ? 'El caso ya está cerrado' : 'Cerrar Caso Definitivamente'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Buttons Area */}
      <div className="bg-white border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] p-4 flex gap-2 z-20 shrink-0">
        <button 
          onClick={() => setShowSeguimientoModal(true)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] sm:text-xs py-2.5 rounded-xl shadow-sm flex flex-col justify-center items-center gap-1 transition-colors"
        >
          <Plus size={18} /> Seguimiento
        </button>
        <button 
          onClick={() => setShowCitaModal(true)}
          className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px] sm:text-xs py-2.5 rounded-xl shadow-sm flex flex-col justify-center items-center gap-1 transition-colors"
        >
          <CalendarIcon size={18} /> Cita
        </button>
        <button 
          onClick={() => setShowRutaModal(true)}
          className="flex-1 bg-red-50 border border-red-100 text-red-700 hover:bg-red-100 font-bold text-[11px] sm:text-xs py-2.5 rounded-xl shadow-sm flex flex-col justify-center items-center gap-1 transition-colors"
        >
          <Activity size={18} /> Activar Ruta
        </button>
      </div>

      {showSeguimientoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">{editingSeguimiento ? 'Editar Seguimiento' : 'Nuevo Seguimiento'}</h2>
              <button onClick={() => setShowSeguimientoModal(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <form onSubmit={handleAddSeguimiento} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha *</label>
                  <input required name="fecha" type="date" defaultValue={editingSeguimiento?.fecha || new Date().toISOString().split('T')[0]} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo *</label>
                  <select required name="tipoSeguimiento" defaultValue={editingSeguimiento?.tipoSeguimiento || 'Estudiante'} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="Estudiante">Estudiante</option>
                    <option value="Padre de familia">Padre de familia</option>
                    <option value="Docente">Docente</option>
                    <option value="Externo (Salud/ICBF)">Externo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción del seguimiento *</label>
                <textarea required name="descripcion" rows="4" defaultValue={editingSeguimiento?.descripcion || ''} placeholder="Escribe los detalles..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                    <Paperclip size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Soporte de atención</p>
                    <p className="text-[10px] text-slate-500">¿Se entregó documento de soporte?</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="hasSoporte" defaultChecked={editingSeguimiento?.hasSoporte} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSeguimientoModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {showCitaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Agendar Cita</h2>
              <button onClick={() => setShowCitaModal(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <form onSubmit={handleAddCita} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha *</label>
                  <input required name="fecha" type="date" defaultValue={new Date().toISOString().split('T')[0]} min={new Date().toISOString().split('T')[0]} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hora Inicio *</label>
                    <input required name="horaInicio" type="time" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hora Fin *</label>
                    <input required name="horaFin" type="time" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Cita *</label>
                  <select required name="tipoCita" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="Cita con estudiante">Cita con estudiante</option>
                    <option value="Reunión con padre de familia">Reunión con padre de familia</option>
                    <option value="Cita con docente">Cita con docente</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detalle (Opcional)</label>
                  <input name="descripcion" type="text" placeholder="Ej. Traer acudiente..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <Paperclip size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Requiere soporte</p>
                      <p className="text-[10px] text-slate-500">¿El citado debe traer soporte?</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="requiereSoporte" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCitaModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Agendar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showRutaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-red-700 flex items-center gap-2"><Activity size={20}/> Activar Ruta</h2>
              <button onClick={() => setShowRutaModal(false)} className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <form onSubmit={handleAddRuta} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Entidad a remitir *</label>
                  <select required name="entidad" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white">
                    <option value="Sector Salud (EPS/Hospital)">Sector Salud (EPS/Hospital)</option>
                    <option value="ICBF">ICBF</option>
                    <option value="Policía de Infancia y Adolescencia">Policía de Infancia y Adolescencia</option>
                    <option value="Comisaría de Familia">Comisaría de Familia</option>
                    <option value="Fiscalía">Fiscalía</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motivo principal de activación *</label>
                  <input required name="motivo" type="text" placeholder="Ej. Presunto maltrato, ideación suicida..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones / Detalles *</label>
                  <textarea required name="descripcion" rows="3" placeholder="Describe los hechos para la remisión..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"></textarea>
                </div>
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex gap-3 items-start mt-2">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-800 leading-relaxed font-medium">Al guardar, este proceso quedará registrado permanentemente en el historial como una activación formal de ruta interinstitucional.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowRutaModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm shadow-red-600/30">Activar Ruta</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
