import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import tiloLogo from '../assets/TiLo_Logo.png';

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
  'Casos en seguimiento': 'Informe Oficial de Casos en Seguimiento'
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
  const logoDataUrl = await getLogoDataUrl();

  // Portada institucional
  doc.setFillColor(15, 77, 184);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(32, 32, pageWidth - 64, pageHeight - 64, 14, 14, 'F');
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 56, 56, 130, 40);
  }
  doc.setTextColor(15, 77, 184);
  doc.setFontSize(20);
  doc.text('TiLoAPP', 56, 125);
  doc.setFontSize(11);
  doc.text('Plataforma institucional de orientación escolar', 56, 145);
  doc.setDrawColor(226, 232, 240);
  doc.line(56, 160, pageWidth - 56, 160);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(22);
  doc.text(officialHeader, 56, 205);
  doc.setFontSize(12);
  doc.text('Documento oficial generado automáticamente', 56, 227);
  let coverY = 265;
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

