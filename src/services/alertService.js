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
    
    // Generar alertas iniciales
    alertService.generateAlerts();

    // Suscribirse a cambios en casos para regenerar alertas automáticamente
    subscribe('tilo_cases', () => {
      alertService.generateAlerts();
    });
    
    // También suscribirse a actividades
    subscribe('tilo_activities', () => {
      alertService.generateAlerts();
    });
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
            accionSugerida: 'Revisar caso',
            rutaDestino: 'casos'
          });
        }

        // 3 missed citations
        const missed = c.citaciones ? c.citaciones.filter(cit => cit.estado === 'No asistió').length : 0;
        if (missed >= 3) {
          alertService.createAlert({
            tipo: 'Citación',
            titulo: 'Tres citaciones incumplidas',
            descripcion: `El ${c.codigo} acumula tres citaciones incumplidas.`,
            prioridad: 'Prioritaria',
            estado: 'Activa',
            fecha: today,
            sede: c.sede,
            caseId: c.id,
            codigoCaso: c.codigo,
            accionSugerida: 'Revisar historial',
            rutaDestino: 'casos'
          });
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
                a.periodoId === pId && 
                a.tipoFaltante === type.key &&
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
