import { useState, useEffect } from 'react';
import { caseService } from '../services/caseService';
import { subscribe } from '../utils/storage';

export const useCases = () => {
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchCases = async () => {
      const data = await caseService.getCases();
      setCases(Array.isArray(data) ? data : []);
    };

    fetchCases();

    // Subscribe to changes in local storage key
    const unsubscribe = subscribe('tilo_cases', (newData) => {
      if (newData) setCases(Array.isArray(newData) ? newData : []);
    });

    return () => unsubscribe();
  }, []);

  const createCase = (caseData) => caseService.createCase(caseData);
  const updateCase = (id, updates) => caseService.updateCase(id, updates);
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
