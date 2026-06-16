// api/alerts.js
import { query } from './db.js';

const normalizeCaseId = (caseId) => {
  if (caseId === undefined || caseId === null) return null;
  if (typeof caseId !== 'string') return String(caseId);
  const trimmed = caseId.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
  return trimmed;
};

const mapAlertRow = (row) => {
  const extra = row.data || {};
  const estado = extra.estado || (row.activo ? 'Activa' : 'Atendida');
  return {
    id: row.id,
    caseId: row.caseId ?? null,
    tipo: extra.tipo ?? row.tipo,
    prioridad: extra.prioridad ?? row.prioridad ?? 'Media',
    mensaje: row.mensaje,
    activo: row.activo,
    estado,
    titulo: extra.titulo ?? extra.tipo ?? row.tipo,
    descripcion: extra.descripcion ?? row.mensaje,
    fecha: extra.fecha ?? row.createdAt?.toISOString?.().slice(0, 10),
    hora: extra.hora ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ...extra
  };
};

const toDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  if (text.length >= 10) return text.slice(0, 10);
  return null;
};

const isClosedCase = (estado) => (estado || '').toLowerCase() === 'cerrado';

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const isDoneActivityState = (estado) => {
  const normalized = normalizeText(estado);
  return normalized === 'realizada'
    || normalized === 'completada'
    || normalized === 'cancelada'
    || normalized === 'no asistio';
};

const parseScheduledDateFromSeguimiento = (seg) => {
  const text = seg?.descripcion || '';
  const match = text.match(/Agendada para:\s*(\d{4}-\d{2}-\d{2})/i);
  return match ? match[1] : null;
};

const containsPadre = (text) => String(text || '').toLowerCase().includes('padre');

const buildAutoCandidates = ({ cases, activities, today }) => {
  const candidates = [];

  for (const row of cases) {
    const data = row.data || {};
    const caseId = row.id;
    const estudiante = data.estudiante || row.nombre || row.codigo || 'Estudiante';
    const nivelRiesgo = data.nivelRiesgo || 'Bajo';
    const sede = data.sede || null;
    const grado = data.grado || null;
    const seguimientos = Array.isArray(data.seguimientos) ? data.seguimientos.filter((s) => !s?.eliminado) : [];
    const byId = new Map(seguimientos.map((seg) => [seg.id, seg]));

    if (!isClosedCase(row.estado) && (nivelRiesgo === 'Alto' || nivelRiesgo === 'Prioritario')) {
      candidates.push({
        sourceKey: `auto-case-high-risk-${caseId}`,
        tipo: 'Caso',
        prioridad: 'Prioritaria',
        estado: 'Activa',
        titulo: `Caso de alto riesgo: ${estudiante}`,
        descripcion: `El caso ${row.codigo || caseId} esta clasificado como ${nivelRiesgo}. Requiere revision prioritaria.`,
        fecha: today,
        sede,
        grado,
        caseId,
        codigoCaso: row.codigo || null,
        estudiante,
        accionSugerida: 'Revisar caso y priorizar seguimiento',
        rutaDestino: 'casos'
      });
    }

    if (!isClosedCase(row.estado) && seguimientos.length === 0) {
      candidates.push({
        sourceKey: `auto-case-no-followup-${caseId}`,
        tipo: 'Seguimiento',
        prioridad: (nivelRiesgo === 'Alto' || nivelRiesgo === 'Prioritario') ? 'Alta' : 'Media',
        estado: 'Pendiente',
        titulo: `Sin seguimiento inicial: ${estudiante}`,
        descripcion: `El caso ${row.codigo || caseId} no tiene seguimientos activos registrados.`,
        fecha: today,
        sede,
        grado,
        caseId,
        codigoCaso: row.codigo || null,
        estudiante,
        accionSugerida: 'Registrar primer seguimiento',
        rutaDestino: 'casos'
      });
    }

    if (!isClosedCase(row.estado)) {
      const requiredTypes = ['Estudiante', 'Docente', 'Padre de familia'];
      for (const requiredType of requiredTypes) {
        const hasType = seguimientos.some((seg) => seg?.tipoSeguimiento === requiredType);
        if (hasType) continue;

        candidates.push({
          sourceKey: `auto-followup-required-${caseId}-${requiredType.toLowerCase().replace(/[^a-z]+/g, '-')}`,
          tipo: 'Seguimiento',
          prioridad: requiredType === 'Padre de familia' ? 'Alta' : 'Media',
          estado: 'Pendiente',
          titulo: `Seguimiento pendiente: ${requiredType}`,
          descripcion: `El caso ${row.codigo || caseId} aun no registra seguimiento por ${requiredType}.`,
          fecha: today,
          sede,
          grado,
          caseId,
          codigoCaso: row.codigo || null,
          estudiante,
          accionSugerida: `Registrar seguimiento de ${requiredType}`,
          rutaDestino: 'casos'
        });
      }
    }

    const hasHealthRoute = seguimientos.some((seg) => String(seg?.tipoSeguimiento || '').includes('Sector Salud'));
    const hasHealthSupport = seguimientos.some((seg) => {
      if (seg?.hasSoporte === true || seg?.trajoSoporte === true) return true;
      const description = normalizeText(seg?.descripcion);
      return description.includes('documento recibido: si') || description.includes('trajo soporte: si');
    });

    if (!isClosedCase(row.estado) && hasHealthRoute && !hasHealthSupport) {
      const caseCode = row.codigo || caseId;
      candidates.push({
        sourceKey: `auto-route-salud-${caseId}`,
        tipo: 'RutaSalud',
        prioridad: 'Prioritaria',
        estado: 'Activa',
        titulo: 'Pendiente: soporte de atencion en salud',
        descripcion: `La ruta de Sector Salud esta activa para ${estudiante} (${caseCode}) y aun no hay constancia de soporte recibido.`,
        fecha: today,
        sede,
        grado,
        caseId,
        codigoCaso: caseCode,
        estudiante,
        accionSugerida: 'Verificar entrega de soporte',
        rutaDestino: 'casos'
      });
    }

    if (!isClosedCase(row.estado)) {
      const citasPadre = seguimientos.filter((seg) => seg?.esCita && containsPadre(seg?.tipoSeguimiento));
      const noShowPadreCount = citasPadre.filter((cita) => {
        if (!cita?.citaResultadoId) return false;
        const result = byId.get(cita.citaResultadoId);
        return result?.esCitaResultado && result?.asistio === false;
      }).length;

      const hasRouteIcbf = seguimientos.some((seg) => String(seg?.tipoSeguimiento || '').toUpperCase().includes('ICBF'))
        || (Array.isArray(data.rutaActivada) ? data.rutaActivada.some((r) => String(r || '').toUpperCase().includes('ICBF')) : String(data.rutaActivada || '').toUpperCase().includes('ICBF'));

      if (noShowPadreCount >= 3 && !hasRouteIcbf) {
        candidates.push({
          sourceKey: `auto-icbf-no-show-${caseId}`,
          tipo: 'Ruta externa',
          prioridad: 'Prioritaria',
          estado: 'Pendiente',
          titulo: 'Escalar a ICBF por inasistencias de acudiente',
          descripcion: `El caso ${row.codigo || caseId} acumula ${noShowPadreCount} inasistencias en citas de padres.`,
          fecha: today,
          sede,
          grado,
          caseId,
          codigoCaso: row.codigo || null,
          estudiante,
          accionSugerida: 'Activar ruta ICBF y documentar remision',
          rutaDestino: 'casos'
        });
      }
    }

    for (const seg of seguimientos) {
      if (!seg?.esCita || seg?.citaConfirmada || seg?.citaCancelada) continue;
      const citaFecha = parseScheduledDateFromSeguimiento(seg);
      if (!citaFecha || citaFecha > today) continue;
      candidates.push({
        sourceKey: `auto-cita-pendiente-${seg.id}`,
        tipo: 'Citacion',
        prioridad: 'Alta',
        estado: 'Activa',
        titulo: `Cita pendiente de confirmar: ${estudiante}`,
        descripcion: `Hay una cita registrada para ${citaFecha} sin confirmacion de asistencia.`,
        fecha: citaFecha,
        sede,
        grado,
        caseId,
        codigoCaso: row.codigo || null,
        estudiante,
        accionSugerida: 'Confirmar resultado de la cita',
        rutaDestino: 'casos'
      });
    }
  }

  for (const row of activities) {
    const data = row.data || {};
    const activityId = row.id;
    const fecha = toDateOnly(data.fecha || row.fecha);
    const estado = data.estado || row.resultado || 'Programada';
    const prioridad = data.prioridad || 'Media';
    const titulo = data.titulo || data.descripcion || row.descripcion || `Actividad ${activityId}`;
    const caseId = normalizeCaseId(data.caseId || row.caseId);
    const sede = data.sede || null;
    const estudiante = data.estudiante || data.estudianteRelacionado || null;

    if (!fecha || isDoneActivityState(estado)) continue;

    if (fecha < today) {
      candidates.push({
        sourceKey: `auto-activity-overdue-${activityId}`,
        tipo: 'Vencimiento',
        prioridad: prioridad === 'Prioritaria' ? 'Prioritaria' : 'Alta',
        estado: 'Vencida',
        titulo: `Actividad vencida: ${titulo}`,
        descripcion: `La actividad programada para ${fecha} sigue pendiente.`,
        fecha,
        sede,
        caseId,
        estudiante,
        activityId,
        accionSugerida: 'Actualizar estado o reprogramar actividad',
        rutaDestino: 'actividades'
      });
    } else if (fecha === today) {
      candidates.push({
        sourceKey: `auto-activity-today-${activityId}`,
        tipo: 'Actividad',
        prioridad,
        estado: 'Programada',
        titulo: `Actividad de hoy: ${titulo}`,
        descripcion: 'Hay una actividad programada para hoy que requiere seguimiento.',
        fecha,
        sede,
        caseId,
        estudiante,
        activityId,
        accionSugerida: 'Realizar o actualizar estado de la actividad',
        rutaDestino: 'actividades'
      });
    }
  }

  return candidates;
};

const upsertAutoAlerts = async (candidates) => {
  const existingResult = await query(`
    SELECT
      id,
      caseid AS "caseId",
      tipo,
      prioridad,
      mensaje,
      activo,
      data
    FROM alerts
    WHERE data->>'source' = 'auto'
  `);

  const existingBySource = new Map();
  for (const row of existingResult.rows) {
    const key = row.data?.sourceKey;
    if (key) existingBySource.set(key, row);
  }

  const activeKeys = new Set();

  for (const candidate of candidates) {
    activeKeys.add(candidate.sourceKey);
    const existing = existingBySource.get(candidate.sourceKey);
    const payload = {
      source: 'auto',
      sourceKey: candidate.sourceKey,
      ...candidate
    };
    const mensaje = payload.mensaje || payload.descripcion || payload.titulo || 'Alerta automatica';
    const activo = payload.estado !== 'Atendida';

    if (!existing) {
      const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await query(
        'INSERT INTO alerts (id, caseid, tipo, prioridad, mensaje, activo, data, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW())',
        [id, normalizeCaseId(payload.caseId), payload.tipo || 'Informativa', payload.prioridad || 'Media', mensaje, activo, JSON.stringify({ ...payload, id })]
      );
      continue;
    }

    const existingEstado = existing.data?.estado || (existing.activo ? 'Activa' : 'Atendida');
    if (existingEstado === 'Atendida') continue;

    await query(
      'UPDATE alerts SET caseid=$1, tipo=$2, prioridad=$3, mensaje=$4, activo=$5, data=$6::jsonb, updatedat=NOW() WHERE id=$7',
      [
        normalizeCaseId(payload.caseId),
        payload.tipo || existing.tipo,
        payload.prioridad || existing.prioridad,
        mensaje,
        activo,
        JSON.stringify({ ...(existing.data || {}), ...payload, id: existing.id }),
        existing.id
      ]
    );
  }

  for (const row of existingResult.rows) {
    const sourceKey = row.data?.sourceKey;
    if (!sourceKey || activeKeys.has(sourceKey)) continue;
    const currentEstado = row.data?.estado || (row.activo ? 'Activa' : 'Atendida');
    if (currentEstado === 'Atendida') continue;

    const merged = { ...(row.data || {}), estado: 'Atendida', autoResolved: true };
    await query(
      'UPDATE alerts SET activo=false, data=$1::jsonb, updatedat=NOW() WHERE id=$2',
      [JSON.stringify(merged), row.id]
    );
  }
};

const closeDuplicateManualHealthRouteAlerts = async (candidates) => {
  const healthRouteCaseIds = candidates
    .filter((candidate) => candidate.tipo === 'RutaSalud' && candidate.estado !== 'Atendida')
    .map((candidate) => normalizeCaseId(candidate.caseId))
    .filter(Boolean);

  const uniqueCaseIds = [...new Set(healthRouteCaseIds)];
  if (uniqueCaseIds.length === 0) return;

  await query(
    `
      UPDATE alerts
      SET
        activo=false,
        data=COALESCE(data, '{}'::jsonb)
          || '{"estado":"Atendida","autoResolved":true,"duplicateOf":"auto-route-salud"}'::jsonb,
        updatedat=NOW()
      WHERE tipo='RutaSalud'
        AND caseid = ANY($1::text[])
        AND COALESCE(data->>'source', '') <> 'auto'
        AND COALESCE(data->>'estado', CASE WHEN activo THEN 'Activa' ELSE 'Atendida' END) <> 'Atendida'
    `,
    [uniqueCaseIds]
  );
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
      const shouldAutogen = !requestedCaseId && (req.query.autogen === '1' || req.query.autogen === 'true');

      if (shouldAutogen) {
        const today = new Date().toISOString().slice(0, 10);
        const [casesResult, activitiesResult] = await Promise.all([
          query(`
            SELECT
              id,
              codigo,
              nombre,
              estado,
              data
            FROM cases
          `),
          query(`
            SELECT
              id,
              caseid AS "caseId",
              fecha,
              resultado,
              descripcion,
              data
            FROM activities
          `)
        ]);

        const candidates = buildAutoCandidates({
          cases: casesResult.rows,
          activities: activitiesResult.rows,
          today
        });
        await upsertAutoAlerts(candidates);
        await closeDuplicateManualHealthRouteAlerts(candidates);
      }

      const selectSql = `
        SELECT
          id,
          caseid AS "caseId",
          tipo,
          prioridad,
          mensaje,
          activo,
          data,
          createdat AS "createdAt",
          updatedat AS "updatedAt"
        FROM alerts
      `;

      if (requestedCaseId) {
        const result = await query(`${selectSql} WHERE caseid=$1 ORDER BY createdat DESC`, [requestedCaseId]);
        res.status(200).json(result.rows.map(mapAlertRow));
      } else {
        const result = await query(`${selectSql} ORDER BY createdat DESC`);
        res.status(200).json(result.rows.map(mapAlertRow));
      }
    } else if (req.method === 'POST') {
      const payload = req.body || {};
      const id = payload.id || `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const caseId = normalizeCaseId(payload.caseId);
      const tipo = payload.tipo || 'Informativa';
      const prioridad = payload.prioridad || 'Media';
      const mensaje = payload.mensaje || payload.descripcion || payload.titulo || 'Sin mensaje';
      const estado = payload.estado || (payload.activo === false ? 'Atendida' : 'Activa');
      const activo = payload.activo !== undefined ? payload.activo : estado !== 'Atendida';
      const data = { ...payload, id, caseId, tipo, prioridad, estado };

      if (caseId) {
        const caseCheck = await query('SELECT id FROM cases WHERE id=$1', [caseId]);
        if (caseCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Case not found' });
        }
      }

      const result = await query(
        'INSERT INTO alerts (id, caseid, tipo, prioridad, mensaje, activo, data, createdat, updatedat) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW()) RETURNING id, caseid AS "caseId", tipo, prioridad, mensaje, activo, data, createdat AS "createdAt", updatedat AS "updatedAt"',
        [id, caseId, tipo, prioridad, mensaje, activo, JSON.stringify(data)]
      );

      res.status(201).json(mapAlertRow(result.rows[0]));
    } else if (req.method === 'PUT') {
      const payload = req.body || {};
      const { id } = payload;

      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }

      const current = await query(
        'SELECT id, caseid AS "caseId", tipo, prioridad, mensaje, activo, data FROM alerts WHERE id=$1',
        [id]
      );

      if (current.rows.length === 0) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      const merged = { ...(current.rows[0].data || {}), ...payload, id };
      const caseId = normalizeCaseId(merged.caseId);
      const tipo = merged.tipo || current.rows[0].tipo;
      const prioridad = merged.prioridad || current.rows[0].prioridad;
      const estado = merged.estado || (merged.activo === false ? 'Atendida' : undefined) || (current.rows[0].activo ? 'Activa' : 'Atendida');
      const activo = merged.activo !== undefined ? merged.activo : estado !== 'Atendida';
      const mensaje = merged.mensaje || merged.descripcion || merged.titulo || current.rows[0].mensaje;
      merged.estado = estado;

      const result = await query(
        'UPDATE alerts SET caseid=$1, tipo=$2, prioridad=$3, mensaje=$4, activo=$5, data=$6::jsonb, updatedat=NOW() WHERE id=$7 RETURNING id, caseid AS "caseId", tipo, prioridad, mensaje, activo, data, createdat AS "createdAt", updatedat AS "updatedAt"',
        [caseId, tipo, prioridad, mensaje, activo, JSON.stringify(merged), id]
      );

      res.status(200).json(mapAlertRow(result.rows[0]));
    } else if (req.method === 'DELETE') {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }

      const result = await query('DELETE FROM alerts WHERE id=$1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Alert not found' });
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
