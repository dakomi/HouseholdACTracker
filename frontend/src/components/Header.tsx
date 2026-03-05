import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useUser } from '../contexts/UserContext';

export function Header() {
  const { activeSessions } = useApp();
  const { currentUser, clearUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isOn = activeSessions.length > 0;

  const activeZoneNames = activeSessions
    .flatMap((s) => s.zones.map((z) => z.zone.name))
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ');

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="header-logo">❄️ AC Tracker</Link>
      </div>
      <div className={`ac-status-badge ${isOn ? 'ac-on' : 'ac-off'}`}>
        {isOn ? `AC ON • ${activeZoneNames}` : 'AC OFF'}
      </div>
      <nav className="header-nav">
        <Link to="/" className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}>Home</Link>
        <Link to="/stats" className={location.pathname === '/stats' ? 'nav-link active' : 'nav-link'}>Stats</Link>
        <Link to="/sessions" className={location.pathname === '/sessions' ? 'nav-link active' : 'nav-link'}>Sessions</Link>
        <Link to="/admin" className={location.pathname === '/admin' ? 'nav-link active' : 'nav-link'}>Admin</Link>
        {currentUser ? (
          <div className="header-user">
            <span
              className="user-avatar-small"
              style={{ backgroundColor: currentUser.colour }}
            >
              {currentUser.name[0].toUpperCase()}
            </span>
            <button className="btn-link" onClick={() => { clearUser(); navigate('/select-user'); }}>
              Switch
            </button>
          </div>
        ) : (
          <Link to="/select-user" className="nav-link">Select User</Link>
        )}
      </nav>
    </header>
  );
}
