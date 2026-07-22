const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const placeholder = document.getElementById("uploadPlaceholder");
const manualBrand = document.getElementById("manualBrand");
const categorySelect = document.getElementById("categorySelect");
const conditionSelect = document.getElementById("conditionSelect");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultEl = document.getElementById("result");
const modeBadge = document.getElementById("modeBadge");

let imageBase64 = null;

const TIER_CLASS = {
  luxo: "tier-luxo",
  premium: "tier-premium",
  mainstream: "tier-mainstream",
  popular: "tier-popular",
};

function fmtBRL(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function loadOptions() {
  const res = await fetch("/api/options");
  const data = await res.json();

  categorySelect.innerHTML = data.categories
    .map((c) => `<option value="${c.key}">${c.label}</option>`)
    .join("");
  conditionSelect.innerHTML = data.conditions
    .map((c) => `<option value="${c.key}">${c.label}</option>`)
    .join("");

  modeBadge.textContent = data.visionConfigured
    ? `Google Vision API conectada · ${data.knownBrandsCount} marcas na base`
    : `Modo simulado (sem API de visão configurada) · digite a marca manualmente · ${data.knownBrandsCount} marcas na base`;
}

uploadArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    imageBase64 = result.split(",")[1];
    preview.src = result;
    preview.hidden = false;
    placeholder.hidden = true;
    analyzeBtn.disabled = false;
  };
  reader.readAsDataURL(file);
});

manualBrand.addEventListener("input", () => {
  if (manualBrand.value.trim()) analyzeBtn.disabled = false;
});

analyzeBtn.addEventListener("click", async () => {
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analisando...";
  resultEl.hidden = true;

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64,
        categoryKey: categorySelect.value,
        conditionKey: conditionSelect.value,
        manualBrandName: manualBrand.value.trim() || undefined,
      }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Erro desconhecido");

    renderResult(data);
  } catch (err) {
    resultEl.hidden = false;
    resultEl.innerHTML = `<p class="warn">Erro: ${err.message}</p>`;
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analisar";
  }
});

function renderResult(data) {
  resultEl.hidden = false;

  if (!data.recognized) {
    resultEl.innerHTML = `
      <p class="result-title">Marca não identificada</p>
      <p class="warn">${data.message}</p>
      ${data.detectedLabels && data.detectedLabels.length
        ? `<p class="warn">Rótulos detectados na imagem: ${data.detectedLabels.join(", ")}</p>`
        : ""}
    `;
    return;
  }

  const tierClass = TIER_CLASS[data.tier] || "tier-popular";

  resultEl.innerHTML = `
    <p class="result-title">${capitalize(data.brand)}</p>
    <span class="tier-pill ${tierClass}">${data.tierLabel}</span>

    <div class="result-row"><span>País de origem</span><span>${data.country}</span></div>
    <div class="result-row"><span>Categoria analisada</span><span>${data.categoryLabel}</span></div>
    <div class="result-row"><span>Estado de conservação</span><span>${data.conditionLabel}</span></div>
    <div class="result-row"><span>Preço estimado (novo)</span><span>${fmtBRL(data.estimatedNewRangeBRL[0])} – ${fmtBRL(data.estimatedNewRangeBRL[1])}</span></div>

    <div class="price-box">
      <div class="amount">${fmtBRL(data.estimatedResaleRangeBRL[0])} – ${fmtBRL(data.estimatedResaleRangeBRL[1])}</div>
      <div class="label">Estimativa de preço de venda (peça usada)</div>
    </div>
  `;
}

function capitalize(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

loadOptions();
