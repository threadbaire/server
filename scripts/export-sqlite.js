/**
 * Export SQLite entries to JSON for migration to Postgres
 *
 * Run: node scripts/export-sqlite.js
 * Output: scripts/entries-export.json
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'entries.db');

if (!fs.existsSync(dbPath)) {
  console.error('entries.db not found at:', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);

// Get all entries (including soft-deleted for complete migration)
const entries = db.prepare('SELECT * FROM entries ORDER BY id').all();

console.log(`Found ${entries.length} entries`);

// Write to JSON file
const outputPath = path.join(__dirname, 'entries-export.json');
fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2));

console.log(`Exported to: ${outputPath}`);

db.close();
