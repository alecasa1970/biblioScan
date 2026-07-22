// Base curada de marcas de roupas/calçados/acessórios.
// tier: "luxo" | "premium" | "mainstream" | "popular"
// basePriceBRL: faixa de preço (novo, item "camiseta" de referência) usada
// como base para o estimador — ver server/lib/pricing.js.
const BRANDS = [
  // ---- LUXO ----
  { names: ["gucci"], country: "Itália", tier: "luxo", basePriceBRL: [3500, 9000] },
  { names: ["louis vuitton", "lv"], country: "França", tier: "luxo", basePriceBRL: [4000, 12000] },
  { names: ["chanel"], country: "França", tier: "luxo", basePriceBRL: [5000, 15000] },
  { names: ["prada"], country: "Itália", tier: "luxo", basePriceBRL: [3500, 9500] },
  { names: ["hermes", "hermès"], country: "França", tier: "luxo", basePriceBRL: [6000, 20000] },
  { names: ["dior", "christian dior"], country: "França", tier: "luxo", basePriceBRL: [4000, 11000] },
  { names: ["versace"], country: "Itália", tier: "luxo", basePriceBRL: [3000, 8500] },
  { names: ["balenciaga"], country: "Espanha/França", tier: "luxo", basePriceBRL: [3500, 9000] },
  { names: ["burberry"], country: "Reino Unido", tier: "luxo", basePriceBRL: [3000, 8000] },
  { names: ["giorgio armani", "armani"], country: "Itália", tier: "luxo", basePriceBRL: [2800, 7500] },
  { names: ["dolce gabbana", "dolce & gabbana", "d&g"], country: "Itália", tier: "luxo", basePriceBRL: [3200, 9000] },
  { names: ["fendi"], country: "Itália", tier: "luxo", basePriceBRL: [3500, 9500] },
  { names: ["saint laurent", "ysl"], country: "França", tier: "luxo", basePriceBRL: [3800, 9500] },
  { names: ["valentino"], country: "Itália", tier: "luxo", basePriceBRL: [3500, 9000] },
  { names: ["moncler"], country: "França/Itália", tier: "luxo", basePriceBRL: [4500, 12000] },
  { names: ["gianvito rossi", "louboutin", "christian louboutin"], country: "França/Itália", tier: "luxo", basePriceBRL: [4000, 10000] },
  { names: ["gianni versace"], country: "Itália", tier: "luxo", basePriceBRL: [3000, 8500] },
  { names: ["bottega veneta"], country: "Itália", tier: "luxo", basePriceBRL: [3500, 9500] },
  { names: ["celine", "céline"], country: "França", tier: "luxo", basePriceBRL: [3500, 9000] },
  { names: ["loewe"], country: "Espanha", tier: "luxo", basePriceBRL: [3200, 8500] },

  // ---- PREMIUM / CONTEMPORÂNEO ----
  { names: ["ralph lauren", "polo ralph lauren"], country: "Estados Unidos", tier: "premium", basePriceBRL: [400, 1200] },
  { names: ["tommy hilfiger"], country: "Estados Unidos", tier: "premium", basePriceBRL: [250, 800] },
  { names: ["calvin klein", "ck"], country: "Estados Unidos", tier: "premium", basePriceBRL: [250, 750] },
  { names: ["hugo boss", "boss"], country: "Alemanha", tier: "premium", basePriceBRL: [450, 1300] },
  { names: ["michael kors"], country: "Estados Unidos", tier: "premium", basePriceBRL: [400, 1200] },
  { names: ["coach"], country: "Estados Unidos", tier: "premium", basePriceBRL: [500, 1500] },
  { names: ["lacoste"], country: "França", tier: "premium", basePriceBRL: [300, 900] },
  { names: ["diesel"], country: "Itália", tier: "premium", basePriceBRL: [350, 1000] },
  { names: ["armani exchange", "a|x"], country: "Itália", tier: "premium", basePriceBRL: [300, 900] },
  { names: ["kate spade"], country: "Estados Unidos", tier: "premium", basePriceBRL: [400, 1100] },
  { names: ["osklen"], country: "Brasil", tier: "premium", basePriceBRL: [350, 1000] },
  { names: ["animale"], country: "Brasil", tier: "premium", basePriceBRL: [300, 900] },
  { names: ["farm", "farm rio"], country: "Brasil", tier: "premium", basePriceBRL: [280, 800] },
  { names: ["colcci"], country: "Brasil", tier: "premium", basePriceBRL: [200, 600] },
  { names: ["cavalera"], country: "Brasil", tier: "premium", basePriceBRL: [180, 550] },
  { names: ["north face", "the north face"], country: "Estados Unidos", tier: "premium", basePriceBRL: [350, 1000] },
  { names: ["patagonia"], country: "Estados Unidos", tier: "premium", basePriceBRL: [400, 1100] },
  { names: ["superdry"], country: "Reino Unido", tier: "premium", basePriceBRL: [250, 700] },
  { names: ["guess"], country: "Estados Unidos", tier: "premium", basePriceBRL: [220, 650] },

  // ---- MAINSTREAM / ESPORTIVO ----
  { names: ["nike"], country: "Estados Unidos", tier: "mainstream", basePriceBRL: [90, 350] },
  { names: ["adidas"], country: "Alemanha", tier: "mainstream", basePriceBRL: [90, 350] },
  { names: ["puma"], country: "Alemanha", tier: "mainstream", basePriceBRL: [80, 300] },
  { names: ["under armour"], country: "Estados Unidos", tier: "mainstream", basePriceBRL: [100, 350] },
  { names: ["new balance"], country: "Estados Unidos", tier: "mainstream", basePriceBRL: [120, 400] },
  { names: ["levi's", "levis", "levi strauss"], country: "Estados Unidos", tier: "mainstream", basePriceBRL: [150, 450] },
  { names: ["converse"], country: "Estados Unidos", tier: "mainstream", basePriceBRL: [100, 300] },
  { names: ["vans"], country: "Estados Unidos", tier: "mainstream", basePriceBRL: [100, 300] },
  { names: ["fila"], country: "Coreia do Sul/Itália", tier: "mainstream", basePriceBRL: [80, 280] },
  { names: ["reebok"], country: "Estados Unidos", tier: "mainstream", basePriceBRL: [90, 300] },
  { names: ["track field", "track & field", "t&f"], country: "Brasil", tier: "mainstream", basePriceBRL: [120, 400] },
  { names: ["hering"], country: "Brasil", tier: "mainstream", basePriceBRL: [60, 200] },
  { names: ["zara"], country: "Espanha", tier: "mainstream", basePriceBRL: [90, 300] },
  { names: ["mango"], country: "Espanha", tier: "mainstream", basePriceBRL: [90, 280] },
  { names: ["gap"], country: "Estados Unidos", tier: "mainstream", basePriceBRL: [90, 280] },
  { names: ["uniqlo"], country: "Japão", tier: "mainstream", basePriceBRL: [70, 220] },
  { names: ["tommy jeans"], country: "Estados Unidos", tier: "mainstream", basePriceBRL: [150, 450] },

  // ---- POPULAR / FAST FASHION / VALOR ACESSÍVEL ----
  { names: ["h&m", "hm"], country: "Suécia", tier: "popular", basePriceBRL: [40, 150] },
  { names: ["shein"], country: "China", tier: "popular", basePriceBRL: [20, 80] },
  { names: ["c&a", "cea"], country: "Alemanha (operação no Brasil)", tier: "popular", basePriceBRL: [35, 130] },
  { names: ["renner", "lojas renner"], country: "Brasil", tier: "popular", basePriceBRL: [35, 130] },
  { names: ["riachuelo"], country: "Brasil", tier: "popular", basePriceBRL: [30, 120] },
  { names: ["marisa"], country: "Brasil", tier: "popular", basePriceBRL: [30, 110] },
  { names: ["primark"], country: "Irlanda", tier: "popular", basePriceBRL: [20, 90] },
  { names: ["forever 21"], country: "Estados Unidos", tier: "popular", basePriceBRL: [30, 110] },
];

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9& ]/g, "")
    .trim();
}

// Recebe uma lista de strings candidatas (ex.: descrições de logo, entidades
// web, melhor palpite) já ordenadas por confiança e retorna a primeira marca
// da base que casar, junto do texto que gerou o match.
function matchBrand(candidateStrings) {
  for (const raw of candidateStrings) {
    const norm = normalize(raw);
    if (!norm) continue;
    for (const brand of BRANDS) {
      for (const name of brand.names) {
        if (norm === name || norm.includes(name)) {
          return { brand, matchedText: raw };
        }
      }
    }
  }
  return null;
}

module.exports = { BRANDS, normalize, matchBrand };
