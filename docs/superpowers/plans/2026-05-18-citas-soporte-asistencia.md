# Citas: Soporte requerido y confirmación de asistencia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir indicar si se requiere soporte al agendar una cita, y registrar posteriormente si el citado asistió y si trajo soporte, dejando todo en el historial de seguimientos del caso.

**Architecture:** Un solo archivo de UI (`CasoDetalle.jsx`) recibe todos los cambios. Se enriquece el seguimiento que se crea al agendar una cita con campos `esCita`, `requiereSoporte` y `citaConfirmada`. La confirmación crea un segundo seguimiento de resultado. `caseService.js` y `useCases.js` no necesitan cambios porque `addSeguimiento` y `updateSeguimiento` ya admiten campos arbitrarios.

**Tech Stack:** React 18, Tailwind CSS, localStorage vía `caseService.js`

---

## File Map

| Archivo | Cambio |
|---|---|
| `src/pages/CasoDetalle.jsx` | Único archivo modificado. Cuatro cambios en orden: (1) toggle en modal de cita + campos en handler, (2) nuevos estados + handler de confirmación, (3) chips + botón en rendering de cards, (4) JSX del mini-modal de confirmación |

---

### Task 1: Agregar `requiereSoporte` al formulario y al handler de la cita

**Files:**
- Modify: `src/pages/CasoDetalle.jsx`

**Qué hace:** Añade el toggle "Requiere soporte" al formulario de agendar cita y pasa los campos `esCita`, `requiereSoporte`, `citaConfirmada`, `citaResultadoId` al seguimiento creado por la cita.

- [ ] **Step 1: Enriquecer el `addSeguimiento` dentro de `handleAddCita`**

Localiza `handleAddCita` (aprox. línea 73). Reemplaza el bloque `addSeguimiento` (aprox. líneas 96-101):

```jsx
// ANTES
addSeguimiento(caseId, {
  fecha: new Date().toISOString().split('T')[0],
  tipoSeguimiento: `Cita: ${formData.get('tipoCita')}`,
  descripcion: `Agendada para: ${formData.get('fecha')} de ${formData.get('horaInicio')} a ${formData.get('horaFin')}\nDetalles: ${formData.get('descripcion') || 'N/A'}`,
  responsable: 'Orientación Escolar'
})

// DESPUÉS
addSeguimiento(caseId, {
  fecha: new Date().toISOString().split('T')[0],
  tipoSeguimiento: `Cita: ${formData.get('tipoCita')}`,
  descripcion: `Agendada para: ${formData.get('fecha')} de ${formData.get('horaInicio')} a ${formData.get('horaFin')}\nDetalles: ${formData.get('descripcion') || 'N/A'}`,
  responsable: 'Orientación Escolar',
  esCita: true,
  requiereSoporte: formData.get('requiereSoporte') === 'on',
  citaConfirmada: false,
  citaResultadoId: null
})
```

- [ ] **Step 2: Agregar el toggle "Requiere soporte" en el modal de cita**

Localiza el formulario del modal de cita (`showCitaModal`, aprox. línea 473). Inserta el siguiente bloque **antes** del `<div className="flex gap-3 pt-2">` que contiene los botones Cancelar/Agendar:

```jsx
<div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
      <Paperclip size={16} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-700">Requiere soporte</p>
      <p className="text-[10px] text-slate-500">¿El citado debe traer soporte?</p>
    </div>
  </div>
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" name="requiereSoporte" className="sr-only peer" />
    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
  </label>
</div>
```

- [ ] **Step 3: Verificar en navegador**

1. Abre la app y navega a cualquier caso.
2. Presiona el botón "Cita". El toggle "Requiere soporte" debe aparecer antes de los botones.
3. Activa el toggle y agenda la cita.
4. Abre DevTools → Application → LocalStorage → `tilo_cases`.
5. Busca el último seguimiento del caso. Debe tener `esCita: true`, `requiereSoporte: true`, `citaConfirmada: false`, `citaResultadoId: null`.
6. Agenda otra cita con toggle desactivado → `requiereSoporte: false`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/CasoDetalle.jsx
git commit -m "feat: agregar campo requiereSoporte al agendar cita"
```

---

### Task 2: Agregar estados y handler `handleConfirmarCita`

**Files:**
- Modify: `src/pages/CasoDetalle.jsx`

**Qué hace:** Define los dos estados necesarios para el mini-modal de confirmación y el handler que actualiza el seguimiento original y crea el seguimiento de resultado. **Este task debe completarse antes del Task 3** porque el rendering del botón referencia estas variables.

- [ ] **Step 1: Agregar los dos nuevos estados al bloque de estados del componente**

Localiza el bloque de estados al inicio del componente (aprox. línea 12):

```jsx
// ANTES
const [showSeguimientoModal, setShowSeguimientoModal] = useState(false)
const [showCitaModal, setShowCitaModal] = useState(false)
const [showRutaModal, setShowRutaModal] = useState(false)
const [editingSeguimiento, setEditingSeguimiento] = useState(null)
const [showConfigMenu, setShowConfigMenu] = useState(false)

// DESPUÉS
const [showSeguimientoModal, setShowSeguimientoModal] = useState(false)
const [showCitaModal, setShowCitaModal] = useState(false)
const [showRutaModal, setShowRutaModal] = useState(false)
const [showConfirmCitaModal, setShowConfirmCitaModal] = useState(false)
const [citaParaConfirmar, setCitaParaConfirmar] = useState(null)
const [editingSeguimiento, setEditingSeguimiento] = useState(null)
const [showConfigMenu, setShowConfigMenu] = useState(false)
```

- [ ] **Step 2: Agregar `showConfirmCitaModal` al `useEffect` de scroll**

Localiza el `useEffect` que controla `no-scroll` (aprox. línea 20):

```jsx
// ANTES
useEffect(() => {
  if (showSeguimientoModal || showCitaModal || showRutaModal) {
    document.body.classList.add('no-scroll');
  } else {
    document.body.classList.remove('no-scroll');
  }
  return () => document.body.classList.remove('no-scroll');
}, [showSeguimientoModal, showCitaModal, showRutaModal]);

// DESPUÉS
useEffect(() => {
  if (showSeguimientoModal || showCitaModal || showRutaModal || showConfirmCitaModal) {
    document.body.classList.add('no-scroll');
  } else {
    document.body.classList.remove('no-scroll');
  }
  return () => document.body.classList.remove('no-scroll');
}, [showSeguimientoModal, showCitaModal, showRutaModal, showConfirmCitaModal]);
```

- [ ] **Step 3: Agregar el handler `handleConfirmarCita`**

Localiza `handleAddRuta` (aprox. línea 107). Inserta el siguiente handler **inmediatamente antes** de `handleAddRuta`:

```jsx
const handleConfirmarCita = (e) => {
  e.preventDefault()
  const formData = new FormData(e.target)
  const asistio = formData.get('asistio') === 'si'
  const trajoSoporte = formData.get('trajoSoporte') === 'si'
  const observaciones = formData.get('observaciones')

  const lineas = [
    `Asistió: ${asistio ? 'Sí' : 'No'}`,
    citaParaConfirmar.requiereSoporte ? `Trajo soporte: ${trajoSoporte ? 'Sí' : 'No'}` : null,
    observaciones ? `Observaciones: ${observaciones}` : null
  ].filter(Boolean).join('\n')

  addSeguimiento(caseId, {
    fecha: new Date().toISOString().split('T')[0],
    tipoSeguimiento: 'Resultado de cita',
    descripcion: lineas,
    responsable: 'Orientación Escolar',
    esCitaResultado: true,
    asistio,
    trajoSoporte: citaParaConfirmar.requiereSoporte ? trajoSoporte : null
  })

  updateSeguimiento(caseId, citaParaConfirmar.id, { citaConfirmada: true })

  setShowConfirmCitaModal(false)
  setCitaParaConfirmar(null)
}
```

- [ ] **Step 4: Verificar que la app compila sin errores**

Abre la app en el navegador. No debe haber errores en consola. No hay cambios visuales en este paso.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CasoDetalle.jsx
git commit -m "feat: agregar estados y handler de confirmación de asistencia a cita"
```

---

### Task 3: Renderizar chips de estado y botón "Confirmar asistencia" en las cards

**Files:**
- Modify: `src/pages/CasoDetalle.jsx`

**Qué hace:** Modifica el rendering del map de seguimientos para mostrar chips de estado en citas (`esCita`) y resultados (`esCitaResultado`), y el botón "Confirmar asistencia" en citas no confirmadas.

- [ ] **Step 1: Reemplazar el bloque de chips por la versión extendida**

Localiza dentro del `.map()` de seguimientos (aprox. línea 300) el div con los chips existentes:

```jsx
<div className="flex gap-2 items-center">
  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">{seg.tipoSeguimiento}</span>
  {seg.hasSoporte && (
    <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">
      <Paperclip size={10} /> Soporte
    </span>
  )}
  {seg.editado && (
    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded-md">
      <Edit2 size={10} /> Editado
    </span>
  )}
</div>
```

Reemplázalo con:

```jsx
<div className="flex gap-2 items-center flex-wrap">
  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">{seg.tipoSeguimiento}</span>
  {seg.hasSoporte && (
    <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">
      <Paperclip size={10} /> Soporte
    </span>
  )}
  {seg.esCita && seg.requiereSoporte && !seg.citaConfirmada && (
    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
      <Paperclip size={10} /> Requiere soporte
    </span>
  )}
  {seg.esCita && seg.citaConfirmada && (
    <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">
      <CheckCircle2 size={10} /> Confirmada
    </span>
  )}
  {seg.esCitaResultado && seg.asistio && (
    <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">
      <CheckCircle2 size={10} /> Asistió
    </span>
  )}
  {seg.esCitaResultado && !seg.asistio && (
    <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-1 rounded-md">
      <XCircle size={10} /> No se presentó
    </span>
  )}
  {seg.editado && (
    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded-md">
      <Edit2 size={10} /> Editado
    </span>
  )}
</div>
```

- [ ] **Step 2: Agregar el botón "Confirmar asistencia" en las cards de cita no confirmadas**

Localiza el `<div className="relative">` que contiene la descripción del seguimiento (aprox. línea 327):

```jsx
<div className="relative">
  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{seg.descripcion}</p>
</div>
```

Reemplázalo con:

```jsx
<div className="relative">
  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{seg.descripcion}</p>
</div>
{seg.esCita && !seg.citaConfirmada && (
  <button
    onClick={() => { setCitaParaConfirmar(seg); setShowConfirmCitaModal(true) }}
    className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition-colors"
  >
    <CheckCircle2 size={14} /> Confirmar asistencia
  </button>
)}
```

- [ ] **Step 3: Verificar rendering de chips en navegador**

1. Las citas agendadas con `requiereSoporte: true` muestran chip ámbar "Requiere soporte" y botón "Confirmar asistencia".
2. Las citas agendadas con `requiereSoporte: false` muestran solo el botón "Confirmar asistencia" (sin chip ámbar).
3. Los seguimientos existentes sin `esCita` no muestran cambios.

- [ ] **Step 4: Commit**

```bash
git add src/pages/CasoDetalle.jsx
git commit -m "feat: renderizar chips de estado y botón de confirmación en seguimientos de cita"
```

---

### Task 4: Agregar el mini-modal de confirmación de asistencia

**Files:**
- Modify: `src/pages/CasoDetalle.jsx`

**Qué hace:** Inserta el JSX del mini-modal que abre al presionar "Confirmar asistencia", con formulario de asistencia + soporte + observaciones. Al guardar, llama a `handleConfirmarCita`.

- [ ] **Step 1: Insertar el JSX del mini-modal**

Localiza el bloque `{showRutaModal && (...)}` (aprox. línea 511). Inserta el siguiente bloque **inmediatamente después** del cierre de ese bloque (`})`):

```jsx
{showConfirmCitaModal && citaParaConfirmar && (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[85vh]">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-blue-600" /> Confirmar asistencia
        </h2>
        <button
          onClick={() => { setShowConfirmCitaModal(false); setCitaParaConfirmar(null) }}
          className="p-2 hover:bg-white rounded-full text-slate-400 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <form onSubmit={handleConfirmarCita} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs text-blue-800 font-medium">
            {citaParaConfirmar.tipoSeguimiento} — {citaParaConfirmar.descripcion?.split('\n')[0]}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">¿Asistió a la cita? *</label>
            <select required name="asistio" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">-- Selecciona --</option>
              <option value="si">Sí asistió</option>
              <option value="no">No se presentó</option>
            </select>
          </div>

          {citaParaConfirmar.requiereSoporte && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">¿Trajo soporte? *</label>
              <select required name="trajoSoporte" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">-- Selecciona --</option>
                <option value="si">Sí trajo soporte</option>
                <option value="no">No trajo soporte</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones (Opcional)</label>
            <textarea
              name="observaciones"
              rows="3"
              placeholder="Notas adicionales sobre la cita..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowConfirmCitaModal(false); setCitaParaConfirmar(null) }}
              className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Verificar flujo completo en navegador**

**Caso A — Cita con soporte requerido, asistió:**
1. Crea una cita con toggle "Requiere soporte" activado.
2. En el historial presiona "Confirmar asistencia". El modal muestra los selectores "¿Asistió?" y "¿Trajo soporte?".
3. Selecciona "Sí asistió" y "No trajo soporte". Escribe una observación. Presiona "Registrar".
4. El modal se cierra. La card original muestra chip verde "Confirmada ✓" y sin botón "Confirmar asistencia".
5. Un nuevo seguimiento "Resultado de cita" aparece con chip verde "Asistió ✓".
6. En LocalStorage, el seguimiento original tiene `citaConfirmada: true`. El nuevo tiene `esCitaResultado: true`, `asistio: true`, `trajoSoporte: false`, y la descripción incluye "Trajo soporte: No" y la observación.

**Caso B — Cita sin soporte requerido, no asistió:**
1. Crea una cita con toggle desactivado.
2. Presiona "Confirmar asistencia". El modal **no** muestra el selector "¿Trajo soporte?".
3. Selecciona "No se presentó". Presiona "Registrar".
4. El nuevo seguimiento muestra chip rojo "No se presentó". La descripción solo tiene "Asistió: No" (sin línea de soporte).

**Caso C — Regresión:**
1. Los seguimientos manuales existentes (tipo "Estudiante", "Docente", etc.) siguen mostrando y funcionando igual.
2. El botón "Confirmar asistencia" no aparece en seguimientos que no son citas.

- [ ] **Step 3: Commit final**

```bash
git add src/pages/CasoDetalle.jsx
git commit -m "feat: mini-modal de confirmación de asistencia a cita con registro en seguimientos"
```
