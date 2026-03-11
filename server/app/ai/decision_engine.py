"""
Decision Engine — core AI logic for analyzing and scoring business decisions.
This is the brain of the Enterprise Decision Support system.
"""

import json
import logging
import re
from datetime import datetime
from typing import Optional

from app.ai.llm_client import call_llm
from app.ai.prompt_templates import get_decision_analysis_prompt
from app.data.mock_sap_data import (
    FINANCIAL_DATA,
    SUPPLY_CHAIN_DATA,
    SALES_DATA,
    HR_DATA,
    KPI_SUMMARY,
    PREDICTIONS_DATA,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# DECISION CATEGORIES AND ROUTING
# ─────────────────────────────────────────────
DECISION_CATEGORIES = {
    "finance": ["budget", "revenue", "cost", "investment", "profit", "margin", "spend", "capex", "opex"],
    "supply_chain": ["supplier", "inventory", "stock", "procurement", "purchase", "delivery", "logistics", "vendor"],
    "hr": ["headcount", "hire", "layoff", "attrition", "employee", "talent", "compensation", "workforce"],
    "sales": ["customer", "deal", "pipeline", "product", "pricing", "discount", "market", "expansion"],
    "operations": ["process", "efficiency", "automation", "infrastructure", "capacity", "operations"],
}


def detect_category(title: str, description: str = "") -> str:
    """Detect the decision category from title and description."""
    text = (title + " " + description).lower()
    scores = {cat: 0 for cat in DECISION_CATEGORIES}
    for cat, keywords in DECISION_CATEGORIES.items():
        for keyword in keywords:
            if keyword in text:
                scores[cat] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "general"


def get_relevant_context(category: str) -> dict:
    """Get the most relevant SAP data for a given decision category."""
    context_map = {
        "finance": {"financial": FINANCIAL_DATA, "kpis": KPI_SUMMARY},
        "supply_chain": {"supply_chain": SUPPLY_CHAIN_DATA, "financial": {"operating_profit": FINANCIAL_DATA["operating_profit"]}},
        "hr": {"hr": HR_DATA, "financial": {"total_revenue": FINANCIAL_DATA["total_revenue"]}},
        "sales": {"sales": SALES_DATA, "financial": FINANCIAL_DATA},
        "operations": {"financial": FINANCIAL_DATA, "supply_chain": SUPPLY_CHAIN_DATA},
        "general": {"kpis": KPI_SUMMARY, "financial": FINANCIAL_DATA},
    }
    return context_map.get(category, context_map["general"])


# ─────────────────────────────────────────────
# RULE-BASED PRE-CHECKS (fast, no LLM needed)
# ─────────────────────────────────────────────
def run_rule_based_checks(title: str, category: str) -> dict:
    """
    Fast rule-based checks that run before the LLM.
    Returns flags and adjustments to the final score.
    """
    flags = []
    score_adjustment = 0
    title_lower = title.lower()

    # Finance rules
    if category == "finance":
        if any(w in title_lower for w in ["reduce", "cut", "decrease"]):
            flags.append("Cost reduction — verify impact on operations before approving")
        if any(w in title_lower for w in ["increase budget", "additional spend"]):
            if FINANCIAL_DATA["cash_flow"] < 5_000_000:
                flags.append("⚠️ Cash flow below $5M — large budget increases carry liquidity risk")
                score_adjustment -= 10

    # Supply chain rules
    if category == "supply_chain":
        high_risk_suppliers = [s["name"] for s in SUPPLY_CHAIN_DATA["top_suppliers"] if s["risk"] == "HIGH"]
        for supplier in high_risk_suppliers:
            if supplier.lower() in title_lower:
                flags.append(f"⚠️ {supplier} is flagged as HIGH RISK in procurement system")
                score_adjustment -= 15

    # HR rules
    if category == "hr":
        if any(w in title_lower for w in ["layoff", "reduction", "downsize"]):
            flags.append("Workforce reduction — consider impact on engagement score (currently 74%) and attrition risk")
            score_adjustment -= 5

    return {"flags": flags, "score_adjustment": score_adjustment}


# ─────────────────────────────────────────────
# MAIN DECISION ANALYSIS FUNCTION
# ─────────────────────────────────────────────
def analyze_decision(
    title: str,
    description: str = "",
    submitted_by: str = "Unknown",
) -> dict:
    """
    Full decision analysis pipeline:
    1. Detect category
    2. Run rule-based checks
    3. Call LLM for deep analysis
    4. Combine results
    
    Returns a structured decision result dict.
    """
    logger.info(f"Analyzing decision: '{title}'")

    # Step 1: Categorize
    category = detect_category(title, description)

    # Step 2: Rule-based checks
    rule_check = run_rule_based_checks(title, category)

    # Step 3: Get relevant SAP context
    context = get_relevant_context(category)

    # Step 4: LLM analysis
    system_prompt = get_decision_analysis_prompt(title, context)
    user_message = f"Analyze this decision: {title}"
    if description:
        user_message += f"\n\nAdditional context: {description}"

    raw_response = call_llm(
        system_prompt=system_prompt,
        user_message=user_message,
        history=[],
    )

    # Step 5: Parse LLM JSON response
    try:
        # Strip markdown code fences if present
        clean = re.sub(r"```(?:json)?|```", "", raw_response).strip()
        llm_result = json.loads(clean)
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"Failed to parse LLM JSON response: {e}. Using fallback.")
        llm_result = {
            "recommendation": "REVIEW",
            "confidence_score": 70,
            "summary": "Analysis complete. Manual review recommended before final decision.",
            "supporting_factors": ["Insufficient structured data to auto-approve"],
            "risk_factors": ["LLM response parsing issue — recommend re-running analysis"],
            "expected_impact": "Unknown — requires manual assessment",
            "time_sensitivity": "STANDARD",
            "data_sources_used": ["SAP KPI Summary"],
        }

    # Step 6: Apply rule-based score adjustment
    original_score = llm_result.get("confidence_score", 75)
    adjusted_score = max(0, min(100, original_score + rule_check["score_adjustment"]))
    llm_result["confidence_score"] = adjusted_score

    # Step 7: Add rule flags to risk factors
    if rule_check["flags"]:
        existing_risks = llm_result.get("risk_factors", [])
        llm_result["risk_factors"] = rule_check["flags"] + existing_risks

    # Step 8: Build final result
    result = {
        "id": f"DEC-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "title": title,
        "description": description,
        "category": category,
        "submitted_by": submitted_by,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "status": map_recommendation_to_status(llm_result.get("recommendation", "REVIEW")),
        **llm_result,
    }

    logger.info(f"Decision analyzed: recommendation={result['recommendation']}, confidence={result['confidence_score']}")
    return result


def map_recommendation_to_status(recommendation: str) -> str:
    mapping = {
        "APPROVE": "APPROVED",
        "REJECT": "REJECTED",
        "REVIEW": "UNDER_REVIEW",
    }
    return mapping.get(recommendation.upper(), "PENDING")


# ─────────────────────────────────────────────
# BATCH DECISION SCORING
# ─────────────────────────────────────────────
def score_pending_decisions(decisions: list) -> list:
    """
    Score a list of pending decisions.
    Used by the Decisions page to bulk-analyze open items.
    """
    scored = []
    for decision in decisions:
        if decision.get("status") in ["PENDING", "UNDER_REVIEW"]:
            try:
                result = analyze_decision(
                    title=decision["title"],
                    description=decision.get("description", ""),
                )
                scored.append({**decision, "ai_analysis": result})
            except Exception as e:
                logger.error(f"Error scoring decision {decision.get('id')}: {e}")
                scored.append(decision)
        else:
            scored.append(decision)
    return scored
