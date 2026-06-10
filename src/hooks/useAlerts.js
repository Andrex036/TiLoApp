import { useState, useEffect } from 'react';
import { alertService } from '../services/alertService';
import { subscribe } from '../utils/storage';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const data = await alertService.getAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    };

    fetchAlerts();

    const unsubscribe = subscribe('tilo_alerts', (newData) => {
      if (newData) setAlerts(Array.isArray(newData) ? newData : []);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const markAsAttended = (id) => alertService.markAsAttended(id);
  const triggerAlertGeneration = () => alertService.generateAlerts();
  const createAlert = (alertData) => alertService.createAlert(alertData);

  return {
    alerts,
    markAsAttended,
    triggerAlertGeneration,
    createAlert
  };
};
