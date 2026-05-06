import csv
import io
from datetime import date, datetime
from typing import Dict, Any, List, Optional
from fastapi import HTTPException

ACCEPTED_DATE_FORMATS = ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d"]


def parse_date(raw: str) -> Optional[date]:
    for fmt in ACCEPTED_DATE_FORMATS:
        try:
            return datetime.strptime(raw.strip(), fmt).date()
        except ValueError:
            continue
    return None


def parse_upload(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=415, detail="File must be a .csv file")
    try:
        content = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content = file_bytes.decode("latin-1")

    reader = csv.DictReader(io.StringIO(content))
    headers = list(reader.fieldnames or [])
    rows = list(reader)
    total_rows = len(rows)
    preview = [dict(row) for row in rows[:10]]
    all_rows = [dict(row) for row in rows]

    return {
        "headers": headers,
        "preview": preview,
        "total_rows": total_rows,
        "all_rows": all_rows,
    }
