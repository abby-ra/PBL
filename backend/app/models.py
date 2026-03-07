"""
Database Models - All models in one file
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, Float, JSON, ForeignKey, Text
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.db.base import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""
    ADMIN = "admin"
    MANAGER = "manager"
    ANALYST = "analyst"
    VIEWER = "viewer"


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    organization_id = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"


class Prediction(Base):
    """Prediction model"""
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Prediction metadata
    model_name = Column(String(100), nullable=False, index=True)
    model_version = Column(String(50), nullable=True)
    prediction_type = Column(String(50), nullable=False, index=True)
    
    # Input and output
    input_data = Column(JSON, nullable=False)
    prediction_result = Column(JSON, nullable=False)
    
    # Quality metrics
    confidence_score = Column(Float, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    
    # Additional metadata
    extra_data = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    def __repr__(self):
        return f"<Prediction(id={self.id}, model='{self.model_name}', type='{self.prediction_type}')>"


class Decision(Base):
    """Decision model"""
    __tablename__ = "decisions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Decision details
    decision_type = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Input parameters and context
    input_context = Column(JSON, nullable=False)
    constraints = Column(JSON, nullable=True)
    objectives = Column(JSON, nullable=True)
    
    # Results
    recommendation = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    analysis_result = Column(JSON, nullable=True)
    
    # Status
    status = Column(String(50), default="pending", nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Decision(id={self.id}, type='{self.decision_type}', status='{self.status}')>"
