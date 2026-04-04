import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import LiveMarketWidget from '../components/LiveMarketWidget';
// ─── helpers ──────────────────────────────────
const fmt = (n) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? n.toLocaleString()
    : String(n);

function ChangeChip({ value }) {
  const up = value >= 0;
  return (
    <span className={`kpi-change ${up ? 'up' : 'down'}`}>
      {up ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  );
}

function KPICard({ label, value, change, icon, accentColor }) {
  return (
    <div className="kpi-card" style={{ '--accent-color': accentColor }}>
      <div className="kpi-icon" style={{ background: `${accentColor}18` }}>
        {icon}
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <ChangeChip value={change} />
    </div>
  );
}

function MiniBar({ quarters }) {
  if (!quarters?.length) return null;
  const max = Math.max(...quarters.map((q) => q.revenue));
  return (
    <div className="chart-bar-container">
      {quarters.map((q, i) => (
        <div
          key={i}
          className="chart-bar"
          style={{ height: `${(q.revenue / max) * 100}%` }}
          title={`${q.quarter}: $${(q.revenue / 1e6).toFixed(1)}M`}
        >
          <span className="chart-bar-label">{q.quarter.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  );
}

function AlertBanner({ alerts }) {
  if (!alerts?.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
      {alerts.map((a, i) => (
        <div className="alert alert-warning" key={i}>
          <span>⚠️</span>
          <div>
            <strong>{a.supplier}</strong> — {a.issue}
            <span
              className={`badge badge-${a.impact === 'HIGH' ? 'red' : 'amber'}`}
              style={{ marginLeft: 8 }}
            >
              {a.impact}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [supplyChain, setSupplyChain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [overview, sc] = await Promise.all([
          analyticsAPI.getOverview(),
          analyticsAPI.getSupplyChain(),
        ]);
        setData(overview);
        setSupplyChain(sc);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const { kpis, financial, sales, hr, decisions, predictions } = data || {};

  const kpiCards = [
    {
      label: 'Total Revenue',
      value: fmt(kpis?.total_revenue?.value),
      change: kpis?.total_revenue?.change,
      icon: '💰',
      accentColor: '#3b82f6',
    },
    {
      label: 'Sales Count',
      value: kpis?.sales_count?.value?.toLocaleString(),
      change: kpis?.sales_count?.change,
      icon: '📈',
      accentColor: '#10b981',
    },
    {
      label: 'Customer Satisfaction',
      value: `${kpis?.customer_satisfaction?.value}/5`,
      change: kpis?.customer_satisfaction?.change,
      icon: '⭐',
      accentColor: '#f59e0b',
    },
    {
      label: 'Pipeline Health',
      value: fmt(kpis?.pipeline_health?.value),
      change: kpis?.pipeline_health?.change,
      icon: '📊',
      accentColor: '#ef4444',
    },
    {
      label: 'Supply Chain',
      value: `${kpis?.supply_chain_efficiency?.value?.toFixed(1)}%`,
      change: kpis?.supply_chain_efficiency?.change,
      icon: '🔗',
      accentColor: '#f59e0b',
    },
    {
      label: 'Attrition Rate',
      value: `${kpis?.attrition_rate?.value?.toFixed(1)}%`,
      change: kpis?.attrition_rate?.change,
      icon: '⚠️',
      accentColor: '#ef4444',
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard Overview</div>
          <div className="page-subtitle">
            SAP Enterprise Decision Support · Last updated: {data?.refreshed_at ? new Date(data.refreshed_at).toLocaleTimeString() : 'N/A'}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm">⟳ Refresh</button>
          <button className="btn btn-primary btn-sm">+ New Decision</button>
        </div>
      </div>

      <div className="page-body">
        <AlertBanner alerts={supplyChain?.risk_alerts} />

        {/* KPI Grid */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
          {kpiCards.slice(0, 6).map((kpi, i) => (
            <KPICard key={i} {...kpi} />
          ))}
        </div>

        <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
          {/* Revenue trend */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Revenue Trend</div>
                <div className="card-subtitle">Quarterly performance</div>
              </div>
              <span className="badge badge-green">+{financial?.revenue_growth || 0}% YoY</span>
            </div>
            <MiniBar quarters={financial?.quarterly} />
            <div style={{ marginTop: 32 }} />
            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              {(financial?.quarterly || []).map((q, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div className="text-muted text-sm">{q.quarter}</div>
                  <div className="text-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    ${(q.revenue / 1e6).toFixed(1)}M
                  </div>
                  <div className="text-sm" style={{ color: 'var(--accent-green)' }}>
                    {q.margin}% margin
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Business Pulse</div>
              <span className="badge badge-blue">Live</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <StatRow label="Sales Pipeline" value={`$${((sales?.pipeline_value || 0) / 1e6).toFixed(0)}M`} color="var(--accent-blue)" pct={68} />
              <StatRow label="Win Rate" value={`${sales?.win_rate || 0}%`} color="var(--accent-green)" pct={sales?.win_rate || 0} />
              <StatRow label="On-time Delivery" value={`${supplyChain?.performance?.on_time_delivery_rate || 0}%`} color="var(--accent-cyan)" pct={supplyChain?.performance?.on_time_delivery_rate || 0} />
              <StatRow label="HR Attrition" value={`${hr?.attrition_rate || 0}%`} color="var(--accent-amber)" pct={(hr?.attrition_rate || 0) * 4} />
              <StatRow label="AI Confidence" value={`${kpis?.avg_confidence?.value || 0}%`} color="var(--accent-violet)" pct={kpis?.avg_confidence?.value || 0} />
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 16 }}>
          {/* Decisions summary */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Decision Queue</div>
              <a href="/decisions" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>View all →</a>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <SummaryBox label="Total" value={decisions?.total || 0} color="var(--accent-blue)" />
              <SummaryBox label="Pending" value={decisions?.pending || 0} color="var(--accent-amber)" />
              <SummaryBox label="Resolved" value={(decisions?.total || 0) - (decisions?.pending || 0)} color="var(--accent-green)" />
            </div>
          </div>

          {/* Predictions summary */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">AI Predictions</div>
              <a href="/predictions" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>View all →</a>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <SummaryBox label="Total" value={predictions?.total || 0} color="var(--accent-violet)" />
              <SummaryBox label="High Risk" value={predictions?.high_risk || 0} color="var(--accent-red)" />
              <SummaryBox label="Safe" value={(predictions?.total || 0) - (predictions?.high_risk || 0)} color="var(--accent-green)" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatRow({ label, value, color, pct }) {
  return (
    <div>
      <div className="flex-between mb-4">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <div className="confidence-bar">
        <div className="confidence-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function SummaryBox({ label, value, color }) {
  return (
    <div style={{
      flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '14px', textAlign: 'center',
    }}>
      <div className="text-mono" style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div className="text-sm text-muted" style={{ marginTop: 4 }}>{label}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="page-header">
        <div className="page-title">Dashboard Overview</div>
      </div>
      <div className="page-body">
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="kpi-card">
              <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 8, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: '60%', height: 10, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '80%', height: 24, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '40%', height: 10 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ErrorState({ message }) {
  return (
    <>
      <div className="page-header"><div className="page-title">Dashboard Overview</div></div>
      <div className="page-body">
        <div className="alert alert-danger">
          <span>⚠️</span>
          <div><strong>Failed to load dashboard data</strong> — {message}<br /><span className="text-sm">Make sure your backend is running at http://localhost:8000</span></div>
        </div>
      </div>
    </>
  );
}
