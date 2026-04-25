import json
from dataclasses import dataclass
from urllib import error, request

from app.core.config import get_settings


class AssistantServiceUnavailable(RuntimeError):
    pass


@dataclass
class AssistantGenerationResult:
    content: str
    provider: str
    model: str
    source: str = "llm"


def _post_json(url: str, payload: dict, timeout_seconds: int) -> dict:
    body = json.dumps(payload).encode("utf-8")
    http_request = request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(http_request, timeout=timeout_seconds) as response:
            raw_response = response.read().decode("utf-8")
    except error.HTTPError as exc:
        try:
            error_payload = json.loads(exc.read().decode("utf-8"))
        except Exception:
            error_payload = None
        detail = error_payload.get("error") if isinstance(error_payload, dict) else None
        raise AssistantServiceUnavailable(detail or f"Assistant request failed with HTTP {exc.code}.") from exc
    except error.URLError as exc:
        raise AssistantServiceUnavailable("Unable to reach the local Ollama service.") from exc
    except TimeoutError as exc:
        raise AssistantServiceUnavailable("The local Ollama service timed out.") from exc

    try:
        parsed = json.loads(raw_response)
    except json.JSONDecodeError as exc:
        raise AssistantServiceUnavailable("The assistant service returned an invalid response.") from exc

    if not isinstance(parsed, dict):
        raise AssistantServiceUnavailable("The assistant service returned an unexpected response payload.")

    return parsed


def generate_chat_reply(*, system_prompt: str, messages: list[dict[str, str]]) -> AssistantGenerationResult:
    settings = get_settings()
    provider = settings.chatbot_provider
    if provider != "ollama":
        raise AssistantServiceUnavailable(f"Unsupported chatbot provider: {provider}.")

    payload = {
        "model": settings.chatbot_model,
        "messages": [{"role": "system", "content": system_prompt}, *messages],
        "stream": False,
        "options": {
            "temperature": settings.chatbot_temperature,
        },
    }

    response_payload = _post_json(
        f"{settings.chatbot_ollama_base_url}/api/chat",
        payload,
        timeout_seconds=settings.chatbot_request_timeout_seconds,
    )
    message_payload = response_payload.get("message")
    if not isinstance(message_payload, dict):
        raise AssistantServiceUnavailable("The assistant service did not return a message.")

    content = str(message_payload.get("content") or "").strip()
    if not content:
        raise AssistantServiceUnavailable("The assistant service returned an empty reply.")

    return AssistantGenerationResult(
        content=content,
        provider="Ollama",
        model=settings.chatbot_model,
    )
