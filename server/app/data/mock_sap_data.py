"""
Mock SAP-like enterprise data for demo purposes.
Replace these with real SAP API calls (OData / HANA) in production.

BASED ON REAL SCENARIO:
- PROBLEM 1: Sales turnover 18.4% → pipeline dropped to $38.4M → revenue 8.2% below plan
- PROBLEM 2: 2 HIGH-risk suppliers (56% dependency) → supply chain efficiency 84.7% down
- PROBLEM 3: Engineering turnover 14.8% → 387 open positions → SAP BTP can't scale (47.8% growth)
"""

from datetime import datetime, timedelta
import random

# ─────────────────────────────────────────────
# FINANCIAL DATA
# ─────────────────────────────────────────────
FINANCIAL_DATA = {
    "total_revenue": 45_200_000,  # Down from $48.75M due to sales pipeline pressure
    "revenue_growth": 3.2,  # Slowed significantly (was 12.4%)
    "gross_margin": 64.1,  # Down from 67.3% due to supply chain inefficiencies
    "operating_profit": 7_300_000,  # Down due to both revenue pressure and supply costs
    "ebitda": 9_100_000,
    "cash_flow": 5_200_000,  # Reduced cash generation
    "accounts_receivable": 5_800_000,
    "accounts_payable": 4_100_000,  # Increased — paying suppliers slower due to cash pressure
    "quarterly": [
        {"quarter": "Q1 2025 (Proj)", "revenue": 10_100_000, "profit": 1_820_000, "margin": 18.0, "vs_target": -8.2},  # 8.2% BELOW Q1 2025 plan ($55M / 4 = $13.75M)
        {"quarter": "Q1 2024", "revenue": 11_800_000, "profit": 2_360_000, "margin": 20.0},
        {"quarter": "Q2 2024", "revenue": 12_100_000, "profit": 2_420_000, "margin": 20.0},
        {"quarter": "Q3 2024", "revenue": 11_200_000, "profit": 2_016_000, "margin": 18.0},  # Visible DECLINE — impact of sales turnover
        {"quarter": "Q4 2024", "revenue": 10_000_000, "profit": 1_800_000, "margin": 18.0},  # Continued pressure
    ],
    "region_breakdown": {
        "EMEA": {"revenue": 18_100_000, "growth": 2.1},  # Slowed
        "APAC": {"revenue": 13_500_000, "growth": -5.2},  # NEGATIVE — sales team demoralized
        "Americas": {"revenue": 13_600_000, "growth": 3.0},  # Slowed
    },
}

# ─────────────────────────────────────────────
# SUPPLY CHAIN DATA — 2 HIGH-risk suppliers at 56% dependency
# ─────────────────────────────────────────────
SUPPLY_CHAIN_DATA = {
    "inventory_turnover": 3.9,  # Down from 6.8 — stuck inventory due to supplier issues
    "days_inventory_outstanding": 93,  # Up from 53 — more capital tied up
    "supplier_performance": 78.1,  # Down from 91.2 — declining reliability
    "on_time_delivery_rate": 71.2,  # MAJOR DROP from 94.7% — supply chain DETERIORATING
    "stockout_incidents": 47,  # Up from 12 — critical shortages
    "purchase_orders_open": 1_204,  # Up from 847 — more chaos in ordering
    "purchase_orders_overdue": 127,  # Up from 34 — significant delays
    "supply_chain_efficiency": 15.3,  # DOWN 84.7% from baseline 100% (was working fine)
    "top_suppliers": [
        {"name": "Acme Materials GmbH", "spend": 3_200_000, "reliability": 92.1, "risk": "LOW"},
        {"name": "TechComp Asia", "spend": 8_900_000, "reliability": 62.4, "risk": "HIGH", "dependency": 28, "issue": "Geopolitical tariffs + 12-day delays"},
        {"name": "GlobalParts Ltd", "spend": 7_800_000, "reliability": 71.3, "risk": "HIGH", "dependency": 28, "issue": "Quality issues + shipping delays ramping"},
        {"name": "FastShip Logistics", "spend": 2_100_000, "reliability": 88.0, "risk": "MEDIUM"},
        {"name": "EuroChem Solutions", "spend": 1_900_000, "reliability": 85.3, "risk": "LOW"},
    ],
    "risk_alerts": [
        {"supplier": "TechComp Asia", "issue": "Geopolitical tariff increase + 12-day avg delays (was 2 days)", "impact": "HIGH", "dependency_pct": 28},
        {"supplier": "GlobalParts Ltd", "issue": "Recent quality failures + Q4 capacity shortage expected", "impact": "HIGH", "dependency_pct": 28},
        {"supplier": "FastShip Logistics", "issue": "Capacity strain — increased shipping costs (+15%)", "impact": "MEDIUM"},
    ],
}

# ─────────────────────────────────────────────
# SALES & CRM DATA — Sales turnover 18.4% → pipeline dropping
# ─────────────────────────────────────────────
SALES_DATA = {
    "total_sales": 3_120,  # Down from 3,847 — fewer deals closing
    "new_customers": 201,  # Down from 284 — less new business
    "churned_customers": 63,  # Up from 47 — customer retention declining
    "net_revenue_retention": 104.2,  # Down from 118.4%
    "avg_deal_size": 11_200,  # Down from $12,680 — smaller deals
    "sales_cycle_days": 48,  # Up from 34 days — longer sales cycles = team demoralization
    "pipeline_value": 38_400_000,  # DOWN from $67M — CRITICAL (target was $55M)
    "pipeline_vs_target": -30.2,  # -30.2% BELOW target
    "win_rate": 22.1,  # Down from 31.4% — team losing motivation
    "turnover_rate_sales": 18.4,  # THE ROOT PROBLEM — high sales attrition
    "top_products": [
        {"name": "SAP S/4HANA Cloud", "revenue": 14_100_000, "units": 310, "growth": 2.1},  # Slowed
        {"name": "SAP Analytics Cloud", "revenue": 9_200_000, "units": 620, "growth": -3.1},  # DOWN due to sales churn
        {"name": "SAP SuccessFactors", "revenue": 7_900_000, "units": 270, "growth": -5.2},  # DOWN
        {"name": "SAP Ariba", "revenue": 4_100_000, "units": 150, "growth": -8.3},  # NEGATIVE growth
        {"name": "SAP BTP", "revenue": 3_100_000, "units": 2_150, "growth": 47.8},  # Fast growing but team can't keep up
    ],
}

# ─────────────────────────────────────────────
# HR DATA — Sales 18.4%, Engineering 14.8% turnover → 387 open positions
# ─────────────────────────────────────────────
HR_DATA = {
    "total_headcount": 4_620,  # Down from 4,820 — net losses from attrition
    "open_positions": 387,  # CRITICAL — many positions unfilled (was 203)
    "attrition_rate": 13.2,  # Up from 11.2% — company-wide increase
    "avg_tenure_years": 4.9,  # Down from 5.4 — losing institutional knowledge
    "engagement_score": 68.2,  # Down from 74.0% — morale declining
    "training_completion_rate": 71.4,  # Down from 86.3% — people disengaged
    "departments": {
        "Engineering": {
            "headcount": 1_090,  # Down from 1,240
            "attrition": 14.8,  # THE PROBLEM — losing critical talent
            "open_positions": 150,
            "issue": "SAP BTP growth (47.8%) outpacing hiring — 387 open positions company-wide"
        },
        "Sales": {
            "headcount": 671,  # Down from 820
            "attrition": 18.4,  # ROOT CAUSE of pipeline drop
            "open_positions": 149,
            "issue": "Lost 149 reps — morale low from missed comp, long sales cycles"
        },
        "Operations": {
            "headcount": 650,  # Down from 670
            "attrition": 8.1,  # Normal
            "open_positions": 20,
        },
        "Finance": {
            "headcount": 335,  # Down from 340
            "attrition": 6.0,  # Stable
            "open_positions": 5,
        },
        "HR": {
            "headcount": 195,  # Down from 210
            "attrition": 11.4,  # Elevated
            "open_positions": 15,
        },
        "Marketing": {
            "headcount": 340,  # Down from 380
            "attrition": 16.8,  # Sales momentum down → marketing also struggling
            "open_positions": 40,
        },
        "Product": {
            "headcount": 421,  # Down from 460
            "attrition": 12.1,
            "open_positions": 39,
        },
        "Support": {
            "headcount": 618,  # Down from 700
            "attrition": 13.9,
            "open_positions": 82,
        },
    },
}

# ─────────────────────────────────────────────
# KPI SUMMARY (for Dashboard)
# ─────────────────────────────────────────────
KPI_SUMMARY = {
    "total_revenue": {"value": 45_200_000, "change": -7.3, "unit": "$", "trend": "DOWN", "alert": "8.2% below Q1 2025 plan"},
    "sales_count": {"value": 3_120, "change": -18.9, "unit": "", "trend": "DOWN"},
    "customer_satisfaction": {"value": 4.1, "change": -10.9, "unit": "/5", "trend": "DOWN"},
    "pipeline_health": {"value": 38_400_000, "change": -42.7, "unit": "$", "trend": "CRITICAL", "alert": "-30.2% vs $55M target"},
    "supply_chain_efficiency": {"value": 15.3, "change": -84.7, "unit": "%", "trend": "CRITICAL", "alert": "2 HIGH-risk suppliers at 56% dependency"},
    "attrition_rate": {"value": 13.2, "change": 18.0, "unit": "%", "trend": "UP", "alert": "Sales 18.4%, Engineering 14.8%"},
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
# PREDICTIONS DATA — forecasts based on interconnected problems
# ─────────────────────────────────────────────
PREDICTIONS_DATA = [
    {
        "id": "PRED-001",
        "title": "Q1 2025 Revenue Forecast — REVISED DOWN",
        "predicted_value": 9_800_000,  # Down from $15.8M forecast (now 8.2% BELOW target $13.75M)
        "confidence": 84.3,
        "model": "Revenue Time-Series (SARIMA + LLM)",
        "factors": [
            "Sales pipeline dropped to $38.4M (vs $55M target)",
            "Sales team turnover 18.4% reducing pipeline conversion",
            "Sales cycle lengthening (48 days, up from 34)"
        ],
        "risk_level": "HIGH",
        "root_cause": "Sales attrition (PROBLEM 1)",
        "generated_at": "2024-11-21T00:00:00Z",
    },
    {
        "id": "PRED-002",
        "title": "Supply Chain Disruption Risk — CRITICAL (60 Days)",
        "predicted_value": 67.8,  # Elevated from 34%
        "confidence": 89.1,
        "model": "Risk Scoring (XGBoost + NLP)",
        "factors": [
            "2 HIGH-risk suppliers at 56% combined dependency",
            "On-time delivery rate collapsed to 71.2% (was 94.7%)",
            "Supply chain efficiency at 15.3% (down 84.7%)",
            "47 stockout incidents in November alone"
        ],
        "risk_level": "CRITICAL",
        "root_cause": "TechComp Asia tariffs + GlobalParts capacity (PROBLEM 2)",
        "generated_at": "2024-11-21T00:00:00Z",
    },
    {
        "id": "PRED-003",
        "title": "Revenue Loss from Supply Chain Delays — Q1 2025",
        "predicted_value": 2_100_000,  # $2.1M revenue at risk
        "confidence": 81.2,
        "model": "Impact Modeling",
        "factors": [
            "Stockouts force customer orders to competitors",
            "Delivery delays damage SAP BTP momentum (47.8% growth opportunity)",
            "Margin compression from expedited shipping costs"
        ],
        "risk_level": "HIGH",
        "generated_at": "2024-11-21T00:00:00Z",
    },
    {
        "id": "PRED-004",
        "title": "SAP BTP Growth Stalled Due to Engineering Capacity",
        "predicted_value": 2_150,  # Units, not growing as expected
        "confidence": 86.7,
        "model": "Demand vs Capacity Forecasting",
        "factors": [
            "Engineering turnover 14.8% = 150 open positions unfilled",
            "387 total open positions company-wide preventing scaling",
            "BTP growing 47.8% but team can't deliver implementations fast enough"
        ],
        "risk_level": "MEDIUM",
        "root_cause": "Engineering attrition (PROBLEM 3)",
        "generated_at": "2024-11-21T00:00:00Z",
    },
    {
        "id": "PRED-005",
        "title": "Gross Margin Pressure — Q1 2025",
        "predicted_value": 61.2,  # Down from 64.1%
        "confidence": 79.5,
        "model": "Cost Structure Analysis",
        "factors": [
            "Expedited shipping from supply delays: +$800K",
            "Higher freight costs from single supplier dependency",
            "Pricing pressure from sales team concessions"
        ],
        "risk_level": "MEDIUM",
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
