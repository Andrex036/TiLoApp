# Diseño: Soporte requerido y confirmación de asistencia en citas

**Fecha:** 2026-05-18  
**Proyecto:** TiLoApp — Módulo de casos (CasoDetalle)

---

## Resumen

Agregar tres capacidades al flujo de citas del módulo de casos:

1. Al **agendar** una cita, indicar si el citado debe traer soporte (documentos, acudiente u otro).
2. En el **historial de seguimientos**, mostrar el estado de la cita y permitir confirmar asistencia mediante un botón dedicado.
3. Al **confirmar**, registrar si el citado asistió, si trajo soporte, y notas opcionales — generando un nuevo seguimiento de resultado.

---

## Modelo de datos

### Seguimiento de "Cita agendada" (creado al agendar)

Campos nuevos que se agregan al objeto de seguimiento existente:

```js
{
  // ... campos existentes (id, fecha, tipoSeguimiento, descripcion, responsable) ...
  esCita: true,           // boolean — identifica este seguimiento como cita agendada
  requiereSoporte: false, // boolean — si el citado debe traer soporte
  citaConfirmada: false,  // boolean — si ya se registró la asistencia
  citaResultadoId: null   // string | null — id del seguimiento de resultado, una vez confirmada
}
```

### Seguimiento de "Resultado de cita" (creado al confirmar asistencia)

```js
{
  id: "seg-yyy",
  tipoSeguimiento: "Resultado de cita",
  fecha: "<fecha del día en que se confirma>",
  descripcion: "Asistió: Sí\nTrajo soporte: No\nObservaciones: <texto>",
  responsable: "Orientación Escolar",
  esCitaResultado: true, // boolean — identifica este seguimiento como resultado de cita
  asistio: true,         // boolean
  trajoSoporte: false    // boolean
}
```

---

## Cambios en UI

### 1. Modal "Agendar Cita"

Se agrega un toggle al final del formulario existente (antes de los botones Cancelar/Agendar):

- **Etiqueta:** "Requiere soporte"
- **Subtítulo:** "¿El citado debe traer soporte a la cita?"
- **Control:** Toggle on/off (mismo estilo que el toggle de `hasSoporte` en el formulario de seguimiento)
- **Campo:** `name="requiereSoporte"`, se lee como `formData.get('requiereSoporte') === 'on'`

### 2. Card de seguimiento de tipo cita (`esCita: true`)

Se agregan dos elementos visuales al renderizado:

**Chip de soporte requerido** (solo si `requiereSoporte === true` y `citaConfirmada === false`):
- Ícono: `📎` + texto "Requiere soporte"
- Color: amarillo/ámbar (`bg-amber-50 text-amber-700`)

**Chip de confirmada** (solo si `citaConfirmada === true`):
- Texto "Confirmada ✓"
- Color: verde (`bg-green-50 text-green-700`)

**Botón "Confirmar asistencia"** (solo si `citaConfirmada === false`):
- Aparece como botón pequeño en la parte inferior de la card
- Al presionarlo: abre el mini-modal de confirmación con esa cita preseleccionada
- Desaparece una vez `citaConfirmada === true`

### 3. Mini-modal "Confirmar asistencia"

Estado nuevo en `CasoDetalle`: `showConfirmCitaModal` (boolean) y `citaParaConfirmar` (objeto seguimiento o null).

Campos del formulario:

| Campo | Tipo | Condición |
|---|---|---|
| ¿Asistió a la cita? | Selector Sí/No (botones radio) | Siempre |
| ¿Trajo soporte? | Selector Sí/No (botones radio) | Solo si `citaParaConfirmar.requiereSoporte === true` |
| Observaciones | Textarea opcional | Siempre |

### 4. Card de seguimiento de resultado (`esCitaResultado: true`)

Se renderiza igual que un seguimiento normal, pero con chips de color según resultado:
- `asistio === true` → chip verde "Asistió ✓"
- `asistio === false` → chip rojo "No se presentó"

---

## Flujo completo

```
1. Orientador abre modal "Cita"
   └─ Llena: fecha, hora inicio/fin, tipo, detalle, toggle "Requiere soporte"
   └─ Guarda → createActivity() + addSeguimiento({esCita:true, requiereSoporte, citaConfirmada:false})

2. En historial de seguimientos:
   └─ Seguimiento de cita muestra chip "Requiere soporte" (si aplica) + botón "Confirmar asistencia"

3. Orientador presiona "Confirmar asistencia"
   └─ Abre mini-modal con: ¿Asistió?, ¿Trajo soporte? (si aplica), Observaciones
   └─ Guarda →
       a) updateSeguimiento(citaId, { citaConfirmada: true, citaResultadoId: nuevoId })
       b) addSeguimiento({ esCitaResultado: true, asistio, trajoSoporte, descripcion, fecha: hoy })

4. Historial actualizado:
   └─ Seguimiento original: chip "Confirmada ✓", sin botón "Confirmar asistencia"
   └─ Nuevo seguimiento de resultado: chip "Asistió ✓" o "No se presentó"
```

---

## Archivos a modificar

| Archivo | Cambios |
|---|---|
| `src/pages/CasoDetalle.jsx` | • Toggle `requiereSoporte` en modal de cita<br>• Pasar `requiereSoporte` al `addSeguimiento` de la cita<br>• Estado `showConfirmCitaModal` + `citaParaConfirmar`<br>• Handler `handleConfirmarCita()`<br>• Renderizado condicional de chips y botón en cards de seguimiento<br>• Mini-modal de confirmación |
| `src/services/caseService.js` | Sin cambios — `updateSeguimiento` y `addSeguimiento` ya admiten campos arbitrarios |

---

## Criterios de éxito

- El formulario de cita tiene toggle de soporte requerido y el dato se guarda en el seguimiento.
- Las cards de cita en el historial muestran chip "Requiere soporte" cuando corresponde.
- El botón "Confirmar asistencia" aparece en citas no confirmadas y desaparece tras confirmar.
- El mini-modal muestra el campo "¿Trajo soporte?" solo si la cita lo requería.
- Tras confirmar, se crea un seguimiento de resultado visible en el historial con estado correcto.
- Los seguimientos existentes de citas (sin los campos nuevos) no se rompen.
