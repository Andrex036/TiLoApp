// src/services/alertService.js
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

const buildAlertsUrl = (caseId, options = {}) => {
  const params = new URLSearchParams();

  if (caseId !== undefined && caseId !== null && caseId !== '') {
    params.set('caseId', String(caseId));
  }

  if (options.autogen) {
    params.set('autogen', '1');
  }

  const query = params.toString();
  return query ? `${API_BASE}/alerts?${query}` : `${API_BASE}/alerts`;
};

export const alertService = {
  getAlerts: async (caseId, options = {}) => {
    try {
      const res = await fetch(buildAlertsUrl(caseId, options));
      if (!res.ok) throw new Error(await parseError(res));
      return await res.json();
    } catch (error) {
      console.error(`Failed to fetch alerts for case ${caseId}:`, error);
      return [];
    }
  },

  createAlert: async (alertData) => {
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      if (!res.ok) throw new Error(await parseError(res));
      return await res.json();
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  },

  updateAlert: async (alertData) => {
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      if (!res.ok) throw new Error(await parseError(res));
      return await res.json();
    } catch (error) {
      console.error('Failed to update alert:', error);
      throw error;
    }
  },

  deleteAlert: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error(await parseError(res));
      return await res.json();
    } catch (error) {
      console.error('Failed to delete alert:', error);
      throw error;
    }
  },

  markAsAttended: async (id) => {
    return alertService.updateAlert({ id, estado: 'Atendida', activo: false });
  },

  generateAlerts: async () => {
    return alertService.getAlerts(undefined, { autogen: true });
  }
};
