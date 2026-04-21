from dotenv import load_dotenv
load_dotenv()

import uuid
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from core.config import db, STARTING_BALANCE
from core.security import hash_password
from routes.auth import router as auth_router
from routes.market import router as market_router
from routes.trading import router as trading_router
from routes.portfolio import router as portfolio_router
from routes.ai import router as ai_router
import os

logger = logging.getLogger(__name__)

app = FastAPI(title="SimuTrade API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health():
    return {"status": "ok", "service": "simutrade-api"}


api_router.include_router(auth_router)
api_router.include_router(market_router)
api_router.include_router(trading_router)
api_router.include_router(portfolio_router)
api_router.include_router(ai_router)

app.include_router(api_router)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id")
    await db.sessions.create_index("session_token")
    await db.positions.create_index("user_id")

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@simutrade.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "SimuTrade2024!")
    # Idempotent upsert: keep existing user_id/balance but always refresh password hash + role
    await db.users.update_one(
        {"email": admin_email},
        {
            "$set": {
                "email": admin_email,
                "name": "Admin",
                "password_hash": hash_password(admin_password),
                "role": "admin",
                "auth_type": "email",
                "onboarding_complete": True,
            },
            "$setOnInsert": {
                "user_id": f"user_{uuid.uuid4().hex[:12]}",
                "balance": STARTING_BALANCE,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        },
        upsert=True,
    )


@app.on_event("shutdown")
async def shutdown():
    from core.config import client
    client.close()
