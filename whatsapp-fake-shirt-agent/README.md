# Agente WhatsApp: Detector de Roupas Falsificadas

Agente que se conecta ao **WhatsApp Business (API oficial da Meta)**, recebe
fotos de peças de roupa (camisas, jaquetas etc.) enviadas por câmera/galeria,
e usa a **API da Anthropic (Claude, com visão)** para analisar a peça contra
uma base de dicas de autenticação — logotipos, costuras, etiquetas, zíperes,
números RN/CA — pesquisadas para marcas como **Lacoste**, **The North Face**,
**Nike** e **Adidas**. Responde no próprio WhatsApp com um veredito:
**FALSA**, **VERDADEIRA** ou **INCONCLUSIVO**, junto com os sinais
observados na foto.

> ⚠️ **Aviso importante:** isso é uma triagem visual automatizada baseada
> apenas em fotos. Não substitui a autenticação oficial da marca, um perito
> credenciado ou um serviço especializado de autenticação. Use como um
> indicativo, não como prova legal/definitiva — especialmente se for usar o
> resultado para decisões de compra, venda ou denúncia.

## Como funciona

```
WhatsApp (usuário) --foto--> Meta Cloud API --webhook--> este servidor
                                                              |
                                                              v
                                                    baixa a foto (Graph API)
                                                              |
                                                              v
                                                Claude (Anthropic, com visão)
                                                + base de conhecimento local
                                                              |
                                                              v
                                                  veredito estruturado
                                                              |
                                                              v
                              este servidor --resposta--> WhatsApp (usuário)
```

- **Conexão com o WhatsApp:** API oficial do WhatsApp Business (Meta Cloud
  API), via webhook HTTP. Não usa nenhuma biblioteca não-oficial.
- **Análise da imagem:** API da Anthropic (`anthropic` SDK Python), enviando
  a foto como bloco de imagem e pedindo uma resposta estruturada (JSON) com
  veredito, marca detectada, sinais de alerta/positivos e nível de confiança.
- **Base de conhecimento:** arquivo [`knowledge_base.py`](./knowledge_base.py),
  com um checklist geral de autenticação de roupas e dicas específicas por
  marca. É fácil de estender — veja a seção "Adicionando novas marcas".

## Este agente precisa rodar continuamente

Este servidor precisa ficar ativo o tempo todo, esperando fotos chegarem pelo
WhatsApp. Rode-o na sua própria máquina (para testes) ou em um servidor/VPS
que fique sempre ligado (para uso contínuo) — veja "Rodando em produção"
abaixo.

## Passo a passo de configuração

### 1. Pré-requisitos

- Python 3.10+
- Uma conta [Meta for Developers](https://developers.facebook.com/) e um
  **Meta App** com o produto **WhatsApp** adicionado
- Uma chave de API da Anthropic (crie em https://console.anthropic.com/settings/keys)

### 2. Instalar dependências

```bash
cd whatsapp-fake-shirt-agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configurar o WhatsApp Business (API oficial)

1. Acesse https://developers.facebook.com/apps e crie um novo App do tipo
   "Business", adicionando o produto **WhatsApp**.
2. Em **WhatsApp > API Setup** você verá:
   - Um **número de telefone de teste** já pronto para usar (grátis, mas só
     envia mensagens para números que você cadastrar como destinatários de
     teste) — ótimo para começar.
   - O **Phone Number ID** — copie para `WHATSAPP_PHONE_NUMBER_ID` no `.env`.
   - Um **token de acesso temporário** (válido por 24h, só para testes) —
     copie para `WHATSAPP_TOKEN`. Para uso contínuo, gere um **token
     permanente**: crie um System User em
     **Configurações do Negócio > Usuários do sistema**, atribua a ele o
     app e a permissão `whatsapp_business_messaging`, e gere um token sem
     expiração.
3. Em `.env`, defina `WHATSAPP_VERIFY_TOKEN` como qualquer string secreta
   escolhida por você (você vai usar o mesmo valor no passo 5).
4. Copie `.env.example` para `.env` e preencha os valores.

### 4. Configurar a Anthropic

No `.env`, defina `ANTHROPIC_API_KEY` com sua chave da Anthropic. O modelo
padrão é `claude-opus-5` (mais capaz); se quiser reduzir custo por foto
analisada, troque `ANTHROPIC_MODEL` para `claude-sonnet-5` ou
`claude-haiku-4-5`.

### 5. Rodar o servidor localmente e expor para a internet (para testes)

O webhook da Meta precisa alcançar seu servidor por HTTPS público. Para
testar localmente, use o [ngrok](https://ngrok.com/):

```bash
# Terminal 1: rode o servidor
python app.py

# Terminal 2: exponha a porta 8080
ngrok http 8080
```

O ngrok vai te dar uma URL tipo `https://abcd1234.ngrok-free.app`.

### 6. Registrar o webhook no Meta App Dashboard

1. Em **WhatsApp > Configuration**, clique em **Edit** no webhook.
2. **Callback URL**: `https://SUA-URL-NGROK/webhook`
3. **Verify Token**: o mesmo valor que você colocou em `WHATSAPP_VERIFY_TOKEN`
4. Clique em **Verify and Save**.
5. Em **Webhook fields**, inscreva-se (subscribe) no campo **messages**.

### 7. Testar

No WhatsApp do seu celular, envie uma mensagem para o número de teste (você
precisa primeiro adicionar seu número como destinatário de teste em
**API Setup > To**). Envie uma foto de uma camisa — o bot deve responder com
"🔎 Analisando a foto..." e, em seguida, o veredito.

Você também pode testar a análise de visão sem o WhatsApp:

```bash
python analyze_local.py caminho/para/foto.jpg
```

## Rodando em produção (24/7)

Para uso contínuo (não apenas testes), rode em um servidor que fique sempre
ligado (VPS, Raspberry Pi em casa, etc.), com HTTPS real (não ngrok):

```bash
gunicorn -w 2 -b 0.0.0.0:8080 app:app
```

Coloque um proxy reverso com HTTPS na frente (ex: nginx + certbot/Let's
Encrypt, ou Caddy, que faz isso automaticamente), aponte o domínio para o
servidor, e registre `https://seu-dominio.com/webhook` no Meta App Dashboard.
Para manter o processo rodando após reinícios, use `systemd`, `pm2` ou
Docker.

Além disso, para enviar mensagens para **qualquer** número (não só os de
teste), você precisa verificar seu Meta Business e seu número de telefone de
produção segue as políticas de mensagens do WhatsApp Business (ex: para
iniciar conversa com um usuário fora da janela de 24h é preciso usar um
"message template" pré-aprovado — isso não afeta respostas normais dentro de
uma conversa já iniciada pelo usuário, que é o caso deste agente).

## Adicionando novas marcas

Edite [`knowledge_base.py`](./knowledge_base.py) e adicione uma nova entrada
em `BRAND_GUIDES`, no mesmo formato das existentes (lista de strings, cada
uma descrevendo um sinal concreto de autenticidade ou falsificação). Não é
necessário alterar mais nada — a base é injetada automaticamente no prompt
do Claude.

## Estrutura dos arquivos

| Arquivo | Descrição |
|---|---|
| `app.py` | Servidor Flask: webhook do WhatsApp (verificação + recebimento de mensagens) |
| `whatsapp_client.py` | Funções para enviar mensagens e baixar mídia via WhatsApp Cloud API |
| `vision_analyzer.py` | Chama a API da Anthropic com a foto e retorna o veredito estruturado |
| `knowledge_base.py` | Checklist geral + dicas específicas por marca (Lacoste, North Face, Nike, Adidas) |
| `analyze_local.py` | Script utilitário para testar a análise sem precisar do WhatsApp |
| `.env.example` | Modelo de variáveis de ambiente (copie para `.env`) |

## Limitações conhecidas

- A qualidade da análise depende diretamente da qualidade e do ângulo das
  fotos enviadas (foco, iluminação, proximidade dos detalhes).
- Falsificadores de alta qualidade podem replicar até etiquetas e hologramas
  com bastante fidelidade — nenhuma análise por foto é 100% garantida.
- A base de conhecimento cobre em detalhe apenas Lacoste, The North Face,
  Nike e Adidas; para outras marcas o agente usa apenas o checklist geral.
- Este projeto não usa nenhuma biblioteca não-oficial de WhatsApp — depende
  inteiramente da API oficial da Meta, sujeita às políticas de uso da
  plataforma.
