import { useState, useEffect } from 'react';
import { alertService } from '../services/alertService';
import { subscribe } from '../utils/storage';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    alertService.initAlerts();
    setAlerts(alertService.getAlerts());

    const unsubscribe = subscribe('tilo_alerts', (newData) => {
      if (newData) setAlerts(newData);
    });

    return () => unsubscribe();
  }, []);

  const markAsAttended = (id) => alertService.markAsAttended(id);
  const triggerAlertGeneration = () => alertService.generateAlerts();

  return {
    alerts,
    markAsAttended,
    triggerAlertGeneration
  };
};
