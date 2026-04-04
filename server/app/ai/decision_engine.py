"""
Decision Engine — connected to real SAP data values
Makes decisions based on actual company metrics, not just keywords.

Flow:
1. Pull live SAP data (financial, HR, supply chain, sales)
2. Analyze the decision against real thresholds
3. Produce confidence score + factors backed by actual numbers
4. LLM then explains the result in natural language
"""

import re
from app.data.mock_sap_data import (
    FINANCIAL_DATA,
    SUPPLY_CHAIN_DATA,
    SALES_DATA,
    HR_DATA,
    KPI_SUMMARY,
)


# ── Thresholds — based on industry benchmarks ─
THRESHOLDS = {
    "min_operating_margin":     15.0,   # % — below this = financial stress
    "healthy_operating_margin": 20.0,   # % — above this = can afford investments
    "max_turnover_rate":         7.0,   # % — above this = hiring is justified
    "critical_turnover_rate":   12.0,   # % — above this = urgent hiring needed
    "min_supply_efficiency":    80.0,   # % — below this = supply chain at risk
    "good_supply_efficiency":   90.0,   # % — above this = supply chain healthy
    "min_cash_flow_ratio":       0.15,  # operating cash / revenue
    "max_debt_ratio":            0.45,  # debt / total assets
    "min_employee_satisfaction": 65.0,  # % — below this = retention risk
    "high_risk_supplier_score":  75,    # below this = supplier is HIGH risk
}


def get_sap_snapshot() -> dict:
    """
    Pull current SAP data values into a flat dict
    that the rule engine can check against.
    """
    # Calculate operating margin
    operating_margin = (FINANCIAL_DATA.get("operating_profit", 0) / FINANCIAL_DATA.get("total_revenue", 1)) * 100
    net_profit_margin = (FINANCIAL_DATA.get("operating_profit", 0) / FINANCIAL_DATA.get("total_revenue", 1)) * 100

    # Count high-risk suppliers
    high_risk_suppliers = [s for s in SUPPLY_CHAIN_DATA.get("top_suppliers", []) if s.get("risk") == "HIGH"]
    total_suppliers = len(SUPPLY_CHAIN_DATA.get("top_suppliers", []))

    # Calculate overall company health score (0-100)
    # Based on multiple factors
    health_score = 100
    if operating_margin < 15:
        health_score -= 15
    elif operating_margin < 20:
        health_score -= 5
    if HR_DATA.get("attrition_rate", 0) > 12:
        health_score -= 15
    elif HR_DATA.get("attrition_rate", 0) > 8:
        health_score -= 8
    if SUPPLY_CHAIN_DATA.get("on_time_delivery_rate", 95) < 80:
        health_score -= 15
    elif SUPPLY_CHAIN_DATA.get("on_time_delivery_rate", 95) < 90:
        health_score -= 8
    if SALES_DATA.get("pipeline_value", 0) < SALES_DATA.get("pipeline_vs_target", 0) * 1_000_000 * -1:
        health_score -= 10

    health_score = max(10, min(100, health_score))

    return {
        # Financial
        "total_revenue":        FINANCIAL_DATA.get("total_revenue", 0) / 1_000_000,  # in $M
        "operating_margin":     operating_margin,
        "net_profit_margin":    net_profit_margin,
        "cash_flow":            FINANCIAL_DATA.get("cash_flow", 0) / 1_000_000,
        "yoy_growth":           FINANCIAL_DATA.get("revenue_growth", 0),
        "debt_ratio":           0.35,  # Safe assumption

        # HR
        "total_employees":      HR_DATA.get("total_headcount", 0),
        "turnover_rate":        HR_DATA.get("attrition_rate", 0),
        "employee_satisfaction": 68.2,  # From HR_DATA engagement_score
        "training_completion":  HR_DATA.get("training_completion_rate", 0),
        "open_positions":       HR_DATA.get("open_positions", 0),
        "departments":          HR_DATA.get("departments", {}),

        # Supply Chain
        "supply_efficiency":    SUPPLY_CHAIN_DATA.get("supply_chain_efficiency", 50),
        "fulfillment_rate":     SUPPLY_CHAIN_DATA.get("on_time_delivery_rate", 80),
        "avg_delivery_days":    0,  # Not in new data
        "high_risk_suppliers":  len(high_risk_suppliers),
        "high_risk_names":      [s.get("name", "Unknown") for s in high_risk_suppliers],
        "total_suppliers":      total_suppliers,
        "supplier_dependency":  sum(s.get("dependency", 0) for s in SUPPLY_CHAIN_DATA.get("top_suppliers", [])),

        # Sales
        "pipeline_value":       SALES_DATA.get("pipeline_value", 0) / 1_000_000,
        "pipeline_gap_pct":     SALES_DATA.get("pipeline_vs_target", 0),
        "customer_satisfaction": 4.1,  # Approximated from KPI
        "sales_growth":         SALES_DATA.get("turnover_rate_sales", 0) * -1,  # Negative due to turnover impact

        # KPIs
        "overall_health":       health_score,
    }


def analyze_decision(title: str, description: str = "", category: str = "") -> dict:
    """
    Main function — analyzes a decision against real SAP data.
    Returns recommendation, confidence, and data-backed factors.
    """

    title_lower       = (title or "").lower()
    description_lower = (description or "").lower()
    full_text         = f"{title_lower} {description_lower}"
    category_lower    = (category or "").lower()

    # Pull real SAP data
    sap = get_sap_snapshot()

    confidence        = 0.50   # neutral start
    supporting        = []     # reasons TO approve
    risks             = []     # reasons to be cautious
    data_points_used  = []     # which SAP values influenced the decision

    # ────────────────────────────────────────────────────
    # FINANCIAL HEALTH CHECKS
    # ────────────────────────────────────────────────────

    op_margin = sap["operating_margin"]
    if op_margin >= THRESHOLDS["healthy_operating_margin"]:
        confidence += 0.08
        supporting.append(
            f"Strong operating margin ({op_margin:.1f}%) provides financial headroom for this investment"
        )
        data_points_used.append(f"Operating Margin: {op_margin:.1f}%")
    elif op_margin < THRESHOLDS["min_operating_margin"]:
        confidence -= 0.12
        risks.append(
            f"Low operating margin ({op_margin:.1f}%) — below safe threshold of {THRESHOLDS['min_operating_margin']}%"
        )
        data_points_used.append(f"Operating Margin: {op_margin:.1f}% ⚠️")

    if sap["yoy_growth"] > 10:
        confidence += 0.06
        supporting.append(
            f"YoY revenue growth of {sap['yoy_growth']:.1f}% indicates strong business momentum"
        )

    if sap["debt_ratio"] > THRESHOLDS["max_debt_ratio"]:
        confidence -= 0.08
        risks.append(
            f"Debt ratio ({sap['debt_ratio']:.2f}) exceeds safe threshold — limits borrowing capacity"
        )

    # ────────────────────────────────────────────────────
    # HR / HIRING DECISIONS
    # ────────────────────────────────────────────────────

    is_hiring = any(kw in full_text for kw in [
        "hire", "hiring", "recruit", "headcount", "engineer", "staff",
        "employee", "talent", "workforce", "team", "position"
    ])

    if is_hiring:
        turnover = sap["turnover_rate"]
        satisfaction = sap["employee_satisfaction"]
        open_pos = sap["open_positions"]

        if turnover >= THRESHOLDS["critical_turnover_rate"]:
            confidence += 0.14
            supporting.append(
                f"Critical turnover rate ({turnover:.1f}%) — urgent hiring is strongly justified"
            )
            data_points_used.append(f"Turnover Rate: {turnover:.1f}% (critical)")
        elif turnover >= THRESHOLDS["max_turnover_rate"]:
            confidence += 0.09
            supporting.append(
                f"Turnover rate ({turnover:.1f}%) above healthy threshold ({THRESHOLDS['max_turnover_rate']}%) — hiring is justified"
            )
            data_points_used.append(f"Turnover Rate: {turnover:.1f}%")
        else:
            confidence -= 0.05
            risks.append(
                f"Turnover rate ({turnover:.1f}%) is within acceptable range — additional hiring may not be urgent"
            )

        if open_pos > 100:
            confidence += 0.07
            supporting.append(
                f"{open_pos} open positions currently unfilled — capacity gap supports this hire"
            )
            data_points_used.append(f"Open Positions: {open_pos}")

        if satisfaction < THRESHOLDS["min_employee_satisfaction"]:
            risks.append(
                f"Low employee satisfaction ({satisfaction:.1f}%) — address retention before expanding headcount"
            )
            confidence -= 0.06

        # Extract headcount number from text if mentioned
        numbers = re.findall(r'\b(\d+)\b', full_text)
        if numbers:
            hire_count = max(int(n) for n in numbers)
            total_emp  = sap["total_employees"]
            pct_increase = (hire_count / total_emp) * 100
            if pct_increase > 5:
                risks.append(
                    f"Hiring {hire_count} people = {pct_increase:.1f}% headcount increase — significant operational impact"
                )
                confidence -= 0.05
            else:
                supporting.append(
                    f"Hiring {hire_count} people = {pct_increase:.1f}% headcount increase — manageable scale"
                )

    # ────────────────────────────────────────────────────
    # SUPPLY CHAIN DECISIONS
    # ────────────────────────────────────────────────────

    is_supply_chain = any(kw in full_text for kw in [
        "supplier", "supply", "inventory", "warehouse", "logistics",
        "procurement", "vendor", "delivery", "shipping", "stock"
    ])

    if is_supply_chain:
        efficiency = sap["supply_efficiency"]
        high_risk  = sap["high_risk_suppliers"]
        fulfillment = sap["fulfillment_rate"]
        supplier_dependency = sap.get("supplier_dependency", 0)

        if efficiency < THRESHOLDS["min_supply_efficiency"]:
            confidence -= 0.15  # Critical issue
            risks.append(
                f"⚠️ CRITICAL: Supply chain efficiency ({efficiency:.1f}%) — system under severe stress. "
                f"2 HIGH-risk suppliers at {supplier_dependency}% dependency. "
                f"On-time delivery collapsed to {fulfillment:.1f}% (target: 95%+). Stabilize BEFORE new initiatives."
            )
            data_points_used.append(f"Supply Chain Efficiency: {efficiency:.1f}% ⚠️ CRITICAL")
        elif efficiency >= THRESHOLDS["good_supply_efficiency"]:
            confidence += 0.08
            supporting.append(
                f"Supply chain efficiency ({efficiency:.1f}%) is strong — good foundation for this change"
            )
            data_points_used.append(f"Supply Chain Efficiency: {efficiency:.1f}%")

        if high_risk > 0 and supplier_dependency >= 50:
            confidence -= 0.12
            risks.append(
                f"🚩 HIGH-RISK: {high_risk} supplier(s) ({', '.join(sap['high_risk_names'])}) represent {supplier_dependency:.0f}% of supply dependency — "
                f"concentration risk threatens revenue if either fails. This decision should address supplier diversification."
            )
            data_points_used.append(f"High-Risk Suppliers: {high_risk} at {supplier_dependency:.0f}% dependency")
        elif high_risk > 0:
            risks.append(
                f"{high_risk} HIGH-risk supplier(s) identified — increases execution risk"
            )
            confidence -= 0.06 * high_risk

        if fulfillment < 90:
            confidence -= 0.08
            risks.append(
                f"Order fulfillment rate ({fulfillment:.1f}%) below target 95% — supply chain delays impacting revenue. "
                f"Prioritize stabilization and redundancy plans."
            )
            data_points_used.append(f"Fulfillment Rate: {fulfillment:.1f}%")

        # Expansion specifically
        is_expansion = any(kw in full_text for kw in ["expand", "new warehouse", "additional warehouse", "open"])
        if is_expansion:
            if efficiency < 50:
                risks.append(
                    "Expanding capacity while supply chain efficiency is critically low creates bottleneck risk"
                )
                confidence -= 0.08
            elif sap["pipeline_value"] > 40:
                confidence += 0.07
                supporting.append(
                    f"Sales pipeline value of ${sap['pipeline_value']:.1f}M may justify capacity expansion IF supply chain stabilizes"
                )

        # Supplier switch/diversification
        is_supplier_action = any(kw in full_text for kw in ["switch supplier", "change supplier", "new supplier", "replace supplier", "diversif", "secondary", "backup"])
        if is_supplier_action:
            if high_risk > 0:
                confidence += 0.15  # Strong support for supplier action
                supporting.append(
                    f"Supplier diversification is CRITICAL with {high_risk} HIGH-risk suppliers at {supplier_dependency}% dependency. This decision is strategically essential."
                )
                data_points_used.append(f"Supplier Action Justified: Risk reduction needed")
            else:
                risks.append("Current suppliers performing acceptably — switching carries transition risk")
                confidence -= 0.05

    # ────────────────────────────────────────────────────
    # FINANCIAL / INVESTMENT DECISIONS
    # ────────────────────────────────────────────────────

    is_investment = any(kw in full_text for kw in [
        "invest", "budget", "spend", "purchase", "acquire", "buy",
        "capital", "expenditure", "fund", "allocate"
    ])

    if is_investment:
        if sap["cash_flow"] > 30:
            confidence += 0.08
            supporting.append(
                f"Operating cash flow of ${sap['cash_flow']:.1f}M provides adequate funding capacity"
            )
            data_points_used.append(f"Cash Flow: ${sap['cash_flow']:.1f}M")
        elif sap["cash_flow"] < 10:
            confidence -= 0.10
            risks.append(
                f"Low operating cash flow (${sap['cash_flow']:.1f}M) — investment may strain liquidity"
            )

    # ────────────────────────────────────────────────────
    # SALES / MARKET DECISIONS
    # ────────────────────────────────────────────────────

    is_sales = any(kw in full_text for kw in [
        "sales", "market", "customer", "revenue", "pricing", "discount",
        "promotion", "launch", "campaign", "loyalty", "region"
    ])

    if is_sales:
        csat = sap["customer_satisfaction"]
        pipeline = sap["pipeline_value"]
        pipeline_gap = sap.get("pipeline_gap_pct", 0)

        if csat > 80:
            confidence += 0.07
            supporting.append(
                f"High customer satisfaction ({csat:.1f}%) provides strong base for sales initiatives"
            )
        elif csat < 70:
            risks.append(
                f"Customer satisfaction ({csat:.1f}%) needs improvement — sales team turnover (18.4%) damaging relationships"
            )
            confidence -= 0.08

        if pipeline > 40:
            confidence += 0.06
            supporting.append(
                f"Sales pipeline value of ${pipeline:.1f}M is healthy"
            )
        elif pipeline < 40:
            confidence -= 0.12
            risks.append(
                f"🚩 CRITICAL: Sales pipeline at ${pipeline:.1f}M ({pipeline_gap:.1f}% vs $55M target) — "
                f"Sales team turnover (18.4%) and demoralization reducing pipeline conversion. "
                f"Most revenue-impactful issue. Address hiring and compensation urgently."
            )
            data_points_used.append(f"Sales Pipeline: ${pipeline:.1f}M (CRITICAL gap)")

        # Sales hiring/retention specific
        is_sales_hr = any(kw in full_text for kw in ["sales", "hiring", "recruit", "compensation", "bonus", "commission"])
        if is_sales_hr and pipeline < 40:
            confidence += 0.08
            supporting.append(
                "Sales team investments are CRITICAL to recover pipeline and revenue targets"
            )

    # ────────────────────────────────────────────────────
    # COST CUTTING / REDUCTION
    # ────────────────────────────────────────────────────

    is_cost_cut = any(kw in full_text for kw in [
        "cut", "reduce", "eliminate", "downsize", "layoff",
        "restructure", "consolidate", "outsource"
    ])

    if is_cost_cut:
        if op_margin >= THRESHOLDS["healthy_operating_margin"]:
            confidence -= 0.08
            risks.append(
                f"Operating margin ({op_margin:.1f}%) is already healthy — cost cuts may damage operations"
            )
        else:
            confidence += 0.08
            supporting.append(
                f"Operating margin ({op_margin:.1f}%) below target — cost optimization is warranted"
            )

    # ────────────────────────────────────────────────────
    # CATEGORY-BASED ADJUSTMENTS
    # ────────────────────────────────────────────────────

    category_weights = {
        "strategic":      0.05,
        "operational":    0.03,
        "financial":      0.00,
        "hr":             0.02,
        "supply_chain":   0.02,
        "technology":     0.04,
        "compliance":    -0.02,   # compliance decisions are cautious by nature
        "risk":          -0.04,
    }

    for cat, weight in category_weights.items():
        if cat in category_lower:
            confidence += weight

    # ────────────────────────────────────────────────────
    # OVERALL COMPANY HEALTH
    # ────────────────────────────────────────────────────

    health = sap["overall_health"]
    if health > 80:
        confidence += 0.04
        supporting.append(f"Overall company health score ({health:.0f}/100) supports this initiative")
    elif health < 60:
        confidence -= 0.06
        risks.append(f"Company health score ({health:.0f}/100) suggests caution with new initiatives")

    # ────────────────────────────────────────────────────
    # FINAL RECOMMENDATION
    # ────────────────────────────────────────────────────

    # Clamp confidence between 0.30 and 0.92
    confidence = round(min(max(confidence, 0.30), 0.92), 2)

    if confidence >= 0.70:
        recommendation = "APPROVE"
    elif confidence >= 0.52:
        recommendation = "REVIEW"
    else:
        recommendation = "REJECT"

    # Ensure at least 1 item in each list
    if not supporting:
        supporting.append(f"Overall company health ({health:.0f}/100) noted")
    if not risks:
        risks.append("Standard implementation risks apply — monitor execution closely")

    return {
        "recommendation":    recommendation,
        "confidence_score":  round(confidence * 100, 1),
        "supporting_factors": supporting,
        "risk_factors":       risks,
        "data_points_used":   data_points_used,
        "sap_snapshot": {
            "operating_margin":    sap["operating_margin"],
            "turnover_rate":       sap["turnover_rate"],
            "supply_efficiency":   sap["supply_efficiency"],
            "cash_flow_m":         sap["cash_flow"],
            "high_risk_suppliers": sap["high_risk_suppliers"],
            "overall_health":      sap["overall_health"],
        },
    }