"""
CRUD — all database read/write operations.
Every API endpoint calls these functions instead of touching DB directly.
"""

import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.models import User, ChatHistory, DecisionLog, PredictionLog, ActivityLog
from app.core.security import hash_password


# ─────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_all_users(db: Session):
    return db.query(User).all()


def create_user(db: Session, name: str, email: str, password: str, role: str = "viewer"):
    user = User(
        name=name,
        email=email,
        hashed_password=hash_password(password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_last_login(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.last_login = datetime.utcnow()
        db.commit()


# ─────────────────────────────────────────────
# CHAT HISTORY
# ─────────────────────────────────────────────
def save_chat_message(
    db: Session,
    user_id: int,
    session_id: str,
    role: str,
    content: str,
    data_sources: list = None,
):
    msg = ChatHistory(
        user_id=user_id,
        session_id=session_id,
        role=role,
        content=content,
        data_sources=",".join(data_sources) if data_sources else None,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_chat_history(db: Session, user_id: int, limit: int = 100):
    return (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.created_at.desc())
        .limit(limit)
        .all()
    )


def get_chat_sessions(db: Session, user_id: int):
    """Returns unique session IDs with latest message time."""
    from sqlalchemy import func
    sessions = (
        db.query(
            ChatHistory.session_id,
            func.max(ChatHistory.created_at).label("last_message"),
            func.count(ChatHistory.id).label("message_count"),
        )
        .filter(ChatHistory.user_id == user_id)
        .group_by(ChatHistory.session_id)
        .order_by(func.max(ChatHistory.created_at).desc())
        .all()
    )
    return sessions


def get_session_messages(db: Session, user_id: int, session_id: str):
    return (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == user_id, ChatHistory.session_id == session_id)
        .order_by(ChatHistory.created_at.asc())
        .all()
    )


# ─────────────────────────────────────────────
# DECISION LOG
# ─────────────────────────────────────────────
def save_decision(db: Session, user_id: int, decision_data: dict):
    decision = DecisionLog(
        user_id=user_id,
        decision_ref=decision_data.get("id"),
        title=decision_data.get("title"),
        description=decision_data.get("description"),
        category=decision_data.get("category"),
        ai_recommendation=decision_data.get("recommendation"),
        confidence_score=decision_data.get("confidence_score"),
        status=decision_data.get("status", "PENDING"),
        supporting_factors=json.dumps(decision_data.get("supporting_factors", [])),
        risk_factors=json.dumps(decision_data.get("risk_factors", [])),
        expected_impact=decision_data.get("expected_impact"),
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision


def get_decision_history(db: Session, user_id: int, limit: int = 50):
    return (
        db.query(DecisionLog)
        .filter(DecisionLog.user_id == user_id)
        .order_by(DecisionLog.created_at.desc())
        .limit(limit)
        .all()
    )


def update_decision_status(db: Session, decision_id: int, status: str, decided_by: str):
    decision = db.query(DecisionLog).filter(DecisionLog.id == decision_id).first()
    if decision:
        decision.status = status
        decision.decided_by = decided_by
        decision.decided_at = datetime.utcnow()
        db.commit()
    return decision


# ─────────────────────────────────────────────
# PREDICTION LOG
# ─────────────────────────────────────────────
def log_prediction_view(
    db: Session,
    user_id: int,
    prediction_id: str,
    prediction_title: str,
    action: str,
    risk_level: str = None,
    confidence: float = None,
):
    log = PredictionLog(
        user_id=user_id,
        prediction_id=prediction_id,
        prediction_title=prediction_title,
        action=action,
        risk_level=risk_level,
        confidence=confidence,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_prediction_history(db: Session, user_id: int, limit: int = 50):
    return (
        db.query(PredictionLog)
        .filter(PredictionLog.user_id == user_id)
        .order_by(PredictionLog.created_at.desc())
        .limit(limit)
        .all()
    )


# ─────────────────────────────────────────────
# ACTIVITY LOG
# ─────────────────────────────────────────────
def log_activity(
    db: Session,
    user_id: int,
    action: str,
    detail: str = None,
    ip_address: str = None,
):
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        detail=detail,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()
    return entry


def get_activity_log(db: Session, user_id: int, limit: int = 50):
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == user_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )


# ─────────────────────────────────────────────
# STATS (for History dashboard)
# ─────────────────────────────────────────────
def get_user_stats(db: Session, user_id: int):
    chat_count = db.query(ChatHistory).filter(
        ChatHistory.user_id == user_id,
        ChatHistory.role == "user"
    ).count()

    decision_count = db.query(DecisionLog).filter(
        DecisionLog.user_id == user_id
    ).count()

    approved_count = db.query(DecisionLog).filter(
        DecisionLog.user_id == user_id,
        DecisionLog.status == "APPROVED"
    ).count()

    prediction_count = db.query(PredictionLog).filter(
        PredictionLog.user_id == user_id
    ).count()

    return {
        "total_chat_messages": chat_count,
        "total_decisions": decision_count,
        "approved_decisions": approved_count,
        "predictions_viewed": prediction_count,
    }