"""Needs the compose Postgres: `docker compose up -d`."""
import pathlib
import uuid

import psycopg
import pytest

ADMIN = "postgresql://cara:cara@127.0.0.1:5433/postgres"
MIGRATIONS = sorted(pathlib.Path(__file__).parent.parent.joinpath("migrations").glob("*.sql"))


@pytest.fixture
def db_url():
    """A fresh, migrated, throwaway database."""
    name = f"cara_test_{uuid.uuid4().hex[:8]}"
    url = ADMIN.rsplit("/", 1)[0] + "/" + name
    with psycopg.connect(ADMIN, autocommit=True) as admin:
        admin.execute(f"CREATE DATABASE {name}")
        try:
            with psycopg.connect(url, autocommit=True) as conn:
                for m in MIGRATIONS:
                    conn.execute(m.read_text())
            yield url
        finally:
            admin.execute(f"DROP DATABASE {name} WITH (FORCE)")


@pytest.fixture
def db(db_url):
    with psycopg.connect(db_url, autocommit=True) as conn:
        yield conn
