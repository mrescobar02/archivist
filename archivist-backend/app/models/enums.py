from enum import Enum


class AccountType(str, Enum):
    checking = "checking"
    savings = "savings"
    cash = "cash"
    investment = "investment"


class ExpenseType(str, Enum):
    fixed = "fixed"
    variable = "variable"


class Frequency(str, Enum):
    monthly = "monthly"
    weekly = "weekly"
    yearly = "yearly"


class CsvImportStatus(str, Enum):
    pending = "pending"
    mapped = "mapped"
    imported = "imported"
    failed = "failed"


class ReceiptScanStatus(str, Enum):
    pending = "pending"
    reviewed = "reviewed"
    saved = "saved"
    failed = "failed"
