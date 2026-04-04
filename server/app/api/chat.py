"""
/api/chat — AI Assistant conversational endpoint.
Handles multi-turn conversation with full SAP context injection.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging

from app.ai.llm_client import call_llm
from app.ai.prompt_templates import get_chat_system_prompt
from app.data.mock_sap_data import get_context_for_query, KPI_SUMMARY

logger = logging.getLogger(__name__)
router = APIRouter()


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str        # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    user_id: Optional[str] = "anonymous"


class ChatResponse(BaseModel):
    response: str
    data_sources_used: List[str]
    tokens_used: Optional[int] = None


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint. 
    - Detects relevant SAP modules based on user query
    - Injects real data as context into the LLM
    - Returns AI response with source attribution
    """
    try:
        # 1. Get relevant SAP data context based on the query
        context = get_context_for_query(request.message)
        
        # 2. ENHANCE context with business problem narratives
        context["business_problems"] = {
            "PROBLEM_1": {
                "title": "Sales team turnover 18.4%",
                "impact": "Pipeline dropped $16.6M to $38.4M (30.2% below $55M target)",
                "metrics": "149 reps lost, win rate down to 22.1%, sales cycle 48 days (up from 34)",
            },
            "PROBLEM_2": {
                "title": "High-risk suppliers 56% dependency",
                "impact": "Supply chain efficiency down 84.7%, on-time delivery 71.2% (was 95%)",
                "metrics": "47 stockouts, 2 HIGH-risk suppliers, $2.1M revenue at risk",
            },
            "PROBLEM_3": {
                "title": "Engineering turnover 14.8%",
                "impact": "387 open positions, SAP BTP (47.8% growth) delivery blocked",
                "metrics": "150 eng open positions, 387 company-wide, attrition affecting growth",
            },
        }

        # 3. Detect which modules were used (for source citation)
        module_map = {
            "financial": "SAP S/4HANA Financial Module",
            "supply_chain": "SAP Ariba Procurement Module",
            "sales": "SAP CRM / Sales Cloud",
            "hr": "SAP SuccessFactors HCM",
            "decisions": "Decision Log",
            "predictions": "AI Predictions Engine",
            "kpi_summary": "SAP Analytics Cloud KPIs",
        }
        data_sources = [module_map[k] for k in context.keys() if k in module_map]

        # 4. Build system prompt with injected SAP data
        system_prompt = get_chat_system_prompt(context)

        # 5. Convert history to simple dicts
        history = [{"role": msg.role, "content": msg.content} for msg in (request.history or [])]

        # 6. Call LLM
        response_text = call_llm(
            system_prompt=system_prompt,
            user_message=request.message,
            history=history,
        )

        return ChatResponse(
            response=response_text,
            data_sources_used=data_sources,
        )

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"AI processing error: {str(e)}")


@router.get("/chat/suggested-questions")
async def get_suggested_questions():
    """
    Returns suggested questions for the chat UI to display as quick actions.
    These questions are SPECIFIC to the 3 interconnected problems.
    """
    return {
        "questions": [
            "🚩 Why is sales pipeline down $16.6M? What can we do?",
            "⚠️ Which suppliers are at highest risk? How dependent are we?",
            "📊 Our Q1 2025 revenue forecast is LOWER. Why?",
            "👥 Why is Sales attrition 18.4% and Engineering 14.8%?",
            "⚡ SAP BTP is growing 47.8% but we're not capitalizing. Why?",
            "🔗 How do the 3 problems (sales/supply/engineering) connect?",
            "📈 What are our top 3 most urgent decisions?",
            "💡 What should I prioritize THIS WEEK to move the needle?",
        ]
    }
