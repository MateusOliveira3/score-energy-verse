# Learning Engine Evaluation V1

`LearningEngine Evaluation` e a primeira representacao executavel do julgamento cognitivo entre material elegivel para avaliacao e promocao futura para conhecimento.

## O que ele representa

Ele nao representa curiosidade.

Ele nao representa handoff.

Ele nao representa conhecimento.

Ele representa a pergunta:

- esta hipotese merece avancar como candidata a conhecimento?

## Pergunta central

Uma trilha ja entregue pelo handoff:

- ainda precisa de investigacao
- deve permanecer como hipotese aberta
- merece virar candidata a conhecimento
- ou ainda e insuficiente

## Responsabilidades naturais desta V1

- receber um `LearningEvaluationInput`
- julgar forca das evidencias
- julgar qualidade explicativa minima
- julgar confianca preliminar
- preservar preocupacoes explicitas da trilha
- produzir apenas um estado de avaliacao

## O que permanece fora dele

- criar memoria
- confirmar conhecimento
- alterar `HouseModel`
- persistir avaliacao
- falar com o usuario
- recomendar acao

## Integracao atual

Fluxo:

1. `InvestigationSession` amadurece uma trilha
2. `LearningEngine Handoff` decide se ela ja pode ser avaliada
3. `LearningEngine Evaluation` julga a qualidade do material entregue
4. apenas depois disso uma futura camada de conhecimento podera decidir promocao real

## Julgamentos atuais

- `accepted_as_knowledge_candidate`
- `needs_more_investigation`
- `kept_as_open_hypothesis`
- `rejected_insufficient_evidence`

## Como a prudencia e preservada

Mesmo o melhor resultado desta V1 ainda nao cria conhecimento.

Ele apenas diz que a hipotese merece seguir para a proxima etapa cognitiva.

## Limites desta V1

- nao existe `KnowledgeEngine`
- nao existe `MemoryEngine`
- nao existe persistencia de avaliacoes
- nao existe politica temporal de reavaliacao
