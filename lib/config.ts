/**
 * Threadbaire Server Configuration
 * Edit this file to add new projects or statuses.
 */

export const PROJECTS = ['my-project', 'another-project'] as const;

export type ProjectName = typeof PROJECTS[number];

// Force user to select a project — no default
export const DEFAULT_PROJECT = null;

// Status display values with emoji
// Consolidated list: removed Done (duplicate), Partial (merged into In Progress), Urgent (not a status)
export const STATUS_DISPLAY: Record<string, string> = {
  complete: '✅ Complete',
  in_progress: '🟡 In Progress',
  logged: '🟡 Logged',
  queued: '🔜 Queued',
  blocked: '🔴 Blocked',
  observed: '🟢 Observed',
};

// List of valid status keys for forms
export const STATUS_OPTIONS = Object.keys(STATUS_DISPLAY) as readonly string[];
