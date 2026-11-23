"""F02: students and lessons (ADR-003).

Ownership is stored on every lesson row, and the composite foreign key (student_id, teacher_id)
makes the database reject a lesson whose student belongs to another teacher.

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "student",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "teacher_id",
            sa.Integer(),
            sa.ForeignKey("teacher.id", name="fk_student_teacher_id_teacher", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("id", "teacher_id", name="uq_student_id_teacher_id"),
        sa.CheckConstraint("char_length(name) BETWEEN 1 AND 100", name="ck_student_name_length"),
    )
    op.create_index(
        "ix_student_teacher_id_lower_name_id",
        "student",
        ["teacher_id", sa.text("lower(name)"), "id"],
    )
    op.create_table(
        "lesson",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "teacher_id",
            sa.Integer(),
            sa.ForeignKey("teacher.id", name="fk_lesson_teacher_id_teacher", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("paid", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["student_id", "teacher_id"],
            ["student.id", "student.teacher_id"],
            name="fk_lesson_student_same_teacher",
            ondelete="RESTRICT",
        ),
        sa.CheckConstraint(
            "date BETWEEN DATE '2000-01-01' AND DATE '2099-12-31'", name="ck_lesson_date_range"
        ),
        sa.CheckConstraint(
            "duration_minutes BETWEEN 1 AND 600", name="ck_lesson_duration_minutes_range"
        ),
        sa.CheckConstraint("price_cents BETWEEN 0 AND 1000000", name="ck_lesson_price_cents_range"),
    )
    op.create_index(
        "ix_lesson_teacher_id_date_id",
        "lesson",
        ["teacher_id", sa.text("date DESC"), sa.text("id DESC")],
    )
    op.create_index("ix_lesson_student_id_teacher_id", "lesson", ["student_id", "teacher_id"])


def downgrade() -> None:
    op.drop_table("lesson")
    op.drop_table("student")
