"""
Database Models — all SQLite tables
Tables: users, chat_history, decision_log, prediction_log, activity_log
"""

from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class User(Base):
    """Stores registered users."""
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), nullable=False)
    email       = Column(String(150), unique=True, index=True, nullable=False)
    role        = Column(String(50), default="viewer")         # admin | viewer
    hashed_password = Column(String(255), nullable=False)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    last_login  = Column(DateTime, nullable=True)

    # Relationships
    chat_history    = relationship("ChatHistory",    back_populates="user", cascade="all, delete")
    decision_log    = relationship("DecisionLog",    back_populates="user", cascade="all, delete")
    prediction_log  = relationship("PredictionLog",  back_populates="user", cascade="all, delete")
    activity_log    = relationship("ActivityLog",    back_populates="user", cascade="all, delete")


class ChatHistory(Base):
    """Stores every AI chat message — both user and assistant turns."""
    __tablename__ = "chat_history"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id  = Column(String(100), nullable=False)          # groups messages in same chat session
    role        = Column(String(20), nullable=False)           # "user" | "assistant"
    content     = Column(Text, nullable=False)
    data_sources = Column(Text, nullable=True)                 # comma-separated SAP modules used
    created_at  = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_history")


class DecisionLog(Base):
    """Stores every decision submitted and its AI analysis result."""
    __tablename__ = "decision_log"

    id                  = Column(Integer, primary_key=True, index=True)
    user_id             = Column(Integer, ForeignKey("users.id"), nullable=False)
    decision_ref        = Column(String(50), nullable=True)    # e.g. DEC-20241121
    title               = Column(String(300), nullable=False)
    description         = Column(Text, nullable=True)
    category            = Column(String(50), nullable=True)
    ai_recommendation   = Column(String(20), nullable=True)    # APPROVE | REJECT | REVIEW
    confidence_score    = Column(Float, nullable=True)
    status              = Column(String(30), default="PENDING")
    supporting_factors  = Column(Text, nullable=True)          # JSON string
    risk_factors        = Column(Text, nullable=True)          # JSON string
    expected_impact     = Column(Text, nullable=True)
    decided_by          = Column(String(100), nullable=True)
    decided_at          = Column(DateTime, nullable=True)
    created_at          = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="decision_log")


class PredictionLog(Base):
    """Stores when a user viewed or generated a prediction narrative."""
    __tablename__ = "prediction_log"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    prediction_id   = Column(String(50), nullable=False)       # e.g. PRED-001
    prediction_title = Column(String(300), nullable=True)
    action          = Column(String(50), nullable=False)       # "viewed" | "narrative_generated"
    risk_level      = Column(String(20), nullable=True)
    confidence      = Column(Float, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="prediction_log")


class ActivityLog(Base):
    """Stores user login/logout and key actions for audit trail."""
    __tablename__ = "activity_log"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    action      = Column(String(100), nullable=False)          # "login" | "logout" | "decision_submitted" etc.
    detail      = Column(Text, nullable=True)                  # extra context
    ip_address  = Column(String(50), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activity_log")