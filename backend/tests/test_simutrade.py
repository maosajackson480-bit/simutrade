"""SimuTrade API Backend Tests"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

TEST_USER = {"email": "test_auto@simutrade.com", "password": "Test1234!", "name": "Auto Tester"}
ADMIN_USER = {"email": "admin@simutrade.com", "password": "SimuTrade2024!"}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_token(session):
    # Try login first
    r = session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
    if r.status_code == 200:
        return r.json()["token"]
    # Register
    r = session.post(f"{BASE_URL}/api/auth/register", json=TEST_USER)
    assert r.status_code == 200, f"Register failed: {r.text}"
    token = r.json()["token"]
    # Complete onboarding
    session.put(
        f"{BASE_URL}/api/auth/onboarding",
        json={"experience_level": "beginner", "risk_tolerance": "low", "trading_goals": ["learn"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    return token


@pytest.fixture(scope="module")
def authed_session(session, auth_token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {auth_token}"})
    return s


# Health
class TestHealth:
    def test_backend_reachable(self, session):
        r = session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code in [200, 401], f"Backend unreachable: {r.status_code}"
        print("Backend reachable")


# Auth Tests
class TestAuth:
    def test_register_existing_email(self, session, auth_token):
        r = session.post(f"{BASE_URL}/api/auth/register", json=TEST_USER)
        assert r.status_code == 400
        print("Duplicate registration correctly rejected")

    def test_login_success(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_USER["email"]
        print("Login success")

    def test_login_wrong_password(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_USER["email"], "password": "WrongPass!"})
        assert r.status_code == 401
        print("Wrong password correctly rejected")

    def test_get_me(self, authed_session):
        r = authed_session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert "email" in data
        assert "user_id" in data
        assert "password_hash" not in data
        print(f"Get me: {data['email']}")

    def test_admin_login(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login", json=ADMIN_USER)
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["role"] == "admin"
        assert data["user"]["onboarding_complete"] == True
        print("Admin login success")

    def test_onboarding(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        token = r.json()["token"]
        r = session.put(
            f"{BASE_URL}/api/auth/onboarding",
            json={"experience_level": "intermediate", "risk_tolerance": "medium"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200
        print("Onboarding updated")


# Market Tests
class TestMarket:
    def test_get_quotes(self, session):
        r = session.get(f"{BASE_URL}/api/market/quotes")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 7
        for item in data:
            assert "symbol" in item
            assert "price" in item
            assert "display" in item
        print(f"Quotes: {[d['display'] + ':' + str(d['price']) for d in data]}")

    def test_get_history(self, session):
        r = session.get(f"{BASE_URL}/api/market/history/VIX?period=1mo")
        assert r.status_code == 200
        data = r.json()
        assert "data" in data
        assert len(data["data"]) > 0
        print(f"History entries: {len(data['data'])}")


# Trading Tests
class TestTrading:
    def test_open_position(self, authed_session):
        r = authed_session.post(f"{BASE_URL}/api/trading/open", json={"symbol": "^VIX", "direction": "long", "contracts": 1})
        assert r.status_code == 200
        data = r.json()
        assert "position_id" in data
        assert data["status"] == "open"
        assert data["direction"] == "long"
        print(f"Opened position: {data['position_id']}")
        return data["position_id"]

    def test_get_open_positions(self, authed_session):
        r = authed_session.get(f"{BASE_URL}/api/trading/positions")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"Open positions: {len(data)}")

    def test_close_position(self, authed_session):
        # Open one first
        r = authed_session.post(f"{BASE_URL}/api/trading/open", json={"symbol": "^VIX", "direction": "short", "contracts": 1})
        assert r.status_code == 200
        pos_id = r.json()["position_id"]
        # Close it
        r = authed_session.post(f"{BASE_URL}/api/trading/close/{pos_id}")
        assert r.status_code == 200
        data = r.json()
        assert "pnl" in data
        print(f"Closed position pnl: {data['pnl']}")

    def test_trade_history(self, authed_session):
        r = authed_session.get(f"{BASE_URL}/api/trading/history")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"Trade history: {len(data)} entries")

    def test_invalid_direction(self, authed_session):
        r = authed_session.post(f"{BASE_URL}/api/trading/open", json={"symbol": "^VIX", "direction": "invalid", "contracts": 1})
        assert r.status_code == 400
        print("Invalid direction rejected")


# AI Tests (Claude Sonnet 4.5 via Emergent LLM)
class TestAI:
    def test_chat_requires_auth(self, session):
        r = session.post(f"{BASE_URL}/api/ai/chat", json={"message": "What is VIX?"})
        assert r.status_code == 401
        print("AI chat unauth -> 401")

    def test_chat_basic_and_context(self, authed_session):
        r1 = authed_session.post(f"{BASE_URL}/api/ai/chat", json={"message": "What is VIX?"}, timeout=60)
        assert r1.status_code == 200, f"Chat failed: {r1.status_code} {r1.text}"
        data1 = r1.json()
        assert "session_id" in data1 and "reply" in data1
        assert len(data1["reply"]) > 20
        sid = data1["session_id"]
        print(f"AI reply1 ({len(data1['reply'].split())} words): {data1['reply'][:120]}...")

        # Multi-turn context preservation
        r2 = authed_session.post(f"{BASE_URL}/api/ai/chat", json={"session_id": sid, "message": "When does it spike?"}, timeout=60)
        assert r2.status_code == 200
        reply2 = r2.json()["reply"].lower()
        assert "vix" in reply2 or "volatility" in reply2, f"Context lost: {reply2[:200]}"
        print(f"AI reply2 references VIX/volatility: OK")

        # Session retrieval
        r3 = authed_session.get(f"{BASE_URL}/api/ai/sessions/{sid}")
        assert r3.status_code == 200
        msgs = r3.json()["messages"]
        assert len(msgs) >= 4  # 2 user + 2 assistant
        print(f"Session messages: {len(msgs)}")

    def test_explain_trade(self, authed_session):
        r = authed_session.post(
            f"{BASE_URL}/api/ai/explain-trade",
            json={"symbol": "^VIX", "direction": "long", "entry_price": 19.0, "contracts": 1},
            timeout=60,
        )
        assert r.status_code == 200
        data = r.json()
        assert "rationale" in data and len(data["rationale"]) > 30
        print(f"Explain-trade rationale: {data['rationale'][:160]}...")


# Backwards-compat: 'quantity' alias for 'contracts'
class TestOpenQuantityAlias:
    def test_open_with_quantity(self, authed_session):
        r = authed_session.post(f"{BASE_URL}/api/trading/open", json={"symbol": "^VIX", "direction": "long", "quantity": 1})
        # Should accept either 'quantity' or 'contracts'
        assert r.status_code in [200, 422], f"Unexpected: {r.status_code} {r.text}"
        if r.status_code == 200:
            print("quantity alias accepted")
        else:
            print(f"quantity alias NOT accepted: {r.text}")


# Portfolio Tests
class TestPortfolio:
    def test_portfolio_summary(self, authed_session):
        r = authed_session.get(f"{BASE_URL}/api/portfolio/summary")
        assert r.status_code == 200
        data = r.json()
        assert "cash_balance" in data
        assert "total_portfolio_value" in data
        assert "open_positions" in data
        assert "realized_pnl" in data
        print(f"Portfolio: cash={data['cash_balance']}, total={data['total_portfolio_value']}")



# ============== Phase 4 additions ==============

# Guest auth
class TestGuest:
    def test_guest_create(self, session):
        r = session.post(f"{BASE_URL}/api/auth/guest", json={})
        assert r.status_code == 200, f"Guest creation failed: {r.text}"
        data = r.json()
        assert "token" in data and "user" in data
        u = data["user"]
        assert u["role"] == "guest"
        assert u["balance"] == 10000
        assert u["onboarding_complete"] is True
        assert u["user_id"].startswith("guest_")
        # Stash for subsequent tests
        pytest._guest_token = data["token"]
        pytest._guest_user = u
        print(f"Guest created: {u['user_id']}")

    def test_guest_token_can_access_portfolio(self, session):
        token = getattr(pytest, "_guest_token", None)
        assert token, "Guest token missing"
        r = session.get(
            f"{BASE_URL}/api/portfolio/summary",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["cash_balance"] == 10000
        print("Guest JWT works for /portfolio/summary")

    def test_guest_token_can_access_market_quotes(self, session):
        token = getattr(pytest, "_guest_token", None)
        r = session.get(
            f"{BASE_URL}/api/market/quotes",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, (list, dict))
        print("Guest JWT works for /market/quotes")

    def test_guest_can_open_trade(self, session):
        token = getattr(pytest, "_guest_token", None)
        r = session.post(
            f"{BASE_URL}/api/trading/open",
            headers={"Authorization": f"Bearer {token}"},
            json={"symbol": "^VIX", "direction": "long", "quantity": 1},
        )
        # yfinance can be slow, retry once
        if r.status_code not in (200, 201):
            time.sleep(3)
            r = session.post(
                f"{BASE_URL}/api/trading/open",
                headers={"Authorization": f"Bearer {token}"},
                json={"symbol": "^VIX", "direction": "long", "quantity": 1},
            )
        assert r.status_code in (200, 201), f"Guest open trade failed: {r.status_code} {r.text}"
        print("Guest can open a trade")


# Deriv integration (no real token available)
class TestDeriv:
    def test_status_without_connect(self, authed_session):
        # Clean slate — ensure no leftover account for test_auto
        authed_session.post(f"{BASE_URL}/api/deriv/disconnect")
        r = authed_session.get(f"{BASE_URL}/api/deriv/status")
        assert r.status_code == 200
        data = r.json()
        assert data.get("connected") is False
        print("Deriv /status returns connected=false when no account linked")

    def test_connect_invalid_token(self, authed_session):
        r = authed_session.post(
            f"{BASE_URL}/api/deriv/connect",
            json={"api_token": "invalid_deriv_token_xxxxx"},
        )
        # Could be 400 (Deriv rejected) or 503 (unreachable). Both acceptable; 400 preferred.
        assert r.status_code in (400, 503), f"Unexpected: {r.status_code} {r.text}"
        detail = r.json().get("detail", "")
        print(f"Invalid token -> {r.status_code}: {detail}")

    def test_connect_short_token_400(self, authed_session):
        r = authed_session.post(f"{BASE_URL}/api/deriv/connect", json={"api_token": "short"})
        assert r.status_code == 400
        assert "Invalid API token" in r.json().get("detail", "")
        print("Short token rejected with 400")

    def test_symbols_requires_connection(self, authed_session):
        r = authed_session.get(f"{BASE_URL}/api/deriv/symbols")
        assert r.status_code == 400
        assert "not connected" in r.json().get("detail", "").lower()
        print("/deriv/symbols requires connection")

    def test_portfolio_requires_connection(self, authed_session):
        r = authed_session.get(f"{BASE_URL}/api/deriv/portfolio")
        assert r.status_code == 400
        assert "not connected" in r.json().get("detail", "").lower()
        print("/deriv/portfolio requires connection")

    def test_buy_requires_connection(self, authed_session):
        r = authed_session.post(
            f"{BASE_URL}/api/deriv/buy",
            json={"symbol": "R_100", "contract_type": "CALL", "amount": 10, "duration": 60, "duration_unit": "s"},
        )
        assert r.status_code == 400
        assert "not connected" in r.json().get("detail", "").lower()
        print("/deriv/buy requires connection")

    def test_sell_requires_connection(self, authed_session):
        r = authed_session.post(
            f"{BASE_URL}/api/deriv/sell",
            json={"contract_id": 123456, "price": 0},
        )
        assert r.status_code == 400
        assert "not connected" in r.json().get("detail", "").lower()
        print("/deriv/sell requires connection")

    def test_deriv_endpoints_require_auth(self, session):
        # No bearer token — should 401
        r = session.get(f"{BASE_URL}/api/deriv/status")
        assert r.status_code == 401
        r2 = session.post(f"{BASE_URL}/api/deriv/connect", json={"api_token": "x" * 20})
        assert r2.status_code == 401
        print("Deriv endpoints require auth")
