// Integração com a Google Cloud Vision API — é a API oficial do Google mais
// próxima do que o Google Lens faz "por baixo dos panos" (detecção de
// logotipo + busca visual na web). O Google Lens em si não expõe uma API
// pública para apps de terceiros.
//
// Sem GOOGLE_VISION_API_KEY configurada, cai num modo simulado (mock) para
// que o app funcione de ponta a ponta sem credenciais.

const VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

async function callGoogleVision(base64Image, apiKey) {
  const body = {
    requests: [
      {
        image: { content: base64Image },
        features: [
          { type: "LOGO_DETECTION", maxResults: 5 },
          { type: "WEB_DETECTION", maxResults: 10 },
          { type: "LABEL_DETECTION", maxResults: 10 },
        ],
      },
    ],
  };

  const res = await fetch(`${VISION_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google Vision API respondeu ${res.status}: ${text}`);
  }

  const data = await res.json();
  const result = data.responses && data.responses[0];
  if (!result) return { candidates: [], labels: [], source: "google-vision" };

  if (result.error) {
    throw new Error(`Google Vision API erro: ${result.error.message}`);
  }

  const candidates = [];

  for (const logo of result.logoAnnotations || []) {
    candidates.push({ text: logo.description, confidence: logo.score || 0, source: "logo" });
  }

  const web = result.webDetection || {};
  for (const guess of web.bestGuessLabels || []) {
    candidates.push({ text: guess.label, confidence: 0.5, source: "web-best-guess" });
  }
  for (const entity of web.webEntities || []) {
    if (entity.description) {
      candidates.push({ text: entity.description, confidence: entity.score || 0, source: "web-entity" });
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence);

  const labels = (result.labelAnnotations || []).map((l) => l.description);

  return { candidates, labels, source: "google-vision" };
}

// Modo simulado: não sabe reconhecer a imagem de verdade, então devolve uma
// lista vazia de candidatos com confiança — o restante do fluxo (categoria
// escolhida manualmente + banco de marcas) segue funcionando para fins de
// demonstração e para permitir digitar a marca manualmente no frontend.
async function mockVision() {
  return { candidates: [], labels: [], source: "mock" };
}

async function analyzeImage(base64Image) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return mockVision();
  }
  return callGoogleVision(base64Image, apiKey);
}

module.exports = { analyzeImage };
