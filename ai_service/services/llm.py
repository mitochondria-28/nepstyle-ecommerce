"""
Gemini LLM wrapper using the current google-genai SDK.

Provides two main interfaces:
  - generate()  : single-turn text generation
  - chat()      : multi-turn conversation (list of messages)

Uses tenacity for retry on transient rate-limit / server errors.
"""
import logging
from typing import Optional

from google import genai
from google.genai import types
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from config import settings

logger = logging.getLogger(__name__)

# ── Singleton client ─────────────────────────────────────────────
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def _generation_config(
    temperature: float,
    system_prompt: Optional[str] = None,
) -> types.GenerateContentConfig:
    cfg = dict(
        temperature=temperature,
        max_output_tokens=settings.llm_max_tokens,
        candidate_count=1,
        safety_settings=[
            types.SafetySetting(
                category="HARM_CATEGORY_HARASSMENT",
                threshold="BLOCK_ONLY_HIGH",
            ),
            types.SafetySetting(
                category="HARM_CATEGORY_HATE_SPEECH",
                threshold="BLOCK_ONLY_HIGH",
            ),
            types.SafetySetting(
                category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold="BLOCK_ONLY_HIGH",
            ),
            types.SafetySetting(
                category="HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold="BLOCK_ONLY_HIGH",
            ),
        ],
    )
    if system_prompt:
        cfg["system_instruction"] = system_prompt
    return types.GenerateContentConfig(**cfg)


@retry(
    retry=retry_if_exception_type(Exception),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
def generate(
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = settings.llm_temperature,
) -> str:
    """Single-turn text generation."""
    client = _get_client()
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=_generation_config(temperature, system_prompt),
    )
    text = response.text.strip()
    logger.debug(f"LLM generated {len(text)} chars")
    return text


@retry(
    retry=retry_if_exception_type(Exception),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
def chat(
    messages: list[dict],
    system_prompt: Optional[str] = None,
    temperature: float = settings.llm_temperature,
) -> str:
    """
    Multi-turn conversation.

    messages format:
      [{"role": "user", "content": "..."}, {"role": "model", "content": "..."}, ...]

    The last message must be from "user".
    """
    client = _get_client()
    history: list[types.Content] = []

    for msg in messages[:-1]:
        role = "user" if msg["role"] == "user" else "model"
        history.append(
            types.Content(role=role, parts=[types.Part(text=msg["content"])])
        )

    last_message = messages[-1]["content"] if messages else ""

    chat_session = client.chats.create(
        model=settings.gemini_model,
        config=_generation_config(temperature, system_prompt),
        history=history,
    )
    response = chat_session.send_message(last_message)
    return response.text.strip()


def ping() -> bool:
    """Verify Gemini API key is valid. Used by /health."""
    try:
        client = _get_client()
        # List models is a cheap API call that validates the key
        next(iter(client.models.list()))
        return True
    except Exception as e:
        logger.error(f"Gemini ping failed: {e}")
        return False
