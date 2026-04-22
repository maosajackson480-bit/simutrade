import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from core.config import db
from core.security import get_current_user
from core.crypto import encrypt, decrypt
from core.deriv_client import DerivClient, DerivError, stream_ticks

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/deriv", tags=["deriv"])


class ConnectRequest(BaseModel):
    api_token: str


class BuyRequest(BaseModel):
    symbol: str
    contract_type: str  # e.g. "CALL", "PUT"
    amount: float
    duration: int = 60
    duration_unit: str = "s"  # s, m, h, d, t


class SellRequest(BaseModel):
    contract_id: int
    price: float = 0


async def _get_token(user: dict) -> str:
    acc = await db.deriv_accounts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not acc:
        raise HTTPException(status_code=400, detail="Deriv account not connected")
    try:
        return decrypt(acc["encrypted_token"])
    except ValueError:
        raise HTTPException(status_code=500, detail="Stored token is corrupted; reconnect Deriv")


@router.post("/connect")
async def connect_deriv(req: ConnectRequest, request: Request):
    user = await get_current_user(request)
    token = req.api_token.strip()
    if not token or len(token) < 8:
        raise HTTPException(status_code=400, detail="Invalid API token")

    try:
        async with DerivClient(token) as c:
            auth = await c.authorize()
            bal = await c.balance()
    except DerivError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Deriv connect failure: {e}")
        raise HTTPException(status_code=503, detail="Unable to reach Deriv. Try again.")

    await db.deriv_accounts.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "user_id": user["user_id"],
            "encrypted_token": encrypt(token),
            "account_id": auth.get("loginid"),
            "account_type": "demo" if auth.get("is_virtual") else "real",
            "email": auth.get("email"),
            "currency": auth.get("currency", "USD"),
            "connected_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )

    return {
        "connected": True,
        "account_id": auth.get("loginid"),
        "account_type": "demo" if auth.get("is_virtual") else "real",
        "email": auth.get("email"),
        "currency": auth.get("currency", "USD"),
        "balance": bal.get("balance", 0),
    }


@router.post("/disconnect")
async def disconnect_deriv(request: Request):
    user = await get_current_user(request)
    await db.deriv_accounts.delete_one({"user_id": user["user_id"]})
    return {"connected": False}


@router.get("/status")
async def deriv_status(request: Request):
    user = await get_current_user(request)
    acc = await db.deriv_accounts.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "encrypted_token": 0},
    )
    if not acc:
        return {"connected": False}

    token = await _get_token(user)
    try:
        async with DerivClient(token) as c:
            await c.authorize()
            bal = await c.balance()
        acc["connected"] = True
        acc["balance"] = bal.get("balance", 0)
    except Exception as e:
        logger.warning(f"Deriv status refresh failed: {e}")
        acc["connected"] = False
        acc["fallback"] = "Deriv API unreachable — falling back to Demo Mode."
    return acc


@router.get("/symbols")
async def get_symbols(request: Request):
    user = await get_current_user(request)
    token = await _get_token(user)
    try:
        async with DerivClient(token) as c:
            await c.authorize()
            syms = await c.active_symbols()
    except DerivError as e:
        raise HTTPException(status_code=400, detail=str(e))
    # Keep the response trim
    return [
        {
            "symbol": s.get("symbol"),
            "display_name": s.get("display_name"),
            "market": s.get("market"),
            "submarket": s.get("submarket_display_name"),
            "pip": s.get("pip"),
        }
        for s in syms[:120]
    ]


@router.get("/portfolio")
async def get_portfolio(request: Request):
    user = await get_current_user(request)
    token = await _get_token(user)
    try:
        async with DerivClient(token) as c:
            await c.authorize()
            contracts = await c.portfolio()
            history = await c.profit_table(limit=25)
    except DerivError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"open": contracts, "history": history}


@router.post("/buy")
async def place_buy(req: BuyRequest, request: Request):
    user = await get_current_user(request)
    token = await _get_token(user)
    try:
        async with DerivClient(token) as c:
            auth = await c.authorize()
            currency = auth.get("currency", "USD")
            prop = await c.proposal(
                symbol=req.symbol,
                contract_type=req.contract_type,
                amount=req.amount,
                duration=req.duration,
                duration_unit=req.duration_unit,
                currency=currency,
            )
            pid = prop.get("id")
            ask_price = prop.get("ask_price", req.amount)
            if not pid:
                raise DerivError("Proposal did not return an id")
            result = await c.buy(pid, ask_price)
    except DerivError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "contract_id": result.get("contract_id"),
        "buy_price": result.get("buy_price"),
        "payout": result.get("payout"),
        "start_time": result.get("start_time"),
        "longcode": result.get("longcode"),
    }


@router.post("/sell")
async def place_sell(req: SellRequest, request: Request):
    user = await get_current_user(request)
    token = await _get_token(user)
    try:
        async with DerivClient(token) as c:
            await c.authorize()
            result = await c.sell(req.contract_id, req.price)
    except DerivError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "sold_for": result.get("sold_for"),
        "contract_id": result.get("contract_id"),
        "reference_id": result.get("reference_id"),
    }


@router.websocket("/ticks/{symbol}")
async def tick_stream(ws: WebSocket, symbol: str, token: str):
    """Client connects to /api/deriv/ticks/{symbol}?token=<jwt>.
    We validate the JWT, fetch stored Deriv token, then proxy tick stream."""
    await ws.accept()
    # Manual JWT auth (can't use Depends on websocket easily)
    import jwt as _jwt
    from core.config import JWT_SECRET, JWT_ALG
    try:
        payload = _jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = payload["sub"]
    except Exception:
        await ws.close(code=1008)
        return

    acc = await db.deriv_accounts.find_one({"user_id": user_id}, {"_id": 0})
    if not acc:
        await ws.close(code=1008)
        return

    try:
        deriv_token = decrypt(acc["encrypted_token"])
    except ValueError:
        await ws.close(code=1011)
        return

    stop = asyncio.Event()

    async def pump(tick):
        try:
            await ws.send_json(tick)
        except Exception:
            stop.set()

    task = asyncio.create_task(stream_ticks(deriv_token, symbol, pump, stop))
    try:
        while not stop.is_set():
            # Keep-alive; ignore any client messages
            try:
                await asyncio.wait_for(ws.receive_text(), timeout=30)
            except asyncio.TimeoutError:
                continue
            except WebSocketDisconnect:
                break
    finally:
        stop.set()
        task.cancel()
        try:
            await task
        except Exception:
            pass
        try:
            await ws.close()
        except Exception:
            pass
