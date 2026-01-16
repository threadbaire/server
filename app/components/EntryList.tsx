'use client';

import { useState } from 'react';
import { Entry, UI_LABELS, getStatusDisplay, formatEntryTitle, formatDateHeader, DocumentType, DOCUMENT_TYPE_LABELS } from '@/lib/types';

interface EntryListProps {
  entries: Entry[];
  onEdit?: (entry: Entry) => void;
  onDelete?: (id: number) => void;
}

// Group entries by date
function groupByDate(entries: Entry[]): Map<string, Entry[]> {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const existing = groups.get(entry.entry_date) || [];
    existing.push(entry);
    groups.set(entry.entry_date, existing);
  }
  return groups;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const displayStatus = getStatusDisplay(status);
  return (
    <span className={`status-badge status-${status}`}>
      {displayStatus}
    </span>
  );
}

function EntryCard({ entry, onEdit, onDelete }: {
  entry: Entry;
  onEdit?: (entry: Entry) => void;
  onDelete?: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const labels = UI_LABELS[entry.document_type as DocumentType];

  return (
    <article className="entry-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h3>{formatEntryTitle(entry.entry_number, entry.title, entry.document_type as DocumentType)}</h3>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '0.5rem',
            fontSize: '0.8125rem',
            color: 'var(--tb-gray-600)',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--tb-green-600)' }}>
              {entry.project}
            </span>
            <span style={{ color: 'var(--tb-gray-300)' }}>·</span>
            <span style={{ color: 'var(--tb-gray-500)' }}>
              {DOCUMENT_TYPE_LABELS[entry.document_type]}
            </span>
            <StatusBadge status={entry.status} />
            {entry.entry_type && (
              <span className="tag" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                {entry.entry_type}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            {expanded ? '−' : '+'}
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(entry)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.25rem 0.5rem' }}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--tb-border-soft)' }}>
          {entry.summary && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.8125rem', color: 'var(--tb-gray-600)' }}>
                {labels.summary}
              </strong>
              <p style={{ marginTop: '0.25rem', color: 'var(--tb-gray-700)' }}>
                {entry.summary}
              </p>
            </div>
          )}

          {entry.details && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.8125rem', color: 'var(--tb-gray-600)' }}>
                {labels.details}
              </strong>
              <div className="markdown-preview" style={{ marginTop: '0.25rem' }}>
                {entry.details}
              </div>
            </div>
          )}

          {entry.narrative_signal && entry.document_type === 'addendum' && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.8125rem', color: 'var(--tb-gray-600)' }}>
                {labels.narrative_signal}
              </strong>
              <p style={{
                marginTop: '0.25rem',
                color: 'var(--tb-gray-700)',
                fontStyle: 'italic',
                borderLeft: '3px solid var(--tb-green)',
                paddingLeft: '0.75rem',
              }}>
                {entry.narrative_signal}
              </p>
            </div>
          )}

          {entry.next_steps && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.8125rem', color: 'var(--tb-gray-600)' }}>
                {labels.next_steps}
              </strong>
              <div className="markdown-preview" style={{ marginTop: '0.25rem' }}>
                {entry.next_steps}
              </div>
            </div>
          )}

          {onDelete && (
            <div style={{
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--tb-border-soft)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => {
                  if (confirm('Delete this entry?')) {
                    onDelete(entry.id);
                  }
                }}
                className="btn btn-sm"
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function EntryList({ entries, onEdit, onDelete }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p style={{ fontSize: '1rem', fontWeight: 500 }}>No entries yet</p>
        <p style={{ marginTop: '0.25rem' }}>Create your first entry using the form above.</p>
      </div>
    );
  }

  const grouped = groupByDate(entries);
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      {sortedDates.map(date => {
        const dateEntries = grouped.get(date)!;
        // Sort entries by entry_number ascending within the date
        dateEntries.sort((a, b) => a.entry_number - b.entry_number);
        const docType = dateEntries[0].document_type as DocumentType;

        return (
          <div key={date}>
            <h3 className="date-header">
              {formatDateHeader(date, docType)}
            </h3>
            {dateEntries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
