import { saveData, readData } from '../utils/storage';
import { initialCases } from '../data/mockCases';

const CASES_KEY = 'tilo_cases';

export const caseService = {
  /**
   * Initializes cases if storage is empty
   */
  initCases: () => {
    const existing = readData(CASES_KEY);
    if (!existing) {
      saveData(CASES_KEY, initialCases);
    }
  },

  /**
   * Get all cases
   */
  getCases: () => {
    return readData(CASES_KEY) || [];
  },

  /**
   * Create a new case
   */
  createCase: (caseData) => {
    const cases = caseService.getCases();
    const newId = caseData.identificacion || caseData.id || `case-${Date.now()}`;
    const maxNum = cases.reduce((max, c) => {
      const match = c.codigo?.match(/\d+/);
      return match ? Math.max(max, parseInt(match[0])) : max;
    }, 100);
    const newCase = {
      ...caseData,
      id: newId,
      identificacion: caseData.identificacion || newId,
      codigo: `Caso #${maxNum + 1}`,
      tipoCaso: 'Nuevo',
      estado: 'Activo',
      seguimientos: [],
      citaciones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveData(CASES_KEY, [...cases, newCase]);
    return newCase;
  },

  /**
   * Update an existing case
   */
  updateCase: (id, updates) => {
    const cases = caseService.getCases();
    const index = cases.findIndex(c => c.id === id);
    if (index !== -1) {
      cases[index] = { ...cases[index], ...updates, updatedAt: new Date().toISOString() };
      saveData(CASES_KEY, cases);
      return cases[index];
    }
    return null;
  },

  /**
   * Add follow-up to a case
   */
  addSeguimiento: (caseId, seguimientoData) => {
    const cases = caseService.getCases();
    const index = cases.findIndex(c => c.id === caseId);
    if (index !== -1) {
      const nuevoSeguimiento = {
        ...seguimientoData,
        id: `seg-${Date.now()}`,
        caseId
      };
      cases[index].seguimientos.push(nuevoSeguimiento);
      cases[index].updatedAt = new Date().toISOString();
      saveData(CASES_KEY, cases);
      return nuevoSeguimiento;
    }
    return null;
  },

  /**
   * Update follow-up
   */
  updateSeguimiento: (caseId, seguimientoId, updates) => {
    const cases = caseService.getCases();
    const caseIndex = cases.findIndex(c => c.id === caseId);
    if (caseIndex !== -1) {
      const segIndex = cases[caseIndex].seguimientos.findIndex(s => s.id === seguimientoId);
      if (segIndex !== -1) {
        cases[caseIndex].seguimientos[segIndex] = {
          ...cases[caseIndex].seguimientos[segIndex],
          ...updates,
          editado: true,
          ultimaEdicion: new Date().toISOString()
        };
        cases[caseIndex].updatedAt = new Date().toISOString();
        saveData(CASES_KEY, cases);
        return cases[caseIndex].seguimientos[segIndex];
      }
    }
    return null;
  },

  /**
   * Soft delete follow-up
   */
  deleteSeguimiento: (caseId, seguimientoId) => {
    const cases = caseService.getCases();
    const caseIndex = cases.findIndex(c => c.id === caseId);
    if (caseIndex !== -1) {
      const segIndex = cases[caseIndex].seguimientos.findIndex(s => s.id === seguimientoId);
      if (segIndex !== -1) {
        cases[caseIndex].seguimientos[segIndex] = {
          ...cases[caseIndex].seguimientos[segIndex],
          eliminado: true,
          fechaEliminacion: new Date().toISOString()
        };
        cases[caseIndex].updatedAt = new Date().toISOString();
        saveData(CASES_KEY, cases);
        return true;
      }
    }
    return false;
  },

  /**
   * Close a case
   */
  closeCase: (id) => {
    return caseService.updateCase(id, { estado: 'Cerrado' });
  },

  /**
   * Delete a case
   */
  deleteCase: (id) => {
    const cases = caseService.getCases();
    if (!cases.some(c => c.id === id)) return false;
    saveData(CASES_KEY, cases.filter(c => c.id !== id));
    return true;
  }
};
