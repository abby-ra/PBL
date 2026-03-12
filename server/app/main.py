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
from app.api.auth import router as auth_router
from app.api.history import router as history_router
from app.db.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SAP Enterprise Decision Support AI",
    description="Intelligent AI Assistant for Enterprise Decision Support",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Initialize DB on startup ──────────────────
@app.on_event("startup")
def startup():
    init_db()
    logger.info("🚀 SAP Decision AI backend started")

# ── Routers ───────────────────────────────────
app.include_router(auth_router,        prefix="/api", tags=["Auth"])
app.include_router(history_router,     prefix="/api", tags=["History"])
app.include_router(chat_router,        prefix="/api", tags=["AI Chat"])
app.include_router(predictions_router, prefix="/api", tags=["Predictions"])
app.include_router(decisions_router,   prefix="/api", tags=["Decisions"])
app.include_router(analytics_router,   prefix="/api", tags=["Analytics"])

# ── Health ────────────────────────────────────
@app.get("/health", tags=["System"])
def health():
    return {"status": "healthy", "version": "2.0.0"}

@app.get("/", tags=["System"])
def root():
    return {"message": "SAP Enterprise Decision Support AI", "docs": "/docs"}