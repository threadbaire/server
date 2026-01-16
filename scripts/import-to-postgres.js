/**
 * Import entries from JSON to Vercel Postgres
 *
 * Prerequisites:
 * 1. Set POSTGRES_URL environment variable (from Vercel dashboard)
 * 2. Run export-sqlite.js first to create entries-export.json
 * 3. Initialize schema via POST /api/init
 *
 * Run: POSTGRES_URL="postgres://..." node scripts/import-to-postgres.js
 */

const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function importEntries() {
  const inputPath = path.join(__dirname, 'entries-export.json');

  if (!fs.existsSync(inputPath)) {
    console.error('entries-export.json not found. Run export-sqlite.js first.');
    process.exit(1);
  }

  const entries = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`Importing ${entries.length} entries...`);

  let imported = 0;
  let errors = 0;

  for (const entry of entries) {
    try {
      await sql`
        INSERT INTO entries (
          project, document_type, entry_date, entry_number, title,
          entry_type, status, summary, details, narrative_signal,
          next_steps, is_deleted, created_at, updated_at
        ) VALUES (
          ${entry.project},
          ${entry.document_type},
          ${entry.entry_date},
          ${entry.entry_number},
          ${entry.title},
          ${entry.entry_type},
          ${entry.status},
          ${entry.summary},
          ${entry.details},
          ${entry.narrative_signal},
          ${entry.next_steps},
          ${entry.is_deleted || 0},
          ${entry.created_at || new Date().toISOString()},
          ${entry.updated_at || new Date().toISOString()}
        )
      `;
      imported++;
      if (imported % 10 === 0) {
        console.log(`  Imported ${imported}/${entries.length}`);
      }
    } catch (error) {
      console.error(`Error importing entry ${entry.id}:`, error.message);
      errors++;
    }
  }

  console.log(`\nDone! Imported: ${imported}, Errors: ${errors}`);
}

importEntries().catch(console.error);
