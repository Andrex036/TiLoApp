// api/activities.js
import { query } from './db.js';

export default async function handler(req, res) {
  // Enable CORS
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
      const { caseId } = req.query;

      if (caseId) {
        const result = await query(
          'SELECT * FROM activities WHERE caseId=$1 ORDER BY fecha DESC',
          [caseId]
        );
        res.status(200).json(result.rows);
      } else {
        const result = await query('SELECT * FROM activities ORDER BY fecha DESC');
        res.status(200).json(result.rows);
      }
    } else if (req.method === 'POST') {
      const { id, caseId, tipo, descripcion, fecha, resultado } = req.body;

      if (!id || !caseId || !tipo) {
        return res.status(400).json({ error: 'Missing required fields: id, caseId, tipo' });
      }

      const caseCheck = await query('SELECT id FROM cases WHERE id=$1', [caseId]);
      if (caseCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const result = await query(
        'INSERT INTO activities (id, caseId, tipo, descripcion, fecha, resultado, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *',
        [id, caseId, tipo, descripcion, fecha, resultado]
      );

      res.status(201).json(result.rows[0]);
    } else if (req.method === 'PUT') {
      const { id, tipo, descripcion, fecha, resultado } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }

      const result = await query(
        'UPDATE activities SET tipo=$1, descripcion=$2, fecha=$3, resultado=$4, updatedAt=NOW() WHERE id=$5 RETURNING *',
        [tipo, descripcion, fecha, resultado, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      res.status(200).json(result.rows[0]);
    } else if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }

      const result = await query('DELETE FROM activities WHERE id=$1 RETURNING *', [id]);

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
