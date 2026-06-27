# Review

## Objetivo desta revisao

Validar se a experiencia atual do app realmente materializa a filosofia "Hermes conversa. Score revela." sem voltar a parecer dashboard, formulario ou sistema interno.

## Estado atual do produto

A Hero ja trabalha com descoberta protagonista, meaning, acao unica e aprofundamento opcional. Os estados pre-ready e o pos-resposta foram aproximados do runtime, e o aprofundamento foi limpo para soar mais como leitura do que como painel.

Hoje a experiencia principal ja responde com mais clareza:

- quanto foi a conta;
- quanto consumiu;
- o que mais parece pesar;
- qual leitura vale aprofundar agora.

Os artefatos desta pasta refletem o estado atual da branch `feature/knowledge-persistence-boundary-v1` em `2026-06-26`.

## Filosofia do produto

Hermes e o canal de conversa, memoria e acompanhamento. Score App e a superficie de revelacao visual. O usuario deve sentir que alguem ja trabalhou por ele antes de pedir qualquer esforco adicional.

Em uma frase:

Hermes cria vinculo e continuidade.  
Score App cristaliza leitura, significado e acao.

## O que mudou na sprint sob revisao

A ultima sprint de produto empurrou tres pontos para mais perto da filosofia oficial: estados pre-ready dentro do Product Runtime, feedback pos-resposta com menos linguagem de sistema e aprofundamento com copy mais humana.

## O que nao mudou

Nao mudaram parser, backend, HouseModel, InvestigationState, NextBestQuestion, Product Runtime calculando novos sinais, UI base ou arquitetura cognitiva. A revisao deve focar superficie, narrativa e fronteira de papeis.

## O que desejamos validar

- Se a Hero parece leitura pronta ou ainda carrega relatorio interno.
- Se existe apenas um proximo passo dominante e se ele parece consequencia da leitura.
- Se o app revela melhor do que conversa.
- Se o aprofundamento secundario continua silencioso e util.
- Se a experiencia esta com gosto de produto e nao de sistema.

## Artefatos principais deste pacote

- `BRIEFING.md`
- `CHANGELOG.md`
- `KNOWN_LIMITATIONS.md`
- `SCREENSHOTS.md`
- `CLAUDE_PROMPT.md`
- pasta `screenshots/`

## Contexto de revisao

- branch: `feature/knowledge-persistence-boundary-v1`
- commit: `7e90de08dc2561a1129e21ef63163af6e8fcad53`
- gerado em: `2026-06-26T15:22:29.742Z`
