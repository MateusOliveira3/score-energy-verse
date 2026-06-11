# Hermes Setup Score

## Repositorio de referencia
- [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent.git)

## Objetivo desta integracao
A Score usa um BFF local para falar com Hermes sem expor segredo no browser. O frontend conversa apenas com `/api/score-assistant/*`.

## Clonar Hermes separadamente
Nao clone Hermes dentro deste repositorio principal.

Exemplo:

```bash
git clone https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
```

## Variaveis de ambiente da Score
Preencha no ambiente local da Score:

```env
HERMES_WEB_API_URL=
HERMES_WEB_API_KEY=
HERMES_MODEL=minimax/minimax-m3
HERMES_MAX_TOKENS=1024
ASSISTANT_SERVICE_TOKEN=
SCORE_ASSISTANT_ENABLED=true
SCORE_ASSISTANT_FALLBACK_ENABLED=true
```

## Como subir localmente
1. Suba o Hermes Agent no repositorio dele, conforme a documentacao oficial.
2. Configure `HERMES_WEB_API_URL` apontando para a API web do Hermes.
3. Configure `HERMES_WEB_API_KEY` apenas no ambiente server-side.
4. Rode a Score com `npm run dev`.

## Como testar o Hermes
1. Verifique modelos:
   - `GET {HERMES_WEB_API_URL}/v1/models`
2. Verifique chat:
   - `POST {HERMES_WEB_API_URL}/v1/chat/completions`
3. Opcionalmente rode:
   - `node scripts/hermes/smoke-test.mjs`

## Como a Score conecta com Hermes
- Browser -> `/api/score-assistant/chat`
- Vite server/preview -> Hermes
- Hermes responde com contexto da Score
- Se Hermes falhar, a Score usa fallback local educativo

## Limitacao atual
Nesta sprint, o BFF e entregue no runtime local do projeto via Vite middleware. Em producao, o proximo passo recomendado e mover o mesmo handler para um BFF dedicado ou edge runtime da stack oficial.
