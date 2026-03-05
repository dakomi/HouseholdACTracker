import type {
  User,
  Zone,
  ZoneCombination,
  Session,
  Settings,
  UsageResult,
  HouseholdReport,
  ApiResponse,
  Period,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
      ...options,
    });
    const json: ApiResponse<T> = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Network error');
  }
}

// Users
export const getUsers = () => apiFetch<User[]>('/api/users');
export const createUser = (data: { name: string; colour: string; pin?: string; is_admin?: boolean }) =>
  apiFetch<User>('/api/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: number, data: Partial<{ name: string; colour: string; pin: string | null; is_admin: boolean }>) =>
  apiFetch<User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteUser = (id: number) =>
  apiFetch<{ id: number }>(`/api/users/${id}`, { method: 'DELETE' });
export const authenticateUser = (id: number, pin?: string) =>
  apiFetch<User>('/api/users/authenticate', { method: 'POST', body: JSON.stringify({ id, pin }) });

// Zones
export const getZones = () => apiFetch<Zone[]>('/api/zones');
export const createZone = (data: { name: string; kwh_per_hour: number }) =>
  apiFetch<Zone>('/api/zones', { method: 'POST', body: JSON.stringify(data) });
export const updateZone = (id: number, data: Partial<{ name: string; kwh_per_hour: number }>) =>
  apiFetch<Zone>(`/api/zones/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteZone = (id: number) =>
  apiFetch<{ id: number }>(`/api/zones/${id}`, { method: 'DELETE' });

// Zone Combinations
export const getZoneCombinations = () => apiFetch<ZoneCombination[]>('/api/zone-combinations');
export const createZoneCombination = (data: { label: string; kwh_per_hour: number; zone_ids: number[] }) =>
  apiFetch<ZoneCombination>('/api/zone-combinations', { method: 'POST', body: JSON.stringify(data) });
export const updateZoneCombination = (id: number, data: Partial<{ label: string; kwh_per_hour: number; zone_ids: number[] }>) =>
  apiFetch<ZoneCombination>(`/api/zone-combinations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteZoneCombination = (id: number) =>
  apiFetch<{ id: number }>(`/api/zone-combinations/${id}`, { method: 'DELETE' });

// Sessions
export const getSessions = (params?: { user_id?: number; limit?: number; offset?: number }) => {
  const qs = new URLSearchParams();
  if (params?.user_id) qs.set('user_id', String(params.user_id));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  return apiFetch<Session[]>(`/api/sessions${qs.toString() ? '?' + qs.toString() : ''}`);
};
export const getActiveSessions = () => apiFetch<Session[]>('/api/sessions/active');
export const getSession = (id: number) => apiFetch<Session>(`/api/sessions/${id}`);
export const startSession = (data: { user_id: number; zone_ids: number[]; start_time?: string }) =>
  apiFetch<Session>('/api/sessions', { method: 'POST', body: JSON.stringify(data) });
export const endSession = (id: number) =>
  apiFetch<Session>(`/api/sessions/${id}/end`, { method: 'POST' });
export const updateSession = (id: number, data: Partial<{ start_time: string; end_time: string; zone_ids: number[] }>) =>
  apiFetch<Session>(`/api/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSession = (id: number) =>
  apiFetch<{ id: number }>(`/api/sessions/${id}`, { method: 'DELETE' });

// Settings
export const getSettings = () => apiFetch<Settings>('/api/settings');
export const updateSettings = (data: Partial<Settings>) =>
  apiFetch<Settings>('/api/settings', { method: 'PUT', body: JSON.stringify(data) });

// Reports
export const getUsageReport = (params?: { user_id?: number; period?: Period }) => {
  const qs = new URLSearchParams();
  if (params?.user_id) qs.set('user_id', String(params.user_id));
  if (params?.period) qs.set('period', params.period);
  return apiFetch<UsageResult[]>(`/api/reports/usage${qs.toString() ? '?' + qs.toString() : ''}`);
};
export const getHouseholdReport = (period?: Period) => {
  const qs = period ? `?period=${period}` : '';
  return apiFetch<HouseholdReport>(`/api/reports/household${qs}`);
};
