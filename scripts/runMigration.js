#!/usr/bin/env node

/**
 * Migration runner script
 * Executes SQL migration files to update database schema
 *
 * Usage: node scripts/runMigration.js [migration-number]
 * Example: node scripts/runMigration.js 001
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration(migrationNumber = '001') {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    const migrationFile = path.join(__dirname, 'migrations', `${migrationNumber}_*.sql`);
    const migrationsDir = path.join(__dirname, 'migrations');

    // Find the migration file
    const files = fs.readdirSync(migrationsDir);
    const migrationPath = files
      .filter(f => f.startsWith(migrationNumber) && f.endsWith('.sql'))
      .map(f => path.join(migrationsDir, f))[0];

    if (!migrationPath) {
      console.error(`ERROR: Migration ${migrationNumber} not found in ${migrationsDir}`);
      process.exit(1);
    }

    console.log(`Running migration: ${path.basename(migrationPath)}`);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
      console.log('Executing migration SQL...');
      await client.query(sql);
      console.log('✓ Migration completed successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('ERROR during migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
const migrationNum = process.argv[2] || '001';
runMigration(migrationNum);
