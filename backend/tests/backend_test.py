"""
CAT Habit Tracker - Backend API tests
Covers: auth (register/login/me/logout), settings, habits CRUD + stats,
timetable CRUD + CSV/JSON upload (add/replace), error cases.
"""
import os
import io
import json
import uuid
import time
import pytest
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://discipline-hub-222.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@cattracker.app"
ADMIN_PASSWORD = "Admin@2026"

TODAY = datetime.now(timezone.utc).strftime("%Y-%m-%d")


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"
    assert "session_token" in s.cookies, f"session_token cookie missing. Cookies: {dict(s.cookies)}"
    return s


@pytest.fixture(scope="module")
def fresh_user_session():
    """Register a brand new user for isolated tests"""
    s = requests.Session()
    email = f"test_{uuid.uuid4().hex[:8]}@cattracker.app"
    payload = {"email": email, "password": "TestPass@2026", "name": "Test User"}
    r = s.post(f"{API}/auth/register", json=payload, timeout=15)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    s.email = email  # type: ignore
    s.password = "TestPass@2026"  # type: ignore
    return s


# ---------- Auth ----------
class TestAuth:
    def test_admin_login_sets_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == ADMIN_EMAIL
        assert body["name"]  # not empty
        assert "user_id" in body
        assert "session_token" in s.cookies

    def test_auth_me_with_cookie(self, admin_session):
        r = admin_session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == ADMIN_EMAIL
        assert body["role"] == "admin"

    def test_auth_me_without_cookie_returns_401(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_logout_clears_session(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        assert "session_token" in s.cookies
        r2 = s.post(f"{API}/auth/logout", timeout=15)
        assert r2.status_code == 200
        # After logout, /auth/me must 401 with same session jar
        r3 = s.get(f"{API}/auth/me", timeout=15)
        assert r3.status_code == 401

    def test_register_creates_user_seeds_habits(self):
        s = requests.Session()
        email = f"reg_{uuid.uuid4().hex[:8]}@cattracker.app"
        r = s.post(f"{API}/auth/register",
                   json={"email": email, "password": "Passw0rd!", "name": "Reggie"},
                   timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["email"] == email
        assert body["name"] == "Reggie"
        assert "session_token" in s.cookies
        # Default habits should be 5
        r2 = s.get(f"{API}/habits", timeout=15)
        assert r2.status_code == 200
        habits = r2.json()
        assert len(habits) == 5, f"Expected 5 seeded habits, got {len(habits)}"

    def test_register_duplicate_email_returns_400(self):
        s = requests.Session()
        email = f"dup_{uuid.uuid4().hex[:8]}@cattracker.app"
        r1 = s.post(f"{API}/auth/register",
                    json={"email": email, "password": "Passw0rd!", "name": "Dup"}, timeout=15)
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/auth/register",
                           json={"email": email, "password": "Passw0rd!", "name": "Dup"}, timeout=15)
        assert r2.status_code == 400


# ---------- Settings ----------
class TestSettings:
    def test_get_settings(self, admin_session):
        r = admin_session.get(f"{API}/me/settings", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "exam_name" in body
        assert "target_exam_date" in body

    def test_update_settings_then_persist(self, admin_session):
        # Update
        payload = {"exam_name": "GMAT", "target_exam_date": "2027-01-15"}
        r = admin_session.put(f"{API}/me/settings", json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["exam_name"] == "GMAT"
        assert r.json()["target_exam_date"] == "2027-01-15"
        # Persisted on next GET
        r2 = admin_session.get(f"{API}/me/settings", timeout=15)
        assert r2.json()["exam_name"] == "GMAT"
        assert r2.json()["target_exam_date"] == "2027-01-15"
        # Restore to defaults for downstream FE tests
        admin_session.put(f"{API}/me/settings",
                          json={"exam_name": "CAT", "target_exam_date": "2026-11-30"},
                          timeout=15)

    def test_update_settings_bad_date(self, admin_session):
        r = admin_session.put(f"{API}/me/settings",
                              json={"target_exam_date": "15-01-2027"}, timeout=15)
        assert r.status_code == 400


# ---------- Habits ----------
class TestHabits:
    def test_list_habits_returns_completed_today_flag(self, fresh_user_session):
        r = fresh_user_session.get(f"{API}/habits", timeout=15)
        assert r.status_code == 200
        habits = r.json()
        assert len(habits) == 5
        for h in habits:
            assert "completed_today" in h
            assert h["completed_today"] is False
            assert "habit_id" in h
            assert "title" in h

    def test_create_habit(self, fresh_user_session):
        r = fresh_user_session.post(f"{API}/habits",
                                    json={"title": "TEST_Custom habit", "icon": "★", "category": "Custom"},
                                    timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["title"] == "TEST_Custom habit"
        assert body["completed_today"] is False
        # Verify via list
        r2 = fresh_user_session.get(f"{API}/habits", timeout=15)
        titles = [h["title"] for h in r2.json()]
        assert "TEST_Custom habit" in titles

    def test_toggle_habit_and_stats_streak(self, fresh_user_session):
        habits = fresh_user_session.get(f"{API}/habits", timeout=15).json()
        hid = habits[0]["habit_id"]
        r = fresh_user_session.post(f"{API}/habits/{hid}/toggle", timeout=15)
        assert r.status_code == 200
        assert r.json()["completed_today"] is True

        # Verify in list
        r2 = fresh_user_session.get(f"{API}/habits", timeout=15)
        flagged = [h for h in r2.json() if h["habit_id"] == hid][0]
        assert flagged["completed_today"] is True

        # Stats
        s = fresh_user_session.get(f"{API}/habits/stats", timeout=15)
        assert s.status_code == 200
        stats = s.json()
        assert stats["completion_pct"] > 0
        assert stats["streak"] == 1
        assert stats["completed_today"] == 1
        assert len(stats["heatmap"]) == 30
        assert len(stats["weekly"]) == 7
        assert stats["heatmap"][-1]["date"] == TODAY

    def test_toggle_habit_off(self, fresh_user_session):
        habits = fresh_user_session.get(f"{API}/habits", timeout=15).json()
        # Use second habit so we don't disturb above streak test
        hid = habits[1]["habit_id"]
        fresh_user_session.post(f"{API}/habits/{hid}/toggle", timeout=15)
        r = fresh_user_session.post(f"{API}/habits/{hid}/toggle", timeout=15)
        assert r.status_code == 200
        assert r.json()["completed_today"] is False

    def test_delete_habit(self, fresh_user_session):
        # Create then delete
        c = fresh_user_session.post(f"{API}/habits",
                                    json={"title": "TEST_to_delete"}, timeout=15)
        hid = c.json()["habit_id"]
        d = fresh_user_session.delete(f"{API}/habits/{hid}", timeout=15)
        assert d.status_code == 200
        titles = [h["title"] for h in fresh_user_session.get(f"{API}/habits", timeout=15).json()]
        assert "TEST_to_delete" not in titles


# ---------- Timetable ----------
class TestTimetable:
    def test_create_and_list_by_date(self, fresh_user_session):
        payload = {"subject": "TEST_Mock", "teacher": "Self", "start_time": "10:00",
                   "end_time": "11:00", "date": TODAY, "duration": 60}
        r = fresh_user_session.post(f"{API}/timetable", json=payload, timeout=15)
        assert r.status_code == 200
        eid = r.json()["entry_id"]

        r2 = fresh_user_session.get(f"{API}/timetable", params={"date": TODAY}, timeout=15)
        assert r2.status_code == 200
        entries = r2.json()
        assert any(e["entry_id"] == eid for e in entries)

        # Different date should be empty (or at least not contain eid)
        other = (datetime.now(timezone.utc).date() + timedelta(days=400)).isoformat()
        r3 = fresh_user_session.get(f"{API}/timetable", params={"date": other}, timeout=15)
        assert all(e["entry_id"] != eid for e in r3.json())

        # Delete
        d = fresh_user_session.delete(f"{API}/timetable/{eid}", timeout=15)
        assert d.status_code == 200

    def test_upload_csv_add_then_replace(self, fresh_user_session):
        csv_text = (
            "subject,teacher,start_time,end_time,date,duration\n"
            f"TEST_QA,Coach A,09:00,10:00,{TODAY},60\n"
            f"TEST_VARC,Coach B,10:15,11:15,{TODAY},60\n"
        )
        files = {"file": ("plan.csv", csv_text.encode("utf-8"), "text/csv")}
        r = fresh_user_session.post(f"{API}/timetable/upload",
                                    files=files, data={"mode": "add"}, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["inserted"] == 2
        assert TODAY in body["dates"]

        # Verify they exist
        entries = fresh_user_session.get(f"{API}/timetable",
                                         params={"date": TODAY}, timeout=15).json()
        subjects = [e["subject"] for e in entries]
        assert "TEST_QA" in subjects and "TEST_VARC" in subjects

        # Re-upload as replace with 1 row → should wipe the 2, leave only 1
        csv_text2 = (
            "subject,teacher,start_time,end_time,date,duration\n"
            f"TEST_LRDI,Coach C,12:00,13:00,{TODAY},60\n"
        )
        files = {"file": ("plan2.csv", csv_text2.encode("utf-8"), "text/csv")}
        r2 = fresh_user_session.post(f"{API}/timetable/upload",
                                     files=files, data={"mode": "replace"}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["inserted"] == 1

        entries2 = fresh_user_session.get(f"{API}/timetable",
                                          params={"date": TODAY}, timeout=15).json()
        subjects2 = [e["subject"] for e in entries2]
        assert "TEST_QA" not in subjects2
        assert "TEST_VARC" not in subjects2
        assert "TEST_LRDI" in subjects2

    def test_upload_json_array(self, fresh_user_session):
        data = [
            {"subject": "TEST_JSON_1", "start_time": "08:00", "end_time": "09:00",
             "date": TODAY, "duration": 60, "teacher": "X"},
            {"subject": "TEST_JSON_2", "start_time": "09:00", "end_time": "10:00",
             "date": TODAY, "duration": 60, "teacher": "Y"},
        ]
        files = {"file": ("plan.json", json.dumps(data).encode("utf-8"), "application/json")}
        r = fresh_user_session.post(f"{API}/timetable/upload",
                                    files=files, data={"mode": "add"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["inserted"] == 2

    def test_upload_invalid_extension(self, fresh_user_session):
        files = {"file": ("plan.txt", b"some text", "text/plain")}
        r = fresh_user_session.post(f"{API}/timetable/upload",
                                    files=files, data={"mode": "add"}, timeout=15)
        assert r.status_code == 400


if __name__ == "__main__":
    import sys
    sys.exit(pytest.main([__file__, "-v"]))
