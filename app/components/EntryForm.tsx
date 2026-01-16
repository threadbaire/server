'use client';

import { useState } from 'react';
import { UI_LABELS, DocumentType } from '@/lib/types';
import { PROJECTS, DEFAULT_PROJECT, STATUS_DISPLAY, STATUS_OPTIONS } from '@/lib/config';

interface EntryFormProps {
  onSubmit: (data: EntryFormData) => Promise<void>;
  onDelete?: () => void;
  initialData?: Partial<EntryFormData>;
  isEditing?: boolean;
}

export interface EntryFormData {
  project: string;
  document_type: DocumentType;
  entry_date: string;
  title: string;
  entry_type: string;
  status: string;
  summary: string;
  details: string;
  narrative_signal: string;
  next_steps: string;
}

const ENTRY_TYPE_SUGGESTIONS = [
  'Setup',
  'Feature',
  'Fix',
  'Research',
  'Dead End',
  'Strategic Pivot',
  'Visibility Milestone',
  'Positioning Infrastructure',
  'Narrative Adjustment',
  'Inbound Validation',
  'Technical Setup',
];

export default function EntryForm({ onSubmit, onDelete, initialData, isEditing = false }: EntryFormProps) {
  const [formData, setFormData] = useState<EntryFormData>({
    project: initialData?.project || DEFAULT_PROJECT || '',
    document_type: initialData?.document_type || 'addendum',
    entry_date: initialData?.entry_date || new Date().toISOString().split('T')[0],
    title: initialData?.title || '',
    entry_type: initialData?.entry_type || '',
    status: initialData?.status || 'complete',
    summary: initialData?.summary || '',
    details: initialData?.details || '',
    narrative_signal: initialData?.narrative_signal || '',
    next_steps: initialData?.next_steps || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = UI_LABELS[formData.document_type];

  // Check if selected date is in the future
  const isFutureDate = formData.entry_date > new Date().toISOString().split('T')[0];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      // Reset form on success (unless editing)
      if (!isEditing) {
        setFormData({
          ...formData,
          title: '',
          entry_type: '',
          status: 'complete',
          summary: '',
          details: '',
          narrative_signal: '',
          next_steps: '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="card-header">
        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
          {isEditing ? 'Edit Entry' : '✨ New Entry'}
        </h2>
      </div>

      <div className="card-body">
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--tb-radius)',
            color: '#991b1b',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {/* Row 1: Project, Document Type, Date */}
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="project">Project <span style={{ color: '#991b1b' }}>*</span></label>
            <select
              id="project"
              name="project"
              value={formData.project}
              onChange={handleChange}
              required
            >
              <option value="">Select project...</option>
              {PROJECTS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="document_type">Document Type <span style={{ color: '#991b1b' }}>*</span></label>
            <select
              id="document_type"
              name="document_type"
              value={formData.document_type}
              onChange={handleChange}
              required
            >
              <option value="addendum">Addendum</option>
              <option value="dev_log">Dev Log</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="entry_date">{labels.entry_date} Date <span style={{ color: '#991b1b' }}>*</span></label>
            <input
              type="date"
              id="entry_date"
              name="entry_date"
              value={formData.entry_date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Future date warning */}
        {isFutureDate && (
          <div style={{
            padding: '0.5rem 0.75rem',
            marginBottom: '1rem',
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: 'var(--tb-radius)',
            color: '#92400e',
            fontSize: '0.875rem',
          }}>
            ⚠️ Warning: The selected date is in the future.
          </div>
        )}

        {/* Row 2: Title */}
        <div className="field-group">
          <label htmlFor="title">{labels.entry_number} Title <span style={{ color: '#991b1b' }}>*</span></label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Strategic pivot — from stealth startup to open method"
            required
          />
        </div>

        {/* Row 3: Entry Type, Status */}
        <div className="field-row">
          <div className="field-group">
            <label htmlFor="entry_type">{labels.entry_type}</label>
            <input
              type="text"
              id="entry_type"
              name="entry_type"
              value={formData.entry_type}
              onChange={handleChange}
              placeholder="e.g., Strategic Pivot · Positioning Infrastructure"
              list="entry-type-suggestions"
            />
            <datalist id="entry-type-suggestions">
              {ENTRY_TYPE_SUGGESTIONS.map(type => (
                <option key={type} value={type} />
              ))}
            </datalist>
          </div>

          <div className="field-group">
            <label htmlFor="status">{labels.status}</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {STATUS_DISPLAY[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="field-group">
          <label htmlFor="summary">{labels.summary}</label>
          <textarea
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            placeholder="2-4 sentences explaining what happened and why it matters..."
            style={{ minHeight: '80px' }}
          />
        </div>

        {/* Details */}
        <div className="field-group">
          <label htmlFor="details">{labels.details}</label>
          <textarea
            id="details"
            name="details"
            value={formData.details}
            onChange={handleChange}
            placeholder="Bullet list of specifics, features, or work completed (markdown supported)..."
            style={{ minHeight: '120px' }}
          />
        </div>

        {/* Narrative Signal (addendum only) */}
        {formData.document_type === 'addendum' && labels.narrative_signal && (
          <div className="field-group">
            <label htmlFor="narrative_signal">{labels.narrative_signal}</label>
            <textarea
              id="narrative_signal"
              name="narrative_signal"
              value={formData.narrative_signal}
              onChange={handleChange}
              placeholder="The deeper meaning, tone, or strategic significance..."
              style={{ minHeight: '60px' }}
            />
          </div>
        )}

        {/* Next Steps */}
        <div className="field-group">
          <label htmlFor="next_steps">{labels.next_steps}</label>
          <textarea
            id="next_steps"
            name="next_steps"
            value={formData.next_steps}
            onChange={handleChange}
            placeholder="Practical consequences, future actions, or queued work..."
            style={{ minHeight: '80px' }}
          />
        </div>

        {/* Submit */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--tb-border-soft)',
        }}>
          <div>
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this entry?')) {
                    onDelete();
                  }
                }}
                className="btn btn-sm"
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                }}
              >
                Delete Entry
              </button>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Entry' : 'Create Entry'}
          </button>
        </div>
      </div>
    </form>
  );
}
