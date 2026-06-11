import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Calendar as CalendarIcon, FileText, CheckCircle2, AlertTriangle, User, MapPin, Activity, Paperclip, MoreVertical, TrendingUp, XCircle, Edit2, X } from 'lucide-react'
import { useCases } from '../hooks/useCases'
import { useActivities } from '../hooks/useActivities'
import { useAlerts } from '../hooks/useAlerts'

export default function CasoDetalle({ caseId, onBack, onEdit }) {
  const { cases, addSeguimiento, updateCase, updateSeguimiento, deleteSeguimiento, closeCase } = useCases()
  const { activities, createActivity, updateActivity, deleteActivity } = useActivities()
  const { alerts, markAsAttended, createAlert, triggerAlertGeneration } = useAlerts()
  const [activeTab, setActiveTab] = useState('seguimientos') // seguimientos, info
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false)
  const [showCitaModal, setShowCitaModal] = useState(false)
  const [showRutaModal, setShowRutaModal] = useState(false)
  const [showConfirmCitaModal, setShowConfirmCitaModal] = useState(false)
  const [citaParaConfirmar, setCitaParaConfirmar] = useState(null)
  const [editingSeguimiento, setEditingSeguimiento] = useState(null)
  const [showConfigMenu, setShowConfigMenu] = useState(false)
  const [showConfirmSoporteModal, setShowConfirmSoporteModal] = useState(false)
  const [saludAlertToConfirm, setSaludAlertToConfirm] = useState(null)
  const [asistioSelection, setAsistioSelection] = useState('')
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [submittingCitaResult, setSubmittingCitaResult] = useState(false)
  const [submittingAction, setSubmittingAction] = useState('')

  const caseData = cases.find(c => c.id === caseId)
  const activeSeguimientos = (caseData?.seguimientos || []).filter((seg) => !seg?.eliminado)
  const hasSeguimientoType = (requiredType) => activeSeguimientos.some((seg) => seg?.tipoSeguimiento === requiredType)
  const isCaseAlertSatisfied = (alert) => {
    if (alert?.tipo !== 'Seguimiento') return false
    const sourceKey = alert.sourceKey || ''

    if (sourceKey.includes('auto-case-no-followup')) {
      return activeSeguimientos.length > 0
    }

    if (sourceKey.includes('padre-de-familia') || alert.titulo?.includes('Padre de familia')) {
      return hasSeguimientoType('Padre de familia')
    }

    if (sourceKey.includes('docente') || alert.titulo?.includes('Docente')) {
      return hasSeguimientoType('Docente')
    }

    if (sourceKey.includes('estudiante') || alert.titulo?.includes('Estudiante')) {
      return hasSeguimientoType('Estudiante')
    }

    return false
  }
  const visibleSeguimientoAlerts = (alerts || []).filter((alert) =>
    alert.caseId === caseId
    && alert.tipo === 'Seguimiento'
    && alert.estado !== 'Atendida'
    && !isCaseAlertSatisfied(alert)
  )
  const visibleRutaSaludAlerts = (alerts || []).filter((alert) =>
    alert.caseId === caseId
    && alert.tipo === 'RutaSalud'
    && alert.estado !== 'Atendida'
  )

  const refreshCaseAlerts = async () => {
    try {
      await triggerAlertGeneration()
    } catch (error) {
      console.error('Error refreshing case alerts:', error)
    }
  }

  const getLinkedCitaActivity = (seguimientoId) => {
    return activities.find(act => act.caseId === caseId && act.citaSeguimientoId === seguimientoId) || null
  }

  const syncCitaActivity = async (seguimiento, { action = 'update', result } = {}) => {
    const linkedActivity = getLinkedCitaActivity(seguimiento?.id)
    if (!linkedActivity) return

    if (action === 'delete') {
      await deleteActivity(linkedActivity.id)
      return
    }

    if (action === 'restore') {
      await updateActivity(linkedActivity.id, {
        estado: 'Programada',
        color: 'blue'
      })
      return
    }

    if (action === 'result') {
      const nextStatus = result?.asistio ? 'Realizada' : 'No asistió'
      await updateActivity(linkedActivity.id, {
        estado: nextStatus,
        color: result?.asistio ? 'green' : 'slate'
      })
      return
    }

    await updateActivity(linkedActivity.id, {
      fecha: seguimiento.fecha,
      descripcion: seguimiento.descripcion,
      estado: linkedActivity.estado === 'Cancelada' ? 'Cancelada' : linkedActivity.estado,
      color: linkedActivity.color
    })
  }

  useEffect(() => {
    if (showSeguimientoModal || showCitaModal || showRutaModal || showConfirmCitaModal || showConfirmSoporteModal) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [showSeguimientoModal, showCitaModal, showRutaModal, showConfirmCitaModal, showConfirmSoporteModal]);

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-500">
        <p>Caso no encontrado.</p>
        <button onClick={onBack} className="mt-4 text-blue-600 font-bold">Volver</button>
      </div>
    )
  }

  const handleAddSeguimiento = async (e) => {
    e.preventDefault()
    if (submittingAction) return
    setSubmittingAction('seguimiento')
    try {
    const formData = new FormData(e.target)
    
    if (editingSeguimiento) {
      const updates = {
        fecha: formData.get('fecha'),
        tipoSeguimiento: formData.get('tipoSeguimiento'),
        descripcion: formData.get('descripcion'),
      }
      if (editingSeguimiento.esCita) {
        updates.requiereSoporte = formData.get('hasSoporte') === 'on'
      } else {
        updates.hasSoporte = formData.get('hasSoporte') === 'on'
      }
      await updateSeguimiento(caseId, editingSeguimiento.id, updates)
      if (editingSeguimiento.esCita) {
        await syncCitaActivity({
          ...editingSeguimiento,
          ...updates
        })
      }
      setEditingSeguimiento(null)
    } else {
      await addSeguimiento(caseId, {
        fecha: formData.get('fecha'),
        tipoSeguimiento: formData.get('tipoSeguimiento'),
        descripcion: formData.get('descripcion'),
        hasSoporte: formData.get('hasSoporte') === 'on',
        responsable: 'Orientación Escolar'
      })
    }
    setShowSeguimientoModal(false)
    await refreshCaseAlerts()
    } finally {
      setSubmittingAction('')
    }
  }

  const handleDeleteSeguimiento = (segId) => {
    if (confirm('¿Estás seguro de eliminar este seguimiento? Quedará un registro de la eliminación.')) {
      void (async () => {
      const targetSeg = caseData.seguimientos.find(s => s.id === segId);
      if (targetSeg?.esCita) {
        const linkedResult = targetSeg.citaResultadoId
          ? caseData.seguimientos.find(s => s.id === targetSeg.citaResultadoId)
          : null
        if (linkedResult) {
          await deleteSeguimiento(caseId, linkedResult.id)
        }
        await syncCitaActivity(targetSeg, { action: 'delete' })
      }
      if (targetSeg?.esCitaResultado) {
        const originalCita = caseData.seguimientos.find(s => s.citaResultadoId === segId);
        if (originalCita) {
          await updateSeguimiento(caseId, originalCita.id, {
            citaConfirmada: false,
            citaResultadoId: null
          });
          await syncCitaActivity(originalCita, { action: 'restore' })
        }
      }
      await deleteSeguimiento(caseId, segId)
      await refreshCaseAlerts()
      })()
    }
  }

  const handleEditSeguimiento = (seg) => {
    setEditingSeguimiento(seg)
    if (seg.esCitaResultado) {
      const originalCita = caseData.seguimientos.find(s => s.citaResultadoId === seg.id);
      setCitaParaConfirmar(originalCita || { requiereSoporte: seg.trajoSoporte !== null });
      setShowConfirmCitaModal(true);
    } else {
      setShowSeguimientoModal(true);
    }
  }

  const handleAddCita = async (e) => {
    e.preventDefault()
    if (submittingAction) return
    setSubmittingAction('cita')
    try {
    const formData = new FormData(e.target)
    const horaInicio = formData.get('horaInicio')
    const horaFin = formData.get('horaFin')
    if (horaFin <= horaInicio) {
      alert('La hora de fin debe ser posterior a la hora de inicio.')
      return
    }
    const citaSeguimiento = await addSeguimiento(caseId, {
      fecha: new Date().toISOString().split('T')[0],
      tipoSeguimiento: `Cita: ${formData.get('tipoCita')}`,
      descripcion: `Agendada para: ${formData.get('fecha')} de ${formData.get('horaInicio')} a ${formData.get('horaFin')}\nDetalles: ${formData.get('descripcion') || 'N/A'}`,
      responsable: 'Orientación Escolar',
      esCita: true,
      requiereSoporte: formData.get('requiereSoporte') === 'on',
      citaConfirmada: false,
      citaResultadoId: null
    })

    await createActivity({
      titulo: `Cita: ${caseData.estudiante}`,
      fecha: formData.get('fecha'),
      horaInicio: formData.get('horaInicio'),
      horaFin: formData.get('horaFin'),
      sede: caseData.sede,
      tipo: formData.get('tipoCita'),
      descripcion: formData.get('descripcion'),
      responsable: 'Orientación',
      prioridad: caseData.nivelRiesgo === 'Alto' || caseData.nivelRiesgo === 'Prioritario' ? 'Alta' : 'Media',
      color: 'blue',
      caseId,
      citaSeguimientoId: citaSeguimiento?.id ?? null
    })

    setShowCitaModal(false)
    await refreshCaseAlerts()
    alert("Cita agendada exitosamente. Podrás verla en el módulo de Actividades.")
    } finally {
      setSubmittingAction('')
    }
  }

  const handleConfirmarCita = async (e) => {
    e.preventDefault()
    if (submittingCitaResult) return
    setSubmittingCitaResult(true)

    try {
    const formData = new FormData(e.target)
    const asistio = formData.get('asistio')

    // Validar hora fin > hora inicio para reprogramación
    if (asistio === 'cancelar') {
      const horaInicio = formData.get('newHoraInicio')
      const horaFin = formData.get('newHoraFin')
      if (horaFin <= horaInicio) {
        alert('La hora de fin debe ser posterior a la hora de inicio.')
        return
      }

      const newFecha = formData.get('newFecha')
      const motivoCancelacion = formData.get('motivoCancelacion')?.trim() || 'Sin especificar'

      // 1. Crear seguimiento de cancelación
      await addSeguimiento(caseId, {
        fecha: new Date().toISOString().split('T')[0],
        tipoSeguimiento: 'Cita cancelada',
        descripcion: `${citaParaConfirmar.tipoSeguimiento}\nMotivo: ${motivoCancelacion}\nReprogramada para: ${newFecha} de ${horaInicio} a ${horaFin}`,
        responsable: 'Orientación Escolar'
      })

      await updateSeguimiento(caseId, citaParaConfirmar.id, {
        citaConfirmada: true,
        citaCancelada: true,
        citaResultadoId: null
      })

      // 2. Crear nueva cita con nueva fecha/hora
      const newCitaSeguimiento = await addSeguimiento(caseId, {
        fecha: new Date().toISOString().split('T')[0],
        tipoSeguimiento: citaParaConfirmar.tipoSeguimiento,
        descripcion: `Agendada para: ${newFecha} de ${horaInicio} a ${horaFin}\nDetalles: Reprogramación\nMotivo cancelación anterior: ${motivoCancelacion}`,
        responsable: 'Orientación Escolar',
        esCita: true,
        requiereSoporte: citaParaConfirmar.requiereSoporte,
        citaConfirmada: false,
        citaResultadoId: null
      })

      // 3. Crear nueva actividad para la nueva cita
      const tipoCita = citaParaConfirmar.tipoSeguimiento.replace('Cita: ', '')
      await createActivity({
        titulo: `Cita: ${caseData.estudiante} (Reprogramada)`,
        fecha: newFecha,
        horaInicio: horaInicio,
        horaFin: horaFin,
        sede: caseData.sede,
        tipo: tipoCita,
        descripcion: formData.get('descripcion')?.trim() || `Reprogramación - motivo: ${motivoCancelacion}`,
        responsable: 'Orientación',
        prioridad: caseData.nivelRiesgo === 'Alto' || caseData.nivelRiesgo === 'Prioritario' ? 'Alta' : 'Media',
        color: 'blue',
        caseId,
        citaSeguimientoId: newCitaSeguimiento?.id ?? null
      })

      // 4. Eliminar la actividad antigua
      const linkedActivity = getLinkedCitaActivity(citaParaConfirmar.id)
      if (linkedActivity) {
        await deleteActivity(linkedActivity.id)
      }

      setShowConfirmCitaModal(false)
      setCitaParaConfirmar(null)
      setEditingSeguimiento(null)
      setAsistioSelection('')
      await refreshCaseAlerts()
      alert('Cita cancelada y reprogramada exitosamente.')
      return
    }

    // Lógica original para "Sí asistió" y "No se presentó"
    const trajoSoporte = formData.get('trajoSoporte') === 'si'
    const observaciones = formData.get('observaciones')?.trim()

    const lineas = [
      `Asistió: ${asistio === 'si' ? 'Sí' : 'No'}`,
      citaParaConfirmar.requiereSoporte ? `Trajo soporte: ${trajoSoporte ? 'Sí' : 'No'}` : null,
      observaciones ? `Observaciones: ${observaciones}` : null
    ].filter(Boolean).join('\n')

    if (editingSeguimiento) {
      await updateSeguimiento(caseId, editingSeguimiento.id, {
        descripcion: lineas,
        observaciones,
        asistio: asistio === 'si',
        trajoSoporte: citaParaConfirmar.requiereSoporte ? trajoSoporte : null
      })
      await updateSeguimiento(caseId, citaParaConfirmar.id, {
        citaConfirmada: true,
        citaCancelada: false,
        citaResultadoId: editingSeguimiento.id
      })
      await syncCitaActivity(citaParaConfirmar, {
        action: 'result',
        result: { asistio: asistio === 'si' }
      })
      setEditingSeguimiento(null)
    } else {
      const resultSeg = await addSeguimiento(caseId, {
        fecha: new Date().toISOString().split('T')[0],
        tipoSeguimiento: 'Resultado de cita',
        descripcion: lineas,
        observaciones,
        responsable: 'Orientación Escolar',
        esCitaResultado: true,
        asistio: asistio === 'si',
        trajoSoporte: citaParaConfirmar.requiereSoporte ? trajoSoporte : null
      })

      await updateSeguimiento(caseId, citaParaConfirmar.id, {
        citaConfirmada: true,
        citaCancelada: false,
        citaResultadoId: resultSeg?.id ?? null
      })
      await syncCitaActivity(citaParaConfirmar, {
        action: 'result',
        result: { asistio: asistio === 'si' }
      })
    }

    setShowConfirmCitaModal(false)
    setCitaParaConfirmar(null)
    setAsistioSelection('')
    await refreshCaseAlerts()
    } catch (error) {
      console.error('Error confirming cita:', error)
      alert('No se pudo confirmar la asistencia. Intenta nuevamente.')
    } finally {
      setSubmittingCitaResult(false)
    }
  }

  const handleAddRuta = async (e) => {
    e.preventDefault()
    if (submittingAction) return
    setSubmittingAction('ruta')
    try {
    const formData = new FormData(e.target)
    const entidad = formData.get('entidad')
    const today = new Date().toISOString().split('T')[0]

    // 1. Add follow-up record
    await addSeguimiento(caseId, {
      fecha: today,
      tipoSeguimiento: `Activación Ruta: ${entidad}`,
      descripcion: `Entidad: ${entidad}\nMotivo: ${formData.get('motivo')}\nObservaciones: ${formData.get('descripcion')}`,
      responsable: 'Orientación Escolar'
    })

    // 2. Update case's activated routes for reporting
    const currentRoutes = caseData.rutaActivada
      ? (Array.isArray(caseData.rutaActivada) ? caseData.rutaActivada : [caseData.rutaActivada])
      : [];

    if (!currentRoutes.includes(entidad)) {
      await updateCase(caseId, {
        rutaActivada: [...currentRoutes, entidad]
      });
    }

    // 3. Si es Sector Salud, crear alerta prioritaria para verificar soporte de atención
    if (entidad === 'Sector Salud (EPS/Hospital)') {
      await createAlert({
        tipo: 'RutaSalud',
        titulo: 'Pendiente: soporte de atención en salud',
        descripcion: `Ruta activada con Sector Salud para ${caseData.estudiante} (${caseData.codigo}). Motivo: ${formData.get('motivo')}. Verificar recepción del documento de soporte de atención médica.`,
        prioridad: 'Prioritaria',
        estado: 'Activa',
        fecha: today,
        sede: caseData.sede,
        grado: caseData.grado,
        caseId,
        codigoCaso: caseData.codigo,
        estudiante: caseData.estudiante,
        accionSugerida: 'Verificar entrega de soporte',
        rutaDestino: 'casos'
      })
    }

    setShowRutaModal(false)
    await refreshCaseAlerts()
    alert(`Ruta con ${entidad} activada exitosamente.`)
    } finally {
      setSubmittingAction('')
    }
  }

  const handleUpdateStatus = async (updates) => {
    if (submittingAction) return
    setSubmittingAction('status')
    try {
    await updateCase(caseId, updates)
    setShowConfigMenu(false)
    alert("Caso actualizado correctamente")
    } finally {
      setSubmittingAction('')
    }
  }

  const handleConfirmSoporteSalud = async (e) => {
    e.preventDefault()
    if (submittingAction) return
    setSubmittingAction('soporte')
    try {
    const formData = new FormData(e.target)
    const recibiDocumento = formData.get('recibiDocumento') === 'si'
    const observaciones = formData.get('observaciones')?.trim()

    // Registrar seguimiento de la verificación
    await addSeguimiento(caseId, {
      fecha: new Date().toISOString().split('T')[0],
      tipoSeguimiento: 'Externo (Salud/ICBF)',
      descripcion: [
        `Verificación de soporte de atención en salud.`,
        `Documento recibido: ${recibiDocumento ? 'Sí' : 'No'}`,
        observaciones ? `Observaciones: ${observaciones}` : null
      ].filter(Boolean).join('\n'),
      responsable: 'Orientación Escolar',
      hasSoporte: recibiDocumento
    })

    // Si se recibió, marcar la alerta como atendida
    if (recibiDocumento) {
      await markAsAttended(saludAlertToConfirm.id)
    }

    setShowConfirmSoporteModal(false)
    setSaludAlertToConfirm(null)
    await refreshCaseAlerts()
    } finally {
      setSubmittingAction('')
    }
  }

  const getObservacionesVal = (seg) => {
    if (!seg) return '';
    if (seg.observaciones !== undefined) return seg.observaciones;
    const lines = seg.descripcion?.split('\n') || [];
    const obsLine = lines.find(l => l.startsWith('Observaciones: '));
    return obsLine ? obsLine.replace('Observaciones: ', '') : '';
  };

  return (
    <div className="w-full bg-slate-50 flex flex-col relative">
      {/* Encabezado */}
      <header className="bg-white px-5 py-4 border-b border-slate-200 sticky top-0 z-20 flex items-center gap-4 shadow-sm">
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
                  onClick={() => {
                    setShowConfigMenu(false);
                    if (onEdit) onEdit(caseData);
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <FileText size={18} className="text-blue-500" /> Editar Información
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

      <div className="flex-1 px-5 py-6 space-y-6 max-w-4xl mx-auto w-full">
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
        {visibleSeguimientoAlerts.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-600" /> Alertas de seguimiento
            </h2>
            <div className="space-y-2">
              {visibleSeguimientoAlerts.map(alert => (
                <div key={alert.id} className="bg-white/60 border border-orange-100 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-orange-900">{alert.titulo}</p>
                    <p className="text-[10px] text-orange-700">{alert.descripcion}</p>
                  </div>
                  <button
                    onClick={() => setShowSeguimientoModal(true)}
                    className="text-[10px] font-bold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors shrink-0"
                  >
                    Registrar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerta prioritaria: soporte de atención en salud pendiente */}
        {visibleRutaSaludAlerts.map(saludAlert => (
          <div key={saludAlert.id} className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 shadow-sm animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0 border border-red-200">
                <Activity size={18} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    Prioritaria
                  </span>
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-wide">Sector Salud</span>
                </div>
                <h2 className="text-sm font-bold text-red-900 leading-tight">{saludAlert.titulo}</h2>
                <p className="text-[11px] text-red-700/80 mt-1 leading-relaxed">{saludAlert.descripcion}</p>
              </div>
            </div>
            <button
              onClick={() => { setSaludAlertToConfirm(saludAlert); setShowConfirmSoporteModal(true); }}
              className="w-full py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm shadow-red-600/20"
            >
              <CheckCircle2 size={14} /> Verificar entrega de soporte
            </button>
          </div>
        ))}

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
                            <div className="flex gap-2 items-center flex-wrap">
                              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">{seg.tipoSeguimiento}</span>
                              {seg.hasSoporte && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">
                                  <Paperclip size={10} /> Soporte
                                </span>
                              )}
                              {seg.esCita && seg.requiereSoporte && !seg.citaConfirmada && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                                  <Paperclip size={10} /> Requiere soporte
                                </span>
                              )}
                              {seg.esCita && seg.citaConfirmada && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">
                                  <CheckCircle2 size={10} /> Confirmada
                                </span>
                              )}
                              {seg.esCitaResultado && seg.asistio && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">
                                  <CheckCircle2 size={10} /> Asistió
                                </span>
                              )}
                              {seg.esCitaResultado && !seg.asistio && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded-md">
                                  <XCircle size={10} /> No se presentó
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
                          {seg.esCita && !seg.esCitaResultado && !seg.citaConfirmada && (() => {
                            const linkedActivity = getLinkedCitaActivity(seg.id)
                            if (!linkedActivity) return null

                            const appointmentDate = linkedActivity.fecha
                            const appointmentTime = linkedActivity.horaInicio
                            const now = new Date()
                            const today = now.toISOString().split('T')[0]
                            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')

                            // Only show button if appointment date is today or earlier AND current time is at/past appointment start
                            const canConfirm = appointmentDate <= today && (appointmentDate < today || appointmentTime <= currentTime)

                            return canConfirm ? (
                              <button
                                type="button"
                                onClick={() => { setEditingSeguimiento(null); setCitaParaConfirmar(seg); setShowConfirmCitaModal(true) }}
                                className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition-colors"
                              >
                                <CheckCircle2 size={14} /> Confirmar asistencia
                              </button>
                            ) : null
                          })()}

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
      <div 
        className="sticky bg-white border-t border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] p-4 flex gap-2 z-20 w-full"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 74px)' }}
      >
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
                    {editingSeguimiento && !['Estudiante', 'Padre de familia', 'Docente', 'Externo (Salud/ICBF)'].includes(editingSeguimiento.tipoSeguimiento) && (
                      <option value={editingSeguimiento.tipoSeguimiento}>{editingSeguimiento.tipoSeguimiento}</option>
                    )}
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
                    <p className="text-xs font-bold text-slate-700">
                      {editingSeguimiento?.esCita ? 'Requiere soporte' : 'Soporte de atención'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {editingSeguimiento?.esCita ? '¿El citado debe traer soporte?' : '¿Se entregó documento de soporte?'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="hasSoporte" defaultChecked={editingSeguimiento?.hasSoporte || editingSeguimiento?.requiereSoporte} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSeguimientoModal(false)} disabled={submittingAction === 'seguimiento'} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={submittingAction === 'seguimiento'} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors">{submittingAction === 'seguimiento' ? 'Guardando...' : 'Guardar'}</button>
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
                  <button type="button" onClick={() => setShowCitaModal(false)} disabled={submittingAction === 'cita'} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" disabled={submittingAction === 'cita'} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors">{submittingAction === 'cita' ? 'Guardando...' : 'Agendar'}</button>
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
                  <button type="button" onClick={() => setShowRutaModal(false)} disabled={submittingAction === 'ruta'} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" disabled={submittingAction === 'ruta'} className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-red-600/30">{submittingAction === 'ruta' ? 'Guardando...' : 'Activar Ruta'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showConfirmSoporteModal && saludAlertToConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-red-100 flex justify-between items-center bg-red-50 shrink-0">
              <h2 className="text-base font-bold text-red-800 flex items-center gap-2">
                <Activity size={18} className="text-red-600" /> Verificar soporte de salud
              </h2>
              <button
                type="button"
                onClick={() => { setShowConfirmSoporteModal(false); setSaludAlertToConfirm(null); }}
                className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-xs text-red-800 font-medium leading-relaxed">
                {saludAlertToConfirm.descripcion}
              </div>
              <form onSubmit={handleConfirmSoporteSalud} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    ¿Se recibió el documento de soporte de atención? *
                  </label>
                  <select
                    required
                    name="recibiDocumento"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="">-- Selecciona --</option>
                    <option value="si">Sí, se recibió el documento</option>
                    <option value="no">No, aún no se ha recibido</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    La alerta se cerrará solo si se confirma la recepción del documento.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones (Opcional)</label>
                  <textarea
                    name="observaciones"
                    rows="3"
                    placeholder="Notas adicionales sobre el soporte de atención..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  ></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowConfirmSoporteModal(false); setSaludAlertToConfirm(null); }}
                    disabled={submittingAction === 'soporte'}
                    className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction === 'soporte'}
                    className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm shadow-red-600/30"
                  >
                    Registrar verificación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showConfirmCitaModal && citaParaConfirmar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-blue-600" /> {editingSeguimiento ? 'Editar resultado de cita' : 'Confirmar asistencia'}
              </h2>
              <button
                type="button"
                onClick={() => { setShowConfirmCitaModal(false); setCitaParaConfirmar(null); setEditingSeguimiento(null); setAsistioSelection(''); }}
                className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <form onSubmit={handleConfirmarCita} className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs text-blue-800 font-medium">
                  {citaParaConfirmar.tipoSeguimiento} — {citaParaConfirmar.descripcion?.split('\n')[0]}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">¿Asistió a la cita? *</label>
                  <select
                    required
                    name="asistio"
                    value={asistioSelection}
                    onChange={(e) => setAsistioSelection(e.target.value)}
                    defaultValue={editingSeguimiento ? (editingSeguimiento.asistio ? 'si' : 'no') : ''}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Selecciona --</option>
                    <option value="si">Sí asistió</option>
                    <option value="no">No se presentó</option>
                    <option value="cancelar">Cancelar cita para reagendar</option>
                  </select>
                </div>

                {/* Campos para "Sí asistió" y "No se presentó" */}
                {(asistioSelection === 'si' || asistioSelection === 'no') && (
                  <>
                    {citaParaConfirmar.requiereSoporte && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">¿Trajo soporte? *</label>
                        <select
                          required
                          name="trajoSoporte"
                          defaultValue={editingSeguimiento ? (editingSeguimiento.trajoSoporte ? 'si' : 'no') : ''}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">-- Selecciona --</option>
                          <option value="si">Sí trajo soporte</option>
                          <option value="no">No trajo soporte</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones (Opcional)</label>
                      <textarea
                        name="observaciones"
                        rows="3"
                        defaultValue={editingSeguimiento ? getObservacionesVal(editingSeguimiento) : ''}
                        placeholder="Notas adicionales sobre la cita..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>
                  </>
                )}

                {/* Campos para "Cancelar cita para reagendar" */}
                {asistioSelection === 'cancelar' && (
                  <>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                      <p className="text-xs font-bold text-orange-900">Reprogramación de cita</p>
                      <p className="text-[10px] text-orange-700 mt-1">Selecciona la nueva fecha y horario para esta cita.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nueva fecha *</label>
                      <input
                        required
                        name="newFecha"
                        type="date"
                        min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Hora Inicio *</label>
                        <input
                          required
                          name="newHoraInicio"
                          type="time"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Hora Fin *</label>
                        <input
                          required
                          name="newHoraFin"
                          type="time"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de cancelación *</label>
                      <textarea
                        required
                        name="motivoCancelacion"
                        rows="2"
                        placeholder="Ej. No asistió, reagendó por motivos personales..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Detalles adicionales (Opcional)</label>
                      <textarea
                        name="descripcion"
                        rows="2"
                        placeholder="Notas sobre la reprogramación..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowConfirmCitaModal(false); setCitaParaConfirmar(null); setEditingSeguimiento(null); setAsistioSelection(''); }}
                    disabled={submittingCitaResult}
                    className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!asistioSelection || submittingCitaResult}
                    className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors"
                  >
                    {submittingCitaResult
                      ? 'Guardando...'
                      : asistioSelection === 'cancelar'
                      ? 'Reagendar cita'
                      : editingSeguimiento
                      ? 'Guardar'
                      : 'Registrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
