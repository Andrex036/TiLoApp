// api/cases.js
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
      const result = await query('SELECT * FROM cases ORDER BY createdAt DESC');
      // Merge data column fields with base fields for frontend
      const cases = result.rows.map(c => ({
        ...c,
        ...(c.data || {})
      }));
      res.status(200).json(cases);
    } else if (req.method === 'POST') {
      const { id, identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin, ...additionalData } = req.body;

      if (!id || !nombre) {
        return res.status(400).json({ error: 'Missing required fields: id, nombre' });
      }

      // Try to insert with additional fields, fallback to basic fields if schema doesn't support them
      try {
        const dataJson = JSON.stringify(additionalData);
        const result = await query(
          'INSERT INTO cases (id, identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin, data, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) RETURNING *',
          [id, identificacion, codigo, nombre, descripcion, tipoCaso, estado || 'Activo', fechaInicio, fechaFin, dataJson]
        );
        // Merge response data with additional fields
        const caseData = { ...result.rows[0], ...additionalData };
        res.status(201).json(caseData);
      } catch (schemaError) {
        // Fallback: Insert with basic schema only
        const result = await query(
          'INSERT INTO cases (id, identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *',
          [id, identificacion, codigo, nombre, descripcion, tipoCaso, estado || 'Activo', fechaInicio, fechaFin]
        );
        // Merge response data with additional fields for client
        const caseData = { ...result.rows[0], ...additionalData };
        res.status(201).json(caseData);
      }
    } else if (req.method === 'PUT') {
      const { id, identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin, ...additionalData } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }

      try {
        // Try with additional fields first
        const dataJson = JSON.stringify(additionalData);
        const result = await query(
          'UPDATE cases SET identificacion=$1, codigo=$2, nombre=$3, descripcion=$4, tipoCaso=$5, estado=$6, fechaInicio=$7, fechaFin=$8, data=$9, updatedAt=NOW() WHERE id=$10 RETURNING *',
          [identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin, dataJson, id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Case not found' });
        }

        // Merge response with additional fields
        const caseData = { ...result.rows[0], ...additionalData };
        res.status(200).json(caseData);
      } catch (schemaError) {
        // Fallback: Update with basic schema only
        const result = await query(
          'UPDATE cases SET identificacion=$1, codigo=$2, nombre=$3, descripcion=$4, tipoCaso=$5, estado=$6, fechaInicio=$7, fechaFin=$8, updatedAt=NOW() WHERE id=$9 RETURNING *',
          [identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin, id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Case not found' });
        }

        // Merge response with additional fields for client
        const caseData = { ...result.rows[0], ...additionalData };
        res.status(200).json(caseData);
      }
    } else if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }

      const result = await query('DELETE FROM cases WHERE id=$1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Case not found' });
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
