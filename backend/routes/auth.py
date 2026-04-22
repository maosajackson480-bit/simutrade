import uuid
import requests
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request

from core.config import db, STARTING_BALANCE
from core.security import (
    hash_password, verify_password, create_access_token, get_current_user,
)
from models.schemas import (
    RegisterRequest, LoginRequest, GoogleSessionRequest, OnboardingRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/guest")
async def guest():
    """Create a throwaway guest user and return a JWT for instant demo trading.

    Guests auto-expire after 7 days via Mongo TTL index on `guest_expires_at`.
    """
    user_id = f"guest_{uuid.uuid4().hex[:12]}"
    email = f"{user_id}@simutrade.local"
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "email": email,
        "name": "Guest",
        "role": "guest",
        "auth_type": "guest",
        "onboarding_complete": True,
        "balance": STARTING_BALANCE,
        "created_at": now.isoformat(),
        "guest_expires_at": now + timedelta(days=7),
    }
    try:
        await db.users.insert_one(doc)
    except Exception:
        # Extremely rare uuid collision — retry once with a fresh id
        user_id = f"guest_{uuid.uuid4().hex[:12]}"
        doc["user_id"] = user_id
        doc["email"] = f"{user_id}@simutrade.local"
        await db.users.insert_one(doc)
    token = create_access_token(doc["user_id"], doc["email"])
    doc.pop("_id", None)
    doc.pop("guest_expires_at", None)  # internal only
    return {"user": doc, "token": token}


@router.post("/register")
async def register(req: RegisterRequest):
    email = req.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "name": req.name.strip(),
        "password_hash": hash_password(req.password),
        "role": "user",
        "auth_type": "email",
        "onboarding_complete": False,
        "balance": STARTING_BALANCE,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email)
    doc.pop("password_hash")
    doc.pop("_id", None)
    return {"user": doc, "token": token}


@router.post("/login")
async def login(req: LoginRequest):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user.pop("_id", None)
    user.pop("password_hash", None)
    token = create_access_token(user["user_id"], email)
    return {"user": user, "token": token}


@router.post("/google/session")
async def google_session(req: GoogleSessionRequest):
    resp = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": req.session_id},
        timeout=10,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google session")

    data = resp.json()
    email = data["email"].lower()
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name", ""), "picture": data.get("picture", "")}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name", ""),
            "picture": data.get("picture", ""),
            "role": "user",
            "auth_type": "google",
            "onboarding_complete": False,
            "balance": STARTING_BALANCE,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user_doc, "token": session_token}


@router.get("/me")
async def get_me(request: Request):
    return await get_current_user(request)


@router.post("/logout")
async def logout(request: Request):
    await get_current_user(request)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        await db.sessions.delete_one({"session_token": token})
    return {"message": "Logged out"}


@router.put("/onboarding")
async def complete_onboarding(req: OnboardingRequest, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "onboarding_complete": True,
            "experience_level": req.experience_level,
            "risk_tolerance": req.risk_tolerance,
            "trading_goals": req.trading_goals,
        }},
    )
    return {"message": "Onboarding complete"}
