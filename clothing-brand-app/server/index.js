const path = require("path");
const express = require("express");
const { analyzeImage } = require("./lib/vision");
const { matchBrand, BRANDS } = require("./lib/brands");
const { estimatePrice, CATEGORY_MULTIPLIERS, CONDITION_MULTIPLIERS } = require("./lib/pricing");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/options", (_req, res) => {
  res.json({
    categories: Object.entries(CATEGORY_MULTIPLIERS).map(([key, v]) => ({ key, label: v.label })),
    conditions: Object.entries(CONDITION_MULTIPLIERS).map(([key, v]) => ({ key, label: v.label })),
    visionConfigured: Boolean(process.env.GOOGLE_VISION_API_KEY),
    knownBrandsCount: BRANDS.length,
  });
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64, categoryKey, conditionKey, manualBrandName } = req.body || {};

    if (!imageBase64 && !manualBrandName) {
      return res.status(400).json({ error: "Envie uma imagem ou digite o nome da marca." });
    }

    let candidates = [];
    let labels = [];
    let source = "manual";

    if (imageBase64) {
      const vision = await analyzeImage(imageBase64);
      candidates = vision.candidates;
      labels = vision.labels;
      source = vision.source;
    }

    // A marca digitada manualmente tem prioridade máxima quando fornecida.
    const candidateTexts = manualBrandName
      ? [manualBrandName, ...candidates.map((c) => c.text)]
      : candidates.map((c) => c.text);

    const match = matchBrand(candidateTexts);

    if (!match) {
      return res.json({
        recognized: false,
        source,
        detectedLabels: labels,
        detectedCandidates: candidates.slice(0, 5),
        message:
          "Não foi possível identificar a marca com confiança. Tente uma foto mais próxima da etiqueta/logo, ou digite o nome da marca manualmente.",
      });
    }

    const pricing = estimatePrice({
      brand: match.brand,
      categoryKey,
      conditionKey,
    });

    res.json({
      recognized: true,
      source,
      brand: match.brand.names[0],
      matchedText: match.matchedText,
      country: match.brand.country,
      tier: match.brand.tier,
      ...pricing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro ao analisar a imagem." });
  }
});

app.listen(PORT, () => {
  console.log(`biblioScan Clothing Brand Identifier rodando em http://localhost:${PORT}`);
  if (!process.env.GOOGLE_VISION_API_KEY) {
    console.log("Aviso: GOOGLE_VISION_API_KEY não definida — rodando em modo simulado (mock).");
  }
});
