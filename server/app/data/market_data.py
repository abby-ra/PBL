"""
Real-time market data fetcher — OPTIMIZED
Fixes:
1. Timeout reduced to 3s per request
2. All symbols fetched concurrently via ThreadPoolExecutor
3. Stale cache returned immediately, background refresh triggered
4. Cache warmed at startup so first UI load is instant
"""

import httpx
import json
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.db.database import Base, SessionLocal, engine

logger = logging.getLogger(__name__)

# ── Cache table ───────────────────────────────
class MarketDataCache(Base):
    __tablename__ = "market_data_cache"
    id         = Column(Integer, primary_key=True, index=True)
    symbol     = Column(String(20), nullable=False, index=True)
    data_json  = Column(Text, nullable=False)
    fetched_at = Column(DateTime, default=datetime.utcnow)


def init_market_table():
    Base.metadata.create_all(bind=engine)
    # Warm cache at startup in background — so first UI load is instant
    thread = threading.Thread(target=_warm_cache, daemon=True)
    thread.start()
    logger.info("📡 Market data cache warming started in background")


def _warm_cache():
    """Called once at startup — pre-fetches all symbols into cache."""
    try:
        results = _fetch_all_concurrent()
        db = SessionLocal()
        try:
            for symbol, data in results.items():
                if data:
                    _save_cache(db, symbol, data)
            logger.info(f"✅ Market cache warmed for {len(results)} symbols")
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Cache warm failed: {e}")


# ── Config ────────────────────────────────────
YAHOO_URL       = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
TIMEOUT_SECONDS = 3        # FIX 1: reduced from 10s to 3s
CACHE_TTL_MINUTES = 15

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}

SYMBOLS = {
    "SAP":      {"label": "SAP SE",          "unit": "USD", "type": "stock"},
    "EURUSD=X": {"label": "EUR/USD",         "unit": "USD", "type": "forex"},
    "INR=X":    {"label": "USD/INR",         "unit": "INR", "type": "forex"},
    "CL=F":     {"label": "Crude Oil (WTI)", "unit": "USD/bbl", "type": "commodity"},
    "GC=F":     {"label": "Gold",            "unit": "USD/oz",  "type": "commodity"},
}

FALLBACKS = {
    "SAP":      {"price": 215.40, "change": 1.20,  "change_pct": 0.56},
    "EURUSD=X": {"price": 1.0842, "change": 0.002, "change_pct": 0.18},
    "INR=X":    {"price": 83.92,  "change": -0.12, "change_pct": -0.14},
    "CL=F":     {"price": 78.45,  "change": -0.85, "change_pct": -1.07},
    "GC=F":     {"price": 2345.0, "change": 12.3,  "change_pct": 0.53},
}


# ── Single symbol fetch ───────────────────────
def _fetch_one(symbol: str) -> dict | None:
    """Fetch one symbol from Yahoo Finance. Timeout: 3s."""
    try:
        url = YAHOO_URL.format(symbol=symbol)
        with httpx.Client(timeout=TIMEOUT_SECONDS, follow_redirects=True) as client:
            resp = client.get(url, headers=HEADERS)
            resp.raise_for_status()
            raw = resp.json()

        result = raw["chart"]["result"][0]
        meta   = result["meta"]

        current  = meta.get("regularMarketPrice") or meta.get("previousClose", 0)
        prev     = meta.get("previousClose") or meta.get("chartPreviousClose", current)
        change   = current - prev
        chg_pct  = (change / prev * 100) if prev else 0

        return {
            "symbol":        symbol,
            "label":         SYMBOLS[symbol]["label"],
            "unit":          SYMBOLS[symbol]["unit"],
            "type":          SYMBOLS[symbol]["type"],
            "price":         round(current, 4),
            "previous_close": round(prev, 4),
            "change":        round(change, 4),
            "change_pct":    round(chg_pct, 2),
            "market_state":  meta.get("marketState", "CLOSED"),
            "currency":      meta.get("currency", "USD"),
            "exchange":      meta.get("exchangeName", ""),
            "fetched_at":    datetime.utcnow().isoformat(),
            "is_live":       meta.get("marketState") == "REGULAR",
            "fallback":      False,
            "stale":         False,
        }
    except Exception as e:
        logger.warning(f"Fetch failed [{symbol}]: {e}")
        return None


# ── FIX 2: Concurrent fetch all symbols ───────
def _fetch_all_concurrent() -> dict:
    """
    Fetch all symbols in parallel using ThreadPoolExecutor.
    All 5 symbols fetched simultaneously — total time = slowest single fetch
    instead of sum of all fetches.
    """
    results = {}
    with ThreadPoolExecutor(max_workers=len(SYMBOLS)) as executor:
        future_map = {executor.submit(_fetch_one, sym): sym for sym in SYMBOLS}
        for future in as_completed(future_map):
            symbol = future_map[future]
            try:
                results[symbol] = future.result()
            except Exception as e:
                logger.warning(f"Concurrent fetch error [{symbol}]: {e}")
                results[symbol] = None
    return results


# ── Cache helpers ─────────────────────────────
def _get_cached(db: Session, symbol: str, allow_stale: bool = False) -> dict | None:
    """Return cached entry if within TTL. If allow_stale, return even expired."""
    query = db.query(MarketDataCache).filter(MarketDataCache.symbol == symbol)

    if not allow_stale:
        cutoff = datetime.utcnow() - timedelta(minutes=CACHE_TTL_MINUTES)
        query  = query.filter(MarketDataCache.fetched_at >= cutoff)

    row = query.order_by(MarketDataCache.fetched_at.desc()).first()
    if row:
        data = json.loads(row.data_json)
        age  = (datetime.utcnow() - row.fetched_at).total_seconds() / 60
        data["stale"] = age > CACHE_TTL_MINUTES
        return data
    return None


def _save_cache(db: Session, symbol: str, data: dict):
    row = MarketDataCache(symbol=symbol, data_json=json.dumps(data))
    db.add(row)
    db.commit()


def _fallback(symbol: str) -> dict:
    fb   = FALLBACKS.get(symbol, {"price": 0, "change": 0, "change_pct": 0})
    info = SYMBOLS.get(symbol, {})
    return {
        "symbol":      symbol,
        "label":       info.get("label", symbol),
        "unit":        info.get("unit", "USD"),
        "type":        info.get("type", "stock"),
        "price":       fb["price"],
        "change":      fb["change"],
        "change_pct":  fb["change_pct"],
        "market_state": "CLOSED",
        "fetched_at":  datetime.utcnow().isoformat(),
        "is_live":     False,
        "from_cache":  False,
        "fallback":    True,
        "stale":       False,
    }


# ── FIX 3: Stale-while-revalidate pattern ─────
def _background_refresh(symbol: str):
    """Refresh a single symbol in background thread — non-blocking."""
    def _do():
        data = _fetch_one(symbol)
        if data:
            db = SessionLocal()
            try:
                _save_cache(db, symbol)
            finally:
                db.close()
    threading.Thread(target=_do, daemon=True).start()


def get_market_data(symbol: str) -> dict:
    """
    Returns data immediately using stale-while-revalidate:
    1. Fresh cache → return immediately ✅
    2. Stale cache → return immediately + refresh in background ✅
    3. No cache    → fetch live (first time only, cache warmed at startup)
    4. Fetch fails → static fallback
    """
    db = SessionLocal()
    try:
        # Try fresh cache first
        fresh = _get_cached(db, symbol, allow_stale=False)
        if fresh:
            fresh["from_cache"] = True
            return fresh

        # Try stale cache — return it immediately, refresh in background
        stale = _get_cached(db, symbol, allow_stale=True)
        if stale:
            stale["from_cache"] = True
            stale["stale"] = True
            _background_refresh(symbol)   # FIX 3: non-blocking refresh
            return stale

        # No cache at all — fetch live (only happens if startup warm failed)
        live = _fetch_one(symbol)
        if live:
            _save_cache(db, symbol, live)
            live["from_cache"] = False
            return live

        # Total fallback
        return _fallback(symbol)

    finally:
        db.close()


def get_all_market_data() -> list:
    """
    FIX 2: Returns all symbols concurrently from cache.
    If any symbol is missing from cache, fetches all missing ones in parallel.
    """
    db = SessionLocal()
    results = []
    missing = []

    try:
        for symbol in SYMBOLS:
            cached = _get_cached(db, symbol, allow_stale=True)
            if cached:
                cached["from_cache"] = True
                results.append(cached)
            else:
                missing.append(symbol)
    finally:
        db.close()

    # Fetch missing symbols concurrently
    if missing:
        with ThreadPoolExecutor(max_workers=len(missing)) as executor:
            future_map = {executor.submit(_fetch_one, sym): sym for sym in missing}
            db2 = SessionLocal()
            try:
                for future in as_completed(future_map):
                    symbol = future_map[future]
                    data   = future.result()
                    if data:
                        _save_cache(db2, symbol, data)
                        results.append(data)
                    else:
                        results.append(_fallback(symbol))
            finally:
                db2.close()

    # Maintain consistent symbol order
    order = list(SYMBOLS.keys())
    results.sort(key=lambda x: order.index(x["symbol"]) if x["symbol"] in order else 99)
    return results