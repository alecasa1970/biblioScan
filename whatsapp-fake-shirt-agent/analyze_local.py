"""Testa a analise de visao (Claude) localmente, sem precisar do WhatsApp.

Uso:
    python analyze_local.py caminho/para/foto.jpg
"""
import mimetypes
import sys

from dotenv import load_dotenv

load_dotenv()

from vision_analyzer import analyze_shirt_photo, format_whatsapp_reply


def main():
    if len(sys.argv) != 2:
        print(f"Uso: python {sys.argv[0]} caminho/para/foto.jpg")
        sys.exit(1)

    path = sys.argv[1]
    mime_type, _ = mimetypes.guess_type(path)
    if not mime_type or not mime_type.startswith("image/"):
        mime_type = "image/jpeg"

    with open(path, "rb") as f:
        image_bytes = f.read()

    print("Analisando... (pode levar alguns segundos)\n")
    result = analyze_shirt_photo(image_bytes, mime_type)
    print(format_whatsapp_reply(result))


if __name__ == "__main__":
    main()
