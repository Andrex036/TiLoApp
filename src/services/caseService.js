const API_BASE = '/api';

export const caseService = {
  /**
   * Get all cases from database
   */
  getCases: async () => {
    try {
      const res = await fetch(`${API_BASE}/cases`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      return [];
    }
  },

  /**
   * Create a new case
   */
  createCase: async (caseData) => {
    try {
      const res = await fetch(`${API_BASE}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Failed to create case:', error);
      throw error;
    }
  },

  /**
   * Update an existing case
   */
  updateCase: async (caseData) => {
    try {
      const res = await fetch(`${API_BASE}/cases`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Failed to update case:', error);
      throw error;
    }
  },

  /**
   * Delete a case
   */
  deleteCase: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/cases`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Failed to delete case:', error);
      throw error;
    }
  },

  /**
   * Add follow-up to a case
   */
  addSeguimiento: async (caseId, seguimientoData) => {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/seguimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seguimientoData)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Failed to add seguimiento:', error);
      throw error;
    }
  },

  /**
   * Update follow-up
   */
  updateSeguimiento: async (caseId, seguimientoId, updates) => {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/seguimientos/${seguimientoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Failed to update seguimiento:', error);
      throw error;
    }
  },

  /**
   * Soft delete follow-up
   */
  deleteSeguimiento: async (caseId, seguimientoId) => {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/seguimientos/${seguimientoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Failed to delete seguimiento:', error);
      throw error;
    }
  },

  /**
   * Close a case
   */
  closeCase: async (id) => {
    try {
      return await caseService.updateCase({ id, estado: 'Cerrado' });
    } catch (error) {
      console.error('Failed to close case:', error);
      throw error;
    }
  }
};
