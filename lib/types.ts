/**
 * Threadbaire Types & UI Labels
 *
 * Schema stores clean field names.
 * UI displays emoji labels to match the markdown format.
 * Future: export entries as .md files with full template format.
 */

// Entry types - defined here so they can be used by both client and server
export interface Entry {
  id: number;
  project: string;
  document_type: 'addendum' | 'dev_log';
  entry_date: string;
  entry_number: number;
  title: string;
  entry_type: string | null;
  status: string | null;
  summary: string | null;
  details: string | null;
  narrative_signal: string | null;
  next_steps: string | null;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEntryInput {
  project: string;
  document_type: 'addendum' | 'dev_log';
  entry_date: string;
  title: string;
  entry_type?: string;
  status?: string;
  summary?: string;
  details?: string;
  narrative_signal?: string;
  next_steps?: string;
}

export interface UpdateEntryInput {
  entry_date?: string;  // When date changes, entry_number is recalculated
  title?: string;
  entry_type?: string;
  status?: string;
  summary?: string;
  details?: string;
  narrative_signal?: string;
  next_steps?: string;
}

// UI label mappings per document type
// Addendum uses full emoji headers; Dev log uses minimal formatting
export const UI_LABELS = {
  addendum: {
    entry_number: '🧩',
    entry_date: '📅',
    entry_type: 'Type:',
    status: 'Status:',
    summary: '🔍 Summary',
    details: '📌 Details',
    narrative_signal: '🧠 Narrative Signal',
    next_steps: '🔄 Implications & Next Steps',
  },
  dev_log: {
    entry_number: '🧩',
    entry_date: '📅',
    entry_type: 'Type:',
    status: 'Status:',
    summary: 'Summary',
    details: 'Details',
    narrative_signal: null, // Not used in dev_log
    next_steps: 'Next',
  },
} as const;

export type DocumentType = 'addendum' | 'dev_log';

// Get labels for a document type
export function getLabels(docType: DocumentType) {
  return UI_LABELS[docType];
}

// Import and re-export STATUS_DISPLAY from config
import { STATUS_DISPLAY } from './config';
export { STATUS_DISPLAY };

// Normalize status input to clean DB value
export function normalizeStatus(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[✅🟡🔜🔴🟢]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  // Map legacy/variant values to canonical statuses
  const mappings: Record<string, string> = {
    'done': 'complete',
    'partial': 'in_progress',
    'urgent': 'blocked',
    'inprogress': 'in_progress',
  };

  return mappings[cleaned] || cleaned;
}

// Get display status from clean DB value
export function getStatusDisplay(status: string | null): string {
  if (!status) return '';
  return STATUS_DISPLAY[status] || status;
}

// Document type labels
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  addendum: 'Addendum',
  dev_log: 'Dev Log',
};

// Format entry title with number for display
// e.g., "🧩 1. Multi-Agent Strategic Recall Mockup Deployed"
export function formatEntryTitle(entryNumber: number, title: string, docType: DocumentType = 'addendum'): string {
  return `${UI_LABELS[docType].entry_number} ${entryNumber}. ${title}`;
}

// Format date header for display
// e.g., "📅 2025-06-30"
export function formatDateHeader(date: string, docType: DocumentType = 'addendum'): string {
  return `${UI_LABELS[docType].entry_date} ${date}`;
}
