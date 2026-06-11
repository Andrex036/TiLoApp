import { query } from '../../../db.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { caseId, seguimientoId } = req.query;
    if (!caseId || !seguimientoId) {
      return res.status(400).json({ error: 'Missing caseId or seguimientoId' });
    }

    const current = await readSeguimientos(caseId);
    if (!current) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const index = current.seguimientos.findIndex((seg) => seg.id === seguimientoId);
    if (index === -1) {
      return res.status(404).json({ error: 'Seguimiento not found' });
    }

    if (req.method === 'PUT') {
      const updates = req.body || {};
      const merged = {
        ...current.seguimientos[index],
        ...updates,
        editado: true,
        ultimaEdicion: new Date().toISOString()
      };

      const updated = [...current.seguimientos];
      updated[index] = merged;
      await writeSeguimientos(caseId, current.data, updated);

      return res.status(200).json(merged);
    }

    if (req.method === 'DELETE') {
      const target = current.seguimientos[index];
      const softDeleted = {
        ...target,
        eliminado: true,
        fechaEliminacion: new Date().toISOString()
      };

      const updated = [...current.seguimientos];
      updated[index] = softDeleted;
      await writeSeguimientos(caseId, current.data, updated);

      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Seguimiento item API error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
