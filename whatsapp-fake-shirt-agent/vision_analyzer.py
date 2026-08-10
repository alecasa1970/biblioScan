"""Analisa fotos de camisas/roupas usando a API de visao da Anthropic (Claude)
para identificar sinais de falsificacao, com base na knowledge_base local.
"""
import base64
import json
import os

import anthropic

from knowledge_base import SYSTEM_PROMPT, list_supported_brands

DEFAULT_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-opus-5")

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


RESULT_SCHEMA = {
    "type": "object",
    "properties": {
        "marca_detectada": {
            "type": "string",
            "description": "Marca identificada na peca, ou 'indeterminada'.",
        },
        "veredito": {
            "type": "string",
            "enum": ["FALSA", "VERDADEIRA", "INCONCLUSIVO"],
        },
        "confianca": {
            "type": "string",
            "enum": ["baixa", "media", "alta"],
        },
        "sinais_de_alerta": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Sinais concretos observados que sugerem falsificacao.",
        },
        "sinais_positivos": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Sinais concretos observados que sugerem autenticidade.",
        },
        "fotos_adicionais_sugeridas": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Se INCONCLUSIVO, quais fotos ajudariam a decidir.",
        },
        "resumo": {
            "type": "string",
            "description": "Explicacao curta e direta em portugues para o usuario.",
        },
    },
    "required": [
        "marca_detectada",
        "veredito",
        "confianca",
        "sinais_de_alerta",
        "sinais_positivos",
        "fotos_adicionais_sugeridas",
        "resumo",
    ],
    "additionalProperties": False,
}


def analyze_shirt_photo(image_bytes: bytes, media_type: str, caption: str = "") -> dict:
    """Envia a foto para o Claude e retorna o veredito estruturado."""
    image_b64 = base64.standard_b64encode(image_bytes).decode("utf-8")

    user_text = (
        "Analise esta foto de uma peca de roupa e determine se e falsificada "
        "ou original, seguindo suas instrucoes."
    )
    if caption:
        user_text += f"\n\nO usuario enviou esta legenda junto com a foto: {caption!r}"

    response = _get_client().messages.create(
        model=DEFAULT_MODEL,
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        output_config={"format": {"type": "json_schema", "schema": RESULT_SCHEMA}},
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {"type": "text", "text": user_text},
                ],
            }
        ],
    )

    if response.stop_reason == "refusal":
        return {
            "erro": True,
            "mensagem": (
                "Nao foi possivel analisar essa imagem (recusada pelos "
                "filtros de seguranca do modelo)."
            ),
        }

    text = next(block.text for block in response.content if block.type == "text")
    result = json.loads(text)
    result["erro"] = False
    return result


def format_whatsapp_reply(result: dict) -> str:
    """Formata o resultado estruturado como texto para enviar no WhatsApp."""
    if result.get("erro"):
        return f"⚠️ {result['mensagem']}"

    veredito_emoji = {
        "FALSA": "❌",
        "VERDADEIRA": "✅",
        "INCONCLUSIVO": "❓",
    }.get(result["veredito"], "")

    lines = [
        f"{veredito_emoji} *Veredito: {result['veredito']}* "
        f"(confianca: {result['confianca']})",
        f"*Marca identificada:* {result['marca_detectada']}",
        "",
        result["resumo"],
    ]

    if result["sinais_de_alerta"]:
        lines.append("\n*Sinais de alerta observados:*")
        lines += [f"- {s}" for s in result["sinais_de_alerta"]]

    if result["sinais_positivos"]:
        lines.append("\n*Sinais de autenticidade observados:*")
        lines += [f"- {s}" for s in result["sinais_positivos"]]

    if result["veredito"] == "INCONCLUSIVO" and result["fotos_adicionais_sugeridas"]:
        lines.append("\n*Para uma analise melhor, envie tambem:*")
        lines += [f"- {s}" for s in result["fotos_adicionais_sugeridas"]]

    lines.append(
        "\n_Esta e uma triagem automatizada e nao substitui autenticacao "
        "oficial da marca ou de um perito credenciado._"
    )
    lines.append(
        f"\n(Marcas com dicas especificas na base: {', '.join(list_supported_brands())}. "
        "Para outras marcas, uso apenas o checklist geral.)"
    )

    return "\n".join(lines)
