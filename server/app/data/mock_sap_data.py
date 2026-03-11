"""
Mock SAP-like enterprise data for demo purposes.
Replace these with real SAP API calls (OData / HANA) in production.
"""

from datetime import datetime, timedelta
import random

# ─────────────────────────────────────────────
# FINANCIAL DATA
# ─────────────────────────────────────────────
FINANCIAL_DATA = {
    "total_revenue": 48_750_000,
    "revenue_growth": 12.4,
    "gross_margin": 67.3,
    "operating_profit": 9_200_000,
    "ebitda": 11_500_000,
    "cash_flow": 7_800_000,
    "accounts_receivable": 6_200_000,
    "accounts_payable": 3_400_000,
    "quarterly": [
        {"quarter": "Q1 2024", "revenue": 10_200_000, "profit": 2_100_000, "margin": 20.6},
        {"quarter": "Q2 2024", "revenue": 11_500_000, "profit": 2_530_000, "margin": 22.0},
        {"quarter": "Q3 2024", "revenue": 12_800_000, "profit": 2_944_000, "margin": 23.0},
        {"quarter": "Q4 2024", "revenue": 14_250_000, "profit": 3_420_000, "margin": 24.0},
    ],
    "region_breakdown": {
        "EMEA": {"revenue": 19_500_000, "growth": 8.2},
        "APAC": {"revenue": 14_200_000, "growth": 18.7},
        "Americas": {"revenue": 15_050_000, "growth": 11.1},
    },
}

# ─────────────────────────────────────────────
# SUPPLY CHAIN DATA
# ─────────────────────────────────────────────
SUPPLY_CHAIN_DATA = {
    "inventory_turnover": 6.8,
    "days_inventory_outstanding": 53,
    "supplier_performance": 91.2,
    "on_time_delivery_rate": 94.7,
    "stockout_incidents": 12,
    "purchase_orders_open": 847,
    "purchase_orders_overdue": 34,
    "top_suppliers": [
        {"name": "Acme Materials GmbH", "spend": 4_200_000, "reliability": 97.1, "risk": "LOW"},
        {"name": "GlobalParts Ltd", "spend": 3_800_000, "reliability": 88.4, "risk": "MEDIUM"},
        {"name": "FastShip Logistics", "spend": 2_100_000, "reliability": 92.0, "risk": "LOW"},
        {"name": "TechComp Asia", "spend": 1_900_000, "reliability": 79.6, "risk": "HIGH"},
        {"name": "EuroChem Solutions", "spend": 1_600_000, "reliability": 95.3, "risk": "LOW"},
    ],
    "risk_alerts": [
        {"supplier": "TechComp Asia", "issue": "Geopolitical risk — APAC region tariff increase", "impact": "HIGH"},
        {"supplier": "GlobalParts Ltd", "issue": "Q3 delivery delays averaging 8 days", "impact": "MEDIUM"},
    ],
}

# ─────────────────────────────────────────────
# SALES & CRM DATA
# ─────────────────────────────────────────────
SALES_DATA = {
    "total_sales": 3_847,
    "new_customers": 284,
    "churned_customers": 47,
    "net_revenue_retention": 118.4,
    "avg_deal_size": 12_680,
    "sales_cycle_days": 34,
    "pipeline_value": 67_000_000,
    "win_rate": 31.4,
    "top_products": [
        {"name": "SAP S/4HANA Cloud", "revenue": 18_200_000, "units": 420, "growth": 22.1},
        {"name": "SAP Analytics Cloud", "revenue": 11_400_000, "units": 780, "growth": 15.3},
        {"name": "SAP SuccessFactors", "revenue": 9_800_000, "units": 340, "growth": 9.7},
        {"name": "SAP Ariba", "revenue": 6_200_000, "units": 215, "growth": 4.2},
        {"name": "SAP BTP", "revenue": 3_150_000, "units": 2092, "growth": 47.8},
    ],
}

# ─────────────────────────────────────────────
# HR DATA
# ─────────────────────────────────────────────
HR_DATA = {
    "total_headcount": 4_820,
    "open_positions": 203,
    "attrition_rate": 11.2,
    "avg_tenure_years": 5.4,
    "engagement_score": 74.0,
    "training_completion_rate": 86.3,
    "departments": {
        "Engineering": {"headcount": 1240, "attrition": 9.1},
        "Sales": {"headcount": 820, "attrition": 18.4},
        "Operations": {"headcount": 670, "attrition": 7.8},
        "Finance": {"headcount": 340, "attrition": 5.2},
        "HR": {"headcount": 210, "attrition": 6.1},
        "Marketing": {"headcount": 380, "attrition": 14.2},
        "Product": {"headcount": 460, "attrition": 10.7},
        "Support": {"headcount": 700, "attrition": 13.9},
    },
}

# ─────────────────────────────────────────────
# KPI SUMMARY (for Dashboard)
# ─────────────────────────────────────────────
KPI_SUMMARY = {
    "total_revenue": {"value": 48_750_000, "change": 12.4, "unit": "$"},
    "sales_count": {"value": 3_847, "change": 8.1, "unit": ""},
    "customer_satisfaction": {"value": 4.6, "change": 2.3, "unit": "/5"},
    "active_users": {"value": 892, "change": -1.2, "unit": ""},
    "avg_confidence": {"value": 84.5, "change": 3.1, "unit": "%"},
    "decisions_made": {"value": 127, "change": 15.0, "unit": ""},
}

# ─────────────────────────────────────────────
# RECENT DECISIONS LOG
# ─────────────────────────────────────────────
DECISIONS_LOG = [
    {
        "id": "DEC-001",
        "title": "Increase safety stock for TechComp Asia components",
        "category": "Supply Chain",
        "ai_recommendation": "APPROVE",
        "confidence": 91.2,
        "status": "APPROVED",
        "impact": "Reduces stockout risk by ~65% over next 90 days",
        "created_at": "2024-11-18T09:23:00Z",
        "decided_by": "Priya Sharma",
    },
    {
        "id": "DEC-002",
        "title": "Reallocate Q4 marketing budget — shift 30% to APAC",
        "category": "Finance",
        "ai_recommendation": "APPROVE",
        "confidence": 87.5,
        "status": "PENDING",
        "impact": "Projected +$1.4M incremental revenue in APAC based on growth trends",
        "created_at": "2024-11-19T14:10:00Z",
        "decided_by": None,
    },
    {
        "id": "DEC-003",
        "title": "Reduce headcount in Support via automation (40 FTEs)",
        "category": "HR",
        "ai_recommendation": "REVIEW",
        "confidence": 62.0,
        "status": "UNDER_REVIEW",
        "impact": "Cost saving of $2.8M annually; risk of customer satisfaction impact",
        "created_at": "2024-11-20T11:05:00Z",
        "decided_by": None,
    },
    {
        "id": "DEC-004",
        "title": "Onboard FastShip Logistics as secondary supplier for EMEA",
        "category": "Supply Chain",
        "ai_recommendation": "APPROVE",
        "confidence": 94.1,
        "status": "APPROVED",
        "impact": "Reduces single-supplier dependency, improves EMEA delivery SLA by 12%",
        "created_at": "2024-11-21T08:45:00Z",
        "decided_by": "Marco Bianchi",
    },
]

# ─────────────────────────────────────────────
# PREDICTIONS DATA
# ─────────────────────────────────────────────
PREDICTIONS_DATA = [
    {
        "id": "PRED-001",
        "title": "Q1 2025 Revenue Forecast",
        "predicted_value": 15_800_000,
        "confidence": 88.3,
        "model": "Revenue Time-Series (SARIMA + LLM)",
        "factors": ["seasonal trends", "pipeline velocity", "macro indicators"],
        "risk_level": "LOW",
        "generated_at": "2024-11-21T00:00:00Z",
    },
    {
        "id": "PRED-002",
        "title": "Supply Chain Disruption Risk — Next 60 Days",
        "predicted_value": 34.0,
        "confidence": 79.1,
        "model": "Risk Scoring (XGBoost + NLP news signals)",
        "factors": ["TechComp Asia geopolitical risk", "shipping delays", "tariff changes"],
        "risk_level": "MEDIUM",
        "generated_at": "2024-11-21T00:00:00Z",
    },
    {
        "id": "PRED-003",
        "title": "Employee Attrition Risk — Sales Dept",
        "predicted_value": 22.1,
        "confidence": 83.7,
        "model": "Attrition Predictor (Random Forest)",
        "factors": ["compensation gap vs market", "manager NPS", "tenure distribution"],
        "risk_level": "HIGH",
        "generated_at": "2024-11-21T00:00:00Z",
    },
    {
        "id": "PRED-004",
        "title": "SAP BTP Product Demand Forecast — Q1 2025",
        "predicted_value": 2890,
        "confidence": 91.5,
        "model": "Demand Forecasting (Prophet + LLM)",
        "factors": ["digital transformation spend", "competitive win rate", "SAP ecosystem growth"],
        "risk_level": "LOW",
        "generated_at": "2024-11-21T00:00:00Z",
    },
]


def get_context_for_query(query: str) -> dict:
    """
    Returns the most relevant SAP data context based on the user's query.
    In production, this would be a semantic search over your SAP data lake.
    """
    query_lower = query.lower()
    context = {}

    if any(w in query_lower for w in ["revenue", "finance", "profit", "margin", "cash", "q1", "q2", "q3", "q4", "quarter"]):
        context["financial"] = FINANCIAL_DATA

    if any(w in query_lower for w in ["supply", "supplier", "inventory", "stock", "delivery", "procurement", "purchase"]):
        context["supply_chain"] = SUPPLY_CHAIN_DATA

    if any(w in query_lower for w in ["sales", "customer", "deal", "pipeline", "product", "win rate", "churn"]):
        context["sales"] = SALES_DATA

    if any(w in query_lower for w in ["employee", "hr", "headcount", "attrition", "hiring", "talent", "workforce"]):
        context["hr"] = HR_DATA

    if any(w in query_lower for w in ["decision", "recommend", "approve", "pending"]):
        context["decisions"] = DECISIONS_LOG

    if any(w in query_lower for w in ["predict", "forecast", "risk", "future"]):
        context["predictions"] = PREDICTIONS_DATA

    # Always include KPI summary as baseline context
    context["kpi_summary"] = KPI_SUMMARY

    # If no specific match, return everything
    if len(context) <= 1:
        context = {
            "financial": FINANCIAL_DATA,
            "supply_chain": SUPPLY_CHAIN_DATA,
            "sales": SALES_DATA,
            "hr": HR_DATA,
            "kpi_summary": KPI_SUMMARY,
        }

    return context
