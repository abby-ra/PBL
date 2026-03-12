"""
/api/auth — Register, Login, Get current user
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import timedelta

from app.db.database import get_db
from app.db import crud
from app.core.security import (
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.db.crud import log_activity

router = APIRouter()


# ── Schemas ──────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "viewer"          # viewer | admin


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


# ── Endpoints ────────────────────────────────
@router.post("/auth/register", response_model=UserResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check duplicate email
    existing = crud.get_user_by_email(db, request.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate password length
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = crud.create_user(
        db,
        name=request.name,
        email=request.email,
        password=request.password,
        role=request.role,
    )

    # Log activity
    log_activity(db, user.id, "register", f"New user registered: {user.email}")

    return user


@router.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login and receive a JWT access token."""
    user = crud.get_user_by_email(db, request.email)

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Create JWT
    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    # Update last login
    crud.update_last_login(db, user.id)

    # Log activity
    log_activity(db, user.id, "login", f"User logged in: {user.email}")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }


@router.post("/auth/logout")
def logout(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout — logs the activity (token invalidation handled client-side)."""
    log_activity(db, current_user.id, "logout", f"User logged out: {current_user.email}")
    return {"message": "Logged out successfully"}


@router.get("/auth/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    """Get currently logged-in user's profile."""
    return current_user


@router.get("/auth/users")
def get_all_users(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin only — list all users."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = crud.get_all_users(db)
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "created_at": u.created_at} for u in users]