import { useState, useEffect } from 'react';
import { activityService } from '../services/activityService';

let activitiesCache = [];
let activitiesInFlight = null;
const activitiesListeners = new Set();

const publishActivities = (data) => {
  activitiesCache = Array.isArray(data) ? data : [];
  activitiesListeners.forEach((listener) => listener(activitiesCache));
};

const readActivities = async ({ force = false } = {}) => {
  if (!force && activitiesCache.length > 0) {
    return activitiesCache;
  }

  if (!force && activitiesInFlight) return activitiesInFlight;

  activitiesInFlight = activityService.getActivities()
    .then((data) => {
      publishActivities(data);
      return activitiesCache;
    })
    .finally(() => {
      activitiesInFlight = null;
    });

  return activitiesInFlight;
};

export const useActivities = () => {
  const [activities, setActivities] = useState(activitiesCache);

  const refreshActivities = async ({ force = true } = {}) => {
    const data = await readActivities({ force });
    setActivities(data);
    return data;
  };

  useEffect(() => {
    activitiesListeners.add(setActivities);
    readActivities();

    return () => {
      activitiesListeners.delete(setActivities);
    };
  }, []);

  const createActivity = async (data) => {
    const result = await activityService.createActivity(data);
    publishActivities([result, ...activitiesCache.filter((activity) => activity.id !== result.id)]);
    await refreshActivities({ force: true });
    return result;
  };

  const updateStatus = async (id, status) => {
    const result = await activityService.updateActivityStatus(id, status);
    publishActivities(activitiesCache.map((activity) =>
      activity.id === id ? { ...activity, ...result } : activity
    ));
    await refreshActivities({ force: true });
    return result;
  };

  const deleteActivity = async (id) => {
    const result = await activityService.deleteActivity(id);
    publishActivities(activitiesCache.filter((activity) => activity.id !== id));
    await refreshActivities({ force: true });
    return result;
  };

  const deleteRecurrenceSeries = async (recurrenceId) => {
    const result = await activityService.deleteRecurrenceSeries(recurrenceId);
    publishActivities(activitiesCache.filter((activity) => activity.recurrenceId !== recurrenceId));
    await refreshActivities({ force: true });
    return result;
  };

  const updateActivity = async (id, data) => {
    const result = await activityService.updateActivity(id, data);
    publishActivities(activitiesCache.map((activity) =>
      activity.id === id ? { ...activity, ...result } : activity
    ));
    await refreshActivities({ force: true });
    return result;
  };

  return {
    activities,
    refreshActivities,
    createActivity,
    updateStatus,
    deleteActivity,
    deleteRecurrenceSeries,
    updateActivity
  };
};
