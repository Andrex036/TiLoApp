import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import tiloLogo from '../assets/TiLo_Logo.png';
import tiloHomeLogo from '../assets/TiLo_Logo_Cara.png';

const sanitizeFileName = (name = 'reporte_tilo') => {
  return String(name)
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_');
};

const normalizeRows = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    if (!row || typeof row !== 'object') return { Valor: row ?? '' };
    return row;
  });
};

const normalizePayload = (payloadOrRows) => {
  if (Array.isArray(payloadOrRows)) {
    return {
      metadata: {},
      sections: [{ title: 'Datos', rows: normalizeRows(payloadOrRows) }]
    };
  }

  if (payloadOrRows && typeof payloadOrRows === 'object') {
    const sections = Array.isArray(payloadOrRows.sections)
      ? payloadOrRows.sections
          .map((section) => ({
            title: section?.title || 'Datos',
            rows: normalizeRows(section?.rows)
          }))
          .filter((section) => section.rows.length > 0)
      : [];

    return {
      metadata: payloadOrRows.metadata || {},
      sections
    };
  }

  return { metadata: {}, sections: [] };
};

const FIELD_LABELS = {
  codigo: 'Codigo del caso',
  codigoCaso: 'Codigo del caso',
  estudiante: 'Estudiante',
  identificacion: 'Numero de identificacion',
  sede: 'Sede',
  grado: 'Grado',
  estado: 'Estado',
  nivelRiesgo: 'Nivel de riesgo',
  tipoCaso: 'Tipo de caso',
  fechaCreacion: 'Fecha de creacion',
  fecha: 'Fecha',
  fechaInicio: 'Fecha de inicio',
  fechaFin: 'Fecha de fin',
  titulo: 'Titulo',
  tipo: 'Tipo',
  horaInicio: 'Hora de inicio',
  horaFin: 'Hora de fin',
  prioridad: 'Prioridad',
  responsable: 'Responsable',
  rutas: 'Rutas activadas',
  origen: 'Origen',
  eliminado: 'Registro eliminado',
  totalCasos: 'Total de casos',
  casosCerrados: 'Casos cerrados',
  casosSeguimiento: 'Casos en seguimiento',
  alertasActivas: 'Alertas activas',
  rutasTotal: 'Activaciones de ruta',
  actividadesRealizadas: 'Actividades realizadas',
  actividadesPendientes: 'Actividades pendientes',
  alertasPrioritarias: 'Alertas prioritarias',
  rutasSalud: 'Rutas Salud',
  rutasICBF: 'Rutas ICBF',
  rutasPolicia: 'Rutas Policia',
  rutasComisaria: 'Rutas Comisaria',
  rutasFiscalia: 'Rutas Fiscalia',
  alertas: 'Alertas',
  actividades: 'Actividades'
};

const CATEGORY_HEADERS = {
  'Todas las categorías': 'Informe Institucional Consolidado',
  'Casos': 'Informe Oficial de Casos',
  'Actividades': 'Informe Oficial de Actividades',
  'Alertas': 'Informe Oficial de Alertas',
  'Seguimientos': 'Informe Oficial de Seguimientos',
  'Citaciones': 'Informe Oficial de Citaciones',
  'Activaciones de ruta': 'Informe Oficial de Activaciones de Ruta',
  'Casos cerrados': 'Informe Oficial de Casos Cerrados',
  'Casos en seguimiento': 'Informe Oficial de Casos en Seguimiento',
  'Caso individual': 'Reporte Ejecutivo del Caso'
};

let logoDataUrlPromise;
const getLogoDataUrl = async () => {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch(tiloLogo)
      .then((res) => res.blob())
      .then((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }))
      .catch(() => null);
  }
  return logoDataUrlPromise;
};

let homeLogoDataUrlPromise;
const getHomeLogoDataUrl = async () => {
  if (!homeLogoDataUrlPromise) {
    homeLogoDataUrlPromise = fetch(tiloHomeLogo)
      .then((res) => res.blob())
      .then((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }))
      .catch(() => null);
  }
  return homeLogoDataUrlPromise;
};

let roundHomeLogoDataUrlPromise;
const getRoundHomeLogoDataUrl = async () => {
  if (!roundHomeLogoDataUrlPromise) {
    roundHomeLogoDataUrlPromise = getHomeLogoDataUrl()
      .then((dataUrl) => {
        if (!dataUrl) return null;

        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const size = 256;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const sourceSize = Math.min(img.width, img.height);
            const sx = (img.width - sourceSize) / 2;
            const sy = (img.height - sourceSize) / 2;

            ctx.clearRect(0, 0, size, size);
            ctx.save();
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
            ctx.restore();

            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
            ctx.lineWidth = 10;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        });
      })
      .catch(() => null);
  }
  return roundHomeLogoDataUrlPromise;
};

const toReadableLabel = (key) => {
  if (!key) return '';
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const sentence = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .trim();
  return sentence.charAt(0).toUpperCase() + sentence.slice(1).toLowerCase();
};

const toDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  return String(value);
};

const getCategoryHeader = (category) => {
  return CATEGORY_HEADERS[category] || 'Informe Institucional TiLoAPP';
};

const toCsvValue = (value) => {
  const safeValue = value === null || value === undefined ? '' : value;
  let str = String(safeValue).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  return `"${str}"`;
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', sanitizeFileName(fileName));
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportReportToCSV = (payloadOrRows, fileName = 'reporte_tilo.csv') => {
  const payload = normalizePayload(payloadOrRows);
  if (!payload.sections.length) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  const lines = [];
  const metadataEntries = Object.entries(payload.metadata || {});
  if (metadataEntries.length > 0) {
    metadataEntries.forEach(([key, value]) => {
      lines.push(`${toCsvValue(key)},${toCsvValue(value)}`);
    });
    lines.push('');
  }

  payload.sections.forEach((section, index) => {
    const rows = section.rows;
    const headers = Object.keys(rows[0] || {});
    if (!headers.length) return;

    lines.push(toCsvValue(section.title));
    lines.push(headers.map((header) => toCsvValue(toReadableLabel(header))).join(','));
    rows.forEach((row) => {
      lines.push(headers.map((header) => toCsvValue(toDisplayValue(row[header]))).join(','));
    });
    if (index < payload.sections.length - 1) lines.push('');
  });

  const csvContent = `\uFEFF${lines.join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, fileName);
};

export const exportReportToExcel = (payloadOrRows, fileName = 'reporte_tilo.xlsx') => {
  const payload = normalizePayload(payloadOrRows);
  if (!payload.sections.length) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  const workbook = XLSX.utils.book_new();
  const metadataEntries = Object.entries(payload.metadata || {}).map(([key, value]) => ({
    Campo: toReadableLabel(key),
    Valor: toDisplayValue(value)
  }));

  if (metadataEntries.length > 0) {
    const metadataSheet = XLSX.utils.json_to_sheet(metadataEntries);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Resumen');
  }

  payload.sections.forEach((section, idx) => {
    const sheetName = `${idx + 1}_${section.title}`.slice(0, 31);
    const sheetRows = section.rows.length > 0
      ? section.rows.map((row) => {
          const entries = Object.entries(row || {}).map(([key, value]) => [toReadableLabel(key), toDisplayValue(value)]);
          return Object.fromEntries(entries);
        })
      : [{ Mensaje: 'Sin datos' }];
    const sheet = XLSX.utils.json_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  });

  XLSX.writeFile(workbook, sanitizeFileName(fileName));
};

const toBackupJson = (value) => {
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const exportCasesBackupToExcel = (cases = [], fileName = 'backup_casos_tilo.xlsx') => {
  if (!Array.isArray(cases) || cases.length === 0) {
    alert('No hay casos registrados disponibles para exportar.');
    return;
  }

  const rows = cases.map((caseItem) => {
    const seguimientos = Array.isArray(caseItem.seguimientos) ? caseItem.seguimientos : [];
    const rutas = getCaseRoutes(caseItem, seguimientos);
    const activeSeguimientos = seguimientos.filter((seg) => !seg?.eliminado);

    return {
      'ID interno': caseItem.id || '',
      'Código del caso': caseItem.codigo || '',
      'Estudiante': getCaseStudentName(caseItem),
      'Identificación': caseItem.identificacion || '',
      'Identificación pendiente': toDisplayValue(caseItem.identificacionPendiente || caseItem.sinIdentificacion || false),
      'Origen identificación': caseItem.identificacionOrigen || '',
      'Género': caseItem.genero || '',
      'Grado': caseItem.grado || '',
      'Sede': caseItem.sede || '',
      'Estado': caseItem.estado || '',
      'Nivel de riesgo': caseItem.nivelRiesgo || '',
      'Tipo de caso': caseItem.tipoCaso || '',
      'Motivo': caseItem.motivo || caseItem.motivoRemision || '',
      'Descripción': caseItem.descripcion || '',
      'Observaciones': caseItem.observaciones || '',
      'Docente remitente': caseItem.docenteRemitente || '',
      'Fecha creación': formatDateTime(caseItem.createdAt),
      'Última actualización': formatDateTime(caseItem.updatedAt),
      'Rutas activadas': joinList(rutas),
      'Total seguimientos': seguimientos.length,
      'Seguimientos activos': activeSeguimientos.length,
      'Seguimientos eliminados': seguimientos.length - activeSeguimientos.length,
      'Seguimientos completos JSON': toBackupJson(seguimientos),
      'Rutas originales JSON': toBackupJson(caseItem.rutaActivada),
      'Registro completo JSON': toBackupJson(caseItem)
    };
  });

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 28 },
    { wch: 18 },
    { wch: 20 },
    { wch: 24 },
    { wch: 12 },
    { wch: 12 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 24 },
    { wch: 36 },
    { wch: 36 },
    { wch: 24 },
    { wch: 20 },
    { wch: 20 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 80 },
    { wch: 40 },
    { wch: 100 }
  ];

  XLSX.utils.book_append_sheet(workbook, sheet, 'Casos registrados');
  XLSX.writeFile(workbook, sanitizeFileName(fileName));
};


// Utilidad para crear un gráfico circular (pie) en un canvas y devolverlo como dataURL
const createPieChartDataUrl = (data, width = 320, height = 320, label = '') => {
  if (!data || !data.length) return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const total = data.reduce((acc, curr) => acc + (curr.value || 0), 0) || 1;
  let startAngle = -Math.PI / 2;
  data.forEach((item) => {
    const sliceAngle = ((item.value || 0) / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2);
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 10, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = item.color || '#888';
    ctx.fill();
    startAngle += sliceAngle;
  });
  // Opcional: agregar borde blanco
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 10, 0, 2 * Math.PI);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  // Etiqueta central
  if (label) {
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.fillText(label, width / 2, height / 2 + 8);
  }
  return canvas.toDataURL('image/png');
};

export const exportReportToPDF = async (payloadOrRows, fileName = 'reporte_tilo.pdf') => {
  const payload = normalizePayload(payloadOrRows);
  if (!payload.sections.length) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const category = payload.metadata?.Categoria || payload.metadata?.categoria || 'Todas las categorías';
  const officialHeader = getCategoryHeader(category);
  const logoDataUrl = await getRoundHomeLogoDataUrl();

  // Portada institucional
  doc.setFillColor(15, 77, 184);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(32, 32, pageWidth - 64, pageHeight - 64, 14, 14, 'F');
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 56, 54, 58, 58);
  }
  doc.setTextColor(15, 77, 184);
  doc.setFontSize(20);
  doc.text('TiLo Te Escucha', 128, 78);
  doc.setFontSize(11);
  doc.text('Plataforma institucional de orientación escolar', 128, 98);
  doc.setDrawColor(226, 232, 240);
  doc.line(56, 130, pageWidth - 56, 130);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(22);
  doc.text(officialHeader, 56, 178);
  doc.setFontSize(12);
  doc.text('Documento oficial generado automáticamente', 56, 200);
  let coverY = 238;
  Object.entries(payload.metadata || {}).forEach(([key, value]) => {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`${toReadableLabel(key)}:`, 56, coverY);
    doc.setTextColor(30, 41, 59);
    doc.text(toDisplayValue(value), 180, coverY);
    coverY += 18;
  });
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text('Confidencial - Uso institucional interno', 56, pageHeight - 56);
  doc.text(`Emitido el ${new Date().toLocaleDateString()}`, pageWidth - 180, pageHeight - 56);

  // Secciones: cada una en página independiente
  for (let i = 0; i < payload.sections.length; i++) {
    const section = payload.sections[i];
    doc.addPage();
    // Encabezado institucional
    doc.setFillColor(15, 77, 184);
    doc.rect(0, 0, pageWidth, 44, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('TiLoAPP - Reporte institucional', 40, 28);
    doc.setFontSize(10);
    doc.text(officialHeader, pageWidth - 40, 28, { align: 'right' });
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 40, pageHeight - 14, { align: 'right' });

    // Título de sección
    doc.setTextColor(15, 77, 184);
    doc.setFontSize(18);
    doc.text(section.title, 56, 80);

    // Gráficos para motivo/género
    if ((section.title === 'Casos por motivo de consulta' || section.title === 'Casos por género') && Array.isArray(section.chartData) && section.chartData.length > 0) {
      const chartLabel = section.title === 'Casos por motivo de consulta' ? 'Motivo' : 'Género';
      const chartUrl = createPieChartDataUrl(section.chartData, 260, 260, '');
      if (chartUrl) {
        doc.addImage(chartUrl, 'PNG', pageWidth / 2 - 130, 110, 260, 260);
      }
      // Leyenda
      let legendY = 390;
      section.chartData.forEach((item, idx) => {
        doc.setFillColor(item.color || '#888');
        doc.rect(70, legendY - 8, 14, 14, 'F');
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(11);
        doc.text(`${item.name}: ${item.value} (${item.percentage})`, 90, legendY + 4);
        legendY += 22;
      });
      continue; // No tabla para estas secciones
    }

    // Tabla de datos para otras secciones
    const rows = section.rows;
    if (!rows.length) continue;
    const headers = Object.keys(rows[0]);
    const headerLabels = headers.map((header) => toReadableLabel(header));
    const body = rows.map((row) => headers.map((header) => toDisplayValue(row[header])));
    autoTable(doc, {
      head: [headerLabels],
      body,
      startY: 110,
      margin: { left: 56, right: 56 },
      styles: { fontSize: 10, cellPadding: 5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 77, 184], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawPage: () => {
        // Redibujar encabezado institucional
        doc.setFillColor(15, 77, 184);
        doc.rect(0, 0, pageWidth, 44, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text('TiLoAPP - Reporte institucional', 40, 28);
        doc.setFontSize(10);
        doc.text(officialHeader, pageWidth - 40, 28, { align: 'right' });
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 40, pageHeight - 14, { align: 'right' });
      }
    });
  }

  doc.save(sanitizeFileName(fileName));
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const joinList = (value) => {
  if (!value) return 'N/A';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'N/A';
  return String(value);
};

const getCaseStudentName = (caseData = {}) => (
  caseData.estudiante || caseData.nombre || 'Estudiante sin nombre'
);

const getCaseRoutes = (caseData = {}, seguimientos = []) => {
  const directRoutes = Array.isArray(caseData.rutaActivada)
    ? caseData.rutaActivada
    : caseData.rutaActivada
      ? [caseData.rutaActivada]
      : [];

  const seguimientoRoutes = seguimientos
    .filter((seg) => String(seg?.tipoSeguimiento || '').startsWith('Activación Ruta:'))
    .map((seg) => String(seg.tipoSeguimiento).replace('Activación Ruta:', '').trim())
    .filter(Boolean);

  return [...new Set([...directRoutes, ...seguimientoRoutes])];
};

export const exportCaseReportToPDF = async (caseData = {}) => {
  if (!caseData || !caseData.id) {
    alert('No hay información del caso disponible para exportar.');
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const primary = [15, 77, 184];
  const primaryDark = [11, 63, 156];
  const slate900 = [15, 23, 42];
  const slate700 = [51, 65, 85];
  const slate500 = [100, 116, 139];
  const slate200 = [226, 232, 240];
  const slate50 = [248, 250, 252];
  const blue50 = [239, 246, 255];
  const logoDataUrl = await getRoundHomeLogoDataUrl();
  const seguimientos = Array.isArray(caseData.seguimientos) ? caseData.seguimientos : [];
  const activeSeguimientos = seguimientos.filter((seg) => !seg?.eliminado);
  const rutas = getCaseRoutes(caseData, seguimientos);
  const estudiante = getCaseStudentName(caseData);
  const fileName = `reporte_caso_${caseData.codigo || caseData.id}_${estudiante}.pdf`;

  const knownKeys = new Set([
    'id',
    'codigo',
    'codigoCaso',
    'identificacion',
    'nombre',
    'estudiante',
    'genero',
    'grado',
    'sede',
    'estado',
    'nivelRiesgo',
    'tipoCaso',
    'createdAt',
    'updatedAt',
    'descripcion',
    'observaciones',
    'motivo',
    'motivoRemision',
    'docenteRemitente',
    'identificacionOrigen',
    'identificacionPendiente',
    'sinIdentificacion',
    'rutaActivada',
    'seguimientos'
  ]);

  const additionalRows = Object.entries(caseData)
    .filter(([key, value]) => !knownKeys.has(key) && value !== undefined && value !== null && value !== '')
    .map(([campo, valor]) => ({ campo: toReadableLabel(campo), valor: joinList(valor) }));

  const addHeader = () => {
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 54, 'F');
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, 8, 38, 38);
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('TiLo Te Escucha', logoDataUrl ? 92 : margin, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Orientación Escolar', logoDataUrl ? 92 : margin, 39);
    doc.setFontSize(9);
    doc.text('Reporte ejecutivo del caso', pageWidth - margin, 31, { align: 'right' });
  };

  const addFooter = () => {
    doc.setTextColor(...slate500);
    doc.setFontSize(8);
    doc.text('Confidencial - Uso institucional interno', margin, pageHeight - 18);
    doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 18, { align: 'right' });
  };

  const ensureSpace = (currentY, neededHeight = 80) => {
    if (currentY + neededHeight <= pageHeight - 38) return currentY;
    addFooter();
    doc.addPage();
    addHeader();
    return 78;
  };

  const drawSectionTitle = (title, y) => {
    y = ensureSpace(y, 44);
    doc.setFillColor(...blue50);
    doc.roundedRect(margin, y, contentWidth, 28, 7, 7, 'F');
    doc.setTextColor(...primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, margin + 12, y + 18);
    return y + 42;
  };

  const drawMetricCards = (items, y) => {
    y = ensureSpace(y, 78);
    const gap = 8;
    const width = (contentWidth - gap * (items.length - 1)) / items.length;
    items.forEach((item, index) => {
      const x = margin + index * (width + gap);
      doc.setFillColor(...slate50);
      doc.setDrawColor(...slate200);
      doc.roundedRect(x, y, width, 58, 8, 8, 'FD');
      doc.setTextColor(...slate500);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(item.label.toUpperCase(), x + 10, y + 18, { maxWidth: width - 20 });
      doc.setTextColor(...item.color);
      doc.setFontSize(16);
      doc.text(String(item.value), x + 10, y + 42, { maxWidth: width - 20 });
    });
    return y + 76;
  };

  const drawFieldList = (rows, y) => {
    const rowHeight = 28;
    rows.forEach(({ label, value }) => {
      const text = toDisplayValue(value);
      const split = doc.splitTextToSize(text, contentWidth - 190);
      const height = Math.max(rowHeight, split.length * 11 + 14);
      y = ensureSpace(y, height + 4);
      doc.setDrawColor(...slate200);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, contentWidth, height, 5, 5, 'FD');
      doc.setTextColor(...slate500);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(label, margin + 12, y + 17);
      doc.setTextColor(...slate900);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(split, margin + 180, y + 17);
      y += height + 6;
    });
    return y + 4;
  };

  const drawParagraphBox = (label, value, y) => {
    const text = toDisplayValue(value);
    const split = doc.splitTextToSize(text, contentWidth - 24);
    const height = Math.max(54, split.length * 11 + 36);
    y = ensureSpace(y, height + 8);
    doc.setFillColor(...slate50);
    doc.setDrawColor(...slate200);
    doc.roundedRect(margin, y, contentWidth, height, 7, 7, 'FD');
    doc.setTextColor(...slate500);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), margin + 12, y + 17);
    doc.setTextColor(...slate700);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(split, margin + 12, y + 34);
    return y + height + 10;
  };

  const drawSeguimiento = (seg, index, y) => {
    const metadata = [
      seg.fecha || formatDateTime(seg.createdAt),
      seg.responsable || 'N/A',
      seg.esCita ? 'Cita' : null,
      seg.esCitaResultado ? 'Resultado de cita' : null,
      seg.hasSoporte || seg.trajoSoporte ? 'Con soporte' : null,
      seg.eliminado ? 'Eliminado' : null
    ].filter(Boolean).join('  |  ');
    const description = toDisplayValue(seg.descripcion);
    const descLines = doc.splitTextToSize(description, contentWidth - 28);
    const height = Math.max(72, descLines.length * 10 + 54);
    y = ensureSpace(y, height + 10);
    doc.setFillColor(seg.eliminado ? 248 : 255, seg.eliminado ? 250 : 255, seg.eliminado ? 252 : 255);
    doc.setDrawColor(...slate200);
    doc.roundedRect(margin, y, contentWidth, height, 7, 7, 'FD');
    doc.setFillColor(...primary);
    doc.roundedRect(margin + 10, y + 12, 22, 22, 5, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(String(index + 1), margin + 21, y + 27, { align: 'center' });
    doc.setTextColor(...slate900);
    doc.setFontSize(10);
    doc.text(seg.tipoSeguimiento || 'Seguimiento', margin + 42, y + 21, { maxWidth: contentWidth - 54 });
    doc.setTextColor(...slate500);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(metadata, margin + 42, y + 36, { maxWidth: contentWidth - 54 });
    doc.setTextColor(...slate700);
    doc.setFontSize(9);
    doc.text(descLines, margin + 14, y + 57);
    return y + height + 10;
  };

  addHeader();
  let y = 86;

  doc.setTextColor(...slate900);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text(estudiante, margin, y, { maxWidth: contentWidth - 130 });
  doc.setFontSize(10);
  doc.setTextColor(...primaryDark);
  doc.text(caseData.codigo || caseData.id, pageWidth - margin, y, { align: 'right' });
  y += 20;
  doc.setTextColor(...slate500);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generado el ${new Date().toLocaleString()}`, margin, y);
  y += 26;

  y = drawMetricCards([
    { label: 'Estado', value: caseData.estado || 'N/A', color: primary },
    { label: 'Riesgo', value: caseData.nivelRiesgo || 'N/A', color: caseData.nivelRiesgo === 'Alto' || caseData.nivelRiesgo === 'Prioritario' ? [220, 38, 38] : [217, 119, 6] },
    { label: 'Seguimientos', value: activeSeguimientos.length, color: [22, 163, 74] },
    { label: 'Rutas', value: rutas.length, color: [124, 58, 237] }
  ], y);

  y = drawSectionTitle('Información general', y);
  y = drawFieldList([
    { label: 'Código del caso', value: caseData.codigo || caseData.id },
    { label: 'Identificación', value: caseData.identificacion || 'No registrada' },
    { label: 'Estudiante', value: estudiante },
    { label: 'Género', value: caseData.genero },
    { label: 'Grado', value: caseData.grado },
    { label: 'Sede', value: caseData.sede },
    { label: 'Tipo de caso', value: caseData.tipoCaso },
    { label: 'Fecha de creación', value: formatDateTime(caseData.createdAt) },
    { label: 'Última actualización', value: formatDateTime(caseData.updatedAt) },
    { label: 'Origen de identificación', value: caseData.identificacionOrigen },
    { label: 'Docente remitente', value: caseData.docenteRemitente }
  ], y);

  y = drawSectionTitle('Motivo y contexto', y);
  y = drawParagraphBox('Motivo de consulta', caseData.motivo || caseData.motivoRemision, y);
  y = drawParagraphBox('Descripción', caseData.descripcion, y);
  y = drawParagraphBox('Observaciones', caseData.observaciones, y);

  y = drawSectionTitle('Rutas activadas', y);
  y = drawFieldList(
    rutas.length
      ? rutas.map((ruta, index) => ({ label: `Ruta ${index + 1}`, value: ruta }))
      : [{ label: 'Estado', value: 'Sin rutas activadas registradas' }],
    y
  );

  y = drawSectionTitle('Historial de seguimientos', y);
  if (seguimientos.length) {
    seguimientos.forEach((seg, index) => {
      y = drawSeguimiento(seg, index, y);
    });
  } else {
    y = drawParagraphBox('Seguimientos', 'Sin seguimientos registrados', y);
  }

  if (additionalRows.length) {
    y = drawSectionTitle('Información adicional', y);
    y = drawFieldList(additionalRows.map((row) => ({ label: row.campo, value: row.valor })), y);
  }

  addFooter();
  doc.save(sanitizeFileName(fileName));
};
