// exportReports.js
// Funciones de exportación simuladas y reales para el módulo de Reportes

/**
 * Exporta datos a CSV de forma estructurada y profesional
 */
export const exportReportToCSV = (data, fileName = "reporte_tilo.csv") => {
  if (!data || !data.length) {
    alert("No hay datos disponibles para exportar.");
    return;
  }

  // Definir encabezados legibles
  const headers = Object.keys(data[0]);
  
  // Mapear datos y limpiar valores
  const rows = data.map(obj => {
    return headers.map(header => {
      let value = obj[header] === null || obj[header] === undefined ? "" : obj[header];
      // Si es un número, dejarlo tal cual, si es texto, limpiar comillas
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta datos a un formato compatible con Excel (CSV con separador adecuado)
 */
export const exportReportToExcel = (data, fileName = "reporte_tilo.xlsx") => {
  console.log("Generando reporte para Excel...");
  // Nota: Para un .xlsx real se requeriría la librería 'xlsx'. 
  // Usamos CSV con BOM para que Excel lo reconozca automáticamente con tildes y formato.
  const csvName = fileName.replace(".xlsx", ".csv");
  exportReportToCSV(data, csvName);
};

/**
 * Genera un PDF profesional utilizando la vista de impresión optimizada
 */
export const exportReportToPDF = () => {
  console.log("Generando PDF profesional...");
  // La vista de impresión ya ha sido optimizada mediante CSS (@media print)
  // para ocultar la interfaz de la app y mostrar solo la información del reporte.
  window.print();
};

/**
 * Lanza la impresión del reporte
 */
export const printReport = () => {
  window.print();
};
