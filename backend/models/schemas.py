from typing import List, Optional
from pydantic import BaseModel
from fastapi import HTTPException


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleSessionRequest(BaseModel):
    session_id: str


class OnboardingRequest(BaseModel):
    experience_level: str
    risk_tolerance: str
    trading_goals: List[str] = []


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class TradeRequest(BaseModel):
    symbol: str
    direction: str
    contracts: Optional[float] = None
    quantity: Optional[float] = None

    def size(self) -> float:
        val = self.contracts if self.contracts is not None else self.quantity
        if val is None:
            raise HTTPException(status_code=400, detail="Either 'contracts' or 'quantity' is required")
        return float(val)
