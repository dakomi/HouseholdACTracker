import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBanner } from './ErrorBanner';
import { useApp } from '../contexts/AppContext';
import { startSession } from '../api/api';
import type { Zone } from '../types';

interface ZoneSelectionModalProps {
  userId: number;
  onClose: () => void;
  onStarted: () => void;
}

export function ZoneSelectionModal({ userId, onClose, onStarted }: ZoneSelectionModalProps) {
  const { zones, settings, refreshActive } = useApp();
  const [selectedZones, setSelectedZones] = useState<number[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedZoneObjects: Zone[] = zones.filter((z) => selectedZones.includes(z.id));
  const estimatedKwh = selectedZoneObjects.reduce((sum, z) => sum + z.kwh_per_hour, 0);
  const rate = settings?.electricity_rate ?? 0.25;

  useEffect(() => {
    setError(null);
  }, [selectedZones]);

  const toggleZone = (id: number) => {
    setSelectedZones((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  };

  const handleStart = async () => {
    if (selectedZones.length === 0) {
      setError('Please select at least one zone.');
      return;
    }
    if (settings?.require_confirmation && !confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await startSession({ user_id: userId, zone_ids: selectedZones });
      await refreshActive();
      onStarted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <Modal
        title="Confirm AC Session"
        onClose={() => setConfirming(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirming(false)}>Back</button>
            <button className="btn btn-primary" onClick={handleStart} disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Confirm & Start'}
            </button>
          </>
        }
      >
        <div className="confirm-summary">
          <p><strong>Zones:</strong> {selectedZoneObjects.map((z) => z.name).join(', ')}</p>
          <p><strong>Estimated rate:</strong> {estimatedKwh.toFixed(2)} kWh/hr</p>
          <p><strong>Estimated cost/hr:</strong> ${(estimatedKwh * rate).toFixed(2)}</p>
        </div>
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      </Modal>
    );
  }

  return (
    <Modal
      title="Select Zones"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={loading || selectedZones.length === 0}
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Start AC'}
          </button>
        </>
      }
    >
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {zones.length === 0 ? (
        <p className="empty-message">No zones configured. Add zones in Admin.</p>
      ) : (
        <div className="zone-grid">
          {zones.map((zone) => (
            <button
              key={zone.id}
              className={`zone-btn ${selectedZones.includes(zone.id) ? 'zone-btn-selected' : ''}`}
              onClick={() => toggleZone(zone.id)}
            >
              <span className="zone-btn-name">{zone.name}</span>
              <span className="zone-btn-kwh">{zone.kwh_per_hour} kWh/hr</span>
            </button>
          ))}
        </div>
      )}
      {selectedZones.length > 0 && (
        <div className="zone-estimate">
          <span>Estimated: {estimatedKwh.toFixed(2)} kWh/hr • ${(estimatedKwh * rate).toFixed(2)}/hr</span>
        </div>
      )}
    </Modal>
  );
}
