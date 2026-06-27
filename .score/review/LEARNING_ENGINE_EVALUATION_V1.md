# Learning Engine Evaluation V1

## O fenomeno representado

O fenomeno representado e o julgamento cognitivo de promocao.

Ele fica muito proximo de "avaliacao cognitiva", mas a implementacao mostrou uma nuance importante:

nao se trata de avaliar qualquer coisa.

Trata-se de julgar se uma hipotese, ja entregue por uma trilha madura, merece avancar como candidata a conhecimento.

## Por que isso nao pertence ao Handoff

Porque o handoff responde:

`isso ja pode ser avaliado?`

Ele verifica elegibilidade minima.

A avaliacao responde outra pergunta:

`isso merece promocao cognitiva?`

Ou seja:

- handoff filtra entrada
- evaluation julga qualidade

## Por que isso ainda nao pertence ao futuro KnowledgeEngine

Porque o futuro `KnowledgeEngine` devera decidir o que fazer com uma candidata forte.

Ja esta camada apenas impede promocao precoce.

Ela nao cria conhecimento.

Ela nao altera memoria.

Ela nao toca na residencia.

## Hipotese arquitetural corrigida

Sim.

A missao falava em "avaliacao cognitiva", e isso permaneceu correto.

Mas a implementacao revelou um nome conceitualmente mais preciso:

`julgamento cognitivo de promocao`

Isto e:

uma avaliacao cujo foco nao e descrever a trilha, mas decidir se ela pode subir um degrau sem ainda virar conhecimento.

## Conceito da Teoria que merece revisao

Sim.

A Teoria Cognitiva ganharia clareza ao explicitar melhor a fronteira entre:

- elegibilidade para avaliacao
- julgamento de promocao
- conhecimento confirmado

Hoje isso ja esta implicito, mas a cadeia executavel mostrou que essas tres etapas sao distintas.

## Arquitetura implementada

### Tipos criados

- `LearningEvaluationStatus`
- `LearningEngineEvaluationResult`

### Tipos enriquecidos

- `LearningEvaluationInput` agora carrega tambem `hypothesisStatus` e `potentialImpact`

### Funcao criada

- `evaluateLearningCandidate`

### Criterios avaliados

- quantidade minima de evidencias
- quantidade de evidencias com confianca util
- diversidade de origem das evidencias
- confianca preliminar
- status atual da hipotese
- qualidade explicativa minima do resumo
- peso dos limites explicitos

### Integracao

1. `LearningEngine Handoff` continua preparando `LearningEvaluationInput`
2. `InvestigationRuntime` chama a avaliacao apenas quando o handoff devolve `ready_for_evaluation`
3. o resultado aparece separado em `learningEvaluation`

## Novo comportamento cognitivo

### O que a Score passou a demonstrar

Ela agora distingue explicitamente entre:

- investigar
- entregar para avaliacao
- julgar possibilidade de promocao
- e conhecer de fato

### Como a implementacao evita promover conhecimento prematuramente

Mesmo um handoff valido ainda pode resultar em:

- `needs_more_investigation`
- `kept_as_open_hypothesis`
- `rejected_insufficient_evidence`

Somente `accepted_as_knowledge_candidate` autoriza avancar para um futuro motor de conhecimento.

### Como a duvida permanece representada

A duvida nao fica mais apenas em texto.

Ela passa a existir em estados estruturados da arquitetura.

## O que nao foi alterado

- frontend
- React
- rotas
- paginas
- parser
- backend
- banco
- score
- ranking
- persistencia
- Hermes
- Core
- KnowledgeEngine
- MemoryEngine
