export interface User {
  id: number;
  name: string;
  colour: string;
  pin: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Zone {
  id: number;
  name: string;
  kwh_per_hour: number;
  created_at: string;
}

export interface ZoneCombination {
  id: number;
  label: string;
  kwh_per_hour: number;
  zones: ZoneCombinationZone[];
}

export interface ZoneCombinationZone {
  zone_id: number;
  zone: Zone;
}

export interface SessionZone {
  zone_id: number;
  zone: Zone;
}

export interface SessionZoneLog {
  id: number;
  session_id: number;
  zone_id: number;
  activated_by: number;
  activated_at: string;
  deactivated_at: string | null;
}

export interface Session {
  id: number;
  user_id: number;
  user: User;
  start_time: string;
  end_time: string | null;
  created_at: string;
  zones: SessionZone[];
  sessionZoneLogs: SessionZoneLog[];
}

export interface Settings {
  id: number;
  electricity_rate: number;
  auto_off_duration: number;
  household_name: string;
  require_confirmation: boolean;
  updated_at?: string;
}

export interface UsageResult {
  userId: number;
  totalHours: number;
  exclusiveHours: number;
  sharedHours: number;
  kWh: number;
  cost: number;
}

export interface HouseholdReport {
  period: string;
  periodStart: string;
  periodEnd: string;
  totalSessions: number;
  activeSessions: number;
  totalKwh: number;
  totalCost: number;
  usageByUser: UsageResult[];
}

export interface StatusUpdate {
  activeSessions: Session[];
  timestamp: string;
}

export type Period = 'today' | 'week' | 'month';

export interface ApiResponse<T> {
  data: T;
  error: string | null;
}
