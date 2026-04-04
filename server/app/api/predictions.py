"""
/api/predictions — AI-powered business predictions endpoint.
Returns forecasts with confidence scores and AI-generated narratives.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime

from app.ai.llm_client import call_llm
from app.ai.prompt_templates import get_prediction_narrative_prompt
from app.data.mock_sap_data import (
    PREDICTIONS_DATA,
    FINANCIAL_DATA,
    SUPPLY_CHAIN_DATA,
    SALES_DATA,
    HR_DATA,
    KPI_SUMMARY,
)

logger = logging.getLogger(__name__)
router = APIRouter()

COMPANY_CONTEXT = {
    "kpis": KPI_SUMMARY,
    "financial_summary": {
        "total_revenue": FINANCIAL_DATA["total_revenue"],
        "revenue_growth": FINANCIAL_DATA["revenue_growth"],
        "gross_margin": FINANCIAL_DATA["gross_margin"],
    },
}


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────
class PredictionNarrativeRequest(BaseModel):
    prediction_id: str


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────
@router.get("/predictions")
async def get_predictions():
    """
    Returns all AI predictions with metadata — connected to real business problems.
    These predictions show WHAT WILL HAPPEN if current trends continue.
    """
    
    # Organize predictions by urgency
    critical_predictions = [p for p in PREDICTIONS_DATA if p.get("risk_level") == "CRITICAL"]
    high_predictions = [p for p in PREDICTIONS_DATA if p.get("risk_level") == "HIGH"]
    other_predictions = [p for p in PREDICTIONS_DATA if p.get("risk_level") not in ["CRITICAL", "HIGH"]]
    
    return {
        "predictions": PREDICTIONS_DATA,
        "by_urgency": {
            "critical": critical_predictions,
            "high": high_predictions,
            "other": other_predictions,
        },
        "summary": {
            "total": len(PREDICTIONS_DATA),
            "critical": len(critical_predictions),
            "high": len(high_predictions),
            "executive_alert": f"{len(critical_predictions + high_predictions)} urgent predictions — all tied to 3 interconnected problems",
        },
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "model_version": "2.0.0",
    }


@router.get("/predictions/{prediction_id}")
async def get_prediction(prediction_id: str):
    """Get a single prediction by ID."""
    prediction = next((p for p in PREDICTIONS_DATA if p["id"] == prediction_id), None)
    if not prediction:
        raise HTTPException(status_code=404, detail=f"Prediction {prediction_id} not found")
    return prediction


@router.post("/predictions/{prediction_id}/narrative")
async def get_prediction_narrative(prediction_id: str):
    """
    Generate an AI-written narrative explanation for a prediction.
    This is what makes predictions readable for executives — not just numbers.
    """
    prediction = next((p for p in PREDICTIONS_DATA if p["id"] == prediction_id), None)
    if not prediction:
        raise HTTPException(status_code=404, detail=f"Prediction {prediction_id} not found")

    try:
        system_prompt = get_prediction_narrative_prompt(prediction, COMPANY_CONTEXT)
        narrative = call_llm(
            system_prompt=system_prompt,
            user_message=f"Explain this prediction: {prediction['title']}",
            history=[],
        )
        return {
            "prediction_id": prediction_id,
            "title": prediction["title"],
            "narrative": narrative,
            "confidence": prediction["confidence"],
            "risk_level": prediction["risk_level"],
        }
    except Exception as e:
        logger.error(f"Narrative generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions/summary/risks")
async def get_risk_summary():
    """
    Returns a risk summary dashboard view — organized by urgency.
    Shows WHAT WILL HAPPEN if each problem continues.
    """
    critical = [p for p in PREDICTIONS_DATA if p.get("risk_level") == "CRITICAL"]
    high = [p for p in PREDICTIONS_DATA if p.get("risk_level") == "HIGH"]
    medium = [p for p in PREDICTIONS_DATA if p.get("risk_level") == "MEDIUM"]
    low = [p for p in PREDICTIONS_DATA if p.get("risk_level") == "LOW"]

    # Map causes to problem space
    problem_map = {
        "Sales": "PROBLEM_1: Sales attrition → pipeline collapse",
        "Supply": "PROBLEM_2: High-risk suppliers → delivery delays",
        "Engineering": "PROBLEM_3: Engineering attrition → capacity blocked",
        "BTP": "PROBLEM_3: Engineering attrition → SAP BTP opportunity lost",
    }

    return {
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "summary": {
            "total": len(PREDICTIONS_DATA),
            "critical_count": len(critical),
            "high_count": len(high),
            "medium_count": len(medium),
            "low_count": len(low),
            "avg_confidence": round(
                sum(p["confidence"] for p in PREDICTIONS_DATA) / len(PREDICTIONS_DATA), 1
            ),
        },
        "interconnected_narrative": (
            "🚨 ALL HIGH/CRITICAL PREDICTIONS trace to 3 interconnected problems:\n\n"
            "PROBLEM 1 (Sales turnover 18.4%) → Revenue forecast DOWN to $9.8M Q1 2025 (8.2% below plan)\n"
            "PROBLEM 2 (56% supplier dependency) → Supply disruption risk 67.8% + $2.1M revenue loss\n"
            "PROBLEM 3 (14.8% engineering attrition) → BTP growth stalled + 387 open positions\n\n"
            "Revenue at risk: $2.1M - $4.1M depending on execution"
        ),
        "top_urgency": {
            "must_address_first": "Sales team retention (Problem 1) — directly blocks $16.6M pipeline",
            "second_priority": "Supplier diversification (Problem 2) — stabilize 71% on-time delivery",
            "third_priority": "Engineering hiring (Problem 3) — unlock $3.1M+ SAP BTP growth opportunity",
        },
    }
