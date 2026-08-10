"""Servidor webhook do agente de deteccao de roupas falsificadas via WhatsApp.

Fluxo:
1. Usuario envia uma foto de uma peca de roupa pelo WhatsApp.
2. Este servidor recebe o webhook da Meta Cloud API, baixa a foto.
3. A foto e enviada para o Claude (Anthropic) com uma base de conhecimento
   sobre como identificar falsificacoes (Lacoste, North Face, Nike, Adidas...).
4. O veredito (FALSA / VERDADEIRA / INCONCLUSIVO) e enviado de volta ao
   usuario no WhatsApp.
"""
import logging
import os
import threading

from dotenv import load_dotenv
from flask import Flask, request

load_dotenv()

import whatsapp_client
from vision_analyzer import analyze_shirt_photo, format_whatsapp_reply

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fake-shirt-agent")

app = Flask(__name__)

VERIFY_TOKEN = os.environ.get("WHATSAPP_VERIFY_TOKEN", "")

HELP_TEXT = (
    "Ola! Eu sou um agente que ajuda a identificar se uma peca de roupa "
    "(camisa, jaqueta etc) e falsificada.\n\n"
    "Envie uma *foto* da peca — de preferencia:\n"
    "- uma foto geral da peca\n"
    "- uma foto de perto do logotipo/etiqueta\n"
    "- uma foto de perto da etiqueta interna de composicao\n"
    "- se houver, uma foto do ziper ou de outros detalhes de acabamento\n\n"
    "Quanto mais detalhes visiveis, mais precisa sera a analise. Isso e uma "
    "triagem automatizada e nao substitui a autenticacao oficial da marca."
)


@app.route("/webhook", methods=["GET"])
def verify_webhook():
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        return challenge or "", 200
    return "forbidden", 403


@app.route("/webhook", methods=["POST"])
def receive_webhook():
    payload = request.get_json(silent=True) or {}

    try:
        entries = payload.get("entry", [])
        for entry in entries:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for message in value.get("messages", []):
                    _handle_message_async(message)
    except Exception:
        logger.exception("Erro processando webhook do WhatsApp")

    # Responde rapido para a Meta nao reenviar o webhook.
    return "ok", 200


def _handle_message_async(message: dict) -> None:
    thread = threading.Thread(target=_handle_message, args=(message,), daemon=True)
    thread.start()


def _handle_message(message: dict) -> None:
    sender = message.get("from")
    msg_type = message.get("type")

    try:
        if msg_type == "image":
            _handle_image_message(sender, message)
        elif msg_type == "text":
            whatsapp_client.send_text_message(sender, HELP_TEXT)
        else:
            whatsapp_client.send_text_message(
                sender,
                "Por favor, envie uma *foto* da peca de roupa para eu analisar.",
            )
    except Exception:
        logger.exception("Erro ao processar mensagem de %s", sender)
        try:
            whatsapp_client.send_text_message(
                sender,
                "⚠️ Desculpe, ocorreu um erro ao analisar sua foto. Tente novamente.",
            )
        except Exception:
            logger.exception("Falha tambem ao enviar mensagem de erro para %s", sender)


def _handle_image_message(sender: str, message: dict) -> None:
    image_info = message.get("image", {})
    media_id = image_info.get("id")
    caption = image_info.get("caption", "")

    whatsapp_client.send_text_message(
        sender, "🔎 Analisando a foto, um momento..."
    )

    image_bytes, mime_type = whatsapp_client.download_media(media_id)
    result = analyze_shirt_photo(image_bytes, mime_type, caption)
    reply = format_whatsapp_reply(result)

    whatsapp_client.send_text_message(sender, reply)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    app.run(host="0.0.0.0", port=port)
