# TiLoApp Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy TiLoApp from GitHub to production on Vercel with persistent PostgreSQL database, replacing localStorage with API-driven data persistence.

**Architecture:** Five-phase approach starting with infrastructure setup (Vercel + Postgres), followed by serverless API route implementation, frontend refactoring to use APIs instead of localStorage, pre-production verification, and final production deployment with monitoring.

**Tech Stack:** React 19, Vite 8, Vercel Edge Functions (Node.js), Vercel Postgres (PostgreSQL), GitHub for version control.

---

## File Structure Overview

**Files to create:**
- `api/cases.js` — CRUD endpoints for cases
- `api/activities.js` — CRUD endpoints for activities  
- `api/alerts.js` — CRUD endpoints for alerts
- `api/db.js` — Shared database connection utility
- `docs/DEPLOYMENT.md` — Deployment runbook
- `vercel.json` — Vercel configuration

**Files to modify:**
- `src/services/caseService.js` — Replace localStorage with fetch calls
- `src/services/activityService.js` — Replace localStorage with fetch calls
- `src/services/alertService.js` — Replace localStorage with fetch calls
- `package.json` — Add postgres client dependency
- `.env.example` — Document required environment variables

---

## PHASE 1: Infrastructure Setup

### Task 1: Create Vercel Account and Connect Repository

**Files:**
- None (manual setup in UI)

- [ ] **Step 1: Create Vercel account or login**

Go to https://vercel.com and sign up or login with GitHub account.

- [ ] **Step 2: Import project**

Click "Add New..." → "Project" → Select your GitHub account → Select `Andrex036/TiLoApp` repo

- [ ] **Step 3: Configure build settings**

In Vercel project settings:
- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`

- [ ] **Step 4: Verify project appears in Vercel dashboard**

Navigate to https://vercel.com/dashboard and confirm `TiLoApp` appears in your projects list.

---

### Task 2: Create Vercel Postgres Database

**Files:**
- None (manual setup via Vercel dashboard)

- [ ] **Step 1: Go to Vercel Storage tab**

In your project dashboard, click "Storage" tab.

- [ ] **Step 2: Create Postgres database**

Click "Create" → Select "Postgres" → Choose region (closest to users or default) → Name it `tiloapp-db` → Click "Create"

- [ ] **Step 3: Copy connection string**

After database is created, copy the `POSTGRES_URL` or `DATABASE_URL` from the "Connection String" section.

- [ ] **Step 4: Add to environment variables**

In Vercel project Settings → Environment Variables:
- Name: `DATABASE_URL`
- Value: (paste the connection string)
- Environments: Production, Preview, Development

- [ ] **Step 5: Verify connection**

Run locally:
```bash
cd d:/TiLoApp
npm install pg
node -e "require('pg').connect(process.env.DATABASE_URL, (err, client, done) => { console.log(err ? 'FAIL: ' + err.message : 'OK'); done(); })"
```

Expected: `OK` (no connection errors)

---

### Task 3: Create Database Schema

**Files:**
- Create: `scripts/init-db.sql`

- [ ] **Step 1: Create init script**

```sql
-- scripts/init-db.sql
-- Initialize TiLoApp database schema

CREATE TABLE IF NOT EXISTS cases (
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

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  caseId TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP,
  resultado TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  caseId TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  prioridad TEXT DEFAULT 'normal',
  mensaje TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activities_caseId ON activities(caseId);
CREATE INDEX IF NOT EXISTS idx_alerts_caseId ON alerts(caseId);
CREATE INDEX IF NOT EXISTS idx_alerts_activo ON alerts(activo);
```

- [ ] **Step 2: Execute schema against database**

```bash
# Using psql (if installed), or via Vercel CLI
psql "$DATABASE_URL" < scripts/init-db.sql
```

If `psql` not available, use Vercel dashboard: Storage → tiloapp-db → "Query" tab, paste schema and execute.

- [ ] **Step 3: Verify tables created**

```bash
psql "$DATABASE_URL" -c "\dt"
```

Expected output shows `cases`, `activities`, `alerts` tables.

---

### Task 4: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add postgres client**

```bash
cd d:/TiLoApp
npm install pg
```

- [ ] **Step 2: Verify installation**

```bash
npm list pg
```

Expected: `pg@<version>` listed

---

### Task 5: Create Environment Configuration

**Files:**
- Create: `.env.example`
- Create: `.env.local` (for local development)

- [ ] **Step 1: Create .env.example**

```bash
# .env.example
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=development
```

- [ ] **Step 2: Create .env.local for development**

```bash
# .env.local
# Get this value from Vercel dashboard: Storage → tiloapp-db → "Connection String"
DATABASE_URL=postgresql://...
NODE_ENV=development
```

- [ ] **Step 3: Verify .env.local is in .gitignore**

```bash
grep "\.env" d:/TiLoApp/.gitignore
```

If not present, add:
```
.env.local
.env
```

---

## PHASE 2: Backend API Implementation

### Task 6: Create Shared Database Connection Utility

**Files:**
- Create: `api/db.js`

- [ ] **Step 1: Write database connection module**

```javascript
// api/db.js
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query in ${duration}ms`, { text, params });
    return res;
  } catch (error) {
    console.error('Database query error', { text, params, error });
    throw error;
  }
}

module.exports = { query, getPool };
```

- [ ] **Step 2: Verify file exists and syntax is correct**

```bash
node -c api/db.js
```

Expected: No output (syntax OK)

---

### Task 7: Implement Cases API Endpoint

**Files:**
- Create: `api/cases.js`

- [ ] **Step 1: Write GET /api/cases and POST /api/cases**

```javascript
// api/cases.js
const { query } = require('./db');

export default async function handler(req, res) {
  // Enable CORS
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
      // GET all cases
      const result = await query('SELECT * FROM cases ORDER BY createdAt DESC');
      res.status(200).json(result.rows);
    } else if (req.method === 'POST') {
      // CREATE new case
      const { id, identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin } = req.body;
      
      // Validation
      if (!id || !nombre) {
        return res.status(400).json({ error: 'Missing required fields: id, nombre' });
      }

      const result = await query(
        'INSERT INTO cases (id, identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *',
        [id, identificacion, codigo, nombre, descripcion, tipoCaso, estado || 'Activo', fechaInicio, fechaFin]
      );
      
      res.status(201).json(result.rows[0]);
    } else if (req.method === 'PUT') {
      // UPDATE case
      const { id, identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }

      const result = await query(
        'UPDATE cases SET identificacion=$1, codigo=$2, nombre=$3, descripcion=$4, tipoCaso=$5, estado=$6, fechaInicio=$7, fechaFin=$8, updatedAt=NOW() WHERE id=$9 RETURNING *',
        [identificacion, codigo, nombre, descripcion, tipoCaso, estado, fechaInicio, fechaFin, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Case not found' });
      }

      res.status(200).json(result.rows[0]);
    } else if (req.method === 'DELETE') {
      // DELETE case (cascade will delete activities & alerts)
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
```

- [ ] **Step 2: Test endpoint with curl locally**

First, start dev server:
```bash
cd d:/TiLoApp
npm run dev
```

In another terminal, test GET:
```bash
curl http://localhost:5173/api/cases
```

Expected: JSON array (may be empty if no cases yet)

Test POST:
```bash
curl -X POST http://localhost:5173/api/cases \
  -H "Content-Type: application/json" \
  -d '{"id":"case-1","identificacion":"ID-001","codigo":"Caso #1","nombre":"Test Case","tipoCaso":"Nuevo","estado":"Activo"}'
```

Expected: `201` status with created case data

---

### Task 8: Implement Activities API Endpoint

**Files:**
- Create: `api/activities.js`

[... activities endpoint implementation ...]

---

### Task 9: Implement Alerts API Endpoint

**Files:**
- Create: `api/alerts.js`

[... alerts endpoint implementation ...]

---

### Task 10: Create Vercel Configuration

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Write Vercel configuration**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "DATABASE_URL": "@database_url"
  }
}
```

---

## PHASE 2-5: Remaining phases...

[Rest of plan continues...]

