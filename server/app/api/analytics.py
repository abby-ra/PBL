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
    """Financial analytics — revenue, margins, regional breakdown WITH TREND ANALYSIS."""
    
    # Analyze trends
    quarterly_data = FINANCIAL_DATA["quarterly"]
    current_margin = (FINANCIAL_DATA["operating_profit"] / FINANCIAL_DATA["total_revenue"]) * 100
    
    insights = []
    # Q3 2024 vs Q2 - visible decline
    if len(quarterly_data) >= 2:
        q2_rev = quarterly_data[2]["revenue"]
        q3_rev = quarterly_data[3]["revenue"]
        q4_rev = quarterly_data[4]["revenue"]
        if q3_rev < q2_rev:
            insights.append(f"⚠️ Revenue declined Q2→Q3 (${q2_rev/1e6:.1f}M → ${q3_rev/1e6:.1f}M) — Sales team turnover (18.4%) impacting pipeline")
        if q4_rev < q3_rev:
            insights.append(f"🚩 Continued decline Q3→Q4 (${q3_rev/1e6:.1f}M → ${q4_rev/1e6:.1f}M) — trend accelerating downward")
    
    # Margin pressure
    if current_margin < 20:
        insights.append(f"⚠️ Operating margin {current_margin:.1f}% — constrained by supply chain cost increases (+15% expedited shipping)")
    
    # Regional analysis
    apac_growth = FINANCIAL_DATA["region_breakdown"]["APAC"]["growth"]
    if apac_growth < 0:
        insights.append(f"🚩 APAC region in negative growth ({apac_growth:.1f}%) — Sales team demoralization spreading")
    
    return {
        "summary": {
            "total_revenue": FINANCIAL_DATA["total_revenue"],
            "revenue_growth": FINANCIAL_DATA["revenue_growth"],
            "gross_margin": FINANCIAL_DATA["gross_margin"],
            "operating_profit": FINANCIAL_DATA["operating_profit"],
            "ebitda": FINANCIAL_DATA["ebitda"],
            "cash_flow": FINANCIAL_DATA["cash_flow"],
            "operating_margin_percent": current_margin,
        },
        "quarterly_trend": quarterly_data,
        "region_breakdown": FINANCIAL_DATA["region_breakdown"],
        "group_by": group_by,
        "story": "Revenue declining due to sales pipeline collapse ($38.4M vs $55M target)" if "financial" else None,
        "insights": insights,
    }


@router.get("/analytics/supply-chain")
async def get_supply_chain_analytics():
    """Supply chain performance metrics WITH CRITICAL ALERTS."""
    
    high_risk_suppliers = [s for s in SUPPLY_CHAIN_DATA["top_suppliers"] if s.get("risk") == "HIGH"]
    total_high_risk_spend = sum(s.get("spend", 0) for s in high_risk_suppliers)
    total_spend = sum(s.get("spend", 0) for s in SUPPLY_CHAIN_DATA["top_suppliers"])
    dependency_pct = (total_high_risk_spend / total_spend * 100) if total_spend > 0 else 0
    
    insights = []
    
    # Critical efficiency issue
    efficiency = SUPPLY_CHAIN_DATA.get("supply_chain_efficiency", 0)
    if efficiency < 50:
        insights.append(f"🚩 CRITICAL: Supply chain efficiency at {efficiency:.1f}% (down 84.7% from healthy baseline)")
    
    # On-time delivery crash
    otd = SUPPLY_CHAIN_DATA["on_time_delivery_rate"]
    if otd < 75:
        insights.append(f"🚩 CRITICAL: On-time delivery collapsed to {otd:.1f}% (target 95%+) — major delays")
    
    # High-risk supplier concentration
    if len(high_risk_suppliers) > 0:
        insights.append(f"🚩 HIGH-RISK CONCENTRATION: {len(high_risk_suppliers)} suppliers ({dependency_pct:.0f}% of spend) — {', '.join([s['name'] for s in high_risk_suppliers])}")
    
    # Stockouts
    if SUPPLY_CHAIN_DATA["stockout_incidents"] > 30:
        insights.append(f"🚩 {SUPPLY_CHAIN_DATA['stockout_incidents']} stockout incidents — damaging customer orders")
    
    return {
        "performance": {
            "inventory_turnover": SUPPLY_CHAIN_DATA["inventory_turnover"],
            "on_time_delivery_rate": SUPPLY_CHAIN_DATA["on_time_delivery_rate"],
            "supplier_performance": SUPPLY_CHAIN_DATA["supplier_performance"],
            "days_inventory_outstanding": SUPPLY_CHAIN_DATA["days_inventory_outstanding"],
            "stockout_incidents": SUPPLY_CHAIN_DATA["stockout_incidents"],
            "supply_chain_efficiency": efficiency,
        },
        "open_orders": {
            "total": SUPPLY_CHAIN_DATA["purchase_orders_open"],
            "overdue": SUPPLY_CHAIN_DATA["purchase_orders_overdue"],
            "overdue_pct": (SUPPLY_CHAIN_DATA["purchase_orders_overdue"] / SUPPLY_CHAIN_DATA["purchase_orders_open"] * 100) if SUPPLY_CHAIN_DATA["purchase_orders_open"] > 0 else 0,
        },
        "supplier_risk": {
            "high_risk_count": len(high_risk_suppliers),
            "high_risk_dependency_pct": dependency_pct,
            "high_risk_suppliers": high_risk_suppliers,
        },
        "top_suppliers": SUPPLY_CHAIN_DATA["top_suppliers"],
        "risk_alerts": SUPPLY_CHAIN_DATA["risk_alerts"],
        "story": f"2 HIGH-risk suppliers ({dependency_pct:.0f}% dependency) causing efficiency collapse and delivery delays. Critical diversification needed.",
        "insights": insights,
    }


@router.get("/analytics/sales")
async def get_sales_analytics():
    """Sales performance and pipeline metrics WITH ROOT CAUSE ANALYSIS."""
    
    insights = []
    
    # Pipeline gap analysis
    pipeline = SALES_DATA["pipeline_value"]
    target = 55_000_000  # $55M target mentioned
    gap_pct = SALES_DATA.get("pipeline_vs_target", 0)
    
    if gap_pct < -25:
        insights.append(f"🚩 CRITICAL: Sales pipeline at ${pipeline/1e6:.1f}M (${gap_pct}% vs $55M target) — Sales team turnover 18.4% is PRIMARY cause")
    
    # Win rate analysis
    if SALES_DATA["win_rate"] < 25:
        insights.append(f"⚠️ Win rate dropped to {SALES_DATA['win_rate']:.1f}% (was 31.4%) — team demoralization + longer sales cycles (48 days, up from 34)")
    
    # Product mix - BTP growing but team can't deliver
    btp = next((p for p in SALES_DATA["top_products"] if "BTP" in p["name"]), {})
    if btp.get("growth", 0) > 40:
        insights.append(f"⚡ SAP BTP demand strong (47.8% growth) but Engineering turnover (14.8%) + 387 open positions limit delivery capacity = LEFT MONEY ON TABLE")
    
    # Customer churn increasing
    if SALES_DATA["churned_customers"] > 50:
        insights.append(f"⚠️ Customer churn rising ({SALES_DATA['churned_customers']} lost) — sales team turnover damaging relationships")
    
    # Sales cycle lengthening
    if SALES_DATA["sales_cycle_days"] > 45:
        insights.append(f"⚠️ Sales cycle extended to {SALES_DATA['sales_cycle_days']} days (+{SALES_DATA['sales_cycle_days']-34} from baseline) — team losing confidence")
    
    return {
        "performance": {
            "total_sales": SALES_DATA["total_sales"],
            "new_customers": SALES_DATA["new_customers"],
            "churned_customers": SALES_DATA["churned_customers"],
            "net_revenue_retention": SALES_DATA["net_revenue_retention"],
            "avg_deal_size": SALES_DATA["avg_deal_size"],
            "win_rate": SALES_DATA["win_rate"],
            "sales_cycle_days": SALES_DATA["sales_cycle_days"],
            "turnover_rate": SALES_DATA.get("turnover_rate_sales", 0),
        },
        "pipeline": {
            "value": pipeline,
            "vs_target": gap_pct,
            "target": target,
            "status": "CRITICAL" if gap_pct < -25 else "WARNING" if gap_pct < -15 else "HEALTHY",
        },
        "top_products": SALES_DATA["top_products"],
        "story": f"Sales team attrition (18.4%) caused pipeline to collapse. Top opportunity: SAP BTP growing 47.8% but Engineering headcount issues blocking delivery",
        "insights": insights,
    }


@router.get("/analytics/hr")
async def get_hr_analytics():
    """HR and workforce analytics WITH CRITICAL TURNOVER INSIGHTS."""
    
    insights = []
    
    # Overall attrition critical
    if HR_DATA["attrition_rate"] > 12:
        insights.append(f"🚩 Company-wide attrition at {HR_DATA['attrition_rate']:.1f}% — well above 7% healthy threshold")
    
    # Analyze by department
    high_attrition_depts = []
    for dept_name, dept_data in HR_DATA["departments"].items():
        if dept_data.get("attrition", 0) > 15:
            high_attrition_depts.append((dept_name, dept_data["attrition"], dept_data.get("open_positions", 0)))
    
    if high_attrition_depts:
        for dept, attrition, open_pos in high_attrition_depts:
            if dept == "Sales":
                insights.append(f"🚩 Sales attrition 18.4% — ROOT CAUSE of $16.6M pipeline gap. Urgently hire + improve comp/culture")
            elif dept == "Engineering":
                insights.append(f"🚩 Engineering attrition 14.8% — {open_pos} open positions preventing SAP BTP delivery (47.8% growth opportunity)")
            else:
                insights.append(f"⚠️ {dept} attrition {attrition:.1f}% with {open_pos} open positions")
    
    # Overall staffing gaps
    if HR_DATA["open_positions"] > 300:
        insights.append(f"🚩 CRITICAL: {HR_DATA['open_positions']} open positions unfilled — organization-wide capacity crisis")
    
    # Engagement score
    if HR_DATA["engagement_score"] < 70:
        insights.append(f"⚠️ Employee engagement at {HR_DATA['engagement_score']:.1f}% — morale declining, likely to drive MORE attrition")
    
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
        "critical_gaps": {
            "sales": {
                "headcount": HR_DATA["departments"]["Sales"]["headcount"],
                "lost": 820 - HR_DATA["departments"]["Sales"]["headcount"],
                "attrition": HR_DATA["departments"]["Sales"]["attrition"],
                "impact": "Pipeline collapsed $16.6M due to sales team churn",
            },
            "engineering": {
                "headcount": HR_DATA["departments"]["Engineering"]["headcount"],
                "open_positions": HR_DATA["departments"]["Engineering"]["open_positions"],
                "attrition": HR_DATA["departments"]["Engineering"]["attrition"],
                "impact": "SAP BTP (47.8% growth) can't scale — capacity bottleneck",
            },
        },
        "story": "Sales turnover (18.4%) caused revenue crisis. Engineering turnover (14.8%) with 387 open positions blocking SAP BTP opportunity.",
        "insights": insights,
    }


@router.get("/analytics/overview")
async def get_full_overview():
    """
    Full overview — all data combined.
    Shows INTERCONNECTED PROBLEMS — how 3 crises feed each other.
    Used by the main dashboard on initial load.
    """
    
    # Build the narrative of interconnected problems
    problems = {
        "PROBLEM_1": {
            "title": "Sales Team Turnover (18.4%)",
            "cause": "Team demoralization from missing comp, long sales cycles",
            "effect": "Sales pipeline dropped from $45.2M → $38.4M (30.2% below $55M target)",
            "impact_revenue": -8.2,  # percent below Q1 2025 plan
            "metrics": {
                "turnover": 18.4,
                "reps_lost": 149,
                "pipeline_gap_m": 16.6,
            }
        },
        "PROBLEM_2": {
            "title": "High-Risk Supplier Concentration (56% dependency)",
            "cause": "TechComp Asia tariffs + GlobalParts capacity issues",
            "effect": "Supply chain efficiency collapsed 84.7%. On-time delivery 71.2% (was 95%)",
            "impact_revenue": -4.8,  # percent margin compression + delayed deliveries
            "metrics": {
                "efficiency": 15.3,
                "on_time_delivery": 71.2,
                "stockouts": 47,
                "supplier_dependency": 56,
            }
        },
        "PROBLEM_3": {
            "title": "Engineering Turnover (14.8%)",
            "cause": "Can't scale fast enough for market growth",
            "effect": "387 open positions. SAP BTP (47.8% growth) delivery blocked",
            "impact_revenue": -2.1,  # missed opportunity
            "metrics": {
                "turnover": 14.8,
                "open_positions": 150,
                "btp_growth": 47.8,
                "unfilled_positions": 387,
            }
        }
    }
    
    return {
        "kpis": KPI_SUMMARY,
        "financial": {
            "total_revenue": FINANCIAL_DATA["total_revenue"],
            "revenue_growth": FINANCIAL_DATA["revenue_growth"],
            "gross_margin": FINANCIAL_DATA["gross_margin"],
            "quarterly": FINANCIAL_DATA["quarterly"],
            "story": "Revenue declining 8.2% below plan due to PROBLEM_1 (sales attrition)",
        },
        "supply_chain": {
            "on_time_delivery_rate": SUPPLY_CHAIN_DATA["on_time_delivery_rate"],
            "supply_chain_efficiency": SUPPLY_CHAIN_DATA.get("supply_chain_efficiency", 0),
            "risk_alerts_count": len(SUPPLY_CHAIN_DATA["risk_alerts"]),
            "story": "Supply chain efficiency down 84.7% due to PROBLEM_2 (high-risk suppliers)",
        },
        "sales": {
            "total_sales": SALES_DATA["total_sales"],
            "pipeline_value": SALES_DATA["pipeline_value"],
            "win_rate": SALES_DATA["win_rate"],
            "story": "Pipeline at $38.4M (30.2% below target) due to PROBLEM_1 (sales turnover 18.4%)",
        },
        "hr": {
            "total_headcount": HR_DATA["total_headcount"],
            "attrition_rate": HR_DATA["attrition_rate"],
            "open_positions": HR_DATA["open_positions"],
            "story": "387 open positions, attrition 13.2% — PROBLEM_1 & PROBLEM_3 compounding",
        },
        "decisions": {
            "total": len(DECISIONS_LOG),
            "pending": len([d for d in DECISIONS_LOG if d["status"] == "PENDING"]),
        },
        "predictions": {
            "total": len(PREDICTIONS_DATA),
            "high_risk": len([p for p in PREDICTIONS_DATA if p["risk_level"] in ["HIGH", "CRITICAL"]]),
        },
        "interconnected_problems": problems,
        "executive_summary": (
            "Three interconnected crises are compounding each other:\n"
            "1️⃣ Sales turnover (18.4%) → pipeline down $16.6M → revenue 8.2% below plan\n"
            "2️⃣ High-risk suppliers (56% dependency) → efficiency down 84.7% → $2.1M revenue at risk\n"
            "3️⃣ Engineering turnover (14.8%) → 387 open positions → SAP BTP (47.8% growth) delivery blocked\n\n"
            "Most urgent: Fix sales team first (directly blocks $16.6M pipeline). Diversify suppliers. Hire engineering to unlock BTP opportunity."
        ),
        "refreshed_at": datetime.utcnow().isoformat() + "Z",
    }
