import { useState, useEffect } from 'react';
import { activityService } from '../services/activityService';
import { subscribe } from '../utils/storage';

export const useActivities = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    activityService.initActivities();
    setActivities(activityService.getActivities());

    const unsubscribe = subscribe('tilo_activities', (newData) => {
      if (newData) setActivities(newData);
    });

    return () => unsubscribe();
  }, []);

  const createActivity = (data) => activityService.createActivity(data);
  const updateStatus = (id, status) => activityService.updateActivityStatus(id, status);
  const deleteActivity = (id) => activityService.deleteActivity(id);
  const deleteRecurrenceSeries = (recurrenceId) => activityService.deleteRecurrenceSeries(recurrenceId);
  const updateActivity = (id, data) => activityService.updateActivity(id, data);

  return {
    activities,
    createActivity,
    updateStatus,
    deleteActivity,
    deleteRecurrenceSeries,
    updateActivity
  };
};
