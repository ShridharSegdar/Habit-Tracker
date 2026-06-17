"""One-off migrator: Mongo (motor) → Supabase Postgres (asyncpg/SQLAlchemy).
Safe to re-run: uses upsert on user_id / habit_id / entry_id / session_token.
"""
import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

load_dotenv(Path(__file__).parent / ".env")

from database import AsyncSessionLocal  # noqa: E402
from models import User, UserSession, Habit, TimetableEntry  # noqa: E402


def to_dt(v):
    if isinstance(v, datetime):
        return v if v.tzinfo else v.replace(tzinfo=timezone.utc)
    if isinstance(v, str):
        try:
            d = datetime.fromisoformat(v.replace("Z", "+00:00"))
            return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
        except Exception:
            return datetime.now(timezone.utc)
    return datetime.now(timezone.utc)


async def main():
    mongo = AsyncIOMotorClient(os.environ["MONGO_URL"])
    mdb = mongo[os.environ["DB_NAME"]]

    async with AsyncSessionLocal() as s:
        # ── Users ──
        users = await mdb.users.find({}, {"_id": 0}).to_list(10_000)
        for u in users:
            stmt = pg_insert(User).values(
                user_id=u["user_id"],
                email=u["email"].lower().strip(),
                password_hash=u.get("password_hash"),
                name=u.get("name", ""),
                picture=u.get("picture"),
                exam_name=u.get("exam_name", "CAT"),
                target_exam_date=u.get("target_exam_date", "2026-11-30"),
                role=u.get("role", "user"),
                created_at=to_dt(u.get("created_at")),
            ).on_conflict_do_update(
                index_elements=["user_id"],
                set_={
                    "email": u["email"].lower().strip(),
                    "password_hash": u.get("password_hash"),
                    "name": u.get("name", ""),
                    "picture": u.get("picture"),
                    "exam_name": u.get("exam_name", "CAT"),
                    "target_exam_date": u.get("target_exam_date", "2026-11-30"),
                    "role": u.get("role", "user"),
                },
            )
            await s.execute(stmt)
        await s.commit()
        print(f"Users migrated: {len(users)}")

        # Get the set of valid user_ids so we can skip orphan rows
        valid_user_ids = {u["user_id"] for u in users}

        # ── Sessions ──
        sess = await mdb.user_sessions.find({}, {"_id": 0}).to_list(50_000)
        kept = 0
        for x in sess:
            if x.get("user_id") not in valid_user_ids:
                continue
            stmt = pg_insert(UserSession).values(
                session_token=x["session_token"],
                user_id=x["user_id"],
                expires_at=to_dt(x["expires_at"]),
                created_at=to_dt(x.get("created_at")),
            ).on_conflict_do_nothing(index_elements=["session_token"])
            await s.execute(stmt)
            kept += 1
        await s.commit()
        print(f"Sessions migrated: {kept}/{len(sess)}")

        # ── Habits ──
        habits = await mdb.habits.find({}, {"_id": 0}).to_list(50_000)
        kept = 0
        for h in habits:
            if h.get("user_id") not in valid_user_ids:
                continue
            stmt = pg_insert(Habit).values(
                habit_id=h["habit_id"],
                user_id=h["user_id"],
                title=h.get("title", ""),
                category=h.get("category", "Custom"),
                icon=h.get("icon", "✦"),
                completed_dates=list(h.get("completed_dates") or []),
                created_at=to_dt(h.get("created_at")),
            ).on_conflict_do_update(
                index_elements=["habit_id"],
                set_={
                    "title": h.get("title", ""),
                    "category": h.get("category", "Custom"),
                    "icon": h.get("icon", "✦"),
                    "completed_dates": list(h.get("completed_dates") or []),
                },
            )
            await s.execute(stmt)
            kept += 1
        await s.commit()
        print(f"Habits migrated: {kept}/{len(habits)}")

        # ── Timetable ──
        tt = await mdb.timetable.find({}, {"_id": 0}).to_list(50_000)
        kept = 0
        for e in tt:
            if e.get("user_id") not in valid_user_ids:
                continue
            stmt = pg_insert(TimetableEntry).values(
                entry_id=e["entry_id"],
                user_id=e["user_id"],
                subject=e.get("subject", ""),
                teacher=e.get("teacher", ""),
                start_time=e.get("start_time", ""),
                end_time=e.get("end_time", ""),
                date=e.get("date", ""),
                duration=int(e.get("duration") or 60),
                notes=e.get("notes", ""),
                created_at=to_dt(e.get("created_at")),
            ).on_conflict_do_nothing(index_elements=["entry_id"])
            await s.execute(stmt)
            kept += 1
        await s.commit()
        print(f"Timetable migrated: {kept}/{len(tt)}")

        # Counts in target
        for M, label in [(User, "users"), (UserSession, "sessions"),
                         (Habit, "habits"), (TimetableEntry, "timetable")]:
            r = await s.execute(select(M))
            print(f"Supabase {label} rows: {len(r.scalars().all())}")

    mongo.close()


if __name__ == "__main__":
    asyncio.run(main())
