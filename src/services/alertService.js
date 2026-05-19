import { saveData, readData, subscribe } from '../utils/storage';
import { alertsMock } from '../data/alertsMock';
import { caseService } from './caseService';
import { activityService } from './activityService';
import { getCurrentPeriod, getPeriodByDate, ACADEMIC_PERIODS } from '../utils/periodUtils';

const ALERTS_KEY = 'tilo_alerts';

export const alertService = {
  initAlerts: () => {
    const existing = readData(ALERTS_KEY);
    if (!existing) {
      saveData(ALERTS_KEY, alertsMock);
    }

    alertService.generateAlerts();

    const unsubCases = subscribe('tilo_cases', () => alertService.generateAlerts());
    const unsubActivities = subscribe('tilo_activities', () => alertService.generateAlerts());

    return () => {
      unsubCases();
      unsubActivities();
    };
  },

  getAlerts: () => {
    return readData(ALERTS_KEY) || [];
  },

  markAsAttended: (id) => {
    const alerts = alertService.getAlerts();
    const index = alerts.findIndex(a => a.id === id);
    if (index !== -1) {
      alerts[index] = { ...alerts[index], estado: 'Atendida', updatedAt: new Date().toISOString() };
      saveData(ALERTS_KEY, alerts);
      return alerts[index];
    }
    return null;
  },

  createAlert: (alertData) => {
    const alerts = alertService.getAlerts();
    
    // Prevent duplicates based on specific criteria (e.g. caseId + tipo + título)
    if (alertData.caseId) {
      const exists = alerts.find(a => 
        a.caseId === alertData.caseId && 
        a.titulo === alertData.titulo && 
        a.estado !== 'Atendida'
      );
      if (exists) return exists;
    }
    
    if (alertData.activityId) {
      const exists = alerts.find(a => 
        a.activityId === alertData.activityId && 
        a.titulo === alertData.titulo && 
        a.estado !== 'Atendida'
      );
      if (exists) return exists;
    }

    const newAlert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveData(ALERTS_KEY, [newAlert, ...alerts]);
    return newAlert;
  },

  /**
   * Evaluates rules across Cases and Activities to generate dynamic alerts
   */
  generateAlerts: () => {
    const cases = caseService.getCases() || [];
    const activities = activityService.getActivities() || [];
    const today = new Date().toISOString().split('T')[0];
    
    cases.forEach(c => {
      if (c.estado !== 'Cerrado') {
        // High Risk Alert
        if (c.nivelRiesgo === 'Alto' || c.nivelRiesgo === 'Prioritario') {
          alertService.createAlert({
            tipo: 'Caso',
            titulo: 'Caso en alto riesgo',
            descripcion: `El ${c.codigo} requiere revisión prioritaria.`,
            prioridad: 'Prioritaria',
            estado: 'Activa',
            fecha: today,
            sede: c.sede,
            grado: c.grado,
            caseId: c.id,
            codigoCaso: c.codigo,
            estudiante: c.estudiante,
            accionSugerida: 'Revisar caso',
            rutaDestino: 'casos'
          });
        }

        // Alerta de Identificación Faltante
        if (!c.identificacion || c.identificacion.toString().startsWith('case-')) {
          alertService.createAlert({
            tipo: 'Caso',
            titulo: 'Falta número de identificación',
            descripcion: `El ${c.codigo} (${c.estudiante}) no tiene un número de identificación registrado.`,
            prioridad: 'Media',
            estado: 'Pendiente',
            fecha: today,
            sede: c.sede,
            grado: c.grado,
            caseId: c.id,
            codigoCaso: c.codigo,
            estudiante: c.estudiante,
            accionSugerida: 'Completar identificación',
            rutaDestino: 'casos'
          });
        }

        // Inasistencias a citaciones por parte de padres registradas en los seguimientos del caso
        const seguimientosCitasPadres = (c.seguimientos || []).filter(seg => 
          seg.esCita === true && 
          (seg.tipoSeguimiento === 'Cita: Reunión con padre de familia' || seg.tipoSeguimiento === 'Cita: Reunión acudiente') &&
          seg.citaResultadoId
        );

        const missedParentActs = seguimientosCitasPadres.filter(segCita => {
          const resultado = (c.seguimientos || []).find(s => s.id === segCita.citaResultadoId);
          // Verificar si el resultado indica explícitamente que NO asistió (asistio === false)
          return resultado && resultado.asistio === false && !resultado.eliminado;
        });
        
        const missedCount = missedParentActs.length;

        // (Se eliminó la alerta individual por cada inasistencia a petición del usuario,
        // ya que la acción inmediata es volver a citar, por lo que no requieren una alerta por separado.
        // Solo se mantiene la alerta prioritaria al acumular 3 inasistencias).

        // 2. Alerta prioritaria ICBF a las 3 inasistencias y registro en bitácora
        const isIcbfActivated = c.rutaActivada && (Array.isArray(c.rutaActivada) ? c.rutaActivada.includes('ICBF') : c.rutaActivada === 'ICBF');

        if (missedCount >= 3) {
          if (!isIcbfActivated) {
            alertService.createAlert({
              tipo: 'Citación',
              titulo: 'Necesidad de remisión a ICBF',
              descripcion: `El ${c.codigo} acumula ${missedCount} inasistencias de padres de familia. Se requiere remisión prioritaria a ICBF.`,
              prioridad: 'Prioritaria',
              estado: 'Activa',
              fecha: today,
              sede: c.sede,
              caseId: c.id,
              codigoCaso: c.codigo,
              estudiante: c.estudiante,
              accionSugerida: 'Iniciar ruta ICBF',
              rutaDestino: 'casos'
            });

            // Inyectar seguimiento en la bitácora del caso si no existe
            const hasIcbfSeguimiento = c.seguimientos?.some(seg => 
              seg.descripcion?.includes('remisión a ICBF') && seg.eliminado !== true
            );

            if (!hasIcbfSeguimiento) {
              caseService.addSeguimiento(c.id, {
                fecha: today,
                tipoSeguimiento: 'Otro',
                descripcion: `[ALERTA AUTOMÁTICA] Se han registrado ${missedCount} inasistencias por parte de los padres de familia a citaciones programadas. Se genera reporte de necesidad de remisión a ICBF.\n\nAcuerdos: Iniciar trámite de remisión a ICBF según protocolo interno.`,
                responsable: 'Sistema (Automático)'
              });
            }
          } else {
            // Si ya se activó la ruta con ICBF, buscar la alerta prioritaria activa y marcarla como Atendida
            const alerts = alertService.getAlerts();
            const existingAlert = alerts.find(a => 
              a.caseId === c.id && 
              a.titulo === 'Necesidad de remisión a ICBF' && 
              a.estado !== 'Atendida'
            );
            if (existingAlert) {
              alertService.markAsAttended(existingAlert.id);
            }
          }
        }

        // Logic for mandatory follow-ups (Student, Teacher, Parent) per period
        const creationDate = new Date(c.createdAt);
        const creationYear = creationDate.getFullYear();
        const currentYear = new Date().getFullYear();
        const currentPeriod = getCurrentPeriod();
        
        // If the case is from a previous year, start from Period 1 of current year.
        // Otherwise start from the period it was created.
        const startPeriodId = creationYear < currentYear ? 1 : getPeriodByDate(c.createdAt).id;
        
        // Only check academic periods 1, 2, and 3 (id 0 is recess)
        const targetPeriods = [1, 2, 3].filter(pId => pId >= startPeriodId && pId <= currentPeriod.id);

        targetPeriods.forEach(pId => {
          const pConfig = ACADEMIC_PERIODS.find(p => p.id === pId);
          const pName = pConfig ? pConfig.name : `${pId}er Periodo`;
          
          const segsInPeriod = (c.seguimientos || []).filter(s => {
            if (s.eliminado) return false;
            const segDate = new Date(s.fecha);
            return getPeriodByDate(s.fecha).id === pId && segDate.getFullYear() === currentYear;
          });

          const typesToCheck = [
            { key: 'Estudiante', label: 'Estudiante' },
            { key: 'Docente', label: 'Docente' },
            { key: 'Padre de familia', label: 'Padre de Familia' }
          ];

          typesToCheck.forEach(type => {
            const hasFollowup = segsInPeriod.some(s => s.tipoSeguimiento === type.key);
            
            if (!hasFollowup) {
              alertService.createAlert({
                tipo: 'Seguimiento',
                titulo: `Seguimiento pendiente: ${type.label}`,
                descripcion: `Falta el seguimiento con ${type.label.toLowerCase()} para el ${pName} en el ${c.codigo}.`,
                prioridad: 'Media',
                estado: 'Pendiente',
                fecha: today,
                sede: c.sede,
                grado: c.grado,
                caseId: c.id,
                codigoCaso: c.codigo,
                estudiante: c.estudiante,
                periodoId: pId,
                periodoNombre: pName,
                tipoFaltante: type.key,
                accionSugerida: `Registrar seguimiento con ${type.label.toLowerCase()}`,
                rutaDestino: 'casos'
              });
            } else {
              // Si ya tiene el seguimiento, buscamos si hay una alerta pendiente para marcarla como atendida
              const alerts = alertService.getAlerts();
              const existingAlert = alerts.find(a => 
                a.caseId === c.id && 
                a.tipo === 'Seguimiento' && 
                a.titulo === `Seguimiento pendiente: ${type.label}` &&
                a.estado !== 'Atendida'
              );
              
              if (existingAlert) {
                alertService.markAsAttended(existingAlert.id);
              }
            }
          });
        });
      }
    });

    activities.forEach(a => {
      // Overdue Activities
      if (a.estado === 'Vencida') {
        alertService.createAlert({
          tipo: 'Vencimiento',
          titulo: 'Actividad vencida sin completar',
          descripcion: `La actividad "${a.titulo}" aparece vencida.`,
          prioridad: 'Alta',
          estado: 'Vencida',
          fecha: a.fecha,
          hora: a.horaInicio,
          sede: a.sede,
          activityId: a.id,
          actividadRelacionada: a.titulo,
          accionSugerida: 'Actualizar estado',
          rutaDestino: 'actividades'
        });
      }
    });
  }
};
