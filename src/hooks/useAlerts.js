import { useState, useEffect } from 'react';
import { alertService } from '../services/alertService';

let alertsCache = [];
let alertsInFlight = null;
const alertsListeners = new Set();

const publishAlerts = (data) => {
  alertsCache = Array.isArray(data) ? data : [];
  alertsListeners.forEach((listener) => listener(alertsCache));
};

const readAlerts = async ({ force = false, autogen = false } = {}) => {
  if (!force && alertsCache.length > 0) {
    return alertsCache;
  }

  if (!force && alertsInFlight) return alertsInFlight;

  alertsInFlight = alertService.getAlerts(undefined, { autogen })
    .then((data) => {
      publishAlerts(data);
      return alertsCache;
    })
    .finally(() => {
      alertsInFlight = null;
    });

  return alertsInFlight;
};

export const useAlerts = () => {
  const [alerts, setAlerts] = useState(alertsCache);

  const refreshAlerts = async ({ force = true, autogen = false } = {}) => {
    const data = await readAlerts({ force, autogen });
    setAlerts(data);
    return data;
  };

  useEffect(() => {
    alertsListeners.add(setAlerts);
    readAlerts({ autogen: true });

    return () => {
      alertsListeners.delete(setAlerts);
    };
  }, []);

  const markAsAttended = async (id) => {
    publishAlerts(alertsCache.map((alert) =>
      alert.id === id ? { ...alert, estado: 'Atendida', activo: false } : alert
    ));

    try {
      const result = await alertService.markAsAttended(id);
      await refreshAlerts({ force: true });
      return result;
    } catch (error) {
      await refreshAlerts({ force: true });
      throw error;
    }
  };

  const triggerAlertGeneration = async () => {
    return refreshAlerts({ force: true, autogen: true });
  };

  const createAlert = async (alertData) => {
    const result = await alertService.createAlert(alertData);
    publishAlerts([result, ...alertsCache.filter((alert) => alert.id !== result.id)]);
    await refreshAlerts({ force: true });
    return result;
  };

  return {
    alerts,
    refreshAlerts,
    markAsAttended,
    triggerAlertGeneration,
    createAlert
  };
};
