import { useState, useEffect } from 'react';
import { caseService } from '../services/caseService';

let casesCache = [];
let casesInFlight = null;
const casesListeners = new Set();

const publishCases = (data) => {
  casesCache = Array.isArray(data) ? data : [];
  casesListeners.forEach((listener) => listener(casesCache));
};

const updateCaseInCache = (caseId, updater) => {
  publishCases(casesCache.map((caseItem) => (
    caseItem.id === caseId ? updater(caseItem) : caseItem
  )));
};

const readCases = async ({ force = false } = {}) => {
  if (!force && casesCache.length > 0) {
    return casesCache;
  }

  if (!force && casesInFlight) return casesInFlight;

  casesInFlight = caseService.getCases()
    .then((data) => {
      publishCases(data);
      return casesCache;
    })
    .finally(() => {
      casesInFlight = null;
    });

  return casesInFlight;
};

export const useCases = () => {
  const [cases, setCases] = useState(casesCache);

  const refreshCases = async ({ force = true } = {}) => {
    const data = await readCases({ force });
    setCases(data);
    return data;
  };

  useEffect(() => {
    casesListeners.add(setCases);
    readCases();

    return () => {
      casesListeners.delete(setCases);
    };
  }, []);

  const createCase = async (caseData) => {
    const result = await caseService.createCase(caseData);
    publishCases([result, ...casesCache.filter((caseItem) => caseItem.id !== result.id)]);
    await refreshCases({ force: true });
    return result;
  };

  const updateCase = async (id, updates) => {
    const result = await caseService.updateCase({ ...updates, id });
    updateCaseInCache(id, (caseItem) => ({ ...caseItem, ...result }));
    await refreshCases({ force: true });
    return result;
  };

  const closeCase = async (id) => {
    const result = await caseService.closeCase(id);
    await refreshCases({ force: true });
    return result;
  };

  const deleteCase = async (id) => {
    const result = await caseService.deleteCase(id);
    publishCases(casesCache.filter((caseItem) => caseItem.id !== id));
    await refreshCases({ force: true });
    return result;
  };

  const addSeguimiento = async (caseId, segData) => {
    const result = await caseService.addSeguimiento(caseId, segData);
    updateCaseInCache(caseId, (caseItem) => ({
      ...caseItem,
      seguimientos: [...(caseItem.seguimientos || []), result]
    }));
    await refreshCases({ force: true });
    return result;
  };

  const updateSeguimiento = async (caseId, segId, data) => {
    const result = await caseService.updateSeguimiento(caseId, segId, data);
    updateCaseInCache(caseId, (caseItem) => ({
      ...caseItem,
      seguimientos: (caseItem.seguimientos || []).map((seg) =>
        seg.id === segId ? { ...seg, ...result } : seg
      )
    }));
    await refreshCases({ force: true });
    return result;
  };

  const deleteSeguimiento = async (caseId, segId) => {
    const result = await caseService.deleteSeguimiento(caseId, segId);
    updateCaseInCache(caseId, (caseItem) => ({
      ...caseItem,
      seguimientos: (caseItem.seguimientos || []).map((seg) =>
        seg.id === segId
          ? { ...seg, eliminado: true, fechaEliminacion: new Date().toISOString() }
          : seg
      )
    }));
    await refreshCases({ force: true });
    return result;
  };

  return {
    cases,
    refreshCases,
    createCase,
    updateCase,
    closeCase,
    deleteCase,
    addSeguimiento,
    updateSeguimiento,
    deleteSeguimiento
  };
};
