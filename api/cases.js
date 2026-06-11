// api/cases.js
import { query } from './db.js';

const mapCaseRow = (row) => {
  const extra = row.data || {};
  return {
    id: row.id,
    identificacion: row.identificacion,
    codigo: row.codigo,
    nombre: row.nombre,
    descripcion: row.descripcion,
    tipoCaso: row.tipoCaso ?? row.tipocaso,
    estado: row.estado,
    fechaInicio: row.fechaInicio ?? row.fechainicio,
    fechaFin: row.fechaFin ?? row.fechafin,
    createdAt: row.createdAt ?? row.createdat,
    updatedAt: row.updatedAt ?? row.updatedat,
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
      const result = await query(`
        SELECT
          id,
          identificacion,
          codigo,
          nombre,
          descripcion,
          tipocaso AS "tipoCaso",
          estado,
          fechainicio AS "fechaInicio",
          fechafin AS "fechaFin",
          data,
          createdat AS "createdAt",
          updatedat AS "updatedAt"
        FROM cases
        ORDER BY createdat DESC
      `);
      res.status(200).json(result.rows.map(mapCaseRow));
    } else if (req.method === 'POST') {
      const { id, identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin, ...additionalData } = req.body;

      if (!id || !nombre) {
        return res.status(400).json({ error: 'Missing required fields: id, nombre' });
      }

      const dataJson = JSON.stringify(additionalData);
      const result = await query(
        'INSERT INTO cases (id, identificacion, codigo, nombre, descripcion, tipocaso, estado, fechainicio, fechafin, data, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, NOW(), NOW()) RETURNING id, identificacion, codigo, nombre, descripcion, tipocaso AS "tipoCaso", estado, fechainicio AS "fechaInicio", fechafin AS "fechaFin", data, createdat AS "createdAt", updatedat AS "updatedAt"',
        [id, identificacion, codigo, nombre, descripcion, tipoCaso, estado || 'Activo', fechaInicio, fechaFin, dataJson]
      );
      res.status(201).json(mapCaseRow(result.rows[0]));
    } else if (req.method === 'PUT') {
      const { id, identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin, ...additionalData } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }

      const dataJson = JSON.stringify(additionalData);
      const result = await query(
        'UPDATE cases SET identificacion=COALESCE($1, identificacion), codigo=COALESCE($2, codigo), nombre=COALESCE($3, nombre), descripcion=COALESCE($4, descripcion), tipocaso=COALESCE($5, tipocaso), estado=COALESCE($6, estado), fechainicio=COALESCE($7, fechainicio), fechafin=COALESCE($8, fechafin), data=COALESCE(data, \'{}\'::jsonb) || $9::jsonb, updatedat=NOW() WHERE id=$10 RETURNING id, identificacion, codigo, nombre, descripcion, tipocaso AS "tipoCaso", estado, fechainicio AS "fechaInicio", fechafin AS "fechaFin", data, createdat AS "createdAt", updatedat AS "updatedAt"',
        [identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin, dataJson, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Case not found' });
      }

      res.status(200).json(mapCaseRow(result.rows[0]));
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
