# Identificador de Marca de Roupas

App web que tira/recebe uma foto de uma peça de roupa (etiqueta ou logo),
tenta identificar a marca, indica:

- **País de origem** da marca
- Se é uma marca **sofisticada (luxo/premium)** ou **mainstream/popular**
- Uma **estimativa de preço de venda** (novo e para a peça usada, considerando
  categoria da peça e estado de conservação)

## Sobre o reconhecimento de imagem

O Google Lens não oferece uma API pública para integração em aplicativos de
terceiros. Este app usa a **Google Cloud Vision API** (Logo Detection + Web
Detection), que é a API oficial do Google mais próxima do que o Lens faz —
é a mesma tecnologia de base usada em produtos de busca visual do Google.

Sem uma chave de API configurada, o app roda em **modo simulado**: a
identificação automática por foto fica desabilitada, mas você pode digitar o
nome da marca manualmente e o restante do fluxo (país de origem,
posicionamento, estimativa de preço) funciona normalmente — útil para testar
a aplicação antes de configurar credenciais do Google Cloud.

## Como rodar localmente

```bash
cd clothing-brand-app
npm install
cp .env.example .env
# (opcional) edite .env e defina GOOGLE_VISION_API_KEY
npm start
```

Acesse `http://localhost:3000`.

## Como obter uma chave da Google Cloud Vision API

1. Crie um projeto em https://console.cloud.google.com
2. Ative a **Cloud Vision API** no projeto (Marketplace de APIs)
3. Em "APIs e serviços" → "Credenciais", crie uma **Chave de API**
4. Coloque a chave em `GOOGLE_VISION_API_KEY` no arquivo `.env`

A Vision API tem uma cota gratuita mensal; acima dela é cobrada por imagem
processada — consulte a página de preços oficial do Google Cloud.

## Como funciona a estimativa de preço

Não existe uma API pública de "preço de mercado" para roupas usadas, então a
estimativa é heurística, calculada em `server/lib/pricing.js`:

1. Cada marca tem uma faixa de preço-base (item novo, categoria "camiseta")
   cadastrada em `server/lib/brands.js`.
2. Essa faixa é multiplicada por um fator de categoria da peça (camiseta,
   calça, jaqueta, tênis, etc.).
3. O resultado é multiplicado por um fator de depreciação conforme o estado
   de conservação informado (novo com etiqueta → usado desgastado).

O resultado é uma faixa (mínimo–máximo), não um valor exato — é pensado como
ponto de partida para quem quer revender a peça, não como cotação de
marketplace em tempo real.

## Estrutura

```
clothing-brand-app/
├── server/
│   ├── index.js        # servidor Express + rotas da API
│   └── lib/
│       ├── vision.js   # integração com Google Cloud Vision API (+ mock)
│       ├── brands.js   # base de marcas: país de origem e posicionamento
│       └── pricing.js  # estimador de preço (categoria x estado de uso)
└── public/              # frontend estático (HTML/CSS/JS puro)
```

## Ampliando a base de marcas

A base em `server/lib/brands.js` cobre ~70 marcas comuns (luxo, premium,
mainstream, popular/fast fashion). Para adicionar uma marca, inclua um novo
objeto no array `BRANDS` com `names` (aliases para reconhecimento), `country`,
`tier` (`luxo` | `premium` | `mainstream` | `popular`) e `basePriceBRL`
(faixa `[min, max]` para uma camiseta nova).
