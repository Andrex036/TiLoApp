# TiLoApp — Módulo Atención por Orientación Escolar

Estado: especificación funcional aprobada por la usuaria; **pendiente de implementación y validación**. No representa funciones ya publicadas en Vercel.

## Objetivo
Gestionar los expedientes de estudiantes atendidos o remitidos a Orientación Escolar, partiendo de los formatos físicos obligatorios y evitando la doble digitación. La aplicación actual React/Vite/Vercel/PostgreSQL debe adaptarse sin sustituir ni eliminar registros existentes. La arquitectura de escritorio local con Tauri/SQLite sigue siendo una propuesta futura distinta: no se debe afirmar que la web actual almacena datos localmente.

## 1. Inicio del módulo
- Indicadores diferenciados: estudiantes únicos, atenciones, casos abiertos/en seguimiento/cerrados/trasladados, seguimientos pendientes por periodo, rutas activas, remisiones, soportes de salud y citaciones incumplidas.
- Filtros por año, periodo, sede/jornada, grado, motivo, origen, estado y prioridad.
- Sedes iniciales: Santa Mónica JM, Santa Mónica JT, El Carmen JM, Puerres JM, Villaflor JM, Villaflor JT; catálogo ampliable. No añadir Canchala por defecto.
- Calendario semanal por defecto; vistas diaria/mensual, días fijos por sede, franjas para acudientes y avisos 3 días antes; críticos inmediatos.

## 2. Solicitudes y expedientes
- Orígenes: docente, padre/madre/acudiente, coordinación, solicitud espontánea de estudiante, entidad externa, identificación directa desde Orientación Escolar.
- Una solicitud recibida queda en bandeja pendiente; el expediente de atención se abre formalmente con primera atención e historia educativa.
- Solo incluir en la base estudiantes atendidos o remitidos.
- Identificación: nombres, tipo/número de documento, nacimiento/edad, grado/grupo, sede/jornada, director de grupo.
- Familia: múltiples acudientes con principal, parentesco, teléfono, dirección/barrio, convivencia, contacto de emergencia y custodia/representación cuando aplique.
- Expediente longitudinal único; matrícula, grado, sede, grupo y jornada por vigencia. No sobrescribir datos históricos.
- Estados de caso: «Abierto / en atención», «En seguimiento», «Cerrado», «Trasladado o retirado». Registrar motivo, fecha y autor de cada transición.
- Motivos catalogados y ampliables. Prioridad sugerida por sistema pero siempre confirmada/corregible por orientadora; sin diagnóstico automatizado.
- No cerrar expediente automáticamente.

## 3. Atenciones y seguimientos
- Registros: historia inicial; atención individual; seguimiento al estudiante, al docente y al acudiente por separado; observaciones y evolución; recomendaciones/compromisos; intervención grupal relacionada; atención externa con soportes.
- Durante cada periodo académico en que el caso esté activo: **un seguimiento de estudiante, uno de docente y uno de acudiente**; ofrecer excepciones justificadas. Un caso abierto en periodos posteriores no debe generar atrasos ficticios de periodos anteriores.
- El sistema distingue una cita programada de un seguimiento efectivo validado; una inasistencia no cuenta como seguimiento cumplido.
- Relacionar citas, tipo de contacto, fecha, resultado, autor, documento, compromisos y próxima cita.
- La orientadora decide manualmente qué hacer tras una inasistencia (justificación, contacto, reprogramar, derivar o cerrar actuación).
- Tras tres inasistencias, mostrar aviso **«Revisar posible remisión a ICBF»**, exigiendo valoración humana y documentación de la decisión. Queda pendiente concretar si serán injustificadas acumuladas o consecutivas, y si aplica solo acudiente; no asumir una regla automática de remisión.
- La detección de riesgo urgente activa señalización prioritaria desde la primera noticia, independientemente del conteo de inasistencias.
- Seguimientos realizados por practicantes autorizadas importados desde Google Drive/Excel: controlar identidad del estudiante, duplicados, procedencia, fecha, autor y aprobación por orientadora. No copiar notas clínicas a informes de desempeño de practicantes.
- Separar «caso» de «acto de atención» y «seguimiento». Permitir múltiples actuaciones el mismo día y varias situaciones por estudiante.

## 4. Rutas asociadas
- Convivencia I/II/III; conducta suicida; SPA; presunta violencia sexual; maltrato/negligencia; embarazo; discriminación/racismo/xenofobia; ciberacoso; otras configurables.
- Clasificación asistida o manual, validada por orientadora. Registro simplificado o detallado de cada actuación.
- Cada ruta puede coexistir con otras en el mismo caso, cada una con su cronología, entidad, remisión, radicado, respuesta, soporte de salud, compromiso, plazo y cierre independiente.
- Plazos sugeridos editables, **sin sustituir plazos legales/protocolos ni diferir urgencias**.
- Si la actuación requiere atención en salud, alerta abierta hasta validar soporte o registrar una resolución justificada.
- Cierre de ruta solo tras validación profesional y documental, sin cerrar necesariamente el caso.
- Protocolos institucionales deben revisarse y aprobarse antes de publicarlos.

## 5. Oficios y documentos
- Generar oficio de recomendaciones a docente desde dificultades o recomendaciones documentadas; no inferir diagnósticos y minimizar información sensible. Exigir revisión antes de generar Word/PDF.
- Otros formatos: historia educativa, citaciones, seguimientos, remisiones, actas, reportes.
- Documentos con membrete institucional y consecutivo por año y tipo; preservar originales.
- Integrar fotografías del celular, escáner, transferencia local QR; OCR local sujeto a pruebas reales. Mostrar texto extraído y coincidencias de estudiante con confirmación explícita.
- Documento digital asociado a código interno y ubicación física por sede (carpeta/folio). Guardar originales inmutables y versiones de trabajo; registrar hash/fecha/procedencia.
- No incluir fotos de menores ni expedientes identificables en informes públicos o de practicantes.

## 6. Seguridad — condición de despliegue
**Bloqueante: no almacenar datos reales de menores en el despliegue público sin revisión de seguridad.**
- El repositorio público contiene un archivo `.env`. Auditar si contiene credenciales reales. Si las contiene: revocarlas/rotarlas, eliminarlas del repositorio y de su historial expuesto, sustituir por variables secretas del proveedor. No basta añadirlo al `.gitignore`.
- Los endpoints `/api/cases` y seguimientos deben tener autenticación, autorización por recurso, validación de entrada, protección de archivos y auditoría. El endpoint de casos inspeccionado no muestra una comprobación de identidad previa a listar o modificar información.
- Revisar CORS y gestión de cookies/tokens; limitar exposición de errores SQL y de datos personales.
- Probar acceso no autenticado y controles de acceso en todos los verbos (GET, POST, PUT, DELETE) y endpoints relacionados.
- Para app local futura: cifrado en reposo, bloqueo por inactividad, copias cifradas diarias/al cerrar/manuales, recuperación probada.
- Incluir registros de prueba ficticios únicamente hasta cerrar estos riesgos.

## 7. Esquema de datos sugerido (evolutivo)
- `students` (id interno, identificaciones, nombre, nacimiento)
- `student_enrollments` (student_id, vigencia, sede, jornada, grado, grupo, docente)
- `guardians` y `student_guardians` (principal, parentesco, historial, restricciones justificadas)
- `referral_requests` (origen, recibido, estado, documento)
- `cases` (student_id, apertura, motivo, prioridad revisada, estado, cierre)
- `interventions` (case_id, fecha, tipo, contenido, profesional, validado)
- `period_followup_requirements` (case_id, vigencia, periodo, tipo, estado, excepción)
- `appointments` (fecha, asistió, justificación, tipo, resultado)
- `routes`, `route_actions`, `health_document_requirements`
- `documents` (origen, clase, clasificación, ubicación física, validación, versión, permisos)
- `teacher_recommendation_letters`, `alerts`, `audit_log`

Preferir migraciones aditivas y pruebas con respaldo. No cambiar nombres/campos actuales sin inventario de dependencias.

## 8. Criterios de aceptación
1. Apertura de expediente desde primera historia, vinculando remisión previa.
2. Un estudiante no se duplica al cambiar de sede, grado o año.
3. Seguimiento estudiante/docente/acudiente se calcula por periodo activo y no se satisface por una cita sin asistencia.
4. Inasistencias documentadas y alerta tras tercer evento según regla confirmada, sin envío automático a ICBF.
5. Ruta con soporte de salud pendiente genera aviso hasta resolución validada.
6. Oficio docente Word/PDF revisable con datos mínimos.
7. Importación de documento exige confirmar extracción OCR y vínculo de estudiante.
8. Acceso sin autenticación a endpoints de casos y documentos devuelve denegación, y los datos no se filtran al cliente.
9. Los informes de practicantes no incluyen expedientes sensibles.
10. No se despliega funcionalidad que exponga información de estudiantes durante las pruebas.

## 9. Orden sugerido de implementación
A. Auditoría de seguridad y autenticación antes de datos reales; B. migraciones estudiantes/familias/vigencias; C. historias y actuaciones; D. obligaciones de seguimiento y alertas; E. documentos/oficios; F. Drive/OCR; G. rutas y reportes, con pruebas por iteración.
