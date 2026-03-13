import { useState, useEffect, useCallback, useRef } from 'react';
import { marketAPI } from '../services/api';

function TickerCard({ item }) {
  const isUp   = item.change_pct > 0;
  const isDown = item.change_pct < 0;
  const arrow  = isUp ? '▲' : isDown ? '▼' : '●';
  const color  = isUp ? 'var(--accent-green)' : isDown ? 'var(--accent-red)' : 'var(--text-muted)';
  const typeIcon = { stock: '📈', forex: '💱', commodity: '🛢️' }[item.type] || '📊';

  function formatPrice(price, unit, type) {
    if (unit === 'INR') return `₹${Number(price).toFixed(2)}`;
    if (type === 'forex') return Number(price).toFixed(4);
    return `$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '12px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{typeIcon}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {item.symbol}
            {item.is_live && <span style={{ marginLeft: 4, fontSize: 9, color: 'var(--accent-green)', background: 'var(--accent-green-dim)', padding: '1px 4px', borderRadius: 3 }}>LIVE</span>}
            {item.stale   && <span style={{ marginLeft: 4, fontSize: 9, color: 'var(--accent-amber)', background: 'var(--accent-amber-dim)', padding: '1px 4px', borderRadius: 3 }}>CACHED</span>}
            {item.fallback && <span style={{ marginLeft: 4, fontSize: 9, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 4px', borderRadius: 3 }}>OFFLINE</span>}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          {formatPrice(item.price, item.unit, item.type)}
        </div>
        <div style={{ fontSize: 11, color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
          {arrow} {Math.abs(item.change_pct).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

function ImpactPill({ impact }) {
  const styles = {
    positive: { bg: 'var(--accent-green-dim)', text: 'var(--accent-green)', icon: '✅' },
    warning:  { bg: 'var(--accent-amber-dim)', text: 'var(--accent-amber)', icon: '⚠️' },
    info:     { bg: 'var(--accent-blue-dim)',  text: 'var(--accent-blue)',  icon: 'ℹ️' },
  }[impact.type] || { bg: 'var(--bg-elevated)', text: 'var(--text-muted)', icon: '●' };

  return (
    <div style={{ background: styles.bg, color: styles.text, fontSize: 11.5, padding: '5px 10px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span>{styles.icon}</span><span>{impact.msg}</span>
    </div>
  );
}

export default function LiveMarketWidget() {
  const [data, setData]               = useState(null);
  // FIX: show skeleton only on very first load, not on background refresh
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    // FIX: silent refresh doesn't block UI — shows small spinner in header only
    if (!silent) setInitialLoading(true);
    else setRefreshing(true);

    try {
      const res = await marketAPI.getSummary();
      if (!mountedRef.current) return;
      setData(res);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      if (!mountedRef.current) return;
      // FIX: on error, keep showing existing data if we have it
      if (!data) setError('Market data unavailable');
    } finally {
      if (!mountedRef.current) return;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  // Initial load — fast because cache is warmed at backend startup
  useEffect(() => { fetchData(false); }, []);

  // FIX: Background refresh every 5 min — silent, doesn't block UI
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const marketItems = data ? Object.values(data.market_snapshot).filter(Boolean) : [];
  const impacts     = data?.business_impacts || [];

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            📡 Live Market Data
            {/* FIX: small inline spinner during silent refresh — doesn't hide data */}
            {refreshing && <div className="spinner" style={{ width: 12, height: 12 }} />}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading…'}
            {' · '}Yahoo Finance · 15min cache
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => fetchData(true)}
          disabled={refreshing} style={{ fontSize: 12 }}>
          ↻ Refresh
        </button>
      </div>

      {/* FIX: Show skeleton ONLY on first load, not on refresh */}
      {initialLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[1,2,3,4,5].map((i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 6 }} />)}
        </div>
      )}

      {/* Error — only show if no data at all */}
      {error && !data && !initialLoading && (
        <div className="alert alert-warning">⚠️ {error} — showing last known values</div>
      )}

      {/* Ticker grid — stays visible during refresh */}
      {!initialLoading && marketItems.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8, marginBottom: impacts.length > 0 ? 14 : 0 }}>
          {marketItems.map((item) => <TickerCard key={item.symbol} item={item} />)}
        </div>
      )}

      {/* Business impact */}
      {!initialLoading && impacts.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Business Impact Analysis
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {impacts.map((impact, i) => <ImpactPill key={i} impact={impact} />)}
          </div>
        </div>
      )}
    </div>
  );
}