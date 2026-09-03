"""
MariaDB connection factory.

FastAPI runs sync endpoints in a thread-pool so plain pymysql is safe.
Each request gets its own connection; we close it in the finally block.
"""
from contextlib import contextmanager
from typing import Generator

import pymysql
import pymysql.cursors
import logging

from config import settings

logger = logging.getLogger(__name__)


def _connect() -> pymysql.Connection:
    return pymysql.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
        connect_timeout=10,
        read_timeout=30,
        write_timeout=30,
    )


@contextmanager
def get_db_conn() -> Generator[pymysql.Connection, None, None]:
    conn = _connect()
    try:
        yield conn
    finally:
        conn.close()


def ping() -> bool:
    """Verify DB is reachable. Used by /health."""
    try:
        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"DB ping failed: {e}")
        return False


def query_one(sql: str, params: tuple = ()) -> dict | None:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchone()


def query_all(sql: str, params: tuple = ()) -> list[dict]:
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()
