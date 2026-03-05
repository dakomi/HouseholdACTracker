import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { getSessions, endSession } from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { SessionCard } from '../components/SessionCard';
import { EditSessionModal } from '../components/EditSessionModal';
import type { Session } from '../types';

const PAGE_SIZE = 10;

export function SessionsPage() {
  const { users } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [editSession, setEditSession] = useState<Session | null>(null);

  const load = useCallback(async (pageNum: number, userId: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSessions({
        user_id: userId ?? undefined,
        limit: PAGE_SIZE,
        offset: pageNum * PAGE_SIZE,
      });
      setSessions(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, filterUserId);
  }, [load, page, filterUserId]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilterUserId(val ? parseInt(val, 10) : null);
    setPage(0);
  };

  const handleEndSession = async (id: number) => {
    try {
      await endSession(id);
      await load(page, filterUserId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  };

  return (
    <main className="page">
      <h1 className="page-title">All Sessions</h1>

      <div className="sessions-toolbar">
        <label htmlFor="filter-user" className="sr-only">Filter by user</label>
        <select
          id="filter-user"
          className="form-select"
          value={filterUserId ?? ''}
          onChange={handleFilterChange}
        >
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingSpinner message="Loading sessions…" />
      ) : sessions.length === 0 ? (
        <p className="empty-message">No sessions found.</p>
      ) : (
        <div className="session-list">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onEdit={() => setEditSession(s)}
              onEnd={() => handleEndSession(s.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button
          className="btn btn-secondary"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          ← Previous
        </button>
        <span className="page-indicator">Page {page + 1}</span>
        <button
          className="btn btn-secondary"
          disabled={!hasMore}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>

      {editSession && (
        <EditSessionModal
          session={editSession}
          onClose={() => setEditSession(null)}
          onUpdated={() => { setEditSession(null); load(page, filterUserId); }}
        />
      )}
    </main>
  );
}
