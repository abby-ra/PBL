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
    Returns all AI predictions with metadata.
    In production, these would come from your ML models (SARIMA, XGBoost, Prophet, etc.)
    """
    return {
        "predictions": PREDICTIONS_DATA,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "model_version": "1.0.0",
        "total": len(PREDICTIONS_DATA),
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
    """Returns a risk summary dashboard view — HIGH/MEDIUM/LOW predictions."""
    high = [p for p in PREDICTIONS_DATA if p["risk_level"] == "HIGH"]
    medium = [p for p in PREDICTIONS_DATA if p["risk_level"] == "MEDIUM"]
    low = [p for p in PREDICTIONS_DATA if p["risk_level"] == "LOW"]

    return {
        "high_risk": high,
        "medium_risk": medium,
        "low_risk": low,
        "summary": {
            "total": len(PREDICTIONS_DATA),
            "high_count": len(high),
            "medium_count": len(medium),
            "low_count": len(low),
            "avg_confidence": round(
                sum(p["confidence"] for p in PREDICTIONS_DATA) / len(PREDICTIONS_DATA), 1
            ),
        },
    }
