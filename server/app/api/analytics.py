"""
/api/analytics — Business analytics and KPI data endpoint.
Serves real SAP data to the Analytics Dashboard.
"""

from fastapi import APIRouter
from typing import Optional
import logging
from datetime import datetime

from app.data.mock_sap_data import (
    FINANCIAL_DATA,
    SUPPLY_CHAIN_DATA,
    SALES_DATA,
    HR_DATA,
    KPI_SUMMARY,
    PREDICTIONS_DATA,
    DECISIONS_LOG,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/analytics/kpis")
async def get_kpis():
    """Main KPI cards for the Dashboard Overview."""
    return {
        "kpis": KPI_SUMMARY,
        "refreshed_at": datetime.utcnow().isoformat() + "Z",
        "data_source": "SAP Analytics Cloud",
    }


@router.get("/analytics/financial")
async def get_financial_analytics(group_by: Optional[str] = "quarter"):
    """Financial analytics — revenue, margins, regional breakdown."""
    return {
        "summary": {
            "total_revenue": FINANCIAL_DATA["total_revenue"],
            "revenue_growth": FINANCIAL_DATA["revenue_growth"],
            "gross_margin": FINANCIAL_DATA["gross_margin"],
            "operating_profit": FINANCIAL_DATA["operating_profit"],
            "ebitda": FINANCIAL_DATA["ebitda"],
            "cash_flow": FINANCIAL_DATA["cash_flow"],
        },
        "quarterly_trend": FINANCIAL_DATA["quarterly"],
        "region_breakdown": FINANCIAL_DATA["region_breakdown"],
        "group_by": group_by,
    }


@router.get("/analytics/supply-chain")
async def get_supply_chain_analytics():
    """Supply chain performance metrics."""
    return {
        "performance": {
            "inventory_turnover": SUPPLY_CHAIN_DATA["inventory_turnover"],
            "on_time_delivery_rate": SUPPLY_CHAIN_DATA["on_time_delivery_rate"],
            "supplier_performance": SUPPLY_CHAIN_DATA["supplier_performance"],
            "days_inventory_outstanding": SUPPLY_CHAIN_DATA["days_inventory_outstanding"],
            "stockout_incidents": SUPPLY_CHAIN_DATA["stockout_incidents"],
        },
        "open_orders": {
            "total": SUPPLY_CHAIN_DATA["purchase_orders_open"],
            "overdue": SUPPLY_CHAIN_DATA["purchase_orders_overdue"],
        },
        "top_suppliers": SUPPLY_CHAIN_DATA["top_suppliers"],
        "risk_alerts": SUPPLY_CHAIN_DATA["risk_alerts"],
    }


@router.get("/analytics/sales")
async def get_sales_analytics():
    """Sales performance and pipeline metrics."""
    return {
        "performance": {
            "total_sales": SALES_DATA["total_sales"],
            "new_customers": SALES_DATA["new_customers"],
            "churned_customers": SALES_DATA["churned_customers"],
            "net_revenue_retention": SALES_DATA["net_revenue_retention"],
            "avg_deal_size": SALES_DATA["avg_deal_size"],
            "win_rate": SALES_DATA["win_rate"],
            "sales_cycle_days": SALES_DATA["sales_cycle_days"],
        },
        "pipeline_value": SALES_DATA["pipeline_value"],
        "top_products": SALES_DATA["top_products"],
    }


@router.get("/analytics/hr")
async def get_hr_analytics():
    """HR and workforce analytics."""
    return {
        "summary": {
            "total_headcount": HR_DATA["total_headcount"],
            "open_positions": HR_DATA["open_positions"],
            "attrition_rate": HR_DATA["attrition_rate"],
            "avg_tenure_years": HR_DATA["avg_tenure_years"],
            "engagement_score": HR_DATA["engagement_score"],
            "training_completion_rate": HR_DATA["training_completion_rate"],
        },
        "departments": HR_DATA["departments"],
    }


@router.get("/analytics/overview")
async def get_full_overview():
    """
    Full overview — all data combined.
    Used by the main dashboard on initial load.
    """
    return {
        "kpis": KPI_SUMMARY,
        "financial": {
            "total_revenue": FINANCIAL_DATA["total_revenue"],
            "revenue_growth": FINANCIAL_DATA["revenue_growth"],
            "gross_margin": FINANCIAL_DATA["gross_margin"],
            "quarterly": FINANCIAL_DATA["quarterly"],
        },
        "supply_chain": {
            "on_time_delivery_rate": SUPPLY_CHAIN_DATA["on_time_delivery_rate"],
            "risk_alerts_count": len(SUPPLY_CHAIN_DATA["risk_alerts"]),
        },
        "sales": {
            "total_sales": SALES_DATA["total_sales"],
            "pipeline_value": SALES_DATA["pipeline_value"],
            "win_rate": SALES_DATA["win_rate"],
        },
        "hr": {
            "total_headcount": HR_DATA["total_headcount"],
            "attrition_rate": HR_DATA["attrition_rate"],
            "open_positions": HR_DATA["open_positions"],
        },
        "decisions": {
            "total": len(DECISIONS_LOG),
            "pending": len([d for d in DECISIONS_LOG if d["status"] == "PENDING"]),
        },
        "predictions": {
            "total": len(PREDICTIONS_DATA),
            "high_risk": len([p for p in PREDICTIONS_DATA if p["risk_level"] == "HIGH"]),
        },
        "refreshed_at": datetime.utcnow().isoformat() + "Z",
    }
