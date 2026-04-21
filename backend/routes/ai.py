import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List

from emergentintegrations.llm.chat import LlmChat, UserMessage

from core.config import db
from core.security import get_current_user
from core.market import fetch_quote, VOLATILITY_INDICES

router = APIRouter(prefix="/ai", tags=["ai"])

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

ASSISTANT_SYSTEM = """You are SimuBot, the educational AI assistant for SimuTrade — a volatility-index
trading SIMULATOR. Your job is to help users LEARN about volatility instruments
(VIX, VXN, VVIX, OVX, GVZ, EVZ, RVX) in plain English.

STRICT RULES:
- NEVER give personalized financial advice or price predictions.
- Always frame responses educationally: "Historically...", "Traders often...", "One interpretation is...".
- Remind users at least once per conversation: "This is a simulation — no real money is at risk."
- Keep answers concise (<= 180 words) and jargon-light. Offer to expand on any term.
- If the user asks for a "buy/sell recommendation", politely decline and instead explain the trade-offs
  of both directions.
- When live quote context is provided, reference it naturally (e.g. "With VIX at 19 right now…").
"""

EXPLAIN_SYSTEM = """You are a concise volatility-trading educator. Given a simulated position,
produce a 2-3 sentence plain-English rationale covering:
1) what this position means in volatility terms,
2) what market condition would make it profit,
3) one key risk.
Never claim prediction certainty. Output plain prose only — no bullets, no markdown, no preamble."""


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str


class ExplainTradeRequest(BaseModel):
    symbol: str
    direction: str
    entry_price: float
    contracts: float


def _build_market_context() -> str:
    lines = []
    for idx in VOLATILITY_INDICES[:4]:  # top 4 to keep prompt short
        q = fetch_quote(idx["symbol"])
        if q["price"] > 0:
            sign = "+" if q["change_pct"] >= 0 else ""
            lines.append(f"- {idx['display']} ({idx['name']}): {q['price']} ({sign}{q['change_pct']}%)")
    return "Current volatility indices:\n" + "\n".join(lines) if lines else ""


@router.post("/chat")
async def ai_chat(req: ChatRequest, request: Request):
    if not EMERGENT_KEY:
        raise HTTPException(status_code=503, detail="AI assistant not configured")
    user = await get_current_user(request)

    session_id = req.session_id or f"sess_{uuid.uuid4().hex[:10]}"

    # Load last 10 messages from this session to preserve context
    history = await db.ai_messages.find(
        {"user_id": user["user_id"], "session_id": session_id},
        {"_id": 0},
    ).sort("created_at", 1).to_list(10)

    market_ctx = _build_market_context()
    system = ASSISTANT_SYSTEM + ("\n\n" + market_ctx if market_ctx else "")

    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    # Replay prior turns so the library keeps context
    for msg in history:
        if msg["role"] == "user":
            await chat.send_message(UserMessage(text=msg["content"]))

    try:
        reply = await chat.send_message(UserMessage(text=req.message))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    now = datetime.now(timezone.utc).isoformat()
    await db.ai_messages.insert_many([
        {"user_id": user["user_id"], "session_id": session_id, "role": "user",
         "content": req.message, "created_at": now},
        {"user_id": user["user_id"], "session_id": session_id, "role": "assistant",
         "content": reply, "created_at": now},
    ])

    return {"session_id": session_id, "reply": reply}


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, request: Request):
    user = await get_current_user(request)
    msgs = await db.ai_messages.find(
        {"user_id": user["user_id"], "session_id": session_id},
        {"_id": 0},
    ).sort("created_at", 1).to_list(100)
    return {"session_id": session_id, "messages": msgs}


@router.post("/explain-trade")
async def explain_trade(req: ExplainTradeRequest, request: Request):
    if not EMERGENT_KEY:
        raise HTTPException(status_code=503, detail="AI assistant not configured")
    await get_current_user(request)

    q = fetch_quote(req.symbol)
    prompt = (
        f"Simulated position: {req.direction.upper()} {req.contracts} contracts of "
        f"{req.symbol} at entry price {req.entry_price}. "
        f"Current price: {q['price']} (change {q['change_pct']}%). "
        f"Write the 2-3 sentence rationale now."
    )

    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=f"explain_{uuid.uuid4().hex[:8]}",
        system_message=EXPLAIN_SYSTEM,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    try:
        reply = await chat.send_message(UserMessage(text=prompt))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    return {"symbol": req.symbol, "rationale": reply}
