"""
/api/history — Retrieve stored user interaction history
Chat history, decision log, prediction log, activity log
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import json

from app.db.database import get_db
from app.db import crud
from app.core.security import get_current_user

router = APIRouter()


@router.get("/history/stats")
def get_stats(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Summary stats for the History dashboard."""
    stats = crud.get_user_stats(db, current_user.id)
    return {
        "user": {"name": current_user.name, "email": current_user.email, "role": current_user.role},
        "stats": stats,
    }


# ── Chat History ─────────────────────────────
@router.get("/history/chat")
def get_chat_history(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all chat messages for logged-in user."""
    messages = crud.get_chat_history(db, current_user.id, limit=200)
    return {
        "total": len(messages),
        "messages": [
            {
                "id": m.id,
                "session_id": m.session_id,
                "role": m.role,
                "content": m.content,
                "data_sources": m.data_sources.split(",") if m.data_sources else [],
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }


@router.get("/history/chat/sessions")
def get_chat_sessions(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get list of chat sessions for logged-in user."""
    sessions = crud.get_chat_sessions(db, current_user.id)
    return {
        "sessions": [
            {
                "session_id": s.session_id,
                "last_message": s.last_message.isoformat(),
                "message_count": s.message_count,
            }
            for s in sessions
        ]
    }


@router.get("/history/chat/sessions/{session_id}")
def get_session_messages(session_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all messages in a specific chat session."""
    messages = crud.get_session_messages(db, current_user.id, session_id)
    return {
        "session_id": session_id,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "data_sources": m.data_sources.split(",") if m.data_sources else [],
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }


# ── Decision History ──────────────────────────
@router.get("/history/decisions")
def get_decision_history(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all decisions submitted by logged-in user."""
    decisions = crud.get_decision_history(db, current_user.id)
    return {
        "total": len(decisions),
        "decisions": [
            {
                "id": d.id,
                "decision_ref": d.decision_ref,
                "title": d.title,
                "category": d.category,
                "ai_recommendation": d.ai_recommendation,
                "confidence_score": d.confidence_score,
                "status": d.status,
                "supporting_factors": json.loads(d.supporting_factors) if d.supporting_factors else [],
                "risk_factors": json.loads(d.risk_factors) if d.risk_factors else [],
                "expected_impact": d.expected_impact,
                "decided_by": d.decided_by,
                "decided_at": d.decided_at.isoformat() if d.decided_at else None,
                "created_at": d.created_at.isoformat(),
            }
            for d in decisions
        ],
    }


# ── Prediction History ────────────────────────
@router.get("/history/predictions")
def get_prediction_history(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get prediction views/interactions for logged-in user."""
    logs = crud.get_prediction_history(db, current_user.id)
    return {
        "total": len(logs),
        "predictions": [
            {
                "id": p.id,
                "prediction_id": p.prediction_id,
                "title": p.prediction_title,
                "action": p.action,
                "risk_level": p.risk_level,
                "confidence": p.confidence,
                "created_at": p.created_at.isoformat(),
            }
            for p in logs
        ],
    }


# ── Activity Log ──────────────────────────────
@router.get("/history/activity")
def get_activity_log(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get login/logout and action history for logged-in user."""
    logs = crud.get_activity_log(db, current_user.id)
    return {
        "total": len(logs),
        "activity": [
            {
                "id": a.id,
                "action": a.action,
                "detail": a.detail,
                "created_at": a.created_at.isoformat(),
            }
            for a in logs
        ],
    }