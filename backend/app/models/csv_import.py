from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
from .enums import CsvImportStatus


class CsvImport(SQLModel, table=True):
    __tablename__ = "csv_imports"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    filename: str
    status: CsvImportStatus = Field(default=CsvImportStatus.pending)
    total_rows: int = Field(default=0)
    imported_rows: int = Field(default=0)
    mapping_json: Optional[str] = Field(default=None)
    target: Optional[str] = Field(default=None)
    rows_json: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
