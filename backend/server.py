from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import io
import csv
import json
import uuid
import logging
import bcrypt
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Form
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from openpyxl import load_workbook

# ---------- DB ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_DAYS = 7
COOKIE_KW = dict(httponly=True, secure=True, samesite="none", path="/")


# ---------- Models ----------
class RegisterPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class SessionPayload(BaseModel):
    session_id: str


class SettingsPayload(BaseModel):
    exam_name: Optional[str] = None
    target_exam_date: Optional[str] = None  # YYYY-MM-DD


class HabitCreate(BaseModel):
    title: str = Field(min_length=1)
    icon: Optional[str] = "✦"
    category: Optional[str] = "Custom"


class TimetableEntry(BaseModel):
    subject: str
    teacher: Optional[str] = ""
    start_time: str  # HH:MM
    end_time: Optional[str] = ""
    date: str  # YYYY-MM-DD
    duration: Optional[int] = 60
    notes: Optional[str] = ""


# ---------- Helpers ----------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode("utf-8"), h.encode("utf-8"))
    except Exception:
        return False


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


async def issue_session(response: Response, user_id: str) -> str:
    token = uuid.uuid4().hex + uuid.uuid4().hex
    expires = now_utc() + timedelta(days=SESSION_DAYS)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": expires.isoformat(),
        "created_at": now_utc().isoformat(),
    })
    response.set_cookie(
        key="session_token", value=token,
        max_age=SESSION_DAYS * 24 * 60 * 60,
        **COOKIE_KW,
    )
    return token


def public_user(u: dict) -> dict:
    return {
        "user_id": u["user_id"],
        "email": u["email"],
        "name": u.get("name", ""),
        "picture": u.get("picture"),
        "exam_name": u.get("exam_name", "CAT"),
        "target_exam_date": u.get("target_exam_date", "2026-11-30"),
        "role": u.get("role", "user"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now_utc():
        raise HTTPException(status_code=401, detail="Session expired")

    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------- Default data seeding ----------
DEFAULT_HABITS_TEMPLATE = [
    {"title": "Quant: 25 LOD questions", "category": "QA", "icon": "🧮"},
    {"title": "VARC: 2 RC passages", "category": "VARC", "icon": "📚"},
    {"title": "LRDI: 1 caselet set", "category": "LRDI", "icon": "🧩"},
    {"title": "Mock analysis (30 min)", "category": "Mock", "icon": "📊"},
    {"title": "Vocab: 10 new words", "category": "VARC", "icon": "🔤"},
]


async def seed_user_defaults(user_id: str):
    count = await db.habits.count_documents({"user_id": user_id})
    if count > 0:
        return
    docs = []
    for h in DEFAULT_HABITS_TEMPLATE:
        docs.append({
            "habit_id": f"h_{uuid.uuid4().hex[:10]}",
            "user_id": user_id,
            "title": h["title"], "category": h["category"], "icon": h["icon"],
            "completed_dates": [],
            "created_at": now_utc().isoformat(),
        })
    if docs:
        await db.habits.insert_many(docs)


# ---------- Auth endpoints ----------
@api_router.get("/")
async def root():
    return {"message": "CAT Habit Tracker API"}


@api_router.post("/auth/register")
async def register(payload: RegisterPayload, response: Response):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "picture": None,
        "exam_name": "CAT",
        "target_exam_date": "2026-11-30",
        "role": "user",
        "created_at": now_utc().isoformat(),
    }
    await db.users.insert_one(doc)
    await seed_user_defaults(user_id)
    await issue_session(response, user_id)
    return public_user(doc)


@api_router.post("/auth/login")
async def login(payload: LoginPayload, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    await seed_user_defaults(user["user_id"])
    await issue_session(response, user["user_id"])
    return public_user(user)


@api_router.post("/auth/session")
async def emergent_session(payload: SessionPayload, response: Response):
    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": payload.session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = data["email"].lower().strip()
    name = data["name"]
    picture = data.get("picture")
    existing = await db.users.find_one({"email": email})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id, "email": email, "name": name, "picture": picture,
            "password_hash": None, "exam_name": "CAT",
            "target_exam_date": "2026-11-30", "role": "user",
            "created_at": now_utc().isoformat(),
        }
        await db.users.insert_one(user_doc)
    await seed_user_defaults(user_id)
    await issue_session(response, user_id)
    return public_user(user_doc)


@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return public_user(user)


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(key="session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# ---------- User settings ----------
@api_router.get("/me/settings")
async def get_settings(request: Request):
    u = await get_current_user(request)
    return {"exam_name": u.get("exam_name", "CAT"), "target_exam_date": u.get("target_exam_date", "2026-11-30")}


@api_router.put("/me/settings")
async def update_settings(payload: SettingsPayload, request: Request):
    u = await get_current_user(request)
    update = {}
    if payload.exam_name is not None:
        update["exam_name"] = payload.exam_name.strip()[:50] or "CAT"
    if payload.target_exam_date is not None:
        try:
            datetime.strptime(payload.target_exam_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Date must be YYYY-MM-DD")
        update["target_exam_date"] = payload.target_exam_date
    if update:
        await db.users.update_one({"user_id": u["user_id"]}, {"$set": update})
    return await get_settings(request)


# ---------- Habits ----------
@api_router.get("/habits")
async def list_habits(request: Request):
    u = await get_current_user(request)
    docs = await db.habits.find({"user_id": u["user_id"]}, {"_id": 0}).to_list(500)
    today = today_str()
    for d in docs:
        d["completed_today"] = today in d.get("completed_dates", [])
    return docs


@api_router.post("/habits")
async def create_habit(payload: HabitCreate, request: Request):
    u = await get_current_user(request)
    doc = {
        "habit_id": f"h_{uuid.uuid4().hex[:10]}",
        "user_id": u["user_id"],
        "title": payload.title.strip()[:120],
        "category": (payload.category or "Custom")[:30],
        "icon": (payload.icon or "✦")[:4],
        "completed_dates": [],
        "created_at": now_utc().isoformat(),
    }
    await db.habits.insert_one(doc)
    doc.pop("_id", None)
    doc["completed_today"] = False
    return doc


@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, request: Request):
    u = await get_current_user(request)
    await db.habits.delete_one({"habit_id": habit_id, "user_id": u["user_id"]})
    return {"ok": True}


@api_router.post("/habits/{habit_id}/toggle")
async def toggle_habit(habit_id: str, request: Request):
    u = await get_current_user(request)
    h = await db.habits.find_one({"habit_id": habit_id, "user_id": u["user_id"]}, {"_id": 0})
    if not h:
        raise HTTPException(status_code=404, detail="Habit not found")
    today = today_str()
    dates = set(h.get("completed_dates", []))
    if today in dates:
        dates.remove(today)
        completed = False
    else:
        dates.add(today)
        completed = True
    await db.habits.update_one(
        {"habit_id": habit_id, "user_id": u["user_id"]},
        {"$set": {"completed_dates": sorted(dates)}}
    )
    return {"completed_today": completed, "habit_id": habit_id}


@api_router.get("/habits/stats")
async def habit_stats(request: Request):
    u = await get_current_user(request)
    habits = await db.habits.find({"user_id": u["user_id"]}, {"_id": 0}).to_list(500)
    total = len(habits)

    # Build a map date -> count of habits completed
    day_counts: dict = {}
    for h in habits:
        for d in h.get("completed_dates", []):
            day_counts[d] = day_counts.get(d, 0) + 1

    today = datetime.now(timezone.utc).date()

    # Heatmap (30 days)
    heatmap = []
    for i in range(29, -1, -1):
        d = today - timedelta(days=i)
        k = d.isoformat()
        heatmap.append({"date": k, "count": day_counts.get(k, 0), "total": total})

    # Weekly (last 7 days) — day letter mapped from Python weekday (Mon=0..Sun=6)
    weekly = []
    # Python weekday: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    day_letters = {0: "M", 1: "T", 2: "W", 3: "T", 4: "F", 5: "S", 6: "S"}
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        k = d.isoformat()
        c = day_counts.get(k, 0)
        weekly.append({
            "date": k,
            "day": day_letters[d.weekday()],
            "pct": round((c / total) * 100) if total else 0,
        })

    # Streak: consecutive days with at least one habit completed (allow today incomplete)
    streak = 0
    cur = today
    for i in range(365):
        k = cur.isoformat()
        c = day_counts.get(k, 0)
        if c == 0:
            if i == 0:
                cur = cur - timedelta(days=1)
                continue
            break
        streak += 1
        cur = cur - timedelta(days=1)

    # Best streak across all history
    keys = sorted([k for k, v in day_counts.items() if v > 0])
    best = streak
    if keys:
        run = 1
        for i in range(1, len(keys)):
            prev = datetime.fromisoformat(keys[i - 1]).date()
            curr = datetime.fromisoformat(keys[i]).date()
            if (curr - prev).days == 1:
                run += 1
                best = max(best, run)
            else:
                run = 1
        best = max(best, streak)

    completed_today = day_counts.get(today.isoformat(), 0)
    pct = round((completed_today / total) * 100) if total else 0

    return {
        "streak": streak,
        "best_streak": best,
        "completed_today": completed_today,
        "total_habits": total,
        "completion_pct": pct,
        "heatmap": heatmap,
        "weekly": weekly,
    }


# ---------- Timetable ----------
@api_router.get("/timetable")
async def list_timetable(request: Request, date: Optional[str] = None):
    u = await get_current_user(request)
    q = {"user_id": u["user_id"]}
    if date:
        q["date"] = date
    docs = await db.timetable.find(q, {"_id": 0}).sort("start_time", 1).to_list(500)
    return docs


@api_router.post("/timetable")
async def create_timetable(entry: TimetableEntry, request: Request):
    u = await get_current_user(request)
    doc = {
        "entry_id": f"t_{uuid.uuid4().hex[:10]}",
        "user_id": u["user_id"],
        **entry.model_dump(),
        "created_at": now_utc().isoformat(),
    }
    await db.timetable.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/timetable/{entry_id}")
async def delete_timetable(entry_id: str, request: Request):
    u = await get_current_user(request)
    await db.timetable.delete_one({"entry_id": entry_id, "user_id": u["user_id"]})
    return {"ok": True}


def _norm_row(row: dict) -> Optional[dict]:
    """Normalize a parsed row into a TimetableEntry-shaped dict."""
    lower = {str(k).strip().lower(): v for k, v in row.items() if k is not None}
    def pick(*names):
        for n in names:
            v = lower.get(n)
            if v not in (None, ""):
                return str(v).strip()
        return ""
    subject = pick("subject", "topic", "task", "title")
    if not subject:
        return None
    date = pick("date", "day")
    if not date:
        return None
    # Normalize date formats
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
        try:
            date = datetime.strptime(date, fmt).strftime("%Y-%m-%d")
            break
        except Exception:
            continue
    return {
        "subject": subject[:120],
        "teacher": pick("teacher", "instructor", "by")[:80],
        "start_time": pick("start_time", "start", "time", "from")[:8],
        "end_time": pick("end_time", "end", "to")[:8],
        "date": date,
        "duration": int(pick("duration") or "60") if (pick("duration") or "").isdigit() else 60,
        "notes": pick("notes", "remarks", "description")[:200],
    }


def _parse_csv(raw: bytes) -> List[dict]:
    text = raw.decode("utf-8-sig", errors="replace")
    rows = list(csv.DictReader(io.StringIO(text)))
    return [r for r in (_norm_row(x) for x in rows) if r]


def _parse_json(raw: bytes) -> List[dict]:
    data = json.loads(raw.decode("utf-8-sig", errors="replace"))
    if isinstance(data, dict):
        data = data.get("entries") or data.get("data") or [data]
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="JSON must be an array or {entries:[...]}")
    return [r for r in (_norm_row(x) for x in data) if r]


def _parse_xlsx(raw: bytes) -> List[dict]:
    wb = load_workbook(io.BytesIO(raw), data_only=True, read_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    headers = [str(h).strip().lower() if h is not None else "" for h in rows[0]]
    out = []
    for r in rows[1:]:
        row = {headers[i]: r[i] for i in range(min(len(headers), len(r)))}
        # Excel dates may come as datetime
        if isinstance(row.get("date"), datetime):
            row["date"] = row["date"].strftime("%Y-%m-%d")
        for tkey in ("start_time", "end_time", "start", "end", "time"):
            v = row.get(tkey)
            if hasattr(v, "strftime"):
                row[tkey] = v.strftime("%H:%M")
        norm = _norm_row(row)
        if norm:
            out.append(norm)
    return out


@api_router.post("/timetable/upload")
async def upload_timetable(
    request: Request,
    file: UploadFile = File(...),
    mode: str = Form("add"),  # "add" | "replace"
):
    u = await get_current_user(request)
    if mode not in ("add", "replace"):
        raise HTTPException(status_code=400, detail="mode must be 'add' or 'replace'")
    raw = await file.read()
    name = (file.filename or "").lower()
    try:
        if name.endswith(".csv"):
            entries = _parse_csv(raw)
        elif name.endswith(".json"):
            entries = _parse_json(raw)
        elif name.endswith(".xlsx") or name.endswith(".xls"):
            entries = _parse_xlsx(raw)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use CSV / XLSX / JSON.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parse failed: {e}")

    if not entries:
        raise HTTPException(status_code=400, detail="No valid rows found in file.")

    if mode == "replace":
        dates = sorted({e["date"] for e in entries})
        await db.timetable.delete_many({"user_id": u["user_id"], "date": {"$in": dates}})

    docs = []
    for e in entries:
        docs.append({
            "entry_id": f"t_{uuid.uuid4().hex[:10]}",
            "user_id": u["user_id"],
            **e,
            "created_at": now_utc().isoformat(),
        })
    if docs:
        await db.timetable.insert_many(docs)

    return {"inserted": len(docs), "mode": mode, "dates": sorted({e["date"] for e in entries})}


# ---------- App setup ----------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.habits.create_index([("user_id", 1), ("habit_id", 1)])
    await db.timetable.create_index([("user_id", 1), ("date", 1)])

    # Seed admin + test user
    for email_env, pw_env, role, name in [
        ("ADMIN_EMAIL", "ADMIN_PASSWORD", "admin", "Admin"),
        ("TEST_USER_EMAIL", "TEST_USER_PASSWORD", "user", "Aspirant"),
    ]:
        email = os.environ.get(email_env)
        pw = os.environ.get(pw_env)
        if not email or not pw:
            continue
        email = email.lower()
        existing = await db.users.find_one({"email": email})
        h = hash_password(pw)
        if not existing:
            uid = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": uid, "email": email, "name": name,
                "password_hash": h, "picture": None,
                "exam_name": "CAT", "target_exam_date": "2026-11-30",
                "role": role, "created_at": now_utc().isoformat(),
            })
            await seed_user_defaults(uid)
        elif not existing.get("password_hash") or not verify_password(pw, existing["password_hash"]):
            await db.users.update_one({"email": email}, {"$set": {"password_hash": h}})


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
