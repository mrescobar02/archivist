from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from ..models.enums import CsvImportStatus


class CsvImportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    status: CsvImportStatus
    total_rows: int
    imported_rows: int
    created_at: datetime


class CsvUploadResponse(BaseModel):
    import_id: int
    headers: List[str]
    preview: List[Dict[str, Any]]
    total_rows: int


class CsvMapRequest(BaseModel):
    target: str
    mapping: Dict[str, str]


class CsvValidationResponse(BaseModel):
    valid_rows: int
    invalid_rows: int
    errors: List[Dict[str, Any]]


class CsvImportResponse(BaseModel):
    imported: int
    skipped: int
    errors: List[Dict[str, Any]]
