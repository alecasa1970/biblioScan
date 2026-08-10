"""Cliente minimo para a API oficial do WhatsApp (Meta Cloud API)."""
import os

import requests

GRAPH_API_VERSION = os.environ.get("WHATSAPP_GRAPH_API_VERSION", "v21.0")
WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID")

_BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


def _headers():
    return {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}


def send_text_message(to: str, body: str) -> None:
    url = f"{_BASE_URL}/{PHONE_NUMBER_ID}/messages"
    # WhatsApp limita mensagens a 4096 caracteres.
    body = body[:4000]
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": body},
    }
    resp = requests.post(url, headers=_headers(), json=payload, timeout=20)
    resp.raise_for_status()


def get_media_url(media_id: str) -> tuple[str, str]:
    """Retorna (url_temporaria, mime_type) para um media_id do WhatsApp."""
    url = f"{_BASE_URL}/{media_id}"
    resp = requests.get(url, headers=_headers(), timeout=20)
    resp.raise_for_status()
    data = resp.json()
    return data["url"], data["mime_type"]


def download_media(media_id: str) -> tuple[bytes, str]:
    """Baixa os bytes de uma midia enviada pelo usuario. Retorna (bytes, mime_type)."""
    media_url, mime_type = get_media_url(media_id)
    resp = requests.get(media_url, headers=_headers(), timeout=30)
    resp.raise_for_status()
    return resp.content, mime_type
