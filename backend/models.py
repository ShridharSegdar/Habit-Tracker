"""SQLAlchemy models — Supabase Postgres tables for CAT Habit Tracker."""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, DateTime, ForeignKey, Index, ARRAY,
)
from sqlalchemy.orm import DeclarativeBase, relationship


def utcnow():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    # Keep human-readable user_id used everywhere in app code (e.g. "user_abc123")
    user_id = Column(String(40), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=True)  # nullable for Google-only users
    name = Column(String(120), nullable=False)
    picture = Column(Text, nullable=True)
    exam_name = Column(String(60), nullable=False, default="CAT")
    target_exam_date = Column(String(10), nullable=False, default="2026-11-30")  # YYYY-MM-DD
    role = Column(String(20), nullable=False, default="user")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    timetable = relationship("TimetableEntry", back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    __tablename__ = "user_sessions"

    session_token = Column(String(128), primary_key=True)
    user_id = Column(String(40), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    user = relationship("User", back_populates="sessions")


class Habit(Base):
    __tablename__ = "habits"

    habit_id = Column(String(40), primary_key=True)
    user_id = Column(String(40), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    category = Column(String(40), nullable=False, default="Custom")
    icon = Column(String(8), nullable=False, default="✦")
    # array of YYYY-MM-DD strings — matches Mongo schema for zero-cost migration
    completed_dates = Column(ARRAY(String), nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    user = relationship("User", back_populates="habits")


class TimetableEntry(Base):
    __tablename__ = "timetable"

    entry_id = Column(String(40), primary_key=True)
    user_id = Column(String(40), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(160), nullable=False)
    teacher = Column(String(120), nullable=True, default="")
    start_time = Column(String(8), nullable=False)  # HH:MM
    end_time = Column(String(8), nullable=True, default="")
    date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    duration = Column(Integer, nullable=False, default=60)
    notes = Column(String(400), nullable=True, default="")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    user = relationship("User", back_populates="timetable")

    __table_args__ = (
        Index("ix_timetable_user_date", "user_id", "date"),
    )
