// api/activities.js
import { query } from './db.js';

const normalizeCaseId = (caseId) => {
  if (caseId === undefined || caseId === null) return null;
  if (typeof caseId !== 'string') return String(caseId);
  const trimmed = caseId.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
  return trimmed;
};

const mapActivityRow = (row) => {
  const extra = row.data || {};
  return {
    id: row.id,
    caseId: row.caseId ?? null,
    tipo: extra.tipo ?? row.tipo,
    descripcion: extra.descripcion ?? row.descripcion,
    fecha: extra.fecha ?? row.fecha,
    resultado: extra.resultado ?? row.resultado ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...extra
  };
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const requestedCaseId = normalizeCaseId(req.query.caseId);
      const selectSql = `
        SELECT
          id,
          caseid AS "caseId",
          tipo,
          descripcion,
          TO_CHAR(fecha::date, 'YYYY-MM-DD') AS fecha,
          resultado,
          data,
          createdat AS "createdAt",
          updatedat AS "updatedAt"
        FROM activities
      `;

      if (requestedCaseId) {
        const result = await query(`${selectSql} WHERE caseid=$1 ORDER BY fecha DESC, createdat DESC`, [requestedCaseId]);
        res.status(200).json(result.rows.map(mapActivityRow));
      } else {
        const result = await query(`${selectSql} ORDER BY fecha DESC, createdat DESC`);
        res.status(200).json(result.rows.map(mapActivityRow));
      }
    } else if (req.method === 'POST') {
      const payload = req.body || {};
      const id = payload.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const caseId = normalizeCaseId(payload.caseId);
      const tipo = payload.tipo || 'Actividad';
      const descripcion = payload.descripcion || payload.titulo || '';
      const fecha = payload.fecha || new Date().toISOString().split('T')[0];
      const resultado = payload.resultado || payload.estado || null;
      const data = { ...payload, id, caseId, tipo, descripcion, fecha, resultado };

      if (caseId) {
        const caseCheck = await query('SELECT id FROM cases WHERE id=$1', [caseId]);
        if (caseCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Case not found' });
        }
      }

      const result = await query(
        'INSERT INTO activities (id, caseid, tipo, descripcion, fecha, resultado, data, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW()) RETURNING id, caseid AS "caseId", tipo, descripcion, TO_CHAR(fecha::date, \'YYYY-MM-DD\') AS fecha, resultado, data, createdat AS "createdAt", updatedat AS "updatedAt"',
        [id, caseId, tipo, descripcion, fecha, resultado, JSON.stringify(data)]
      );

      res.status(201).json(mapActivityRow(result.rows[0]));
    } else if (req.method === 'PUT') {
      const payload = req.body || {};
      const { id } = payload;

      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }

      const current = await query('SELECT id, caseid AS "caseId", tipo, descripcion, TO_CHAR(fecha::date, \'YYYY-MM-DD\') AS fecha, resultado, data FROM activities WHERE id=$1', [id]);
      if (current.rows.length === 0) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      const merged = { ...(current.rows[0].data || {}), ...payload, id };
      const caseId = normalizeCaseId(merged.caseId);
      const tipo = merged.tipo || current.rows[0].tipo;
      const descripcion = merged.descripcion || current.rows[0].descripcion;
      const fecha = merged.fecha || current.rows[0].fecha;
      const resultado = merged.resultado || merged.estado || current.rows[0].resultado;

      const result = await query(
        'UPDATE activities SET caseid=$1, tipo=$2, descripcion=$3, fecha=$4, resultado=$5, data=$6::jsonb, updatedat=NOW() WHERE id=$7 RETURNING id, caseid AS "caseId", tipo, descripcion, TO_CHAR(fecha::date, \'YYYY-MM-DD\') AS fecha, resultado, data, createdat AS "createdAt", updatedat AS "updatedAt"',
        [caseId, tipo, descripcion, fecha, resultado, JSON.stringify(merged), id]
      );

      res.status(200).json(mapActivityRow(result.rows[0]));
    } else if (req.method === 'DELETE') {
      const { id, recurrenceId } = req.body || {};

      if (recurrenceId) {
        const deleted = await query(
          'DELETE FROM activities WHERE data->>\'recurrenceId\' = $1 RETURNING id',
          [recurrenceId]
        );
        return res.status(200).json({ success: true, deletedCount: deleted.rows.length });
      }

      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }

      const result = await query('DELETE FROM activities WHERE id=$1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
