// src/services/activityService.js
const API_BASE = '/api';

export const activityService = {
  /**
   * Get activities for a case
   */
  getActivities: async (caseId) => {
    try {
      const res = await fetch(`${API_BASE}/activities?caseId=${caseId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      console.error(`Failed to fetch activities for case ${caseId}:`, error);
      return [];
    }
  },

  /**
   * Create a new activity
   */
  createActivity: async (activityData) => {
    try {
      const res = await fetch(`${API_BASE}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('Failed to create activity:', error);
      throw error;
    }
  },

  /**
   * Update an activity
   */
  updateActivity: async (activityData) => {
    try {
      const res = await fetch(`${API_BASE}/activities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('Failed to update activity:', error);
      throw error;
    }
  },

  /**
   * Delete an activity
   */
  deleteActivity: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/activities`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (error) {
      console.error('Failed to delete activity:', error);
      throw error;
    }
  }
};
