-- scripts/init-db.sql
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

CREATE INDEX IF NOT EXISTS idx_activities_caseId ON activities(caseId);
CREATE INDEX IF NOT EXISTS idx_alerts_caseId ON alerts(caseId);
CREATE INDEX IF NOT EXISTS idx_alerts_activo ON alerts(activo);
