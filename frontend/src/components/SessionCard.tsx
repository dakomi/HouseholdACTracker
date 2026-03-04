import type { Session } from '../types';

interface SessionCardProps {
  session: Session;
  onEdit?: () => void;
  onEnd?: () => void;
  compact?: boolean;
}

function formatDuration(start: string, end?: string | null): string {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const mins = Math.floor((endMs - startMs) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function SessionCard({ session, onEdit, onEnd, compact }: SessionCardProps) {
  const isActive = !session.end_time;
  const zoneNames = session.zones.map((z) => z.zone.name).join(', ');
  const duration = formatDuration(session.start_time, session.end_time);

  return (
    <div className={`session-card ${isActive ? 'session-card-active' : ''} ${compact ? 'session-card-compact' : ''}`}>
      <div className="session-card-left">
        <span
          className="user-avatar"
          style={{ backgroundColor: session.user?.colour ?? '#888' }}
          title={session.user?.name}
        >
          {session.user?.name?.[0]?.toUpperCase() ?? '?'}
        </span>
      </div>
      <div className="session-card-info">
        <div className="session-card-top">
          <strong>{session.user?.name ?? 'Unknown'}</strong>
          {isActive && <span className="badge badge-active">Active</span>}
        </div>
        <div className="session-zones">{zoneNames || 'No zones'}</div>
        {!compact && (
          <div className="session-meta">
            <span>{new Date(session.start_time).toLocaleString()}</span>
            {session.end_time && <span> → {new Date(session.end_time).toLocaleString()}</span>}
          </div>
        )}
        <div className="session-duration">⏱ {duration}</div>
      </div>
      {(onEdit || onEnd) && (
        <div className="session-card-actions">
          {onEdit && (
            <button className="btn btn-sm btn-secondary" onClick={onEdit}>Edit</button>
          )}
          {onEnd && isActive && (
            <button className="btn btn-sm btn-danger" onClick={onEnd}>End</button>
          )}
        </div>
      )}
    </div>
  );
}
