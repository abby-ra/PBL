"""
Centralized API Routes - All endpoints in one file
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta, datetime
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from app.db.session import get_db
from app.models import User, UserRole
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
    ACCESS_TOKEN_TYPE
)
from app.core.config import settings

# Create router
router = APIRouter()
security = HTTPBearer()


# ============= SCHEMAS/MODELS =============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_id: int | None = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    organization_id: int | None
    is_active: bool
    created_at: str
    
    class Config:
        from_attributes = True


class SalesForecastRequest(BaseModel):
    model: str = "lstm"
    input_features: dict
    forecast_horizon: int = 30
    confidence_level: float = 0.95


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    context: Optional[dict] = None


class DecisionEvaluationRequest(BaseModel):
    decision_type: str
    context: dict
    constraints: Optional[dict] = None
    objectives: List[dict] = []


# ============= DEPENDENCIES =============

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not verify_token_type(payload, ACCESS_TOKEN_TYPE):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


# ============= AUTHENTICATION ROUTES =============

@router.post("/auth/register", response_model=dict, status_code=status.HTTP_201_CREATED, tags=["Authentication"])
async def register(
    user_in: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = User(
        email=user_in.email,
        hashed_password=user_in.password,
        full_name=user_in.full_name,
        organization_id=user_in.organization_id
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "created_at": user.created_at.isoformat()
    }


@router.post("/auth/login", response_model=Token, tags=["Authentication"])
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login with username (email) and password"""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()
    
    # Create tokens
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


# ============= USER ROUTES =============

@router.get("/users/me", response_model=UserResponse, tags=["Users"])
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        organization_id=current_user.organization_id,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat()
    )


@router.put("/users/me", tags=["Users"])
async def update_current_user(
    full_name: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user"""
    if full_name:
        current_user.full_name = full_name
        await db.commit()
    
    return {
        "message": "User updated successfully",
        "user_id": current_user.id
    }


# ============= ANALYTICS ROUTES =============

@router.get("/analytics/dashboard", tags=["Analytics"])
async def get_dashboard_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get dashboard metrics and KPIs"""
    return {
        "period": {
            "start": start_date or (datetime.now() - timedelta(days=30)).isoformat(),
            "end": end_date or datetime.now().isoformat()
        },
        "metrics": {
            "total_revenue": {"value": 1250000, "change": 12.5, "trend": "up"},
            "sales_count": {"value": 3450, "change": 8.3, "trend": "up"},
            "customer_satisfaction": {"value": 4.6, "change": 0.3, "trend": "up"},
            "active_users": {"value": 892, "change": -2.1, "trend": "down"}
        }
    }


@router.get("/analytics/report", tags=["Analytics"])
async def generate_report(
    report_type: str = Query(..., description="Type of report"),
    current_user: User = Depends(get_current_user)
):
    """Generate analytics report"""
    return {
        "report_type": report_type,
        "status": "completed",
        "data": {"message": "Report generated successfully"}
    }


# ============= PREDICTION ROUTES =============

@router.post("/predictions/sales-forecast", tags=["Predictions"])
async def sales_forecast(
    request: SalesForecastRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate sales forecast"""
    return {
        "prediction_id": "pred_12345",
        "model": request.model,
        "forecast_horizon": request.forecast_horizon,
        "predictions": [100 + i * 5 for i in range(request.forecast_horizon)],
        "confidence_intervals": {
            "lower": [95 + i * 5 for i in range(request.forecast_horizon)],
            "upper": [105 + i * 5 for i in range(request.forecast_horizon)]
        }
    }


@router.post("/predictions/demand-forecast", tags=["Predictions"])
async def demand_forecast(
    product_id: str,
    location: str,
    forecast_days: int = 60,
    current_user: User = Depends(get_current_user)
):
    """Forecast product demand"""
    return {
        "product_id": product_id,
        "location": location,
        "forecast": [50 + i * 2 for i in range(forecast_days)],
        "message": "Demand forecast generated"
    }


# ============= DECISION SUPPORT ROUTES =============

@router.post("/decisions/evaluate", tags=["Decisions"])
async def evaluate_decision(
    request: DecisionEvaluationRequest,
    current_user: User = Depends(get_current_user)
):
    """Evaluate a business decision"""
    return {
        "decision_id": "dec_67890",
        "decision_type": request.decision_type,
        "recommendation": "Proceed with caution",
        "confidence": 0.85,
        "analysis": {
            "pros": ["High potential ROI", "Market demand exists"],
            "cons": ["High initial cost", "Competitive market"],
            "risk_level": "medium"
        }
    }


@router.get("/decisions/rules", tags=["Decisions"])
async def list_decision_rules(
    current_user: User = Depends(get_current_user)
):
    """List all decision rules"""
    return {
        "rules": [
            {"id": 1, "name": "Inventory Reorder", "enabled": True},
            {"id": 2, "name": "Price Optimization", "enabled": True}
        ]
    }


# ============= NLP/CHAT ROUTES =============

@router.post("/nlp/chat", tags=["NLP"])
async def chat_interface(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """Chat with AI assistant"""
    return {
        "conversation_id": request.conversation_id or "conv_new_123",
        "response": f"You said: {request.message}. This is a mock response from the AI assistant.",
        "timestamp": datetime.now().isoformat()
    }


@router.post("/nlp/sentiment", tags=["NLP"])
async def analyze_sentiment(
    texts: List[str],
    language: str = "en",
    current_user: User = Depends(get_current_user)
):
    """Analyze sentiment of text"""
    return {
        "results": [
            {"text": text[:50], "sentiment": "positive", "score": 0.85}
            for text in texts
        ]
    }


@router.post("/nlp/summarize", tags=["NLP"])
async def summarize_text(
    text: str,
    max_length: int = 150,
    current_user: User = Depends(get_current_user)
):
    """Summarize text"""
    return {
        "original_length": len(text),
        "summary": text[:max_length] + "...",
        "compression_ratio": max_length / len(text) if len(text) > 0 else 0
    }


# ============= HEALTH CHECK =============

@router.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.APP_VERSION
    }
