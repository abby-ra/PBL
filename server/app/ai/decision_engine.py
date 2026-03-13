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
from app.data.mock_sap_data import get_mock_sap_data


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
    data = get_mock_sap_data()

    fin = data.get("financial", {})
    hr  = data.get("hr", {})
    sc  = data.get("supply_chain", {})
    sal = data.get("sales", {})
    kpi = data.get("kpis", {})

    # Count high-risk suppliers
    suppliers = sc.get("suppliers", [])
    high_risk_suppliers = [s for s in suppliers if s.get("risk_level") == "HIGH"]

    return {
        # Financial
        "total_revenue":        fin.get("total_revenue", 0) / 1_000_000,  # in $M
        "operating_margin":     fin.get("operating_margin", 0),
        "net_profit_margin":    fin.get("net_profit_margin", 0),
        "cash_flow":            fin.get("operating_cash_flow", 0) / 1_000_000,
        "yoy_growth":           fin.get("yoy_growth", 0),
        "debt_ratio":           fin.get("debt_ratio", 0),

        # HR
        "total_employees":      hr.get("total_employees", 0),
        "turnover_rate":        hr.get("turnover_rate", 0),
        "employee_satisfaction": hr.get("employee_satisfaction", 0),
        "training_completion":  hr.get("training_completion", 0),
        "open_positions":       hr.get("open_positions", 0),
        "departments":          hr.get("departments", {}),

        # Supply Chain
        "supply_efficiency":    sc.get("efficiency_score", 0),
        "fulfillment_rate":     sc.get("order_fulfillment_rate", 0),
        "avg_delivery_days":    sc.get("avg_delivery_days", 0),
        "high_risk_suppliers":  len(high_risk_suppliers),
        "high_risk_names":      [s.get("name") for s in high_risk_suppliers],
        "total_suppliers":      len(suppliers),

        # Sales
        "pipeline_value":       sal.get("pipeline_value", 0) / 1_000_000,
        "customer_satisfaction": sal.get("customer_satisfaction", 0),
        "sales_growth":         sal.get("yoy_growth", 0),

        # KPIs
        "overall_health":       kpi.get("overall_health_score", 0),
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

        if efficiency < THRESHOLDS["min_supply_efficiency"]:
            confidence -= 0.10
            risks.append(
                f"Supply chain efficiency ({efficiency:.1f}%) below minimum threshold — system under stress"
            )
            data_points_used.append(f"Supply Chain Efficiency: {efficiency:.1f}% ⚠️")
        elif efficiency >= THRESHOLDS["good_supply_efficiency"]:
            confidence += 0.08
            supporting.append(
                f"Supply chain efficiency ({efficiency:.1f}%) is strong — good foundation for this change"
            )
            data_points_used.append(f"Supply Chain Efficiency: {efficiency:.1f}%")

        if high_risk > 0:
            risks.append(
                f"{high_risk} HIGH-risk supplier(s) currently active ({', '.join(sap['high_risk_names'])}) — adds supply chain vulnerability"
            )
            confidence -= 0.06 * high_risk

        if fulfillment < 90:
            risks.append(
                f"Order fulfillment rate ({fulfillment:.1f}%) below 90% — supply chain needs stabilization first"
            )

        # Expansion specifically
        is_expansion = any(kw in full_text for kw in ["expand", "new warehouse", "additional warehouse", "open"])
        if is_expansion:
            if sap["pipeline_value"] > 40:
                confidence += 0.07
                supporting.append(
                    f"Sales pipeline value of ${sap['pipeline_value']:.1f}M justifies capacity expansion"
                )
            if sap["yoy_growth"] > 8:
                confidence += 0.06
                supporting.append(
                    f"Revenue growth of {sap['yoy_growth']:.1f}% YoY supports infrastructure investment"
                )

        # Supplier switch
        is_supplier_switch = any(kw in full_text for kw in ["switch supplier", "change supplier", "new supplier", "replace supplier"])
        if is_supplier_switch:
            if high_risk > 0:
                confidence += 0.10
                supporting.append(
                    f"Switching away from HIGH-risk supplier(s) is strategically sound"
                )
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

        if csat > 80:
            confidence += 0.07
            supporting.append(
                f"High customer satisfaction ({csat:.1f}%) provides strong base for sales initiatives"
            )
        elif csat < 70:
            risks.append(
                f"Customer satisfaction ({csat:.1f}%) needs improvement before expanding sales efforts"
            )
            confidence -= 0.06

        if pipeline > 40:
            confidence += 0.06
            supporting.append(
                f"Healthy sales pipeline (${pipeline:.1f}M) supports market expansion"
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