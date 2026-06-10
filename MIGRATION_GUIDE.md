# Database Migrations Guide

## Overview

This document describes the database schema migrations for the TiLoApp case management system.

## Current Migration Status

### Migration 001: Add data JSONB column to cases table

**File:** `scripts/migrations/001_add_data_column_to_cases.sql`

**Purpose:** Add a flexible JSONB column to store additional case data fields that aren't part of the core schema.

**Fields stored in data column:**
- `estudiante`: Student name (duplicated with `nombre` for UI compatibility)
- `genero`: Gender (Masculino/Femenino/Otro)
- `grado`: Grade level (Prejardín through 5°)
- `sede`: Campus location
- `identificacionOrigen`: How case was identified
- `motivoRemision`: Reason for referral
- `nivelRiesgo`: Risk level (Bajo/Medio/Alto/Prioritario)
- `docenteRemitente`: Referring teacher name
- `observaciones`: Initial observations
- `seguimientos`: Array of follow-up records
- `rutaActivada`: Route activation status

**Status:** Pending deployment to production

## Running Migrations

### Option 1: Using Node.js script (Recommended)

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:password@host:5432/database"

# Run migration 001
node scripts/runMigration.js 001

# Run latest migration (default)
node scripts/runMigration.js
```

### Option 2: Using psql command line

```bash
# Connect to Neon database and execute migration
psql $DATABASE_URL < scripts/migrations/001_add_data_column_to_cases.sql
```

### Option 3: Using Neon Web Console

1. Go to https://console.neon.tech
2. Select your project and database
3. Open the SQL Editor
4. Copy the contents of `scripts/migrations/001_add_data_column_to_cases.sql`
5. Execute the SQL

## Migration Details

### Before Migration
- Cases table had 11 columns
- Additional data was being collected by the form but lost during save
- API had fallback logic when data column didn't exist

### After Migration
- Cases table has 12 columns (added `data` JSONB)
- All additional fields are now persisted
- 4 new indexes created for common queries (genero, grado, sede, nivelRiesgo)

### Rollback (if needed)

```sql
DROP INDEX IF EXISTS idx_cases_data_nivelRiesgo;
DROP INDEX IF EXISTS idx_cases_data_sede;
DROP INDEX IF EXISTS idx_cases_data_grado;
DROP INDEX IF EXISTS idx_cases_data_genero;
DROP INDEX IF EXISTS idx_cases_data;
ALTER TABLE cases DROP COLUMN IF EXISTS data;
```

## Schema Changes

### Before:
```sql
CREATE TABLE cases (
  id TEXT PRIMARY KEY,
  identificacion TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipoCaso TEXT,
  estado TEXT DEFAULT 'Activo',
  fechaInicio TIMESTAMP,
  fechaFin TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### After:
```sql
CREATE TABLE cases (
  id TEXT PRIMARY KEY,
  identificacion TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipoCaso TEXT,
  estado TEXT DEFAULT 'Activo',
  fechaInicio TIMESTAMP,
  fechaFin TIMESTAMP,
  data JSONB DEFAULT '{}'::jsonb,  -- NEW COLUMN
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## Testing Migration

After running the migration:

1. Verify the column exists:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'cases' AND column_name = 'data';
```

2. Create a test case and verify data is stored:
```bash
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-case-1",
    "identificacion": "12345",
    "codigo": "TEST-001",
    "nombre": "Test Student",
    "estudiante": "Test Student",
    "genero": "Masculino",
    "grado": "3°",
    "sede": "Santa Mónica (JM)",
    "nivelRiesgo": "Medio"
  }'
```

3. Verify the data is stored in the data column:
```sql
SELECT id, nombre, data FROM cases WHERE id = 'test-case-1';
```

## FAQ

**Q: Will existing cases lose data?**
A: No. The migration only adds a new empty column. Existing data in other columns is preserved.

**Q: Can I query the data column?**
A: Yes. Use PostgreSQL's JSONB operators:
```sql
-- Find cases with specific gender
SELECT * FROM cases WHERE data->>'genero' = 'Femenino';

-- Find high-risk cases
SELECT * FROM cases WHERE data->>'nivelRiesgo' IN ('Alto', 'Prioritario');
```

**Q: What if the migration fails?**
A: The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times. Check the error message and address any database permission issues.

## Related Files

- API handler: `/api/cases.js` (already supports data column)
- Form component: `/src/pages/CasosDashboard.jsx`
- Database utilities: `/api/db.js`
- Init script: `/scripts/init-db.sql`
