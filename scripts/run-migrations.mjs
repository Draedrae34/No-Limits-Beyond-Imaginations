#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import pool from '../src/utils/db.js';

async function runMigrations() {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    if (!sqlFiles.length) {
      console.log('No migration files found.');
      return;
    }

    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Running migration: ${file}`);
      const sql = await fs.readFile(filePath, 'utf8');
      try {
        await pool.query(sql);
        console.log(`✅ Applied ${file}`);
      } catch (err) {
        console.error(`❌ Failed to apply ${file}:`, err.message || err);
        // Continue to next migration (idempotent scripts are expected)
      }
    }

    console.log('Migrations complete.');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('Migrations directory not found, skipping.');
      return;
    }
    console.error('Migration runner error:', err);
    process.exitCode = 1;
  }
}

if (process.env.NODE_ENV !== 'test') {
  runMigrations().then(() => pool.end()).catch((err) => {
    console.error('Migration runner failed:', err);
    pool.end().finally(() => process.exit(1));
  });
}
