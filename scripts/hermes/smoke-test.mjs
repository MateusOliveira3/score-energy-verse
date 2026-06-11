const requiredUrl = process.env.HERMES_WEB_API_URL;
const apiKey = process.env.HERMES_WEB_API_KEY;
const model = process.env.HERMES_MODEL || 'minimax/minimax-m3';

if (!requiredUrl) {
  console.log('[hermes-smoke] HERMES_WEB_API_URL nao configurada. Smoke test encerrado.');
  process.exit(0);
}

const baseUrl = requiredUrl.replace(/\/+$/, '');
const headers = {
  'Content-Type': 'application/json',
};

if (apiKey) {
  headers.Authorization = `Bearer ${apiKey}`;
}

try {
  const modelsResponse = await fetch(`${baseUrl}/v1/models`, {
    headers,
    method: 'GET',
  });

  console.log('[hermes-smoke] GET /v1/models ->', modelsResponse.status);

  const chatResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
    body: JSON.stringify({
      model,
      stream: false,
      max_tokens: 128,
      messages: [
        {
          role: 'system',
          content: 'Voce e um teste tecnico da integracao Hermes da Score Energy.',
        },
        {
          role: 'user',
          content: 'Responda apenas: Hermes online.',
        },
      ],
    }),
    headers,
    method: 'POST',
  });

  console.log('[hermes-smoke] POST /v1/chat/completions ->', chatResponse.status);

  if (chatResponse.ok) {
    const payload = await chatResponse.json();
    const answer = payload.choices?.[0]?.message?.content ?? '[sem conteudo]';
    console.log('[hermes-smoke] resposta:', answer);
  } else {
    console.log('[hermes-smoke] Hermes indisponivel. A Score deve seguir com fallback local.');
  }
} catch (error) {
  console.log('[hermes-smoke] Falha ao contatar Hermes. A Score deve seguir com fallback local.');
  console.log('[hermes-smoke] detalhe tecnico:', error instanceof Error ? error.message : String(error));
}
