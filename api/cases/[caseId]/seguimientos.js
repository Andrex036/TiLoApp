import { query } from '../../db.js';

const readSeguimientos = async (caseId) => {
  const result = await query('SELECT data FROM cases WHERE id=$1', [caseId]);
  if (result.rows.length === 0) {
    return null;
  }

  const data = result.rows[0].data || {};
  const seguimientos = Array.isArray(data.seguimientos) ? data.seguimientos : [];
  return { data, seguimientos };
};

const writeSeguimientos = async (caseId, data, seguimientos) => {
  const nextData = { ...data, seguimientos };
  await query(
    'UPDATE cases SET data=$1::jsonb, updatedat=NOW() WHERE id=$2',
    [JSON.stringify(nextData), caseId]
  );
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const caseId = req.query.caseId;
    if (!caseId) {
      return res.status(400).json({ error: 'Missing caseId' });
    }

    const current = await readSeguimientos(caseId);
    if (!current) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (req.method === 'GET') {
      return res.status(200).json(current.seguimientos);
    }

    if (req.method === 'POST') {
      const payload = req.body || {};
      const newSeguimiento = {
        id: payload.id || `seg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fecha: payload.fecha || new Date().toISOString().split('T')[0],
        tipoSeguimiento: payload.tipoSeguimiento || 'Seguimiento',
        descripcion: payload.descripcion || '',
        ...payload
      };

      const updated = [...current.seguimientos, newSeguimiento];
      await writeSeguimientos(caseId, current.data, updated);

      return res.status(201).json(newSeguimiento);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Seguimientos API error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
