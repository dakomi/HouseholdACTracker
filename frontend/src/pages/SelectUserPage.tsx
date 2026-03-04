import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';

export function SelectUserPage() {
  const { users, loadingUsers, authenticateAndSelect } = useUser();
  const navigate = useNavigate();
  const [pinUserId, setPinUserId] = useState<number | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pinUser = users.find((u) => u.id === pinUserId);

  const handleSelectUser = (id: number, hasPin: boolean) => {
    if (hasPin) {
      setPinUserId(id);
      setPin('');
      setError(null);
    } else {
      handleAuthenticate(id);
    }
  };

  const handleAuthenticate = async (id: number, pinVal?: string) => {
    setLoading(true);
    setError(null);
    try {
      await authenticateAndSelect(id, pinVal);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinUserId) handleAuthenticate(pinUserId, pin);
  };

  if (loadingUsers) return <LoadingSpinner message="Loading users…" />;

  if (pinUserId && pinUser) {
    return (
      <main className="page page-center">
        <div className="pin-entry">
          <div
            className="user-avatar user-avatar-lg"
            style={{ backgroundColor: pinUser.colour }}
          >
            {pinUser.name[0].toUpperCase()}
          </div>
          <h2>Enter PIN for {pinUser.name}</h2>
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              className="form-input pin-input"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
            <div className="pin-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setPinUserId(null)}>
                Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || !pin}>
                {loading ? <LoadingSpinner size="sm" /> : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="page page-center">
      <h1 className="page-title">Who are you?</h1>
      {users.length === 0 ? (
        <div className="setup-tip setup-tip-centered">
          <p><span role="img" aria-label="waving hand">👋</span> <strong>Welcome to AC Tracker!</strong></p>
          <p>No household members have been set up yet. Head to the Admin panel to add members and zones, then come back here to log in.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin')}
          >
            Go to Admin Panel →
          </button>
        </div>
      ) : (
        <div className="user-grid">
          {users.map((user) => (
            <button
              key={user.id}
              className="user-tile"
              onClick={() => handleSelectUser(user.id, !!user.pin)}
            >
              <div
                className="user-avatar user-avatar-lg"
                style={{ backgroundColor: user.colour }}
              >
                {user.name[0].toUpperCase()}
              </div>
              <span className="user-tile-name">{user.name}</span>
              {user.pin && <span className="user-tile-pin">🔒</span>}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
