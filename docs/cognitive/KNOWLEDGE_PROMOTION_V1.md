# Knowledge Promotion V1

`KnowledgePromotion` e a primeira representacao executavel da passagem entre uma hipotese avaliada e um conhecimento candidato explicito.

## O que ele representa

Ele nao representa curiosidade.

Ele nao representa investigacao.

Ele nao representa julgamento de qualidade.

Ele nao representa memoria.

Ele representa a pergunta:

- esta hipotese avaliada ja pode ser materializada como conhecimento candidato?

## Pergunta central

Uma hipotese que ja foi aceita pela avaliacao:

- ainda deve ficar apenas como julgamento
- ou ja merece nascer como artefato explicito de conhecimento candidato

## Responsabilidades naturais desta V1

- receber resultado da `LearningEngine Evaluation`
- aceitar apenas `accepted_as_knowledge_candidate`
- rejeitar avaliacoes ainda abertas, insuficientes ou dependentes de mais investigacao
- criar um objeto explicito de `candidate knowledge`
- preservar origem, evidencias, confianca, limites e tempo logico da promocao
- manter rastreabilidade entre `InvestigationSession`, avaliacao e conhecimento candidato
- declarar explicitamente que ainda nao existe consolidacao em memoria

## O que permanece fora dele

- criar memoria permanente
- alterar `HouseModel`
- persistir conhecimento
- gerar recomendacoes
- reavaliar evidencias do zero
- substituir `LearningEngine Evaluation`
- decidir validade temporal de longo prazo

## Integracao atual

Fluxo:

1. `InvestigationSession` amadurece uma trilha
2. `LearningEngine Handoff` decide se ela ja pode ser avaliada
3. `LearningEngine Evaluation` julga se ela merece promocao cognitiva
4. `KnowledgePromotion` materializa apenas os casos aceitos como `candidate knowledge`
5. a memoria futura continua separada e ainda nao nasce aqui

## Como a prudencia e preservada

Mesmo quando a promocao acontece:

- o resultado ainda nao vira memoria
- o resultado ainda nao vira verdade permanente
- os limites continuam anexados ao artefato
- a origem permanece rastreavel

## Limites desta V1

- nao existe consolidacao temporal
- nao existe persistencia do conhecimento candidato
- nao existe `MemoryEngine`
- nao existe politica formal de envelhecimento ou revalidacao
