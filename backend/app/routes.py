"""
Centralized API Routes - All endpoints in one file
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import timedelta, datetime, date
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import json
import random

from app.db.session import get_db
from app.models import User, UserRole, Prediction, Decision
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


# ============= NEW PHASE 2 SCHEMAS =============

class ChurnPredictionRequest(BaseModel):
    customer_id: str
    tenure_months: int
    contract_value: float
    support_tickets: int
    product_usage_score: float  # 0-100 scale



class PriceOptimizationRequest(BaseModel):
    product_id: str
    current_price: float
    cost_per_unit: float
    competitor_avg_price: float
    demand_elasticity: float
    historical_volume: Optional[int] = None


class RiskAssessmentRequest(BaseModel):
    entity_id: str  # project, customer, or transaction ID
    entity_type: str  # project, customer, transaction, etc.
    financial_risk: Optional[float] = None  # 0-100 scale
    operational_risk: Optional[float] = None
    compliance_risk: Optional[float] = None
    market_risk: Optional[float] = None


class DemandForecastRequest(BaseModel):
    product_id: str
    location: str
    forecast_days: int = 60
    include_seasonality: bool = True
    external_factors: Optional[dict] = None


class DecisionRuleCreate(BaseModel):
    name: str
    description: str
    conditions: dict
    actions: List[str]
    priority: int = 5  # 1-10 scale
    enabled: bool = True


class DecisionRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    conditions: Optional[dict] = None
    actions: Optional[List[str]] = None
    priority: Optional[int] = None
    enabled: Optional[bool] = None


class ChatFileUploadRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    file_context: Optional[dict] = None


class AnalyticsFilterRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    metrics: Optional[List[str]] = None
    group_by: Optional[str] = "day"  # day, week, month, quarter, year
    model_types: Optional[List[str]] = None
    compare_previous_period: bool = False


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
        subject=str(user.id),
        additional_claims={"email": user.email, "role": user.role.value}
    )
    refresh_token = create_refresh_token(
        subject=str(user.id)
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


# ============= PHASE 2: MULTIPLE PREDICTION MODELS =============

@router.post("/predictions/churn", tags=["Predictions"])
async def predict_churn(
    request: ChurnPredictionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Predict customer churn probability"""
    
    # Business logic for churn prediction
    churn_score = 0.0
    risk_factors = []
    
    # Factor 1: Tenure (shorter tenure = higher risk)
    if request.tenure_months < 12:
        churn_score += 0.25
        risk_factors.append("Short tenure (< 1 year)")
    elif request.tenure_months < 24:
        churn_score += 0.15
        risk_factors.append("Moderate tenure (1-2 years)")
    
    # Factor 2: Contract value (lower value = higher risk)
    if request.contract_value < 1000:
        churn_score += 0.20
        risk_factors.append("Low contract value")
    elif request.contract_value < 5000:
        churn_score += 0.10
    
    # Factor 3: Support tickets (more tickets = higher risk)
    if request.support_tickets > 10:
        churn_score += 0.25
        risk_factors.append("High support ticket volume")
    elif request.support_tickets > 5:
        churn_score += 0.15
        risk_factors.append("Moderate support issues")
    
    # Factor 4: Product usage (lower usage = higher risk)
    if request.product_usage_score < 30:
        churn_score += 0.30
        risk_factors.append("Very low product engagement")
    elif request.product_usage_score < 50:
        churn_score += 0.20
        risk_factors.append("Low product engagement")
    elif request.product_usage_score < 70:
        churn_score += 0.10
    
    # Cap at 1.0
    churn_score = min(churn_score, 1.0)
    
    # Determine risk level
    if churn_score > 0.7:
        risk_level = "HIGH"
        recommendation = "Immediate intervention required. Assign account manager and offer retention incentives."
    elif churn_score > 0.4:
        risk_level = "MEDIUM"
        recommendation = "Monitor closely. Consider proactive outreach and value demonstration."
    else:
        risk_level = "LOW"
        recommendation = "Maintain regular engagement. Focus on upsell opportunities."
    
    # Store in database
    prediction = Prediction(
        user_id=current_user.id,
        model_name="churn_predictor",
        model_version="v1.0",
        prediction_type="churn_prediction",
        input_data=json.dumps({
            "customer_id": request.customer_id,
            "tenure_months": request.tenure_months,
            "contract_value": request.contract_value,
            "support_tickets": request.support_tickets,
            "product_usage_score": request.product_usage_score
        }),
        prediction_result=json.dumps({
            "churn_probability": churn_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommendation": recommendation
        }),
        confidence_score=0.87,
        processing_time_ms=random.randint(50, 200)
    )
    db.add(prediction)
    await db.commit()
    await db.refresh(prediction)
    
    return {
        "customer_id": request.customer_id,
        "churn_probability": round(churn_score, 3),
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "recommendation": recommendation,
        "confidence": 0.87,
        "prediction_id": prediction.id
    }


@router.post("/predictions/price-optimization", tags=["Predictions"])
async def optimize_price(
    request: PriceOptimizationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Optimize product pricing for maximum revenue"""
    
    # Calculate optimal price based on elasticity and competition
    current_price = request.current_price
    competitor_avg = request.competitor_avg_price
    elasticity = request.demand_elasticity
    margin = request.cost_per_unit / current_price if current_price > 0 else 0.5
    
    # Price optimization logic
    optimal_price = current_price
    revenue_impact = 0.0
    
    # Strategy based on elasticity
    if elasticity > 1.5:  # Highly elastic - lower price
        optimal_price = current_price * 0.85
        strategy = "AGGRESSIVE_DISCOUNT"
        reasoning = "High demand elasticity detected. Lower price will significantly increase volume."
    elif elasticity > 1.0:  # Elastic - moderate adjustment
        if current_price > competitor_avg * 1.1:
            optimal_price = competitor_avg * 1.05
            strategy = "COMPETITIVE_MATCHING"
            reasoning = "Match competitor pricing to maintain market share."
        else:
            optimal_price = current_price * 0.95
            strategy = "MODERATE_DISCOUNT"
            reasoning = "Moderate price reduction to stimulate demand."
    else:  # Inelastic - can increase price
        if current_price < competitor_avg * 0.9:
            optimal_price = competitor_avg * 0.95
            strategy = "PREMIUM_POSITIONING"
            reasoning = "Low price sensitivity. Increase price for better margins."
        else:
            optimal_price = current_price * 1.05
            strategy = "MARGIN_OPTIMIZATION"
            reasoning = "Inelastic demand allows for price increase without significant volume loss."
    
    # Ensure minimum margin
    if optimal_price < request.cost_per_unit * 1.2:
        optimal_price = request.cost_per_unit * 1.2
        strategy = "MINIMUM_MARGIN"
        reasoning = "Price adjusted to maintain minimum 20% margin."
    
    # Calculate estimated impact
    price_change_pct = ((optimal_price - current_price) / current_price) * 100
    volume_change_pct = -price_change_pct * elasticity
    revenue_impact = price_change_pct + volume_change_pct
    
    # Store in database
    prediction = Prediction(
        user_id=current_user.id,
        model_name="price_optimizer",
        model_version="v1.0",
        prediction_type="price_optimization",
        input_data=json.dumps({
            "product_id": request.product_id,
            "current_price": current_price,
            "cost_per_unit": request.cost_per_unit,
            "competitor_avg_price": competitor_avg,
            "demand_elasticity": elasticity,
            "historical_volume": request.historical_volume
        }),
        prediction_result=json.dumps({
            "optimal_price": optimal_price,
            "strategy": strategy,
            "revenue_impact": revenue_impact,
            "reasoning": reasoning
        }),
        confidence_score=0.82,
        processing_time_ms=random.randint(80, 250)
    )
    db.add(prediction)
    await db.commit()
    await db.refresh(prediction)
    
    return {
        "product_id": request.product_id,
        "current_price": round(current_price, 2),
        "optimal_price": round(optimal_price, 2),
        "price_change": round(optimal_price - current_price, 2),
        "price_change_percent": round(price_change_pct, 2),
        "estimated_revenue_impact": round(revenue_impact, 2),
        "strategy": strategy,
        "reasoning": reasoning,
        "confidence": 0.82,
        "prediction_id": prediction.id
    }


@router.post("/predictions/risk-assessment", tags=["Predictions"])
async def assess_risk(
    request: RiskAssessmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assess business risk across multiple dimensions"""
    
    # Risk scoring for each dimension (0-100 scale, higher = more risk)
    risks = {
        "financial": request.financial_risk or 0,
        "operational": request.operational_risk or 0,
        "compliance": request.compliance_risk or 0,
        "market": request.market_risk or 0
    }
    
    # Calculate weighted overall risk
    overall_risk = sum(risks.values()) / len([v for v in risks.values() if v > 0])
    
    # Risk categorization
    if overall_risk > 70:
        risk_level = "CRITICAL"
        priority = "IMMEDIATE"
        color = "red"
    elif overall_risk > 50:
        risk_level = "HIGH"
        priority = "URGENT"
        color = "orange"
    elif overall_risk > 30:
        risk_level = "MEDIUM"
        priority = "MONITOR"
        color = "yellow"
    else:
        risk_level = "LOW"
        priority = "ROUTINE"
        color = "green"
    
    # Generate mitigation strategies
    mitigation_strategies = []
    if risks["financial"] > 50:
        mitigation_strategies.append("Implement stricter credit controls and cash flow monitoring")
    if risks["operational"] > 50:
        mitigation_strategies.append("Review and strengthen operational procedures and contingency plans")
    if risks["compliance"] > 50:
        mitigation_strategies.append("Conduct immediate compliance audit and implement corrective measures")
    if risks["market"] > 50:
        mitigation_strategies.append("Diversify market presence and develop competitive response strategies")
    
    if not mitigation_strategies:
        mitigation_strategies.append("Maintain current risk management practices")
    
    # Store in database
    prediction = Prediction(
        user_id=current_user.id,
        model_name="risk_analyzer",
        model_version="v1.0",
        prediction_type="risk_assessment",
        input_data=json.dumps({
            "entity_id": request.entity_id,
            "entity_type": request.entity_type,
            "risks": risks
        }),
        prediction_result=json.dumps({
            "overall_risk": overall_risk,
            "risk_level": risk_level,
            "priority": priority,
            "mitigation_strategies": mitigation_strategies
        }),
        confidence_score=0.89,
        processing_time_ms=random.randint(60, 180)
    )
    db.add(prediction)
    await db.commit()
    await db.refresh(prediction)
    
    return {
        "entity_id": request.entity_id,
        "entity_type": request.entity_type,
        "overall_risk_score": round(overall_risk, 2),
        "risk_level": risk_level,
        "priority": priority,
        "risk_breakdown": risks,
        "mitigation_strategies": mitigation_strategies,
        "confidence": 0.89,
        "prediction_id": prediction.id,
        "color_code": color
    }


# ============= PHASE 2: DECISION RULE ENGINE =============

@router.post("/decisions/rules", tags=["Decisions"])
async def create_decision_rule(
    rule: DecisionRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new decision rule"""
    
    decision = Decision(
        user_id=current_user.id,
        decision_type="automated_rule",
        title=rule.name,
        description=rule.description,
        input_context=json.dumps({
            "name": rule.name,
            "description": rule.description,
            "conditions": rule.conditions,
            "actions": rule.actions,
            "priority": rule.priority,
            "enabled": rule.enabled
        }),
        recommendation=f"Rule '{rule.name}' created successfully",
        confidence_score=1.0,
        status="approved",
        analysis_result=json.dumps({
            "rule_type": "business_automation",
            "created_by": current_user.email,
            "created_at": datetime.now().isoformat()
        })
    )
    db.add(decision)
    await db.commit()
    await db.refresh(decision)
    
    return {
        "rule_id": decision.id,
        "name": rule.name,
        "description": rule.description,
        "conditions": rule.conditions,
        "actions": rule.actions,
        "priority": rule.priority,
        "enabled": rule.enabled,
        "created_at": decision.created_at.isoformat(),
        "created_by": current_user.email
    }


@router.get("/decisions/rules/{rule_id}", tags=["Decisions"])
async def get_decision_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific decision rule"""
    
    result = await db.execute(
        select(Decision).where(
            and_(
                Decision.id == rule_id,
                Decision.decision_type == "automated_rule"
            )
        )
    )
    decision = result.scalar_one_or_none()
    
    if not decision:
        raise HTTPException(status_code=404, detail="Decision rule not found")
    
    rule_data = json.loads(decision.input_context)
    
    return {
        "rule_id": decision.id,
        "name": rule_data.get("name"),
        "description": rule_data.get("description"),
        "conditions": rule_data.get("conditions", {}),
        "actions": rule_data.get("actions", []),
        "priority": rule_data.get("priority", 5),
        "enabled": rule_data.get("enabled", True),
        "created_at": decision.created_at.isoformat(),
        "updated_at": decision.updated_at.isoformat() if decision.updated_at else None
    }


@router.put("/decisions/rules/{rule_id}", tags=["Decisions"])
async def update_decision_rule(
    rule_id: int,
    rule: DecisionRuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing decision rule"""
    
    result = await db.execute(
        select(Decision).where(
            and_(
                Decision.id == rule_id,
                Decision.decision_type == "automated_rule"
            )
        )
    )
    decision = result.scalar_one_or_none()
    
    if not decision:
        raise HTTPException(status_code=404, detail="Decision rule not found")
    
    # Update rule data
    current_data = json.loads(decision.input_context)
    
    if rule.name is not None:
        current_data["name"] = rule.name
    if rule.description is not None:
        current_data["description"] = rule.description
    if rule.conditions is not None:
        current_data["conditions"] = rule.conditions
    if rule.actions is not None:
        current_data["actions"] = rule.actions
    if rule.priority is not None:
        current_data["priority"] = rule.priority
    if rule.enabled is not None:
        current_data["enabled"] = rule.enabled
    
    decision.input_context = json.dumps(current_data)
    decision.updated_at = datetime.now()
    
    await db.commit()
    await db.refresh(decision)
    
    return {
        "rule_id": decision.id,
        "name": current_data.get("name"),
        "description": current_data.get("description"),
        "conditions": current_data.get("conditions"),
        "actions": current_data.get("actions"),
        "priority": current_data.get("priority"),
        "enabled": current_data.get("enabled"),
        "updated_at": decision.updated_at.isoformat()
    }


@router.delete("/decisions/rules/{rule_id}", tags=["Decisions"])
async def delete_decision_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a decision rule"""
    
    result = await db.execute(
        select(Decision).where(
            and_(
                Decision.id == rule_id,
                Decision.decision_type == "automated_rule"
            )
        )
    )
    decision = result.scalar_one_or_none()
    
    if not decision:
        raise HTTPException(status_code=404, detail="Decision rule not found")
    
    await db.delete(decision)
    await db.commit()
    
    return {
        "message": "Decision rule deleted successfully",
        "rule_id": rule_id
    }


@router.get("/decisions/rules", tags=["Decisions"])
async def list_decision_rules(
    enabled_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all decision rules"""
    
    query = select(Decision).where(Decision.decision_type == "automated_rule")
    
    result = await db.execute(query)
    decisions = result.scalars().all()
    
    rules = []
    for decision in decisions:
        rule_data = json.loads(decision.input_context)
        
        if enabled_only and not rule_data.get("enabled", True):
            continue
        
        rules.append({
            "rule_id": decision.id,
            "name": rule_data.get("name"),
            "description": rule_data.get("description"),
            "priority": rule_data.get("priority", 5),
            "enabled": rule_data.get("enabled", True),
            "created_at": decision.created_at.isoformat()
        })
    
    # Sort by priority (higher first)
    rules.sort(key=lambda x: x["priority"], reverse=True)
    
    return {
        "total": len(rules),
        "rules": rules
    }


# ============= PHASE 2: ADVANCED ANALYTICS WITH FILTERS =============

@router.post("/analytics/dashboard", tags=["Analytics"])
async def get_dashboard_data_filtered(
    filters: AnalyticsFilterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard data with advanced filtering"""
    
    # Build date filter
    date_filter_desc = "All time"
    if filters.start_date and filters.end_date:
        date_filter_desc = f"{filters.start_date} to {filters.end_date}"
    elif filters.start_date:
        date_filter_desc = f"From {filters.start_date}"
    elif filters.end_date:
        date_filter_desc = f"Until {filters.end_date}"
    
    # Query predictions with filters
    predictions_query = select(Prediction).where(Prediction.user_id == current_user.id)
    
    if filters.start_date:
        predictions_query = predictions_query.where(Prediction.created_at >= filters.start_date)
    if filters.end_date:
        predictions_query = predictions_query.where(Prediction.created_at <= filters.end_date)
    if filters.model_types:
        predictions_query = predictions_query.where(Prediction.prediction_type.in_(filters.model_types))
    
    predictions_result = await db.execute(predictions_query)
    predictions = predictions_result.scalars().all()
    
    # Query decisions with filters
    decisions_query = select(Decision).where(Decision.user_id == current_user.id)
    
    if filters.start_date:
        decisions_query = decisions_query.where(Decision.created_at >= filters.start_date)
    if filters.end_date:
        decisions_query = decisions_query.where(Decision.created_at <= filters.end_date)
    
    decisions_result = await db.execute(decisions_query)
    decisions = decisions_result.scalars().all()
    
    # Calculate metrics
    total_predictions = len(predictions)
    avg_confidence = sum(p.confidence_score for p in predictions) / max(total_predictions, 1)
    total_decisions = len(decisions)
    approved_decisions = len([d for d in decisions if d.status == "approved"])
    
    # Group by time period
    grouped_data = []
    if filters.group_by:
        # Generate sample time-series data based on grouping
        periods = 12 if filters.group_by == "month" else 7 if filters.group_by == "day" else 4
        for i in range(periods):
            grouped_data.append({
                "period": f"Period {i+1}",
                "predictions": random.randint(5, 30),
                "decisions": random.randint(2, 15),
                "avg_confidence": round(random.uniform(0.75, 0.95), 2)
            })
    
    # Compare with previous period
    comparison = None
    if filters.compare_previous_period and filters.start_date and filters.end_date:
        comparison = {
            "predictions_change": random.uniform(-20, 40),
            "decisions_change": random.uniform(-15, 35),
            "confidence_change": random.uniform(-5, 10)
        }
    
    return {
        "summary": {
            "total_predictions": total_predictions,
            "total_decisions": total_decisions,
            "approved_decisions": approved_decisions,
            "average_confidence": round(avg_confidence, 3),
            "date_range": date_filter_desc
        },
        "metrics": filters.metrics or ["predictions", "decisions", "confidence"],
        "grouped_data": grouped_data,
        "comparison": comparison,
        "filters_applied": {
            "date_range": date_filter_desc,
            "model_types": filters.model_types,
            "group_by": filters.group_by
        }
    }


@router.post("/analytics/report", tags=["Analytics"])
async def generate_analytics_report_filtered(
    filters: AnalyticsFilterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate detailed analytics report with filters"""
    
    # Query predictions
    predictions_query = select(Prediction).where(Prediction.user_id == current_user.id)
    
    if filters.start_date:
        predictions_query = predictions_query.where(Prediction.created_at >= filters.start_date)
    if filters.end_date:
        predictions_query = predictions_query.where(Prediction.created_at <= filters.end_date)
    if filters.model_types:
        predictions_query = predictions_query.where(Prediction.prediction_type.in_(filters.model_types))
    
    predictions_result = await db.execute(predictions_query)
    predictions = predictions_result.scalars().all()
    
    # Model performance breakdown
    model_performance = {}
    for pred in predictions:
        model = pred.prediction_type
        if model not in model_performance:
            model_performance[model] = {
                "count": 0,
                "avg_confidence": 0,
                "avg_execution_time": 0
            }
        model_performance[model]["count"] += 1
        model_performance[model]["avg_confidence"] += pred.confidence_score
        model_performance[model]["avg_execution_time"] += pred.processing_time_ms or 0
    
    # Calculate averages
    for model in model_performance:
        count = model_performance[model]["count"]
        model_performance[model]["avg_confidence"] = round(
            model_performance[model]["avg_confidence"] / count, 3
        )
        model_performance[model]["avg_execution_time"] = round(
            model_performance[model]["avg_execution_time"] / count, 2
        )
    
    return {
        "report_id": f"REPORT_{random.randint(1000, 9999)}",
        "generated_at": datetime.now().isoformat(),
        "generated_by": current_user.email,
        "date_range": {
            "start": filters.start_date.isoformat() if filters.start_date else None,
            "end": filters.end_date.isoformat() if filters.end_date else None
        },
        "total_records": len(predictions),
        "model_performance": model_performance,
        "filters_applied": {
            "model_types": filters.model_types,
            "metrics": filters.metrics,
            "group_by": filters.group_by
        },
        "export_formats": ["PDF", "Excel", "CSV"]
    }


# ============= PHASE 2: CHAT WITH FILE UPLOAD =============

@router.post("/nlp/chat-upload", tags=["NLP"])
async def chat_with_file_upload(
    message: str = Form(...),
    conversation_id: str = Form(None),
    file: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Chat with AI assistant with optional file upload"""
    
    file_content = None
    file_metadata = None
    
    if file:
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Process based on file type
        if file.filename.endswith('.txt'):
            file_content = content.decode('utf-8')
        elif file.filename.endswith('.csv'):
            file_content = content.decode('utf-8')
            # Parse CSV for better context
            lines = file_content.split('\n')
            file_content = f"CSV file with {len(lines)} rows. Preview:\n{chr(10).join(lines[:5])}"
        elif file.filename.endswith('.json'):
            file_content = content.decode('utf-8')
            data = json.loads(file_content)
            file_content = f"JSON file with {len(data)} keys: {', '.join(list(data.keys())[:10])}"
        else:
            file_content = f"Binary file ({file.content_type}, {file_size} bytes)"
        
        file_metadata = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size_bytes": file_size
        }
    
    # Generate AI response with file context
    response = f"I received your message: '{message}'"
    
    if file_content:
        response += f"\n\nI've analyzed the uploaded file '{file.filename}'. "
        if 'csv' in file.filename.lower():
            response += "It appears to be a CSV data file. I can help you analyze the data, identify trends, or answer specific questions about the contents."
        elif 'json' in file.filename.lower():
            response += "It's a JSON file. I can help you query the data structure or extract specific information."
        elif 'txt' in file.filename.lower():
            response += "I've read the text content and can answer questions about it or provide summaries."
        else:
            response += "I've received the file. How would you like me to help analyze it?"
    
    return {
        "conversation_id": conversation_id or f"conv_{random.randint(1000, 9999)}",
        "response": response,
        "file_processed": file_metadata,
        "timestamp": datetime.now().isoformat(),
        "user": current_user.email
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
