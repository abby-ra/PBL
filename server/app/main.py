"""
Main FastAPI application — SAP Enterprise Decision Support AI Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.api.chat import router as chat_router
from app.api.predictions import router as predictions_router
from app.api.decisions import router as decisions_router
from app.api.analytics import router as analytics_router

# ─────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# APP INIT
# ─────────────────────────────────────────────
app = FastAPI(
    title="SAP Enterprise Decision Support AI",
    description="Intelligent AI Assistant for Enterprise Decision Support",
    version="1.0.0",
    docs_url="/docs",       # Swagger UI at /docs
    redoc_url="/redoc",     # ReDoc at /redoc
)

# ─────────────────────────────────────────────
# CORS — allow your React frontend to call the API
# ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React dev server
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# ROUTERS
# ─────────────────────────────────────────────
app.include_router(chat_router, prefix="/api", tags=["AI Chat"])
app.include_router(predictions_router, prefix="/api", tags=["Predictions"])
app.include_router(decisions_router, prefix="/api", tags=["Decisions"])
app.include_router(analytics_router, prefix="/api", tags=["Analytics"])


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "SAP Enterprise Decision Support AI",
        "version": "1.0.0",
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "SAP Enterprise Decision Support AI — Backend Running",
        "docs": "/docs",
        "health": "/health",
    }
