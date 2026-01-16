/**
 * Threadbaire Database Layer
 *
 * Schema stores clean field names (no emoji).
 * UI labels with emoji are in types.ts.
 *
 * Environment detection:
 * - If POSTGRES_URL is set → use Vercel Postgres (production)
 * - Otherwise → use SQLite (local development)
 */

import type { Entry, CreateEntryInput, UpdateEntryInput } from './types';
export type { Entry, CreateEntryInput, UpdateEntryInput };

// Detect which database to use
const usePostgres = !!process.env.POSTGRES_URL;

// ============================================================================
// SQLite Implementation (local development)
// ============================================================================

let sqliteDb: import('better-sqlite3').Database | null = null;

function getSqliteDb(): import('better-sqlite3').Database {
  if (!sqliteDb) {
    // Dynamic import to avoid loading better-sqlite3 in production
    const Database = require('better-sqlite3');
    const path = require('path');
    const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'entries.db');
    sqliteDb = new Database(dbPath);
    sqliteDb!.pragma('journal_mode = WAL');
    initSqliteSchema();
  }
  return sqliteDb!;
}

function initSqliteSchema(): void {
  const db = sqliteDb!;
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project TEXT NOT NULL,
      document_type TEXT NOT NULL CHECK (document_type IN ('addendum', 'dev_log')),
      entry_date TEXT NOT NULL,
      entry_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      entry_type TEXT,
      status TEXT,
      summary TEXT,
      details TEXT,
      narrative_signal TEXT,
      next_steps TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(project, document_type, entry_date, entry_number)
    );
    CREATE INDEX IF NOT EXISTS idx_entries_project ON entries(project);
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(entry_date);
    CREATE INDEX IF NOT EXISTS idx_entries_project_doctype ON entries(project, document_type);
    CREATE INDEX IF NOT EXISTS idx_entries_browse ON entries(project, document_type, entry_date DESC);
  `);
}

function sqliteListEntries(filters: {
  project?: string;
  document_type?: 'addendum' | 'dev_log';
  after?: string;
  before?: string;
  q?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}): { entries: Entry[]; total: number } {
  const db = getSqliteDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (!filters.includeDeleted) {
    conditions.push('is_deleted = 0');
  }
  if (filters.project) {
    conditions.push('project = ?');
    params.push(filters.project);
  }
  if (filters.document_type) {
    conditions.push('document_type = ?');
    params.push(filters.document_type);
  }
  if (filters.after) {
    conditions.push('entry_date >= ?');
    params.push(filters.after);
  }
  if (filters.before) {
    conditions.push('entry_date <= ?');
    params.push(filters.before);
  }
  if (filters.q) {
    const terms = filters.q.trim().split(/\s+/).filter(t => t.length > 0);
    for (const term of terms) {
      const likeTerm = `%${term}%`;
      conditions.push(`(
        title LIKE ? COLLATE NOCASE OR
        summary LIKE ? COLLATE NOCASE OR
        details LIKE ? COLLATE NOCASE OR
        next_steps LIKE ? COLLATE NOCASE
      )`);
      params.push(likeTerm, likeTerm, likeTerm, likeTerm);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(filters.limit || 50, 200);
  const offset = filters.offset || 0;

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM entries ${whereClause}`);
  const { count } = countStmt.get(...params) as { count: number };

  const selectStmt = db.prepare(`
    SELECT * FROM entries ${whereClause}
    ORDER BY entry_date DESC, entry_number DESC
    LIMIT ? OFFSET ?
  `);
  const entries = selectStmt.all(...params, limit, offset) as Entry[];

  return { entries, total: count };
}

function sqliteGetEntry(id: number): Entry | null {
  const db = getSqliteDb();
  const stmt = db.prepare('SELECT * FROM entries WHERE id = ?');
  return (stmt.get(id) as Entry) || null;
}

function sqliteCreateEntry(input: CreateEntryInput): Entry {
  const db = getSqliteDb();

  const maxStmt = db.prepare(`
    SELECT MAX(entry_number) as max_num FROM entries
    WHERE project = ? AND document_type = ? AND entry_date = ?
  `);
  const result = maxStmt.get(input.project, input.document_type, input.entry_date) as { max_num: number | null };
  const entryNumber = (result.max_num || 0) + 1;

  const insertStmt = db.prepare(`
    INSERT INTO entries (
      project, document_type, entry_date, entry_number, title,
      entry_type, status, summary, details, narrative_signal, next_steps
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = insertStmt.run(
    input.project, input.document_type, input.entry_date, entryNumber, input.title,
    input.entry_type || null, input.status || null, input.summary || null,
    input.details || null, input.narrative_signal || null, input.next_steps || null
  );

  return sqliteGetEntry(info.lastInsertRowid as number)!;
}

function sqliteUpdateEntry(id: number, input: UpdateEntryInput): Entry | null {
  const db = getSqliteDb();
  const existing = sqliteGetEntry(id);
  if (!existing) return null;

  const updates: string[] = ['updated_at = datetime(\'now\')'];
  const params: (string | number | null)[] = [];

  if (input.entry_date !== undefined && input.entry_date !== existing.entry_date) {
    const maxStmt = db.prepare(`
      SELECT MAX(entry_number) as max_num FROM entries
      WHERE project = ? AND document_type = ? AND entry_date = ? AND id != ?
    `);
    const result = maxStmt.get(existing.project, existing.document_type, input.entry_date, id) as { max_num: number | null };
    const newEntryNumber = (result.max_num || 0) + 1;
    updates.push('entry_date = ?');
    params.push(input.entry_date);
    updates.push('entry_number = ?');
    params.push(newEntryNumber);
  }

  if (input.title !== undefined) { updates.push('title = ?'); params.push(input.title); }
  if (input.entry_type !== undefined) { updates.push('entry_type = ?'); params.push(input.entry_type); }
  if (input.status !== undefined) { updates.push('status = ?'); params.push(input.status); }
  if (input.summary !== undefined) { updates.push('summary = ?'); params.push(input.summary); }
  if (input.details !== undefined) { updates.push('details = ?'); params.push(input.details); }
  if (input.narrative_signal !== undefined) { updates.push('narrative_signal = ?'); params.push(input.narrative_signal); }
  if (input.next_steps !== undefined) { updates.push('next_steps = ?'); params.push(input.next_steps); }

  params.push(id);
  const updateStmt = db.prepare(`UPDATE entries SET ${updates.join(', ')} WHERE id = ?`);
  updateStmt.run(...params);

  return sqliteGetEntry(id);
}

function sqliteDeleteEntry(id: number, hard: boolean = false): boolean {
  const db = getSqliteDb();
  if (hard) {
    const stmt = db.prepare('DELETE FROM entries WHERE id = ?');
    return stmt.run(id).changes > 0;
  } else {
    const stmt = db.prepare('UPDATE entries SET is_deleted = 1, updated_at = datetime(\'now\') WHERE id = ?');
    return stmt.run(id).changes > 0;
  }
}

// ============================================================================
// Postgres Implementation (production - Vercel)
// ============================================================================

import { sql } from '@vercel/postgres';

async function postgresInitSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      project TEXT NOT NULL,
      document_type TEXT NOT NULL CHECK (document_type IN ('addendum', 'dev_log')),
      entry_date TEXT NOT NULL,
      entry_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      entry_type TEXT,
      status TEXT,
      summary TEXT,
      details TEXT,
      narrative_signal TEXT,
      next_steps TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(project, document_type, entry_date, entry_number)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_entries_project ON entries(project)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(entry_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_entries_project_doctype ON entries(project, document_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_entries_browse ON entries(project, document_type, entry_date DESC)`;
}

async function postgresListEntries(filters: {
  project?: string;
  document_type?: 'addendum' | 'dev_log';
  after?: string;
  before?: string;
  q?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}): Promise<{ entries: Entry[]; total: number }> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (!filters.includeDeleted) {
    conditions.push('is_deleted = 0');
  }
  if (filters.project) {
    conditions.push(`project = $${paramIndex++}`);
    params.push(filters.project);
  }
  if (filters.document_type) {
    conditions.push(`document_type = $${paramIndex++}`);
    params.push(filters.document_type);
  }
  if (filters.after) {
    conditions.push(`entry_date >= $${paramIndex++}`);
    params.push(filters.after);
  }
  if (filters.before) {
    conditions.push(`entry_date <= $${paramIndex++}`);
    params.push(filters.before);
  }
  if (filters.q) {
    const terms = filters.q.trim().split(/\s+/).filter(t => t.length > 0);
    for (const term of terms) {
      const likeTerm = `%${term}%`;
      conditions.push(`(
        title ILIKE $${paramIndex} OR
        summary ILIKE $${paramIndex} OR
        details ILIKE $${paramIndex} OR
        next_steps ILIKE $${paramIndex}
      )`);
      params.push(likeTerm);
      paramIndex++;
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(filters.limit || 50, 200);
  const offset = filters.offset || 0;

  const countQuery = `SELECT COUNT(*) as count FROM entries ${whereClause}`;
  const countResult = await sql.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const selectQuery = `
    SELECT * FROM entries ${whereClause}
    ORDER BY entry_date DESC, entry_number DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `;
  const entriesResult = await sql.query(selectQuery, [...params, limit, offset]);

  return { entries: entriesResult.rows as Entry[], total };
}

async function postgresGetEntry(id: number): Promise<Entry | null> {
  const result = await sql`SELECT * FROM entries WHERE id = ${id}`;
  return (result.rows[0] as Entry) || null;
}

async function postgresCreateEntry(input: CreateEntryInput): Promise<Entry> {
  const maxResult = await sql`
    SELECT MAX(entry_number) as max_num FROM entries
    WHERE project = ${input.project}
      AND document_type = ${input.document_type}
      AND entry_date = ${input.entry_date}
  `;
  const entryNumber = (maxResult.rows[0]?.max_num || 0) + 1;

  const result = await sql`
    INSERT INTO entries (
      project, document_type, entry_date, entry_number, title,
      entry_type, status, summary, details, narrative_signal, next_steps
    ) VALUES (
      ${input.project}, ${input.document_type}, ${input.entry_date}, ${entryNumber}, ${input.title},
      ${input.entry_type || null}, ${input.status || null}, ${input.summary || null},
      ${input.details || null}, ${input.narrative_signal || null}, ${input.next_steps || null}
    )
    RETURNING *
  `;
  return result.rows[0] as Entry;
}

async function postgresUpdateEntry(id: number, input: UpdateEntryInput): Promise<Entry | null> {
  const existing = await postgresGetEntry(id);
  if (!existing) return null;

  let newEntryNumber = existing.entry_number;
  let newEntryDate = existing.entry_date;

  if (input.entry_date !== undefined && input.entry_date !== existing.entry_date) {
    const maxResult = await sql`
      SELECT MAX(entry_number) as max_num FROM entries
      WHERE project = ${existing.project}
        AND document_type = ${existing.document_type}
        AND entry_date = ${input.entry_date}
        AND id != ${id}
    `;
    newEntryNumber = (maxResult.rows[0]?.max_num || 0) + 1;
    newEntryDate = input.entry_date;
  }

  const result = await sql`
    UPDATE entries SET
      entry_date = ${newEntryDate},
      entry_number = ${newEntryNumber},
      title = ${input.title !== undefined ? input.title : existing.title},
      entry_type = ${input.entry_type !== undefined ? input.entry_type : existing.entry_type},
      status = ${input.status !== undefined ? input.status : existing.status},
      summary = ${input.summary !== undefined ? input.summary : existing.summary},
      details = ${input.details !== undefined ? input.details : existing.details},
      narrative_signal = ${input.narrative_signal !== undefined ? input.narrative_signal : existing.narrative_signal},
      next_steps = ${input.next_steps !== undefined ? input.next_steps : existing.next_steps},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0] as Entry || null;
}

async function postgresDeleteEntry(id: number, hard: boolean = false): Promise<boolean> {
  if (hard) {
    const result = await sql`DELETE FROM entries WHERE id = ${id}`;
    return (result.rowCount ?? 0) > 0;
  } else {
    const result = await sql`UPDATE entries SET is_deleted = 1, updated_at = NOW() WHERE id = ${id}`;
    return (result.rowCount ?? 0) > 0;
  }
}

// ============================================================================
// Unified API (auto-selects based on environment)
// ============================================================================

export async function initSchema(): Promise<void> {
  if (usePostgres) {
    await postgresInitSchema();
  } else {
    // SQLite schema is initialized automatically on first connection
    getSqliteDb();
  }
}

export async function listEntries(filters: {
  project?: string;
  document_type?: 'addendum' | 'dev_log';
  after?: string;
  before?: string;
  q?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}): Promise<{ entries: Entry[]; total: number }> {
  if (usePostgres) {
    return postgresListEntries(filters);
  } else {
    return sqliteListEntries(filters);
  }
}

export async function getEntry(id: number): Promise<Entry | null> {
  if (usePostgres) {
    return postgresGetEntry(id);
  } else {
    return sqliteGetEntry(id);
  }
}

export async function createEntry(input: CreateEntryInput): Promise<Entry> {
  if (usePostgres) {
    return postgresCreateEntry(input);
  } else {
    return sqliteCreateEntry(input);
  }
}

export async function updateEntry(id: number, input: UpdateEntryInput): Promise<Entry | null> {
  if (usePostgres) {
    return postgresUpdateEntry(id, input);
  } else {
    return sqliteUpdateEntry(id, input);
  }
}

export async function deleteEntry(id: number, hard: boolean = false): Promise<boolean> {
  if (usePostgres) {
    return postgresDeleteEntry(id, hard);
  } else {
    return sqliteDeleteEntry(id, hard);
  }
}
