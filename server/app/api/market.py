"""
/api/market — Real-time market data endpoints
Fetches SAP SE stock, exchange rates, commodity prices
"""

from fastapi import APIRouter, Depends
from app.data.market_data import get_all_market_data, get_market_data, SYMBOLS
from app.core.security import get_current_user

router = APIRouter()


@router.get("/market/live")
def get_live_market_data(current_user=Depends(get_current_user)):
    """
    Returns real-time prices for all configured symbols:
    - SAP SE stock (NYSE: SAP)
    - USD/INR exchange rate
    - EUR/USD exchange rate
    - Crude Oil (WTI)
    - Gold
    """
    data = get_all_market_data()
    return {
        "data": data,
        "symbols_tracked": list(SYMBOLS.keys()),
        "cache_ttl_minutes": 15,
    }


@router.get("/market/live/{symbol}")
def get_single_symbol(symbol: str, current_user=Depends(get_current_user)):
    """Returns real-time data for a single symbol."""
    symbol = symbol.upper()
    if symbol not in SYMBOLS:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not tracked")
    return get_market_data(symbol)


@router.get("/market/summary")
def get_market_summary(current_user=Depends(get_current_user)):
    """
    Returns a business-friendly summary of market data
    showing how it impacts SAP enterprise operations.
    """
    all_data = {d["symbol"]: d for d in get_all_market_data()}

    sap_stock = all_data.get("SAP", {})
    usd_inr   = all_data.get("INR=X", {})
    oil       = all_data.get("CL=F", {})
    gold      = all_data.get("GC=F", {})

    # Business impact analysis
    impacts = []

    if sap_stock.get("change_pct", 0) > 1:
        impacts.append({"type": "positive", "msg": f"SAP stock up {sap_stock['change_pct']}% — strong investor confidence"})
    elif sap_stock.get("change_pct", 0) < -1:
        impacts.append({"type": "warning", "msg": f"SAP stock down {abs(sap_stock['change_pct'])}% — monitor closely"})

    if oil.get("change_pct", 0) > 2:
        impacts.append({"type": "warning", "msg": f"Oil up {oil['change_pct']}% — supply chain costs may rise"})
    elif oil.get("change_pct", 0) < -2:
        impacts.append({"type": "positive", "msg": f"Oil down {abs(oil['change_pct'])}% — logistics cost relief"})

    if usd_inr.get("change_pct", 0) > 0.5:
        impacts.append({"type": "info", "msg": f"INR weakening — exports more competitive"})
    elif usd_inr.get("change_pct", 0) < -0.5:
        impacts.append({"type": "info", "msg": f"INR strengthening — imports cheaper"})

    return {
        "market_snapshot": {
            "sap_stock": sap_stock,
            "usd_inr":   usd_inr,
            "oil":       oil,
            "gold":      gold,
        },
        "business_impacts": impacts,
    }