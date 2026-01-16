'use client';

import { DocumentType } from '@/lib/types';

export interface FilterState {
  project: string;
  document_type: DocumentType | '';
  after: string;
  before: string;
  q: string; // Search query
}

interface FiltersProps {
  filters: FilterState;
  projects: string[];
  onChange: (filters: FilterState) => void;
  onClear: () => void;
}

export default function Filters({ filters, projects, onChange, onClear }: FiltersProps) {
  const hasActiveFilters = filters.project || filters.document_type || filters.after || filters.before || filters.q;

  return (
    <div className="filters">
      {/* Search input - full width on its own row */}
      <div className="field-group" style={{ marginBottom: 0, flex: '1 1 100%', maxWidth: '400px' }}>
        <label htmlFor="filter-search" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
          Search
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            id="filter-search"
            value={filters.q}
            onChange={e => onChange({ ...filters, q: e.target.value })}
            placeholder="Search entries..."
            style={{ flex: 1 }}
          />
          {filters.q && (
            <button
              onClick={() => onChange({ ...filters, q: '' })}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.25rem 0.5rem' }}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="field-group" style={{ marginBottom: 0 }}>
        <label htmlFor="filter-project" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
          Project
        </label>
        <select
          id="filter-project"
          value={filters.project}
          onChange={e => onChange({ ...filters, project: e.target.value })}
          style={{ minWidth: '140px' }}
        >
          <option value="">All projects</option>
          {projects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="field-group" style={{ marginBottom: 0 }}>
        <label htmlFor="filter-doctype" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
          Type
        </label>
        <select
          id="filter-doctype"
          value={filters.document_type}
          onChange={e => onChange({ ...filters, document_type: e.target.value as DocumentType | '' })}
          style={{ minWidth: '120px' }}
        >
          <option value="">All types</option>
          <option value="addendum">Addendum</option>
          <option value="dev_log">Dev Log</option>
        </select>
      </div>

      <div className="field-group" style={{ marginBottom: 0 }}>
        <label htmlFor="filter-after" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
          After
        </label>
        <input
          type="date"
          id="filter-after"
          value={filters.after}
          onChange={e => onChange({ ...filters, after: e.target.value })}
          style={{ minWidth: '140px' }}
        />
      </div>

      <div className="field-group" style={{ marginBottom: 0 }}>
        <label htmlFor="filter-before" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
          Before
        </label>
        <input
          type="date"
          id="filter-before"
          value={filters.before}
          onChange={e => onChange({ ...filters, before: e.target.value })}
          style={{ minWidth: '140px' }}
        />
      </div>

      {hasActiveFilters && (
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={onClear}
            className="btn btn-secondary btn-sm"
            style={{ whiteSpace: 'nowrap' }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
