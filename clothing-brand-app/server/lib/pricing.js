// Estimador de preço heurístico: não consulta nenhum marketplace em tempo
// real (não existe uma API pública para isso). Combina a faixa de preço
// "novo" da marca (server/lib/brands.js) com multiplicadores de categoria
// de peça e de estado de conservação. É uma ESTIMATIVA, não uma cotação.

const CATEGORY_MULTIPLIERS = {
  camiseta: { label: "Camiseta / Blusa", mult: 1 },
  calca: { label: "Calça / Jeans", mult: 1.3 },
  vestido: { label: "Vestido", mult: 1.5 },
  jaqueta: { label: "Jaqueta / Casaco", mult: 2.5 },
  moletom: { label: "Moletom / Suéter", mult: 1.4 },
  tenis: { label: "Tênis / Calçado", mult: 1.8 },
  acessorio: { label: "Bolsa / Acessório", mult: 2.0 },
};

const CONDITION_MULTIPLIERS = {
  novo_com_etiqueta: { label: "Novo, com etiqueta", mult: [0.75, 0.9] },
  seminovo: { label: "Seminovo (poucos usos, ótimo estado)", mult: [0.5, 0.65] },
  usado_bom_estado: { label: "Usado, bom estado", mult: [0.3, 0.45] },
  usado_desgastado: { label: "Usado, com desgaste visível", mult: [0.15, 0.25] },
};

const TIER_LABELS = {
  luxo: "Luxo / Grife de alto padrão",
  premium: "Premium / Contemporânea",
  mainstream: "Mainstream / Intermediária",
  popular: "Popular / Fast fashion",
};

function estimatePrice({ brand, categoryKey, conditionKey }) {
  const category = CATEGORY_MULTIPLIERS[categoryKey] || CATEGORY_MULTIPLIERS.camiseta;
  const condition = CONDITION_MULTIPLIERS[conditionKey] || CONDITION_MULTIPLIERS.usado_bom_estado;

  const [baseMin, baseMax] = brand.basePriceBRL;
  const newMin = baseMin * category.mult;
  const newMax = baseMax * category.mult;

  const [condMin, condMax] = condition.mult;
  const usedMin = Math.round(newMin * condMin);
  const usedMax = Math.round(newMax * condMax);

  return {
    tierLabel: TIER_LABELS[brand.tier] || brand.tier,
    categoryLabel: category.label,
    conditionLabel: condition.label,
    estimatedNewRangeBRL: [Math.round(newMin), Math.round(newMax)],
    estimatedResaleRangeBRL: [usedMin, usedMax],
  };
}

module.exports = {
  CATEGORY_MULTIPLIERS,
  CONDITION_MULTIPLIERS,
  TIER_LABELS,
  estimatePrice,
};
