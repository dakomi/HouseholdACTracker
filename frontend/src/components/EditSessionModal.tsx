import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBanner } from './ErrorBanner';
import { useApp } from '../contexts/AppContext';
import { updateSession } from '../api/api';
import type { Session } from '../types';

interface EditSessionModalProps {
  session: Session;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditSessionModal({ session, onClose, onUpdated }: EditSessionModalProps) {
  const { zones, refreshActive } = useApp();
  const [startTime, setStartTime] = useState(
    session.start_time.slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    session.end_time ? session.end_time.slice(0, 16) : ''
  );
  const [selectedZones, setSelectedZones] = useState<number[]>(
    session.zones.map((z) => z.zone_id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setError(null); }, [startTime, endTime, selectedZones]);

  const toggleZone = (id: number) => {
    setSelectedZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!startTime) { setError('Start time is required.'); return; }
    if (selectedZones.length === 0) { setError('Select at least one zone.'); return; }
    if (endTime && new Date(endTime) <= new Date(startTime)) {
      setError('End time must be after start time.');
      return;
    }
    setLoading(true);
    try {
      await updateSession(session.id, {
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : undefined,
        zone_ids: selectedZones,
      });
      await refreshActive();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Session"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <div className="form-group">
        <label htmlFor="edit-start">Start Time</label>
        <input
          id="edit-start"
          type="datetime-local"
          className="form-input"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="edit-end">End Time {session.end_time ? '(session ended)' : '(leave blank if still active)'}</label>
        <input
          id="edit-end"
          type="datetime-local"
          className="form-input"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          disabled={!!session.end_time}
        />
      </div>
      <div className="form-group">
        <label>Zones</label>
        <div className="zone-grid zone-grid-sm">
          {zones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              className={`zone-btn ${selectedZones.includes(zone.id) ? 'zone-btn-selected' : ''}`}
              onClick={() => toggleZone(zone.id)}
            >
              {zone.name}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
