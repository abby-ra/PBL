"""
LLM Client — handles all calls to the AI model.
Supports OpenAI (default), Anthropic Claude, and stub mode for testing.
Switch provider via LLM_PROVIDER env variable: "openai" | "anthropic" | "stub"
"""

import os
import json
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")  # openai | anthropic | stub
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
LLM_MODEL_OPENAI = os.getenv("LLM_MODEL", "gpt-4o")
LLM_MODEL_ANTHROPIC = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "1500"))


# ─────────────────────────────────────────────
# OPENAI PROVIDER
# ─────────────────────────────────────────────
def _call_openai(system_prompt: str, user_message: str, history: list) -> str:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model=LLM_MODEL_OPENAI,
            messages=messages,
            max_tokens=MAX_TOKENS,
            temperature=0.3,  # Lower = more factual for enterprise use
        )
        return response.choices[0].message.content

    except ImportError:
        raise RuntimeError("openai package not installed. Run: pip install openai")
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        raise


# ─────────────────────────────────────────────
# ANTHROPIC PROVIDER
# ─────────────────────────────────────────────
def _call_anthropic(system_prompt: str, user_message: str, history: list) -> str:
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

        messages = []
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        response = client.messages.create(
            model=LLM_MODEL_ANTHROPIC,
            max_tokens=MAX_TOKENS,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text

    except ImportError:
        raise RuntimeError("anthropic package not installed. Run: pip install anthropic")
    except Exception as e:
        logger.error(f"Anthropic API error: {e}")
        raise


# ─────────────────────────────────────────────
# STUB PROVIDER (no API key needed — for local dev/testing)
# ─────────────────────────────────────────────
def _call_stub(system_prompt: str, user_message: str, history: list) -> str:
    """
    Returns a realistic-looking stub response. 
    Use when LLM_PROVIDER=stub or no API keys are set.
    """
    user_lower = user_message.lower()

    if any(w in user_lower for w in ["revenue", "finance", "profit", "margin"]):
        return (
            "📊 **Financial Analysis**\n\n"
            "Based on SAP financial data, total revenue stands at **$48.75M** with a growth rate of **+12.4% YoY**.\n\n"
            "- **Best performing quarter:** Q4 2024 at $14.25M (+11.3% QoQ)\n"
            "- **Gross margin:** 67.3% — above industry average of 61%\n"
            "- **APAC region** is the fastest-growing at +18.7%, driven by SAP BTP adoption\n\n"
            "**Recommendation:** Increase APAC investment by 15–20% in Q1 2025 to capitalize on momentum.\n\n"
            "_Source: SAP S/4HANA Financial Module — Data as of Nov 2024_"
        )
    elif any(w in user_lower for w in ["supply", "supplier", "inventory", "stock"]):
        return (
            "🚚 **Supply Chain Analysis**\n\n"
            "On-time delivery rate is **94.7%** with 847 open purchase orders.\n\n"
            "**⚠️ Risk Alert:** TechComp Asia (HIGH risk) — geopolitical tariff increases in APAC may impact component costs by 12–18%.\n\n"
            "- GlobalParts Ltd showing delays averaging 8 days in Q3\n"
            "- Safety stock recommended for high-risk SKUs\n\n"
            "**Recommendation:** Qualify 1–2 alternative suppliers for TechComp Asia components within 60 days.\n\n"
            "_Source: SAP Ariba Procurement Module_"
        )
    elif any(w in user_lower for w in ["employee", "hr", "attrition", "headcount"]):
        return (
            "👥 **HR & Workforce Analysis**\n\n"
            "Total headcount: **4,820** with an overall attrition rate of **11.2%**.\n\n"
            "**⚠️ High Risk:** Sales department attrition at **18.4%** — significantly above company average.\n\n"
            "Key drivers: compensation gap vs. market rate, manager NPS scores below threshold.\n\n"
            "**Recommendation:** Conduct immediate compensation benchmarking for Sales team. Consider retention bonus for top performers.\n\n"
            "_Source: SAP SuccessFactors HCM Module_"
        )
    elif any(w in user_lower for w in ["sales", "pipeline", "customer", "deal"]):
        return (
            "💼 **Sales Performance Analysis**\n\n"
            "Pipeline value: **$67M** with a win rate of **31.4%**.\n\n"
            "- Net Revenue Retention: **118.4%** — healthy expansion from existing customers\n"
            "- SAP BTP showing **+47.8% growth** — fastest growing product line\n"
            "- Average sales cycle: 34 days\n\n"
            "**Recommendation:** Invest in BTP cross-sell motions for existing S/4HANA customers.\n\n"
            "_Source: SAP CRM / Sales Cloud Module_"
        )
    else:
        return (
            "🤖 **AI Enterprise Analysis**\n\n"
            "I've analyzed your SAP data across Finance, Supply Chain, Sales, and HR modules.\n\n"
            "**Top 3 actions for this week:**\n"
            "1. Address TechComp Asia supplier risk — HIGH priority\n"
            "2. Review Sales team attrition — compensation benchmarking needed\n"
            "3. Reallocate Q1 budget toward APAC growth markets\n\n"
            "Ask me about a specific area: *revenue*, *supply chain*, *sales pipeline*, *HR attrition*, or *decisions*.\n\n"
            "_Powered by SAP Enterprise AI — Data as of Nov 2024_"
        )


# ─────────────────────────────────────────────
# PUBLIC INTERFACE
# ─────────────────────────────────────────────
def call_llm(
    system_prompt: str,
    user_message: str,
    history: Optional[list] = None,
) -> str:
    """
    Main entry point. Routes to the correct LLM provider.
    
    Args:
        system_prompt: The system/context prompt
        user_message: The user's question
        history: List of previous messages [{role: "user"|"assistant", content: "..."}]
    
    Returns:
        The AI response as a string
    """
    history = history or []

    # Auto-fallback to stub if no API keys are configured
    provider = LLM_PROVIDER
    if provider == "openai" and not OPENAI_API_KEY:
        logger.warning("No OPENAI_API_KEY found — falling back to stub mode")
        provider = "stub"
    if provider == "anthropic" and not ANTHROPIC_API_KEY:
        logger.warning("No ANTHROPIC_API_KEY found — falling back to stub mode")
        provider = "stub"

    logger.info(f"LLM call — provider={provider}, message_length={len(user_message)}")

    if provider == "openai":
        return _call_openai(system_prompt, user_message, history)
    elif provider == "anthropic":
        return _call_anthropic(system_prompt, user_message, history)
    else:
        return _call_stub(system_prompt, user_message, history)
