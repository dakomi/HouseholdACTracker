import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useUser } from '../contexts/UserContext';
import { endSession } from '../api/api';
import { SessionCard } from '../components/SessionCard';
import { ZoneSelectionModal } from '../components/ZoneSelectionModal';
import { EditSessionModal } from '../components/EditSessionModal';
import { ErrorBanner } from '../components/ErrorBanner';
import type { Session } from '../types';

function formatTimeRemaining(startTime: string, autoOffMinutes: number): string {
  const startMs = new Date(startTime).getTime();
  const endMs = startMs + autoOffMinutes * 60 * 1000;
  const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 60000));
  if (remaining <= 0) return 'auto-off soon';
  if (remaining < 60) return `${remaining}m remaining`;
  return `${Math.floor(remaining / 60)}h ${remaining % 60}m remaining`;
}

export function HomePage() {
  const { activeSessions, settings, refreshActive } = useApp();
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endingId, setEndingId] = useState<number | null>(null);

  const isOn = activeSessions.length > 0;
  const activeZoneNames = activeSessions
    .flatMap((s) => s.zones.map((z) => z.zone.name))
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ');

  const earliestStart = activeSessions.length > 0
    ? activeSessions.reduce((earliest, s) =>
        new Date(s.start_time) < new Date(earliest.start_time) ? s : earliest
      ).start_time
    : null;

  const handleAcOn = () => {
    if (!currentUser) {
      navigate('/select-user');
      return;
    }
    setShowZoneModal(true);
  };

  const handleEndSession = async (id: number) => {
    setEndingId(id);
    setError(null);
    try {
      await endSession(id);
      await refreshActive();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setEndingId(null);
    }
  };

  return (
    <main className="page">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* AC Status Banner */}
      <div className={`ac-banner ${isOn ? 'ac-banner-on' : 'ac-banner-off'}`}>
        {isOn ? (
          <>
            <span className="ac-banner-dot" />
            <span className="ac-banner-text">
              AC ON in <strong>{activeZoneNames}</strong>
              {settings && earliestStart && (
                <> • {formatTimeRemaining(earliestStart, settings.auto_off_duration)}</>
              )}
            </span>
          </>
        ) : (
          <>
            <span className="ac-banner-dot ac-banner-dot-off" />
            <span className="ac-banner-text">AC is OFF</span>
          </>
        )}
      </div>

      {/* Quick Entry */}
      <section className="section">
        <button
          className={`btn-ac-on ${isOn ? 'btn-ac-on-active' : ''}`}
          onClick={handleAcOn}
        >
          {isOn ? '＋ Add Zone' : '❄️ Turn AC ON'}
        </button>
        {!currentUser && (
          <p className="hint-text">Select a user first to start a session</p>
        )}
      </section>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <section className="section">
          <h2 className="section-title">Active Sessions</h2>
          <div className="session-list">
            {activeSessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onEdit={() => setEditSession(s)}
                onEnd={() => handleEndSession(s.id)}
              />
            ))}
          </div>
          {endingId && <p className="hint-text">Ending session…</p>}
        </section>
      )}

      {/* My Stats */}
      {currentUser && (
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">My Stats Today</h2>
            <Link to="/stats" className="btn btn-sm btn-secondary">View My Stats</Link>
          </div>
          <p className="hint-text">See your usage breakdown on the Stats page.</p>
        </section>
      )}

      {/* Recent Sessions */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Sessions</h2>
          <Link to="/sessions" className="btn btn-sm btn-secondary">View All</Link>
        </div>
        <Link to="/history" className="btn btn-sm btn-secondary" style={{ marginTop: '0.5rem' }}>
          My Last 5 Sessions
        </Link>
      </section>

      {showZoneModal && currentUser && (
        <ZoneSelectionModal
          userId={currentUser.id}
          onClose={() => setShowZoneModal(false)}
          onStarted={() => setShowZoneModal(false)}
        />
      )}

      {editSession && (
        <EditSessionModal
          session={editSession}
          onClose={() => setEditSession(null)}
          onUpdated={() => setEditSession(null)}
        />
      )}
    </main>
  );
}
