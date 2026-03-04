import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { useApp } from '../contexts/AppContext';
import {
  createUser, updateUser, deleteUser,
  createZone, updateZone, deleteZone,
  createZoneCombination, deleteZoneCombination,
  getZoneCombinations, updateSettings,
} from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { Modal } from '../components/Modal';
import type { User, Zone, ZoneCombination, Settings } from '../types';

type Tab = 'members' | 'zones' | 'settings';

// ────────────── Members Tab ──────────────
function MembersTab() {
  const { users, refreshUsers } = useUser();
  const [editing, setEditing] = useState<User | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formName, setFormName] = useState('');
  const [formColour, setFormColour] = useState('#0f3460');
  const [formPin, setFormPin] = useState('');
  const [formAdmin, setFormAdmin] = useState(false);

  const openAdd = () => {
    setFormName(''); setFormColour('#0f3460'); setFormPin(''); setFormAdmin(false);
    setAdding(true); setEditing(null); setError(null);
  };
  const openEdit = (u: User) => {
    setFormName(u.name); setFormColour(u.colour); setFormPin(u.pin ?? ''); setFormAdmin(u.is_admin);
    setEditing(u); setAdding(false); setError(null);
  };
  const closeModal = () => { setEditing(null); setAdding(false); setError(null); };

  const handleSave = async () => {
    if (!formName.trim()) { setError('Name is required.'); return; }
    setLoading(true); setError(null);
    try {
      if (adding) {
        await createUser({ name: formName, colour: formColour, pin: formPin || undefined, is_admin: formAdmin });
      } else if (editing) {
        await updateUser(editing.id, { name: formName, colour: formColour, pin: formPin || null, is_admin: formAdmin });
      }
      await refreshUsers();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this user? All their sessions will also be deleted.')) return;
    try {
      await deleteUser(id);
      await refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const showModal = adding || !!editing;

  return (
    <div>
      <div className="tab-toolbar">
        <button className="btn btn-primary" onClick={openAdd}>+ Add Member</button>
      </div>
      {error && !showModal && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <div className="admin-list">
        {users.map((u) => (
          <div key={u.id} className="admin-list-item">
            <span className="user-avatar" style={{ backgroundColor: u.colour }}>{u.name[0].toUpperCase()}</span>
            <div className="admin-item-info">
              <strong>{u.name}</strong>
              {u.is_admin && <span className="badge badge-admin">Admin</span>}
              {u.pin && <span className="badge">PIN Set</span>}
            </div>
            <div className="admin-item-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => openEdit(u)}>Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal
          title={adding ? 'Add Member' : `Edit ${editing?.name}`}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Save'}
              </button>
            </>
          }
        >
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
          <div className="form-group">
            <label htmlFor="m-name">Name *</label>
            <input id="m-name" className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="m-colour">Colour</label>
            <div className="colour-row">
              <input id="m-colour" type="color" className="colour-picker" value={formColour} onChange={(e) => setFormColour(e.target.value)} />
              <span>{formColour}</span>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="m-pin">PIN (optional)</label>
            <input id="m-pin" type="password" className="form-input" value={formPin} onChange={(e) => setFormPin(e.target.value)} placeholder="Leave blank for no PIN" />
          </div>
          <div className="form-group form-group-check">
            <input id="m-admin" type="checkbox" checked={formAdmin} onChange={(e) => setFormAdmin(e.target.checked)} />
            <label htmlFor="m-admin">Admin</label>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ────────────── Zones Tab ──────────────
function ZonesTab() {
  const { zones, refreshZones } = useApp();
  const [combinations, setCombinations] = useState<ZoneCombination[]>([]);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [addingZone, setAddingZone] = useState(false);
  const [addingCombo, setAddingCombo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneKwh, setZoneKwh] = useState('0.5');
  const [comboLabel, setComboLabel] = useState('');
  const [comboKwh, setComboKwh] = useState('1.0');
  const [comboZones, setComboZones] = useState<number[]>([]);

  const loadCombos = useCallback(async () => {
    try { setCombinations(await getZoneCombinations()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadCombos(); }, [loadCombos]);

  const openEditZone = (z: Zone) => { setZoneName(z.name); setZoneKwh(String(z.kwh_per_hour)); setEditZone(z); setError(null); };
  const openAddZone = () => { setZoneName(''); setZoneKwh('0.5'); setAddingZone(true); setError(null); };
  const closeZoneModal = () => { setEditZone(null); setAddingZone(false); setError(null); };

  const handleSaveZone = async () => {
    if (!zoneName.trim()) { setError('Name is required.'); return; }
    const kwhNum = parseFloat(zoneKwh);
    if (isNaN(kwhNum) || kwhNum <= 0) { setError('kWh/hr must be a positive number.'); return; }
    setLoading(true); setError(null);
    try {
      if (addingZone) await createZone({ name: zoneName, kwh_per_hour: kwhNum });
      else if (editZone) await updateZone(editZone.id, { name: zoneName, kwh_per_hour: kwhNum });
      await refreshZones();
      closeZoneModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (id: number) => {
    if (!window.confirm('Delete this zone?')) return;
    try { await deleteZone(id); await refreshZones(); } catch (err) { setError(err instanceof Error ? err.message : 'Delete failed'); }
  };

  const handleSaveCombo = async () => {
    if (!comboLabel.trim()) { setError('Combo name is required.'); return; }
    const kwhNum = parseFloat(comboKwh);
    if (isNaN(kwhNum) || kwhNum <= 0) { setError('kWh/hr must be positive.'); return; }
    if (comboZones.length === 0) { setError('Select at least one zone.'); return; }
    setLoading(true); setError(null);
    try {
      await createZoneCombination({ label: comboLabel, kwh_per_hour: kwhNum, zone_ids: comboZones });
      await loadCombos();
      setAddingCombo(false); setComboLabel(''); setComboKwh('1.0'); setComboZones([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const showZoneModal = addingZone || !!editZone;

  return (
    <div>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <div className="tab-section">
        <div className="tab-toolbar">
          <h3>Zones</h3>
          <button className="btn btn-primary" onClick={openAddZone}>+ Add Zone</button>
        </div>
        <div className="admin-list">
          {zones.map((z) => (
            <div key={z.id} className="admin-list-item">
              <div className="admin-item-info">
                <strong>{z.name}</strong>
                <span className="hint-text">{z.kwh_per_hour} kWh/hr</span>
              </div>
              <div className="admin-item-actions">
                <button className="btn btn-sm btn-secondary" onClick={() => openEditZone(z)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteZone(z.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="tab-section">
        <div className="tab-toolbar">
          <h3>Zone Combinations</h3>
          <button className="btn btn-primary" onClick={() => { setAddingCombo(true); setError(null); }}>+ Add Combo</button>
        </div>
        <div className="admin-list">
          {combinations.map((c) => (
            <div key={c.id} className="admin-list-item">
              <div className="admin-item-info">
                <strong>{c.label}</strong>
                <span className="hint-text">{c.kwh_per_hour} kWh/hr • {c.zones.map((cz) => cz.zone.name).join(', ')}</span>
              </div>
              <div className="admin-item-actions">
                <button className="btn btn-sm btn-danger" onClick={async () => { await deleteZoneCombination(c.id); loadCombos(); }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showZoneModal && (
        <Modal
          title={addingZone ? 'Add Zone' : `Edit ${editZone?.name}`}
          onClose={closeZoneModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeZoneModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveZone} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Save'}
              </button>
            </>
          }
        >
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
          <div className="form-group">
            <label htmlFor="z-name">Name *</label>
            <input id="z-name" className="form-input" value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="z-kwh">kWh per Hour *</label>
            <input id="z-kwh" type="number" step="0.01" min="0" className="form-input" value={zoneKwh} onChange={(e) => setZoneKwh(e.target.value)} />
          </div>
        </Modal>
      )}

      {addingCombo && (
        <Modal
          title="Add Zone Combination"
          onClose={() => setAddingCombo(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setAddingCombo(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveCombo} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Save'}
              </button>
            </>
          }
        >
          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
          <div className="form-group">
            <label htmlFor="c-label">Combination Name *</label>
            <input id="c-label" className="form-input" value={comboLabel} onChange={(e) => setComboLabel(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="c-kwh">kWh per Hour *</label>
            <input id="c-kwh" type="number" step="0.01" min="0" className="form-input" value={comboKwh} onChange={(e) => setComboKwh(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Zones in Combination</label>
            <div className="zone-grid zone-grid-sm">
              {zones.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  className={`zone-btn ${comboZones.includes(z.id) ? 'zone-btn-selected' : ''}`}
                  onClick={() => setComboZones((prev) => prev.includes(z.id) ? prev.filter((id) => id !== z.id) : [...prev, z.id])}
                >
                  {z.name}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ────────────── Settings Tab ──────────────
function SettingsTab({ settings }: { settings: Settings | null }) {
  const { refreshSettings } = useApp();
  const [rate, setRate] = useState(String(settings?.electricity_rate ?? 0.25));
  const [autoOff, setAutoOff] = useState(String(settings?.auto_off_duration ?? 120));
  const [householdName, setHouseholdName] = useState(settings?.household_name ?? 'Our Home');
  const [requireConfirm, setRequireConfirm] = useState(settings?.require_confirmation ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setRate(String(settings.electricity_rate));
      setAutoOff(String(settings.auto_off_duration));
      setHouseholdName(settings.household_name);
      setRequireConfirm(settings.require_confirmation);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(rate);
    const autoOffNum = parseInt(autoOff, 10);
    if (isNaN(rateNum) || rateNum <= 0) { setError('Electricity rate must be positive.'); return; }
    if (isNaN(autoOffNum) || autoOffNum <= 0) { setError('Auto-off duration must be a positive number of minutes.'); return; }
    setLoading(true); setError(null);
    try {
      await updateSettings({
        electricity_rate: rateNum,
        auto_off_duration: autoOffNum,
        household_name: householdName,
        require_confirmation: requireConfirm,
      });
      await refreshSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="settings-form" onSubmit={handleSave}>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {saved && <div className="success-banner">✓ Settings saved!</div>}
      <div className="form-group">
        <label htmlFor="s-name">Household Name</label>
        <input id="s-name" className="form-input" value={householdName} onChange={(e) => setHouseholdName(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="s-rate">Electricity Rate ($/kWh)</label>
        <input id="s-rate" type="number" step="0.001" min="0" className="form-input" value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="s-autooff">Auto-Off Duration (minutes)</label>
        <input id="s-autooff" type="number" min="1" className="form-input" value={autoOff} onChange={(e) => setAutoOff(e.target.value)} />
      </div>
      <div className="form-group form-group-check">
        <input id="s-confirm" type="checkbox" checked={requireConfirm} onChange={(e) => setRequireConfirm(e.target.checked)} />
        <label htmlFor="s-confirm">Require confirmation before starting a session</label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <LoadingSpinner size="sm" /> : 'Save Settings'}
      </button>
    </form>
  );
}

// ────────────── Admin Page ──────────────
export function AdminPage() {
  const { settings } = useApp();
  const [tab, setTab] = useState<Tab>('members');

  return (
    <main className="page">
      <h1 className="page-title">Admin Panel</h1>
      <div className="tab-bar">
        {(['members', 'zones', 'settings'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'tab-btn-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {tab === 'members' && <MembersTab />}
        {tab === 'zones' && <ZonesTab />}
        {tab === 'settings' && <SettingsTab settings={settings} />}
      </div>
    </main>
  );
}
