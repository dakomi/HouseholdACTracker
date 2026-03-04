import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useUser } from '../contexts/UserContext';
import { getUsageReport, getHouseholdReport, getSessions } from '../api/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { SessionCard } from '../components/SessionCard';
import { EditSessionModal } from '../components/EditSessionModal';
import type { Session, Period, UsageResult } from '../types';

type ViewMode = 'individual' | 'household';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
};

const PIE_COLORS = ['#0f3460', '#e94560', '#27ae60', '#f39c12', '#8e44ad', '#2980b9'];

interface ZoneBreakdown {
  name: string;
  value: number;
}

export function StatsPage() {
  const { currentUser } = useUser();
  const [period, setPeriod] = useState<Period>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageResults, setUsageResults] = useState<UsageResult[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [zoneBreakdown, setZoneBreakdown] = useState<ZoneBreakdown[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMode === 'individual' && currentUser) {
        const [usage, sessions] = await Promise.all([
          getUsageReport({ user_id: currentUser.id, period }),
          getSessions({ user_id: currentUser.id, limit: 5 }),
        ]);
        setUsageResults(usage);
        setRecentSessions(sessions);
        // Build zone breakdown from sessions
        const zoneCount: Record<string, number> = {};
        sessions.forEach((s) => {
          s.zones.forEach((z) => {
            zoneCount[z.zone.name] = (zoneCount[z.zone.name] ?? 0) + 1;
          });
        });
        setZoneBreakdown(Object.entries(zoneCount).map(([name, value]) => ({ name, value })));
      } else {
        const report = await getHouseholdReport(period);
        setUsageResults(report.usageByUser);
        const sessions = await getSessions({ limit: 5 });
        setRecentSessions(sessions);
        // Household zone breakdown
        const zoneCount: Record<string, number> = {};
        sessions.forEach((s) => {
          s.zones.forEach((z) => {
            zoneCount[z.zone.name] = (zoneCount[z.zone.name] ?? 0) + 1;
          });
        });
        setZoneBreakdown(Object.entries(zoneCount).map(([name, value]) => ({ name, value })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [period, viewMode, currentUser]);

  useEffect(() => {
    load();
  }, [load]);

  const myUsage = currentUser
    ? usageResults.find((u) => u.userId === currentUser.id)
    : null;
  const totalHours = viewMode === 'individual'
    ? (myUsage?.hours ?? 0)
    : usageResults.reduce((s, u) => s + u.hours, 0);
  const totalKwh = viewMode === 'individual'
    ? (myUsage?.kWh ?? 0)
    : usageResults.reduce((s, u) => s + u.kWh, 0);
  const totalCost = viewMode === 'individual'
    ? (myUsage?.cost ?? 0)
    : usageResults.reduce((s, u) => s + u.cost, 0);

  return (
    <main className="page">
      <h1 className="page-title">Stats</h1>

      {/* Controls */}
      <div className="stats-controls">
        <div className="period-selector">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'period-btn-active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'individual' ? 'view-btn-active' : ''}`}
            onClick={() => setViewMode('individual')}
          >
            Individual
          </button>
          <button
            className={`view-btn ${viewMode === 'household' ? 'view-btn-active' : ''}`}
            onClick={() => setViewMode('household')}
          >
            Household
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {loading ? (
        <LoadingSpinner message="Loading stats…" />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-card-value">{totalHours.toFixed(1)}h</div>
              <div className="stat-card-label">Hours</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{totalKwh.toFixed(2)}</div>
              <div className="stat-card-label">kWh</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">${totalCost.toFixed(2)}</div>
              <div className="stat-card-label">Cost</div>
            </div>
          </div>

          {/* Zone Breakdown Pie Chart */}
          {zoneBreakdown.length > 0 && (
            <section className="section">
              <h2 className="section-title">Zone Breakdown</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={zoneBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {zoneBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Recent Sessions */}
          <section className="section">
            <h2 className="section-title">Recent Sessions</h2>
            {recentSessions.length === 0 ? (
              <p className="empty-message">No sessions found for this period.</p>
            ) : (
              <div className="session-list">
                {recentSessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onEdit={() => setEditSession(s)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {editSession && (
        <EditSessionModal
          session={editSession}
          onClose={() => setEditSession(null)}
          onUpdated={() => { setEditSession(null); load(); }}
        />
      )}
    </main>
  );
}
