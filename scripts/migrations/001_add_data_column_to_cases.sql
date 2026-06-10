-- scripts/migrations/001_add_data_column_to_cases.sql
-- Migration: Add data JSONB column to cases table to store additional fields
-- This allows storing: estudiante, genero, grado, sede, motivoRemision, nivelRiesgo,
-- identificacionOrigen, docenteRemitente, observaciones, seguimientos, rutaActivada, etc.

BEGIN;

-- Add the data column if it doesn't exist
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- Create an index on the data column for better query performance
CREATE INDEX IF NOT EXISTS idx_cases_data ON cases USING GIN (data);

-- Create an index for common searches in data (genero, grado, sede, estado risk)
CREATE INDEX IF NOT EXISTS idx_cases_data_genero ON cases ((data->>'genero'));
CREATE INDEX IF NOT EXISTS idx_cases_data_grado ON cases ((data->>'grado'));
CREATE INDEX IF NOT EXISTS idx_cases_data_sede ON cases ((data->>'sede'));
CREATE INDEX IF NOT EXISTS idx_cases_data_nivelRiesgo ON cases ((data->>'nivelRiesgo'));

COMMIT;

-- Field documentation for data column:
-- {
--   "estudiante": "String - Student name",
--   "genero": "String - Gender (Masculino/Femenino/Otro)",
--   "grado": "String - Grade level (Prejardín through 5°)",
--   "sede": "String - Campus location",
--   "identificacionOrigen": "String - How case was identified (Por Estudiante/Por Padre/Por Docente)",
--   "motivoRemision": "String - Reason for referral",
--   "motivo": "String - Alias for motivoRemision",
--   "nivelRiesgo": "String - Risk level (Bajo/Medio/Alto/Prioritario)",
--   "docenteRemitente": "String - Referring teacher name",
--   "observaciones": "String - Initial observations",
--   "seguimientos": "Array - Follow-up records",
--   "rutaActivada": "Boolean/Array - Route activation status"
-- }
