import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { getSessions } from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { SessionCard } from '../components/SessionCard';
import { EditSessionModal } from '../components/EditSessionModal';
import type { Session } from '../types';

export function HistoryPage() {
  const { currentUser } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editSession, setEditSession] = useState<Session | null>(null);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSessions({ user_id: currentUser.id, limit: 5 });
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    load();
  }, [load]);

  if (!currentUser) {
    return (
      <main className="page">
        <h1 className="page-title">My Last 5 Sessions</h1>
        <p className="empty-message">Please select a user to view your history.</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1 className="page-title">My Last 5 Sessions</h1>
      <p className="hint-text">Viewing history for <strong>{currentUser.name}</strong></p>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingSpinner message="Loading history…" />
      ) : sessions.length === 0 ? (
        <p className="empty-message">No sessions found.</p>
      ) : (
        <div className="session-list">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onEdit={() => setEditSession(s)}
            />
          ))}
        </div>
      )}

      {editSession && (
        <EditSessionModal
          session={editSession}
          onClose={() => setEditSession(null)}
          onUpdated={() => { setEditSession(null); load(); }}
        />
      )}
    </main>
  );
}
