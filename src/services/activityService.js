import { saveData, readData } from '../utils/storage';
import { initialActivities } from '../data/mockActivities';

const ACT_KEY = 'tilo_activities';

export const activityService = {
  initActivities: () => {
    const existing = readData(ACT_KEY);
    if (!existing) {
      saveData(ACT_KEY, initialActivities);
    } else {
      // Check for overdue activities
      activityService.checkOverdue();
    }
  },

  getActivities: () => {
    return readData(ACT_KEY) || [];
  },

  createActivity: (activityData) => {
    const acts = activityService.getActivities();
    const newAct = {
      ...activityData,
      id: `act-${Date.now()}`,
      estado: activityData.estado || 'Programada',
      prioridad: activityData.prioridad || 'Media',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveData(ACT_KEY, [...acts, newAct]);
    return newAct;
  },

  updateActivityStatus: (id, newStatus) => {
    const acts = activityService.getActivities();
    const index = acts.findIndex(a => a.id === id);
    if (index !== -1) {
      acts[index] = { 
        ...acts[index], 
        estado: newStatus,
        color: (newStatus === 'Realizada' || newStatus === 'Completada') ? 'green' : 
               (newStatus === 'Pendiente') ? 'orange' : 
               (newStatus === 'Cancelada' || newStatus === 'No asistió') ? 'slate' : acts[index].color,
        updatedAt: new Date().toISOString() 
      };
      saveData(ACT_KEY, acts);
      return acts[index];
    }
    return null;
  },

  updateActivity: (id, activityData) => {
    const acts = activityService.getActivities();
    const index = acts.findIndex(a => a.id === id);
    if (index !== -1) {
      acts[index] = { 
        ...acts[index], 
        ...activityData,
        updatedAt: new Date().toISOString() 
      };
      saveData(ACT_KEY, acts);
      return acts[index];
    }
    return null;
  },

  deleteActivity: (id) => {
    const acts = activityService.getActivities();
    const filtered = acts.filter(a => a.id !== id);
    saveData(ACT_KEY, filtered);
    return true;
  },

  deleteRecurrenceSeries: (recurrenceId) => {
    const acts = activityService.getActivities();
    const filtered = acts.filter(a => a.recurrenceId !== recurrenceId);
    saveData(ACT_KEY, filtered);
    return true;
  },

  checkOverdue: () => {
    const acts = activityService.getActivities();
    let updated = false;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    acts.forEach(act => {
      if (act.estado === 'Programada' || act.estado === 'En curso') {
        if (act.fecha < today) {
          act.estado = 'Vencida';
          act.color = 'red';
          updated = true;
        }
      }
    });

    if (updated) {
      saveData(ACT_KEY, acts);
    }
  }
};
