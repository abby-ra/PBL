"""
/api/decisions — AI-powered decision support endpoint.
Submit decisions, get AI recommendations, approve/reject with audit trail.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging
from datetime import datetime

from app.ai.decision_engine import analyze_decision
from app.data.mock_sap_data import DECISIONS_LOG

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory store — replace with your database (PostgreSQL, SAP HANA, etc.)
decisions_store = list(DECISIONS_LOG)


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────
class NewDecisionRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = None
    submitted_by: Optional[str] = "User"


class DecisionActionRequest(BaseModel):
    action: str          # "approve" | "reject" | "escalate"
    decided_by: str
    notes: Optional[str] = ""


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────
@router.get("/decisions")
async def get_decisions(status: Optional[str] = None, category: Optional[str] = None):
    """
    Get all decisions, optionally filtered by status or category.
    status: PENDING | APPROVED | REJECTED | UNDER_REVIEW
    category: finance | supply_chain | hr | sales | operations
    """
    result = decisions_store

    if status:
        result = [d for d in result if d.get("status", "").upper() == status.upper()]
    if category:
        result = [d for d in result if d.get("category", "").lower() == category.lower()]

    # Summary stats
    total = len(decisions_store)
    pending = len([d for d in decisions_store if d.get("status") == "PENDING"])
    approved = len([d for d in decisions_store if d.get("status") == "APPROVED"])
    under_review = len([d for d in decisions_store if d.get("status") == "UNDER_REVIEW"])

    return {
        "decisions": result,
        "total": total,
        "summary": {
            "pending": pending,
            "approved": approved,
            "rejected": total - pending - approved - under_review,
            "under_review": under_review,
        },
    }


@router.get("/decisions/{decision_id}")
async def get_decision(decision_id: str):
    """Get a single decision by ID."""
    decision = next((d for d in decisions_store if d.get("id") == decision_id), None)
    if not decision:
        raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")
    return decision


@router.post("/decisions/analyze")
async def analyze_new_decision(request: NewDecisionRequest):
    """
    Submit a new decision for AI analysis.
    Returns AI recommendation with confidence score before human review.
    
    This is the CORE endpoint — the AI analyzes the decision against live SAP data.
    """
    try:
        logger.info(f"New decision submitted: {request.title} by {request.submitted_by}")

        result = analyze_decision(
            title=request.title,
            description=request.description or "",
            submitted_by=request.submitted_by or "Unknown",
        )

        # Store the decision
        decisions_store.append(result)

        return {
            "success": True,
            "decision": result,
            "message": f"Decision analyzed. AI recommends: {result['recommendation']} (confidence: {result['confidence_score']}%)",
        }

    except Exception as e:
        logger.error(f"Decision analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/decisions/{decision_id}/action")
async def take_decision_action(decision_id: str, request: DecisionActionRequest):
    """
    Human takes an action on a decision (approve/reject/escalate).
    Creates an audit trail entry.
    """
    decision = next((d for d in decisions_store if d.get("id") == decision_id), None)
    if not decision:
        raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found")

    action_map = {
        "approve": "APPROVED",
        "reject": "REJECTED",
        "escalate": "UNDER_REVIEW",
    }

    new_status = action_map.get(request.action.lower())
    if not new_status:
        raise HTTPException(status_code=400, detail=f"Invalid action: {request.action}. Use: approve | reject | escalate")

    # Update decision
    decision["status"] = new_status
    decision["decided_by"] = request.decided_by
    decision["decided_at"] = datetime.utcnow().isoformat() + "Z"
    decision["decision_notes"] = request.notes

    return {
        "success": True,
        "decision_id": decision_id,
        "new_status": new_status,
        "decided_by": request.decided_by,
        "message": f"Decision {request.action}d successfully by {request.decided_by}",
    }


@router.get("/decisions/analytics/summary")
async def get_decisions_analytics():
    """Analytics summary for the Decisions dashboard."""
    total = len(decisions_store)
    if total == 0:
        return {"message": "No decisions yet"}

    approved = [d for d in decisions_store if d.get("status") == "APPROVED"]
    avg_confidence = (
        sum(d.get("confidence_score", d.get("confidence", 0)) for d in decisions_store) / total
    )

    category_counts = {}
    for d in decisions_store:
        cat = d.get("category", "general")
        category_counts[cat] = category_counts.get(cat, 0) + 1

    return {
        "total_decisions": total,
        "approval_rate": round(len(approved) / total * 100, 1),
        "avg_ai_confidence": round(avg_confidence, 1),
        "by_category": category_counts,
        "ai_accuracy": "84.5%",  # Replace with real metric from your evaluation pipeline
    }
