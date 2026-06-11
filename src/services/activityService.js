// src/services/activityService.js
const API_BASE = '/api';

const parseError = async (res) => {
  const fallback = `HTTP ${res.status}`;
  try {
    const payload = await res.json();
    return payload.error || payload.message || fallback;
  } catch {
    return fallback;
  }
};

const buildActivitiesUrl = (caseId) => {
  if (caseId === undefined || caseId === null || caseId === '') {
    return `${API_BASE}/activities`;
  }
  return `${API_BASE}/activities?caseId=${encodeURIComponent(caseId)}`;
};

export const activityService = {
  getActivities: async (caseId) => {
    try {
      const res = await fetch(buildActivitiesUrl(caseId));
      if (!res.ok) throw new Error(await parseError(res));
      return await res.json();
    } catch (error) {
      console.error(`Failed to fetch activities for case ${caseId}:`, error);
      return [];
    }
  },

  createActivity: async (activityData) => {
    try {
      const res = await fetch(`${API_BASE}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      });
      if (!res.ok) throw new Error(await parseError(res));
      return await res.json();
    } catch (error) {
      console.error('Failed to create activity:', error);
      throw error;
    }
  },

  updateActivity: async (activityOrId, updates = null) => {
    const activityData = typeof activityOrId === 'object'
      ? activityOrId
      : { ...(updates || {}), id: activityOrId };

    try {
      const res = await fetch(`${API_BASE}/activities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      });
      if (!res.ok) throw new Error(await parseError(res));
      return await res.json();
    } catch (error) {
      console.error('Failed to update activity:', error);
      throw error;
    }
  },

  updateActivityStatus: async (id, status) => {
    return activityService.updateActivity(id, { estado: status });
  },

  deleteActivity: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/activities`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error(await parseError(res));
      return await res.json();
    } catch (error) {
      console.error('Failed to delete activity:', error);
      throw error;
    }
  },

  deleteRecurrenceSeries: async (recurrenceId) => {
    try {
      const res = await fetch(`${API_BASE}/activities`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recurrenceId })
      });
      if (!res.ok) throw new Error(await parseError(res));
      return await res.json();
    } catch (error) {
      console.error('Failed to delete recurrence series:', error);
      throw error;
    }
  }
};
