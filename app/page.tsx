'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import EntryForm, { EntryFormData } from './components/EntryForm';
import EntryList from './components/EntryList';
import Filters, { FilterState } from './components/Filters';
import { Entry, DocumentType } from '@/lib/types';
import { PROJECTS } from '@/lib/config';

type TabType = 'browse' | 'create';

const ENTRIES_PER_PAGE = 20;
const API_KEY_STORAGE_KEY = 'threadbaire_api_key';

// Helper to get stored API key
function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

// Helper to make authenticated fetch requests
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = getStoredApiKey();
  const headers = new Headers(options.headers);
  if (apiKey) {
    headers.set('Authorization', `Bearer ${apiKey}`);
  }
  return fetch(url, { ...options, headers });
}

// Wrapper component to handle Suspense for useSearchParams
export default function Home() {
  return (
    <Suspense fallback={<div className="empty-state"><p>Loading...</p></div>}>
      <HomeContent />
    </Suspense>
  );
}

// Login screen component
function LoginScreen({ onLogin }: { onLogin: (key: string) => void }) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Test the key by making a request
      const res = await fetch('/api/entries?limit=1', {
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` },
      });

      if (res.ok) {
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
        onLogin(apiKey.trim());
      } else if (res.status === 401) {
        setError('Invalid API key');
      } else {
        setError('Connection error. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: 'var(--tb-radius)',
        border: '1px solid var(--tb-border)',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Threadbaire</h1>
        <p style={{
          color: 'var(--tb-gray-600)',
          marginBottom: '1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
        }}>
          Enter your API key to continue
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="apiKey">API Key</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--tb-radius)',
              color: '#991b1b',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [entries, setEntries] = useState<Entry[]>([]);
  const projects = [...PROJECTS]; // Use config, not extracted from entries
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  const [filters, setFilters] = useState<FilterState>({
    project: '',
    document_type: '',
    after: '',
    before: '',
    q: '',
  });

  // Check authentication on mount
  useEffect(() => {
    const key = getStoredApiKey();
    if (key) {
      // Verify the key is still valid
      fetch('/api/entries?limit=1', {
        headers: { 'Authorization': `Bearer ${key}` },
      }).then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(API_KEY_STORAGE_KEY);
          setIsAuthenticated(false);
        }
      }).catch(() => {
        setIsAuthenticated(false);
      });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Initialize page from URL
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page);
      }
    }
  }, [searchParams]);

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.project) params.set('project', filters.project);
      if (filters.document_type) params.set('document_type', filters.document_type);
      if (filters.after) params.set('after', filters.after);
      if (filters.before) params.set('before', filters.before);
      if (filters.q) params.set('q', filters.q);
      params.set('page', currentPage.toString());
      params.set('limit', ENTRIES_PER_PAGE.toString());

      const res = await authFetch(`/api/entries?${params.toString()}`);

      if (res.status === 401) {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        setIsAuthenticated(false);
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch entries');

      const data = await res.json();
      setEntries(data.entries);
      setTotalPages(data.totalPages);
      setTotalEntries(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEntries();
    }
  }, [fetchEntries, isAuthenticated]);

  // Handle login
  const handleLogin = (key: string) => {
    console.log('Logged in with key:', key.substring(0, 4) + '...');
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setIsAuthenticated(false);
  };

  // Update URL when page changes
  const goToPage = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    router.push(`/?${params.toString()}`);
  };

  // Reset to page 1 when filters change
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    if (currentPage !== 1) {
      goToPage(1);
    }
  };

  // Create entry
  const handleCreate = async (data: EntryFormData) => {
    const res = await authFetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: data.project,
        document_type: data.document_type,
        date: data.entry_date,
        title: data.title,
        type: data.entry_type,
        status: data.status,
        summary: data.summary,
        details: data.details,
        narrative_signal: data.narrative_signal,
        next_steps: data.next_steps,
      }),
    });

    if (res.status === 401) {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      setIsAuthenticated(false);
      return;
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create entry');
    }

    // Switch to browse tab and refresh
    setActiveTab('browse');
    fetchEntries();
  };

  // Update entry
  const handleUpdate = async (data: EntryFormData) => {
    if (!editingEntry) return;

    const res = await authFetch(`/api/entries/${editingEntry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: data.entry_date,
        title: data.title,
        type: data.entry_type,
        status: data.status,
        summary: data.summary,
        details: data.details,
        narrative_signal: data.narrative_signal,
        next_steps: data.next_steps,
      }),
    });

    if (res.status === 401) {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      setIsAuthenticated(false);
      return;
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update entry');
    }

    setEditingEntry(null);
    setActiveTab('browse');
    fetchEntries();
  };

  // Delete entry
  const handleDelete = async (id: number) => {
    const res = await authFetch(`/api/entries/${id}`, {
      method: 'DELETE',
    });

    if (res.status === 401) {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      setIsAuthenticated(false);
      return;
    }

    if (!res.ok) {
      alert('Failed to delete entry');
      return;
    }

    fetchEntries();
  };

  // Edit entry
  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setActiveTab('create');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const clearFilters = () => {
    setFilters({
      project: '',
      document_type: '',
      after: '',
      before: '',
      q: '',
    });
    if (currentPage !== 1) {
      goToPage(1);
    }
  };

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="empty-state">
        <p>Loading...</p>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Entries</h1>
          <p style={{ color: 'var(--tb-gray-600)', marginTop: '0.25rem' }}>
            Manage your addendum and dev log entries.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
          style={{ marginTop: '0.25rem' }}
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'browse' && !editingEntry ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('browse');
            setEditingEntry(null);
          }}
        >
          Browse
        </button>
        <button
          className={`tab ${activeTab === 'create' && !editingEntry ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('create');
            setEditingEntry(null);
          }}
        >
          New Entry
        </button>
        {editingEntry && (
          <button className="tab active">
            Editing: {editingEntry.title.substring(0, 30)}...
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'browse' && !editingEntry && (
        <div>
          <Filters
            filters={filters}
            projects={projects}
            onChange={handleFiltersChange}
            onClear={clearFilters}
          />

          {loading ? (
            <div className="empty-state">
              <p>Loading entries...</p>
            </div>
          ) : error ? (
            <div style={{
              padding: '1rem',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--tb-radius)',
              color: '#991b1b',
            }}>
              {error}
            </div>
          ) : (
            <>
              <EntryList
                entries={entries}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  marginTop: '1.5rem',
                  padding: '1rem 0',
                }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    ← Prev
                  </button>

                  <span style={{ color: 'var(--tb-gray-600)' }}>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Entry count */}
              <div style={{
                textAlign: 'center',
                color: 'var(--tb-gray-600)',
                fontSize: '0.875rem',
                marginTop: '0.5rem',
              }}>
                {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'} total
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'create' && !editingEntry && (
        <EntryForm onSubmit={handleCreate} />
      )}

      {editingEntry && (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={handleCancelEdit}
              className="btn btn-secondary btn-sm"
            >
              ← Cancel editing
            </button>
          </div>
          <EntryForm
            onSubmit={handleUpdate}
            onDelete={async () => {
              await handleDelete(editingEntry.id);
              setEditingEntry(null);
              setActiveTab('browse');
            }}
            initialData={{
              project: editingEntry.project,
              document_type: editingEntry.document_type as DocumentType,
              entry_date: editingEntry.entry_date,
              title: editingEntry.title,
              entry_type: editingEntry.entry_type || '',
              status: editingEntry.status || 'complete',
              summary: editingEntry.summary || '',
              details: editingEntry.details || '',
              narrative_signal: editingEntry.narrative_signal || '',
              next_steps: editingEntry.next_steps || '',
            }}
            isEditing
          />
        </div>
      )}
    </div>
  );
}
