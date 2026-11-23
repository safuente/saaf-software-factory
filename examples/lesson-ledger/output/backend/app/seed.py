"""Local review data: three teacher accounts with the credentials listed in README.md.

alice@example.com gets 6 students and 12 lessons spread over the current calendar month and the
two previous ones (relative to the server date): 1 of 4 paid in the current month, 2 of 4 in the
previous one, none in the oldest (F03 Behavior: Seed); bob@example.com has no students and no
lessons; carol@example.com has more than 500 of each, all unpaid lessons of the current month,
to reach the lists' truncation messages.
Each run resets the three accounts to exactly that state, so data added during review or e2e
runs does not accumulate. Synthetic, local-only data; never run against anything but a local
stack."""

import calendar
import sys
from datetime import UTC, date, datetime

from sqlalchemy import delete, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session as DbSession

from app.accounts.models import Teacher
from app.accounts.security import hash_password
from app.core.config import Settings
from app.core.db import create_db_engine
from app.lessons.models import Lesson
from app.students.models import Student

TEACHERS = {
    "alice@example.com": "alice-ledger-pass",
    "bob@example.com": "bob-ledger-pass1",
    "carol@example.com": "carol-ledger-pass",
}
ALICE = "alice@example.com"
CAROL = "carol@example.com"
# More than the 500 items the pages show (spec UI "Many items").
CAROL_STUDENTS = 510
CAROL_LESSONS = 520

# Synthetic names; "ben Ortiz" in lower case shows the case-insensitive order.
STUDENTS = ["Ava Martin", "ben Ortiz", "Chloé Dubois", "Dev Patel", "Emma Rossi", "Finn Walsh"]

# (months back, day of month, student index, duration minutes, price cents, paid). Days past
# the end of a month or after today are moved to the last possible day, so every month keeps
# its four lessons; two lessons share day 10 of the previous month.
LESSONS = [
    (0, 2, 0, 45, 4500, True),
    (0, 6, 1, 60, 6000, False),
    (0, 9, 2, 30, 3375, False),
    (0, 13, 3, 45, 4250, False),
    (1, 3, 4, 60, 6000, True),
    (1, 10, 0, 45, 4500, False),
    (1, 10, 5, 90, 125000, True),
    (1, 24, 1, 60, 6000, False),
    (2, 5, 2, 30, 3375, False),
    (2, 12, 3, 45, 4250, False),
    (2, 19, 4, 60, 0, False),
    (2, 31, 5, 45, 4550, False),
]

# Serializes concurrent runs (e.g. several e2e workers) so their delete-and-insert do not mix.
_SEED_LOCK_KEY = 4_200_202


def _lesson_date(today: date, months_back: int, day: int) -> date:
    index = today.year * 12 + today.month - 1 - months_back
    year, month = divmod(index, 12)
    month += 1
    last_day = calendar.monthrange(year, month)[1]
    if months_back == 0:
        last_day = today.day
    return date(year, month, min(day, last_day))


def _upsert_teachers(db: DbSession, now: datetime) -> dict[str, int]:
    ids: dict[str, int] = {}
    for email, password in TEACHERS.items():
        password_hash = hash_password(password)
        statement = insert(Teacher).values(email=email, password_hash=password_hash, created_at=now)
        ids[email] = db.execute(
            statement.on_conflict_do_update(
                constraint="uq_teacher_email", set_={"password_hash": password_hash}
            ).returning(Teacher.id)
        ).scalar_one()
    return ids


def seed(db: DbSession, today: date) -> None:
    """Create or reset the seed teachers and alice's history, in one transaction."""
    now = datetime.now(UTC).replace(microsecond=0)
    db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": _SEED_LOCK_KEY})
    ids = _upsert_teachers(db, now)
    teacher_ids = list(ids.values())
    db.execute(delete(Lesson).where(Lesson.teacher_id.in_(teacher_ids)))
    db.execute(delete(Student).where(Student.teacher_id.in_(teacher_ids)))
    students = [Student(teacher_id=ids[ALICE], name=name, created_at=now) for name in STUDENTS]
    db.add_all(students)
    db.flush()
    db.add_all(
        Lesson(
            teacher_id=ids[ALICE],
            student_id=students[student].id,
            date=_lesson_date(today, months_back, day),
            duration_minutes=duration,
            price_cents=price,
            paid=paid,
            created_at=now,
        )
        for months_back, day, student, duration, price, paid in LESSONS
    )
    _seed_many_items(db, ids[CAROL], today, now)
    db.commit()


def _seed_many_items(db: DbSession, teacher_id: int, today: date, now: datetime) -> None:
    student_ids = db.scalars(
        insert(Student).returning(Student.id),
        [
            {"teacher_id": teacher_id, "name": f"Student {n:03d}", "created_at": now}
            for n in range(1, CAROL_STUDENTS + 1)
        ],
    ).all()
    db.execute(
        insert(Lesson),
        [
            {
                "teacher_id": teacher_id,
                "student_id": student_ids[n % len(student_ids)],
                # All in the current month up to today, so a month passes 500 lessons too.
                "date": today.replace(day=1 + n % today.day),
                "duration_minutes": 45,
                "price_cents": 4500,
                "paid": False,
                "created_at": now,
            }
            for n in range(CAROL_LESSONS)
        ],
    )


def main() -> None:
    engine = create_db_engine(Settings.from_env())
    try:
        with DbSession(engine) as db:
            seed(db, date.today())
    finally:
        engine.dispose()
    sys.stdout.write(
        f"seed ok: teachers {', '.join(TEACHERS)} (passwords in README.md); "
        f"alice {len(STUDENTS)} students, {len(LESSONS)} lessons; bob empty; "
        f"carol {CAROL_STUDENTS} students, {CAROL_LESSONS} lessons\n"
    )


if __name__ == "__main__":
    main()
