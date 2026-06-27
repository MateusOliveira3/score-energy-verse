# Knowledge Persistence Boundary V1

`KnowledgePersistenceBoundary` e a primeira representacao executavel da fronteira entre conhecimento candidato e conhecimento elegivel para futura permanencia.

## O que ele representa

Ele nao representa memoria.

Ele nao representa persistencia em banco.

Ele nao representa revalidacao.

Ele representa a pergunta:

- este conhecimento candidato merece sobreviver ao encerramento da investigacao?

## Pergunta central

Um `candidate knowledge` ja promovido:

- ainda deve permanecer apenas como artefato transitario
- ou ja merece tornar-se `persistible knowledge candidate`

## Responsabilidades naturais desta V1

- receber `CandidateKnowledge`
- julgar qualidade minima de evidencia
- julgar diversidade de origem
- julgar estabilidade observada
- julgar maturidade investigativa
- preservar limites explicitos da afirmacao
- produzir apenas um estado de persistibilidade
- criar `PersistibleKnowledgeCandidate` quando a fronteira for atravessada

## O que permanece fora dele

- criar memoria permanente
- persistir em banco
- atualizar `HouseModel`
- reavaliar a realidade do zero
- reagir automaticamente ao envelhecimento
- executar scheduler de revisita

## Integracao atual

Fluxo:

1. `KnowledgePromotion` cria `CandidateKnowledge`
2. `KnowledgePersistenceBoundary` decide se ele merece permanecer
3. apenas os casos persistiveis seguem com autoridade temporal explicita
4. a memoria futura continua fora desta camada

## Como a prudencia e preservada

Mesmo quando a persistibilidade e aceita:

- o conhecimento ainda nao vira memoria
- ele apenas se torna elegivel para futura consolidacao
- seus limites continuam anexados
- sua origem continua rastreavel

## Limites desta V1

- nao existe `MemoryEngine`
- nao existe persistencia definitiva
- nao existe revalidacao automatica
- nao existe politica de esquecimento operacional
