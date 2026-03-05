import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, Settings, Zone } from '../types';
import { getActiveSessions, getSettings, getZones } from '../api/api';
import { onSessionStarted, onSessionEnded, onSessionUpdated, onStatusUpdate } from '../api/socket';

interface AppContextValue {
  activeSessions: Session[];
  settings: Settings | null;
  zones: Zone[];
  loadingApp: boolean;
  refreshActive: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshZones: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_SETTINGS: Settings = {
  id: 1,
  electricity_rate: 0.25,
  auto_off_duration: 120,
  household_name: 'Our Home',
  require_confirmation: true,
  updated_at: new Date().toISOString(),
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingApp, setLoadingApp] = useState(true);

  const refreshActive = useCallback(async () => {
    try {
      const data = await getActiveSessions();
      setActiveSessions(data);
    } catch {
      // keep existing
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  const refreshZones = useCallback(async () => {
    try {
      const data = await getZones();
      setZones(data);
    } catch {
      // keep existing
    }
  }, []);

  useEffect(() => {
    Promise.all([refreshActive(), refreshSettings(), refreshZones()]).finally(() =>
      setLoadingApp(false)
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time socket updates
  useEffect(() => {
    const unsubs = [
      onSessionStarted(() => refreshActive()),
      onSessionEnded(() => refreshActive()),
      onSessionUpdated(() => refreshActive()),
      onStatusUpdate((status) => setActiveSessions(status.activeSessions)),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [refreshActive]);

  return (
    <AppContext.Provider value={{ activeSessions, settings, zones, loadingApp, refreshActive, refreshSettings, refreshZones }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
