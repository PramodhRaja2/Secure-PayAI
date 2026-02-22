import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
if os.getenv("GEMINI_API_KEY"):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

from fastapi import FastAPI, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional, List, Dict
from engines.fx_engine import FXEngine
from engines.biometric_engine import BiometricEngine
from fastapi.middleware.cors import CORSMiddleware
from services.fx_service import get_live_fx_rates
from datetime import datetime, timedelta
import uuid
from database import init_db, SessionLocal, Transaction, UserProfile, Alert
from sqlalchemy import func
import json
from fastapi import WebSocket, WebSocketDisconnect

sessions = {} # token -> username

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {} # user_id -> websocket

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()

app = FastAPI(
    title="SecurePay Optimizer AI V4.0",
    description="Enterprise Identity & Specialized Governance",
    version="4.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "https://secure-pay-ai.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"ERROR: {exc}")
    traceback.print_exc()
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=500, content={"detail": str(exc)})

fx_engine = FXEngine()
biometric_engine = BiometricEngine()

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SUPPORTED_CURRENCIES = [
    {"code": "USD", "name": "US Dollar", "symbol": "$", "flag": "🇺🇸"},
    {"code": "EUR", "name": "Euro", "symbol": "€", "flag": "🇪🇺"},
    {"code": "GBP", "name": "British Pound", "symbol": "£", "flag": "🇬🇧"},
    {"code": "INR", "name": "Indian Rupee", "symbol": "₹", "flag": "🇮🇳"},
    {"code": "JPY", "name": "Japanese Yen", "symbol": "¥", "flag": "🇯🇵"},
    {"code": "AED", "name": "UAE Dirham", "symbol": "د.إ", "flag": "🇦🇪"},
    {"code": "NGN", "name": "Nigerian Naira", "symbol": "₦", "flag": "🇳🇬"},
]

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    primary_location: str

class PreferenceRequest(BaseModel):
    user_id: int
    preference: str

class TransactionRequest(BaseModel):
    amount: float
    base_currency: str
    target_currency: str
    priority: Optional[str] = "balanced"
    typing_speed: Optional[float] = 62
    mouse_velocity: Optional[float] = 450
    ip_location: Optional[str] = "NY"
    lat_long: Optional[List[float]] = [40.7128, -74.0060]
    device: Optional[str] = "Chrome/Windows"
    session_hour: Optional[int] = 12
    is_copy_paste: Optional[bool] = False
    is_vpn: Optional[bool] = False

class AdvisorRequest(BaseModel):
    message: str
    user_id: int

@app.get("/")
async def root():
    from services.fx_service import get_cache_status
    return {
        "status": "online",
        "service": "SecurePay AI V4.0",
        "cache_status": get_cache_status()
    }

@app.post("/login")
async def login(req: LoginRequest):
    db = SessionLocal()
    user = db.query(UserProfile).filter(func.lower(UserProfile.username) == req.username.lower()).first()
    
    if user and user.password == req.password:
        if user.is_blocked:
            db.close()
            raise HTTPException(status_code=403, detail="Account is blocked. Contact Admin.")
        
        # Enforce single session per user: revoke existing tokens
        stale_tokens = [tok for tok, un in sessions.items() if un.lower() == user.username.lower()]
        for tok in stale_tokens:
            del sessions[tok]
            
        token = str(uuid.uuid4())
        sessions[token] = user.username
        # Store metadata in response for frontend
        res = {
            "token": token,
            "role": user.role,
            "name": user.username.capitalize(),
            "id": user.id,
            "region": user.primary_location,
            "preference": user.preferred_priority
        }
        db.close()
        return res
    
    if db:
        db.close()
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/register")
async def register(req: RegisterRequest):
    db = SessionLocal()
    existing_user = db.query(UserProfile).filter(func.lower(UserProfile.username) == req.username.lower()).first()
    if existing_user:
        db.close()
        raise HTTPException(status_code=400, detail="Username already taken")
    
    new_user = UserProfile(
        username=req.username,
        password=req.password,
        role="user",
        primary_location=req.primary_location
    )
    db.add(new_user)
    db.commit()
    
    # Enforce single session per user: revoke existing tokens (just in case)
    stale_tokens = [tok for tok, un in sessions.items() if un.lower() == new_user.username.lower()]
    for tok in stale_tokens:
        del sessions[tok]
        
    # Auto-login the newly created user
    token = str(uuid.uuid4())
    sessions[token] = new_user.username
    res = {
        "token": token,
        "role": new_user.role,
        "name": new_user.username.capitalize(),
        "id": new_user.id,
        "region": new_user.primary_location,
        "preference": new_user.preferred_priority
    }
    db.close()
    return res

# --- USER ENDPOINTS ---

@app.patch("/user/preferences")
async def update_preferences(req: PreferenceRequest):
    db = SessionLocal()
    user = db.query(UserProfile).filter(UserProfile.id == req.user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
    user.preferred_priority = req.preference
    db.commit()
    db.close()
    return {"status": "success", "preference": req.preference}

@app.post("/user/message")
async def send_user_message(payload: dict):
    # payload: { user_id, username, message }
    db = SessionLocal()
    # Find dev user to be the recipient of reports
    dev = db.query(UserProfile).filter(UserProfile.role == "dev").first()
    if not dev:
        db.close()
        raise HTTPException(status_code=404, detail="No DevOps found")
    new_msg = Alert(
        user_id=dev.id,
        from_user_id=payload.get("user_id"),
        from_username=payload.get("username"),
        type="user_message",
        message=payload.get("message", "")
    )
    db.add(new_msg)
    db.commit()
    
    # Real-time broadcast to dev
    msg_data = {
        "id": new_msg.id,
        "user_id": new_msg.user_id,
        "from_user_id": new_msg.from_user_id,
        "from_username": new_msg.from_username,
        "type": new_msg.type,
        "message": new_msg.message,
        "time": new_msg.time
    }
    await manager.send_personal_message(msg_data, dev.id)
    
    db.close()
    return {"status": "sent"}

@app.get("/admin/messages")
async def get_admin_messages():
    db = SessionLocal()
    admin = db.query(UserProfile).filter(UserProfile.role == "admin").first()
    if not admin:
        db.close()
        return []
    msgs = db.query(Alert).filter(Alert.user_id == admin.id, Alert.type == "user_message").order_by(Alert.time.desc()).all()
    db.close()
    return msgs

@app.delete("/admin/messages/clear")
async def clear_admin_messages(authorization: str = Header(None)):
    db = SessionLocal()
    token = authorization
    if not token or token not in sessions or sessions[token] != "admin":
        db.close()
        raise HTTPException(status_code=403, detail="Only Admins can clear the support inbox")
    
    admin = db.query(UserProfile).filter(UserProfile.role == "admin").first()
    if admin:
        db.query(Alert).filter(Alert.user_id == admin.id, Alert.type == "user_message").delete()
        db.commit()
    db.close()
    return {"status": "success"}

# --- DEV ENDPOINTS ---

@app.get("/dev/pending")
async def get_pending_transactions():
    db = SessionLocal()
    pending = db.query(Transaction).filter(Transaction.status == "pending").order_by(Transaction.time.desc()).all()
    db.close()
    return [{"id": t.id, "time": t.time, "amount": t.amount, "base_currency": t.base_currency,
             "target_currency": t.target_currency, "risk_score": t.risk_score, "risk_level": t.risk_level,
             "location": t.location, "device": t.device, "status": t.status} for t in pending]

@app.patch("/dev/transactions/{txn_id}/review")
async def review_transaction(txn_id: int, payload: dict):
    # payload: { action: "approve" | "deny" }
    db = SessionLocal()
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        db.close()
        raise HTTPException(status_code=404, detail="Transaction not found")
    action = payload.get("action")
    if action == "approve":
        txn.approved = True
        txn.status = "dev_approved"
    elif action == "deny":
        txn.approved = False
        txn.status = "dev_denied"
    else:
        db.close()
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'deny'.")
    db.commit()
    db.close()
    return {"status": "success", "action": action, "txn_id": txn_id}

@app.get("/dev/stats")
async def get_dev_stats():
    db = SessionLocal()
    total = db.query(Transaction).count()
    pending = db.query(Transaction).filter(Transaction.status == "pending").count()
    approved = db.query(Transaction).filter(Transaction.approved == True).count()
    denied = db.query(Transaction).filter(Transaction.approved == False, Transaction.status != "pending").count()
    users = db.query(UserProfile).count()
    db.close()
    return {"total_transactions": total, "pending": pending, "approved": approved, "denied": denied, "total_users": users}

@app.get("/dev/messages")
async def get_dev_messages():
    db = SessionLocal()
    dev = db.query(UserProfile).filter(UserProfile.role == "dev").first()
    msgs = db.query(Alert).filter(Alert.user_id == dev.id).order_by(Alert.time.desc()).all() if dev else []
    db.close()
    return msgs

@app.delete("/dev/messages/clear")
async def clear_dev_messages(authorization: str = Header(None)):
    db = SessionLocal()
    if not authorization or authorization not in sessions:
        db.close()
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    un = sessions[authorization]
    dev = db.query(UserProfile).filter(UserProfile.username == un, UserProfile.role == "dev").first()
    if not dev:
        db.close()
        raise HTTPException(status_code=403, detail="Only DevOps can clear this terminal")
    
    db.query(Alert).filter(Alert.user_id == dev.id).delete()
    db.commit()
    db.close()
    return {"status": "success"}

@app.get("/dev/users")
async def get_dev_users():
    db = SessionLocal()
    users = db.query(UserProfile).all()
    db.close()
    return [{"id": u.id, "username": u.username, "role": u.role} for u in users]

@app.post("/dev/message")
async def send_dev_message(payload: dict, authorization: str = Header(None)):
    # payload: { target_id: int, message: str }
    db = SessionLocal()
    sender_name = "DEVOPS"
    if authorization and authorization in sessions:
        sender_name = sessions[authorization] # Track actual dev username
        
    target_id = payload.get("target_id")
    msg_text = payload.get("message")
    if target_id == 0:
        # Broadcast
        users = db.query(UserProfile).filter(UserProfile.role != "dev").all()
        for u in users:
            db.add(Alert(user_id=u.id, from_username=sender_name, type="info", message=msg_text))
    else:
        db.add(Alert(user_id=target_id, from_username=sender_name, type="info", message=msg_text))
    db.commit()

    # Real-time broadcast
    msg_data = {
        "from_username": sender_name,
        "type": "info",
        "message": msg_text,
        "time": datetime.now().isoformat()
    }

    if target_id == 0:
        await manager.broadcast(msg_data)
    else:
        await manager.send_personal_message(msg_data, target_id)

    db.close()
    return {"status": "sent"}

@app.delete("/dev/wipe")
async def wipe_database(authorization: str = Header(None)):
    db = SessionLocal()
    requester = None
    if authorization and authorization in sessions:
        req_username = sessions[authorization]
        requester = db.query(UserProfile).filter(UserProfile.username == req_username).first()
    
    if not requester or requester.role != "dev":
        db.close()
        raise HTTPException(status_code=403, detail="Only DevOps can wipe the database")
    
    # Wipe transactions and alerts, preserve profiles
    db.query(Transaction).delete()
    db.query(Alert).delete()
    db.commit()
    db.close()
    return {"status": "success", "message": "Database wiped successfully. Users preserved."}

# --- ADMIN ENDPOINTS ---

@app.get("/admin/users")
async def list_users(authorization: str = Header(None)):
    db = SessionLocal()
    requester = None
    if authorization and authorization in sessions:
        req_username = sessions[authorization]
        requester = db.query(UserProfile).filter(UserProfile.username == req_username).first()

    users = db.query(UserProfile).all()
    if not requester or requester.role != "dev":
        users = [u for u in users if u.role != "dev"]
        
    db.close()
    return users

@app.post("/admin/users")
async def create_user(req: LoginRequest):
    db = SessionLocal()
    if db.query(UserProfile).filter(func.lower(UserProfile.username) == req.username.lower()).first():
        db.close()
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = UserProfile(username=req.username, password=req.password, role="user")
    db.add(new_user)
    db.commit()
    db.close()
    return {"status": "success"}

@app.patch("/admin/users/{user_id}/block")
async def toggle_block_user(user_id: int):
    db = SessionLocal()
    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == "dev":
        db.close()
        raise HTTPException(status_code=403, detail="Dev account cannot be blocked")
    
    user.is_blocked = not user.is_blocked
    db.commit()
    is_blocked_status = user.is_blocked
    db.close()
    return {"status": "success", "is_blocked": is_blocked_status}

@app.patch("/admin/users/{user_id}/role")
async def toggle_user_role(user_id: int):
    db = SessionLocal()
    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.username == "admin":
        db.close()
        raise HTTPException(status_code=400, detail="Cannot modify primary admin")

    if user.role == "dev":
        db.close()
        raise HTTPException(status_code=403, detail="Dev role cannot be changed")
    
    user.role = "admin" if user.role == "user" else "user"
    db.commit()
    new_role = user.role
    db.close()
    return {"status": "success", "role": new_role}

@app.delete("/admin/users/{user_id}")
async def delete_user(user_id: int, authorization: str = Header(None)):
    db = SessionLocal()
    requester = None
    if authorization and authorization in sessions:
        req_username = sessions[authorization]
        requester = db.query(UserProfile).filter(UserProfile.username == req_username).first()

    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    is_dev = requester and requester.role == "dev"
    if not is_dev:
        if user.role == "dev":
            db.close()
            raise HTTPException(status_code=403, detail="Protected account cannot be deleted")
        if user.role == "admin" and (not requester or requester.id != user.id):
            db.close()
            raise HTTPException(status_code=403, detail="Admins can only delete their own admin account")
    
    db.delete(user)
    db.commit()
    db.close()
    return {"status": "success"}

@app.post("/admin/alerts")
async def send_alert(alert: dict, authorization: str = Header(None)):
    # alert: { "user_id": int, "message": str, "type": str }
    db = SessionLocal()
    sender_name = "ADMIN"
    if authorization and authorization in sessions:
        sender_name = sessions[authorization]
        
    new_alert = Alert(
        user_id=alert["user_id"],
        message=alert["message"],
        from_username=sender_name,
        type=alert.get("type", "security")
    )
    db.add(new_alert)
    db.commit()

    # Real-time broadcast
    msg_data = {
        "id": new_alert.id,
        "user_id": new_alert.user_id,
        "message": new_alert.message,
        "from_username": new_alert.from_username,
        "type": new_alert.type,
        "time": new_alert.time
    }
    await manager.send_personal_message(msg_data, alert["user_id"])

    db.close()
    return {"status": "sent"}

@app.get("/alerts/{user_id}")
async def get_my_alerts(user_id: int):
    db = SessionLocal()
    alerts = db.query(Alert).filter(Alert.user_id == user_id).order_by(Alert.time.desc()).all()
    db.close()
    return alerts

@app.delete("/alerts/clear")
async def clear_my_alerts(authorization: str = Header(None)):
    db = SessionLocal()
    if not authorization or authorization not in sessions:
        db.close()
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    un = sessions[authorization]
    user = db.query(UserProfile).filter(UserProfile.username == un).first()
    if user:
        db.query(Alert).filter(Alert.user_id == user.id).delete()
        db.commit()
    db.close()
    return {"status": "success"}

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    if token not in sessions:
        await websocket.close(code=4001)
        return

    username = sessions[token]
    db = SessionLocal()
    user = db.query(UserProfile).filter(func.lower(UserProfile.username) == username.lower()).first()
    db.close()

    if not user:
        await websocket.close(code=4001)
        return

    await manager.connect(user.id, websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user.id)

@app.post("/logout")
async def logout(request: Request):
    token = request.headers.get("Authorization")
    if token in sessions:
        del sessions[token]
    return {"status": "success"}

@app.get("/currencies")
async def get_currencies():
    return SUPPORTED_CURRENCIES

@app.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: int, authorization: str = Header(None)):
    db = SessionLocal()
    requester = None
    if authorization and authorization in sessions:
        req_username = sessions[authorization]
        requester = db.query(UserProfile).filter(UserProfile.username == req_username).first()
    
    if not requester:
        db.close()
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        db.close()
        raise HTTPException(status_code=404, detail="Alert not found")
        
    # Find the sender's role to see if it's a dev message
    sender_role = "user"
    if alert.from_username:
        sender = db.query(UserProfile).filter(func.lower(UserProfile.username) == alert.from_username.lower()).first()
        if sender:
            sender_role = sender.role
    
    # Permission Logic:
    # 1. Dev (Pramodhraja) can delete anything.
    # 2. If it's a message FROM a dev, only a dev can delete it.
    
    if requester.role == "dev":
        pass # Full access
    elif sender_role == "dev" or alert.from_username == "DEVOPS":
        db.close()
        raise HTTPException(status_code=403, detail="Protected: Only DevOps can delete messages sent by dev accounts")
    elif not (alert.user_id == requester.id or requester.role == "admin"):
        db.close()
        raise HTTPException(status_code=403, detail="Permission denied to delete this message")
        
    db.delete(alert)
    db.commit()
    db.close()
    return {"status": "success"}

@app.get("/transaction-history")
async def get_history(request: Request):
    db = SessionLocal()
    txns = db.query(Transaction).order_by(Transaction.time.desc()).limit(50).all()
    db.close()
    
    return [
        {
            "id": t.id,
            "time": t.time,
            "amount": t.amount,
            "approved": t.approved,
            "risk_score": t.risk_score,
            "base_currency": t.base_currency,
            "target_currency": t.target_currency,
            "status": t.status
        } for t in txns
    ]

@app.delete("/admin/clear-ledger")
async def clear_ledger(request: Request):
    """Wipe all transactions and alerts from the cloud database. Admin only."""
    token = request.headers.get("Authorization")
    db = SessionLocal()
    requester = db.query(UserProfile).filter(UserProfile.username == token).first()
    if not requester or requester.role not in ("admin", "dev"):
        db.close()
        raise HTTPException(status_code=403, detail="Forbidden: Admin or Dev access required")
    
    deleted_txns = db.query(Transaction).delete()
    deleted_alerts = db.query(Alert).delete()
    db.commit()
    db.close()
    return {"status": "success", "deleted_transactions": deleted_txns, "deleted_alerts": deleted_alerts}

@app.get("/admin/stats")
async def get_admin_stats(request: Request):
    db = SessionLocal()
    
    total_txns = db.query(Transaction).count()
    approved_txns = db.query(Transaction).filter(Transaction.approved == True).all()
    blocked_txns = db.query(Transaction).filter(Transaction.approved == False).all()
    
    total_volume = sum(t.amount for t in approved_txns)
    blocked_volume = sum(t.amount for t in blocked_txns)
    
    fraud_rate = f"{round((len(blocked_txns) / total_txns * 100), 2) if total_txns else 0}%"
    
    db.close()
    
    return {
        "system_status": "Healthy",
        "active_users": 1, # Mocked
        "total_volume": total_volume,
        "blocked_volume": blocked_volume,
        "fraud_rate": fraud_rate,
        "engine_telemetry": {
            "fx_latency": "142ms",
            "biometric_accuracy": "99.2%",
            "ml_inference_time": "32ms"
        }
    }

@app.post("/analyze")
async def analyze_transaction(request: TransactionRequest, req: Request):
    db = SessionLocal()
    fx_report = fx_engine.analyze_transaction(
        request.amount, 
        request.base_currency.upper(), 
        request.target_currency.upper(),
        priority=request.priority
    )
    if "error" in fx_report:
        db.close()
        raise HTTPException(status_code=400, detail=fx_report["error"])

    # Fetch User Profile from DB
    token = req.headers.get("Authorization")
    username = sessions.get(token, "admin") # Fallback to admin if token missing for now
    profile_db = db.query(UserProfile).filter(UserProfile.username == username).first()
    
    if not profile_db:
        profile_db = db.query(UserProfile).first() # Final fallback

    # Map DB profile to engine format
    profile_engine = {
        "typing_speed": profile_db.typing_speed if profile_db else 62.0,
        "mouse_velocity": profile_db.mouse_velocity if profile_db else 450.0,
        "ip_location": profile_db.primary_location if profile_db else "NY",
        "last_lat_long": tuple(map(float, profile_db.last_lat_long.split(','))) if profile_db else (40.7128, -74.0060),
        "last_seen_epoch": profile_db.last_seen_epoch if profile_db else 0.0,
        "device": "Chrome/Windows",
        "transaction_amount": 25000,
        "login_hours": list(range(8, 20))
    }

    now = datetime.now()
    hour_ago = now - timedelta(hours=1)
    velocity = db.query(Transaction).filter(Transaction.time > hour_ago.isoformat()).count()

    risk_report = biometric_engine.calculate_unified_risk_score(
        {
            "typing_speed": request.typing_speed,
            "mouse_velocity": request.mouse_velocity,
            "ip_location": request.ip_location,
            "lat_long": tuple(request.lat_long) if request.lat_long else profile_engine["last_lat_long"],
            "device": request.device,
            "amount": request.amount,
            "session_hour": request.session_hour,
            "is_copy_paste": request.is_copy_paste,
            "is_vpn": request.is_vpn,
            "velocity_count": velocity
        },
        corridor_risk=fx_report["corridor_risk"],
        history_velocity=velocity
    )

    best_route = fx_report["comparisons"][0]
    bank_cost = fx_report["traditional_bank_cost"]
    savings = bank_cost - best_route["total_cost_usd"]
    savings_pct = (savings / bank_cost * 100) if bank_cost > 0 else 0
    go_decision = risk_report["risk_score"] <= 60
    txn_status = "pending" if risk_report["risk_score"] > 60 else "approved"
    
    # Persist Transaction
    new_txn = Transaction(
        amount=request.amount,
        base_currency=request.base_currency,
        target_currency=request.target_currency,
        approved=go_decision,
        risk_score=risk_report["risk_score"],
        risk_level=risk_report["risk_level"],
        location=request.ip_location,
        device=request.device,
        aml_flags=json.dumps(risk_report["aml_flags"]),
        time=now.isoformat(),
        status=txn_status
    )
    db.add(new_txn)
    
    # Update Profile if legitimate (optional heuristic)
    if go_decision and risk_report["risk_score"] < 20:
        profile_db.last_seen_epoch = now.timestamp()
        profile_db.last_lat_long = f"{request.lat_long[0]},{request.lat_long[1]}" if request.lat_long else profile_db.last_lat_long
        
    db.commit()
    db.close()

    return {
        "fx_report": fx_report,
        "risk_report": risk_report,
        "recommended_route": best_route,
        "traditional_bank_cost": bank_cost,
        "total_savings": round(savings, 2),
        "savings_pct": round(savings_pct, 1),
        "go_decision": go_decision,
        "go_decision_note": risk_report["recommendation_detail"],
        "fusion_version": "4.0.0"
    }

@app.post("/advisor/chat")
async def advisor_chat(req: AdvisorRequest):
    # Retrieve user context
    db = SessionLocal()
    user = db.query(UserProfile).filter(UserProfile.id == req.user_id).first()
    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
        
    recent_txns = db.query(Transaction).filter(Transaction.user_id == user.id).order_by(Transaction.time.desc()).limit(5).all()
    txns_str = "\n".join([f"- ID: {t.id} | {t.amount} {t.base_currency} -> {t.target_currency} | Status: {t.status} | Risk Score: {t.risk_score}" for t in recent_txns])
    
    db.close()
    
    if not os.getenv("GEMINI_API_KEY"):
         raise HTTPException(status_code=500, detail="LLM AI is currently disabled (No API Key).")
         
    # Build a context-rich prompt
    system_prompt = f"""
    You are the 'SecurePay AI Financial Advisor', an expert, highly professional, and slightly futuristic AI embedded within a high-security banking terminal.
    Your goal is to assist the user with their financial security queries and explain risk logic. Be concise, direct, and helpful. Do not use markdown that would break a simple text chat.
    
    USER CONTEXT:
    Username: {user.username}
    Role: {user.role}
    Primary Location: {user.primary_location}
    Risk Preference: {user.preferred_priority}
    
    RECENT TRANSACTIONS:
    {txns_str if txns_str else "None"}
    
    USER QUERY:
    {req.message}
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(system_prompt)
        return {"response": response.text}
    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Advisor encountered a neural disconnect: {e}")

if __name__ == "__main__":
    import uvicorn
    print("Initializing Database...")
    init_db()
    print("Starting Server...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
