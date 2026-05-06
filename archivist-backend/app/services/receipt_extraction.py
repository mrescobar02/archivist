import base64
import json
import re
import logging
from typing import Dict, Any
from sqlmodel import Session, select
from ..models.category import Category
from .groq_client import get_client, get_vision_model

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """Analyze this receipt image and extract information as JSON.
Return ONLY valid JSON with these exact keys:
{
  "merchant": "store/business name or null",
  "amount": numeric total as a number (no currency symbols) or null,
  "date": "YYYY-MM-DD format or null",
  "category_name": "one of: Food, Housing, Transport, Entertainment, Utilities, Health, Shopping, Education, Other",
  "raw_text": "brief summary of what you see on the receipt"
}
If you cannot determine a value, use null. Return only the JSON object, no other text."""


def extract_from_image(image_bytes: bytes, content_type: str, session: Session) -> Dict[str, Any]:
    client = get_client()
    if not client:
        raise RuntimeError("Groq client not configured — set GROQ_API_KEY")

    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    media_type = content_type if content_type in allowed_types else "image/jpeg"
    image_data = base64.standard_b64encode(image_bytes).decode("utf-8")

    response = client.chat.completions.create(
        model=get_vision_model(),
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{media_type};base64,{image_data}"},
                },
                {"type": "text", "text": EXTRACTION_PROMPT},
            ],
        }],
    )

    raw_response = response.choices[0].message.content.strip()

    try:
        extracted = json.loads(raw_response)
    except json.JSONDecodeError:
        json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        if json_match:
            extracted = json.loads(json_match.group())
        else:
            raise ValueError(f"Could not parse AI response as JSON: {raw_response[:200]}")

    category_id = None
    if extracted.get("category_name"):
        cat = session.exec(
            select(Category).where(Category.name == extracted["category_name"])
        ).first()
        if cat:
            category_id = cat.id

    extracted["category_id"] = category_id
    return extracted
