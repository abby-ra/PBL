import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';

const TABS = ['Financial', 'Supply Chain', 'Sales', 'HR'];

// ─── Bar chart ────────────────────────────────
function BarChart({ data, valueKey, labelKey, color = 'var(--accent-blue)', unit = '' }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((item, i) => {
        const pct = (item[valueKey] / max) * 100;
        return (
          <div key={i}>
            <div className="flex-between mb-4">
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item[labelKey]}</span>
              <span className="text-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                {unit === '$'
                  ? `$${(item[valueKey] / 1e6).toFixed(1)}M`
                  : `${item[valueKey]}${unit}`}
              </span>
            </div>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Metric row ───────────────────────────────
function MetricRow({ label, value, badge, badgeColor = 'badge-blue' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="text-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
        {badge && <span className={`badge ${badgeColor}`}>{badge}</span>}
      </div>
    </div>
  );
}

// ─── Financial tab ────────────────────────────
function FinancialTab({ data }) {
  if (!data) return <LoadSkeleton />;
  const { summary, quarterly_trend, region_breakdown } = data;
  const regions = Object.entries(region_breakdown).map(([k, v]) => ({
    name: k,
    revenue: v.revenue,
    growth: v.growth,
  }));

  return (
    <div className="grid-2" style={{ gap: 16 }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Revenue by Quarter</div>
          <span className="badge badge-green">+{summary.revenue_growth}% YoY</span>
        </div>
        <BarChart data={quarterly_trend} valueKey="revenue" labelKey="quarter" color="var(--accent-blue)" unit="$" />
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Key Financials</div></div>
        <MetricRow label="Total Revenue" value={`$${(summary.total_revenue / 1e6).toFixed(1)}M`} badge="+12.4%" badgeColor="badge-green" />
        <MetricRow label="Gross Margin" value={`${summary.gross_margin}%`} badge="Above avg" badgeColor="badge-blue" />
        <MetricRow label="Operating Profit" value={`$${(summary.operating_profit / 1e6).toFixed(1)}M`} />
        <MetricRow label="EBITDA" value={`$${(summary.ebitda / 1e6).toFixed(1)}M`} />
        <MetricRow label="Cash Flow" value={`$${(summary.cash_flow / 1e6).toFixed(1)}M`} badge="Healthy" badgeColor="badge-green" />
        <MetricRow label="Accounts Receivable" value={`$${(summary.accounts_receivable / 1e6).toFixed(1)}M`} />
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Regional Revenue</div></div>
        <BarChart data={regions} valueKey="revenue" labelKey="name" color="var(--accent-violet)" unit="$" />
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Regional Growth</div></div>
        {regions.map((r, i) => (
          <MetricRow
            key={i}
            label={r.name}
            value={`+${r.growth}%`}
            badge={r.growth > 15 ? '🔥 Hot' : r.growth > 10 ? 'Strong' : 'Steady'}
            badgeColor={r.growth > 15 ? 'badge-red' : r.growth > 10 ? 'badge-green' : 'badge-muted'}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Supply chain tab ─────────────────────────
function SupplyChainTab({ data }) {
  if (!data) return <LoadSkeleton />;
  const { performance, open_orders, top_suppliers, risk_alerts } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {risk_alerts?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {risk_alerts.map((a, i) => (
            <div className="alert alert-warning" key={i}>
              <span>⚠️</span>
              <div><strong>{a.supplier}</strong> — {a.issue}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Performance Metrics</div></div>
          <MetricRow label="On-Time Delivery" value={`${performance.on_time_delivery_rate}%`} badge="Good" badgeColor="badge-green" />
          <MetricRow label="Supplier Performance" value={`${performance.supplier_performance}%`} />
          <MetricRow label="Inventory Turnover" value={`${performance.inventory_turnover}x`} />
          <MetricRow label="Days Inventory Outstanding" value={`${performance.days_inventory_outstanding} days`} />
          <MetricRow label="Stockout Incidents" value={performance.stockout_incidents} badge={performance.stockout_incidents > 10 ? 'High' : 'OK'} badgeColor={performance.stockout_incidents > 10 ? 'badge-amber' : 'badge-green'} />
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Purchase Orders</div></div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 14, textAlign: 'center' }}>
              <div className="text-mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-blue)' }}>{open_orders.total}</div>
              <div className="text-sm text-muted">Open</div>
            </div>
            <div style={{ flex: 1, background: 'var(--accent-amber-dim)', borderRadius: 'var(--radius-sm)', padding: 14, textAlign: 'center', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="text-mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-amber)' }}>{open_orders.overdue}</div>
              <div className="text-sm" style={{ color: 'var(--accent-amber)' }}>Overdue</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Top Suppliers</div></div>
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Annual Spend</th>
                <th>Reliability</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {top_suppliers.map((s, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td>
                  <td className="text-mono">${(s.spend / 1e6).toFixed(1)}M</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="confidence-bar" style={{ width: 60, display: 'inline-block' }}>
                        <div className="confidence-fill" style={{
                          width: `${s.reliability}%`,
                          background: s.reliability > 90 ? 'var(--accent-green)' : s.reliability > 80 ? 'var(--accent-amber)' : 'var(--accent-red)'
                        }} />
                      </div>
                      {s.reliability}%
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${s.risk === 'HIGH' ? 'badge-red' : s.risk === 'MEDIUM' ? 'badge-amber' : 'badge-green'}`}>
                      {s.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Sales tab ────────────────────────────────
function SalesTab({ data }) {
  if (!data) return <LoadSkeleton />;
  const { performance, pipeline_value, top_products } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Sales Performance</div></div>
          <MetricRow label="Total Sales" value={performance.total_sales.toLocaleString()} />
          <MetricRow label="New Customers" value={performance.new_customers} badge="+284" badgeColor="badge-green" />
          <MetricRow label="Churned Customers" value={performance.churned_customers} badge="Risk" badgeColor="badge-amber" />
          <MetricRow label="Net Revenue Retention" value={`${performance.net_revenue_retention}%`} badge="Excellent" badgeColor="badge-green" />
          <MetricRow label="Win Rate" value={`${performance.win_rate}%`} />
          <MetricRow label="Avg Deal Size" value={`$${performance.avg_deal_size.toLocaleString()}`} />
          <MetricRow label="Sales Cycle" value={`${performance.sales_cycle_days} days`} />
          <MetricRow label="Pipeline Value" value={`$${(pipeline_value / 1e6).toFixed(0)}M`} badge="Active" badgeColor="badge-blue" />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Products by Revenue</div>
          </div>
          <BarChart data={top_products} valueKey="revenue" labelKey="name" color="var(--accent-green)" unit="$" />
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Product Performance</div></div>
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr><th>Product</th><th>Revenue</th><th>Units</th><th>Growth</th></tr>
            </thead>
            <tbody>
              {top_products.map((p, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                  <td className="text-mono">${(p.revenue / 1e6).toFixed(1)}M</td>
                  <td className="text-mono">{p.units.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${p.growth > 20 ? 'badge-green' : p.growth > 10 ? 'badge-blue' : 'badge-muted'}`}>
                      +{p.growth}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── HR tab ───────────────────────────────────
function HRTab({ data }) {
  if (!data) return <LoadSkeleton />;
  const { summary, departments } = data;
  const deptArray = Object.entries(departments).map(([k, v]) => ({ name: k, ...v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Workforce Summary</div></div>
          <MetricRow label="Total Headcount" value={summary.total_headcount.toLocaleString()} />
          <MetricRow label="Open Positions" value={summary.open_positions} badge="Hiring" badgeColor="badge-blue" />
          <MetricRow label="Attrition Rate" value={`${summary.attrition_rate}%`} badge={summary.attrition_rate > 12 ? 'High' : 'OK'} badgeColor={summary.attrition_rate > 12 ? 'badge-red' : 'badge-green'} />
          <MetricRow label="Avg Tenure" value={`${summary.avg_tenure_years} yrs`} />
          <MetricRow label="Engagement Score" value={`${summary.engagement_score}%`} badge={summary.engagement_score > 70 ? 'Good' : 'Review'} badgeColor={summary.engagement_score > 70 ? 'badge-green' : 'badge-amber'} />
          <MetricRow label="Training Completion" value={`${summary.training_completion_rate}%`} />
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">Attrition by Department</div></div>
          <BarChart data={deptArray} valueKey="attrition" labelKey="name" color="var(--accent-amber)" unit="%" />
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Department Breakdown</div></div>
        <table className="data-table">
          <thead>
            <tr><th>Department</th><th>Headcount</th><th>Attrition</th><th>Status</th></tr>
          </thead>
          <tbody>
            {deptArray.sort((a, b) => b.attrition - a.attrition).map((d, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{d.name}</td>
                <td className="text-mono">{d.headcount.toLocaleString()}</td>
                <td className="text-mono">{d.attrition}%</td>
                <td>
                  <span className={`badge ${d.attrition > 15 ? 'badge-red' : d.attrition > 10 ? 'badge-amber' : 'badge-green'}`}>
                    {d.attrition > 15 ? '⚠️ High' : d.attrition > 10 ? 'Monitor' : '✓ Stable'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Analytics page ──────────────────────
export default function Analytics() {
  const [activeTab, setActiveTab] = useState('Financial');
  const [financialData, setFinancialData] = useState(null);
  const [supplyData, setSupplyData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [hrData, setHrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab]);

  async function loadTab(tab) {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'Financial' && !financialData) {
        const d = await analyticsAPI.getFinancial();
        setFinancialData(d);
      } else if (tab === 'Supply Chain' && !supplyData) {
        const d = await analyticsAPI.getSupplyChain();
        setSupplyData(d);
      } else if (tab === 'Sales' && !salesData) {
        const d = await analyticsAPI.getSales();
        setSalesData(d);
      } else if (tab === 'HR' && !hrData) {
        const d = await analyticsAPI.getHR();
        setHrData(d);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Analytics Dashboard</div>
          <div className="page-subtitle">SAP data across all modules</div>
        </div>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 20,
          borderBottom: '1px solid var(--border)', paddingBottom: 0,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                background: 'none', border: 'none', borderBottom: '2px solid',
                borderColor: activeTab === tab ? 'var(--accent-blue)' : 'transparent',
                color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-muted)',
                transition: 'all 0.15s', marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert alert-danger">
            ⚠️ {error} — ensure backend is running at http://localhost:8000
          </div>
        )}

        {activeTab === 'Financial' && <FinancialTab data={financialData} />}
        {activeTab === 'Supply Chain' && <SupplyChainTab data={supplyData} />}
        {activeTab === 'Sales' && <SalesTab data={salesData} />}
        {activeTab === 'HR' && <HRTab data={hrData} />}
      </div>
    </>
  );
}

function LoadSkeleton() {
  return (
    <div className="grid-2" style={{ gap: 16 }}>
      {[0, 1].map((i) => (
        <div key={i} className="card">
          {Array(5).fill(0).map((_, j) => (
            <div key={j} style={{ marginBottom: 14 }}>
              <div className="skeleton" style={{ width: '100%', height: 12, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: '70%', height: 10 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
