// src/services/alertService.js
const API_BASE = '/api';

export const alertService = {
  /**
   * Get alerts for a case
   */
  getAlerts: async (caseId) => {
    try {
      const res = await fetch(`${API_BASE}/alerts?caseId=${caseId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`Failed to fetch alerts for case ${caseId}:`, error);
      return [];
    }
  },

  /**
   * Create a new alert
   */
  createAlert: async (alertData) => {
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  },

  /**
   * Update an alert
   */
  updateAlert: async (alertData) => {
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Failed to update alert:', error);
      throw error;
    }
  },

  /**
   * Delete an alert
   */
  deleteAlert: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Failed to delete alert:', error);
      throw error;
    }
  }
};
