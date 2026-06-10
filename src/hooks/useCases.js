import { useState, useEffect } from 'react';
import { caseService } from '../services/caseService';

export const useCases = () => {
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchCases = async () => {
      const data = await caseService.getCases();
      setCases(Array.isArray(data) ? data : []);
    };

    fetchCases();
  }, []);

  const createCase = async (caseData) => {
    const result = await caseService.createCase(caseData);
    // Refresh cases list after successful creation
    const updatedCases = await caseService.getCases();
    setCases(Array.isArray(updatedCases) ? updatedCases : []);
    return result;
  };
  const updateCase = (id, updates) => caseService.updateCase({ ...updates, id });
  const closeCase = (id) => caseService.closeCase(id);
  const addSeguimiento = (caseId, segData) => caseService.addSeguimiento(caseId, segData);

  return {
    cases,
    createCase,
    updateCase,
    closeCase,
    deleteCase: (id) => caseService.deleteCase(id),
    addSeguimiento,
    updateSeguimiento: (caseId, segId, data) => caseService.updateSeguimiento(caseId, segId, data),
    deleteSeguimiento: (caseId, segId) => caseService.deleteSeguimiento(caseId, segId)
  };
};
