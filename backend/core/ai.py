"""Thin Gemini client. Every caller must handle a None result with a rule-based fallback."""
import json
import logging

import requests
from django.conf import settings

log = logging.getLogger(__name__)
URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def ai_enabled():
    return bool(settings.GEMINI_API_KEY)


def gemini(prompt, json_mode=False, temperature=0.4, timeout=25):
    if not ai_enabled():
        return None
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature},
    }
    if json_mode:
        body["generationConfig"]["responseMimeType"] = "application/json"
    try:
        r = requests.post(
            URL.format(model=settings.GEMINI_MODEL),
            params={"key": settings.GEMINI_API_KEY},
            json=body,
            timeout=timeout,
        )
        r.raise_for_status()
        text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text) if json_mode else text.strip()
    except Exception as exc:  # network, quota, parse errors all fall back
        log.warning("Gemini call failed: %s", exc)
        return None
