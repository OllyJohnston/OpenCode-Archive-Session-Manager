import path from 'path';
import { fileURLToPath } from 'url';
import sqlite from 'node:sqlite';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const dbPath = path.join(process.env.USERPROFILE, '.local', 'share', 'opencode', 'opencode.db');
const db = new sqlite.DatabaseSync(dbPath);

// Check table schema
const tables = db.prepare("SELECT sql FROM sqlite_schema WHERE type='table'").all();
console.log('=== Tables ===');
tables.forEach(r => console.log(r.sql));

// Check sessions
const sessions = db.prepare('SELECT * FROM session LIMIT 3').all();
console.log('\n=== Session rows (sample) ===');
sessions.forEach(r => console.log(JSON.stringify(r, null, 2)));

console.log('\n=== Column names ===');
const cols = db.prepare('PRAGMA table_info(session)').all();
cols.forEach(r => console.log(r.name));
