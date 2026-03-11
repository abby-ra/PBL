import { useState, useEffect } from 'react';
import { predictionsAPI } from '../services/api';

function RiskBadge({ level }) {
  const map = {
    HIGH: { cls: 'badge-red', icon: '🔴' },
    MEDIUM: { cls: 'badge-amber', icon: '🟡' },
    LOW: { cls: 'badge-green', icon: '🟢' },
  };
  const { cls, icon } = map[level] || map.LOW;
  return <span className={`badge ${cls}`}>{icon} {level}</span>;
}

function ConfidenceMeter({ value }) {
  const color =
    value >= 85 ? 'var(--accent-green)' :
    value >= 70 ? 'var(--accent-blue)' :
    'var(--accent-amber)';
  return (
    <div>
      <div className="flex-between mb-4">
        <span className="text-sm text-muted">AI Confidence</span>
        <span className="text-mono" style={{ fontSize: 12, color }}>{value}%</span>
      </div>
      <div className="confidence-bar">
        <div className="confidence-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function PredictionCard({ prediction, onExplain }) {
  const [narrative, setNarrative] = useState(null);
  const [loadingNarrative, setLoadingNarrative] = useState(false);

  async function handleExplain() {
    setLoadingNarrative(true);
    try {
      const res = await predictionsAPI.getNarrative(prediction.id);
      setNarrative(res.narrative);
    } catch (e) {
      setNarrative('❌ Failed to generate narrative. Check backend connection.');
    } finally {
      setLoadingNarrative(false);
    }
  }

  const fmtValue = () => {
    const { title, predicted_value } = prediction;
    const t = title.toLowerCase();
    if (t.includes('revenue')) return `$${(predicted_value / 1e6).toFixed(1)}M`;
    if (t.includes('risk') || t.includes('attrition')) return `${predicted_value}%`;
    return predicted_value.toLocaleString();
  };

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div className="flex-between">
        <RiskBadge level={prediction.risk_level} />
        <span className="text-sm text-muted">{prediction.id}</span>
      </div>

      {/* Title & value */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          {prediction.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="text-mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-blue)' }}>
            {fmtValue()}
          </span>
          <span className="text-sm text-muted">predicted</span>
        </div>
      </div>

      <ConfidenceMeter value={prediction.confidence} />

      {/* Model info */}
      <div>
        <div className="text-sm text-muted mb-4">Model</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          {prediction.model}
        </div>
      </div>

      {/* Factors */}
      <div>
        <div className="text-sm text-muted mb-8">Key Factors</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {prediction.factors.map((f, i) => (
            <span key={i} className="badge badge-muted" style={{ fontSize: 10.5 }}>{f}</span>
          ))}
        </div>
      </div>

      <hr className="divider" style={{ margin: '4px 0' }} />

      {/* Narrative */}
      {narrative ? (
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
          padding: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65,
          borderLeft: '3px solid var(--accent-blue)',
        }}>
          {narrative}
        </div>
      ) : (
        <button
          className="btn btn-secondary btn-sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={handleExplain}
          disabled={loadingNarrative}
        >
          {loadingNarrative ? (
            <><div className="spinner" style={{ width: 12, height: 12 }} /> Generating…</>
          ) : (
            '🤖 Explain this prediction'
          )}
        </button>
      )}

      <div className="text-sm text-muted">
        Generated: {new Date(prediction.generated_at).toLocaleDateString()}
      </div>
    </div>
  );
}

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [riskSummary, setRiskSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    (async () => {
      try {
        const [predsRes, riskRes] = await Promise.all([
          predictionsAPI.getAll(),
          predictionsAPI.getRiskSummary(),
        ]);
        setPredictions(predsRes.predictions || []);
        setRiskSummary(riskRes.summary);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered =
    filter === 'ALL' ? predictions : predictions.filter((p) => p.risk_level === filter);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">AI Predictions</div>
          <div className="page-subtitle">ML-powered forecasts from SAP data</div>
        </div>
        {riskSummary && (
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-green">{riskSummary.low_count} Low</span>
            <span className="badge badge-amber">{riskSummary.medium_count} Medium</span>
            <span className="badge badge-red">{riskSummary.high_count} High</span>
            <span className="badge badge-blue">Avg {riskSummary.avg_confidence}% confidence</span>
          </div>
        )}
      </div>

      <div className="page-body">
        {error && (
          <div className="alert alert-danger">⚠️ {error} — backend at http://localhost:8000 not reachable</div>
        )}

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid-2" style={{ gap: 16 }}>
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="card">
                {Array(5).fill(0).map((_, j) => (
                  <div key={j} className="skeleton" style={{ height: 14, marginBottom: 12, width: j % 2 === 0 ? '100%' : '70%' }} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid-2" style={{ gap: 16 }}>
            {filtered.map((p) => (
              <PredictionCard key={p.id} prediction={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
