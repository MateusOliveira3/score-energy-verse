# Learning Engine Handoff V1

## O fenomeno representado

O fenomeno representado e a transicao cognitiva entre trilha investigativa e avaliacao de possivel aprendizado.

Nao e aprendizado em si.

Nao e confirmacao de conhecimento.

E a fronteira que responde:

`isso ja merece avaliacao?`

## Por que isso nao pertence ao CuriosityEngine

Porque curiosidade decide prioridade de incerteza.

Ela responde:

`o que merece atencao agora?`

O handoff responde outra pergunta:

`o que ja amadureceu o suficiente para ser avaliado depois?`

Misturar isso faria a curiosidade deixar de ser priorizacao para virar classificacao de maturidade.

## Por que isso nao pertence integralmente a InvestigationSession

Porque a sessao acompanha a vida util da trilha.

Ela sabe:

- como a trilha nasceu
- quantas tentativas aconteceram
- se houve progresso
- se houve saturacao
- se um handoffCandidate apareceu

Mas ainda falta uma responsabilidade separada:

normalizar material, resolver evidencias reais e decidir se a trilha merece entrar no dominio do `LearningEngine`.

Essa fronteira ja nao e gestao da trilha.

Ja e triagem para avaliacao.

## Por que isso ainda nao confirma conhecimento

Porque material de avaliacao nao e conhecimento confirmado.

Mesmo uma trilha madura ainda pode:

- ter confianca preliminar
- depender de reconfirmacao futura
- conter hipotese forte, mas nao definitiva
- melhorar apenas a duvida, nao a certeza

## Hipotese arquitetural corrigida

Sim.

A missao partia da ideia de "transicao entre investigacao e aprendizado", e essa ideia se manteve.

Mas a implementacao corrigiu um risco importante:

o handoff nao virou um mini `LearningEngine`.

Ele foi mantido como camada de elegibilidade e normalizacao, sem decidir conhecimento.

## Arquitetura implementada

### Tipos criados

- `LearningHandoffStatus`
- `LearningHandoffRejectionReason`
- `LearningEvaluationInput`
- `LearningEngineHandoffResult`

### Funcao criada

- `prepareLearningEngineHandoff`

### Fluxo de integracao

1. `InvestigationSession` pode produzir `handoffCandidate`
2. `InvestigationRuntime` chama o handoff apenas nesse caso
3. o handoff resolve evidencias reais da casa
4. ele rejeita trilhas vazias, frageis ou nao prontas
5. quando aprovado, ele entrega `LearningEvaluationInput`

## Novo comportamento cognitivo

### O que a Score passou a demonstrar

Ela passou a distinguir explicitamente:

- trilha encerrada
- trilha saturada
- trilha com progresso real
- trilha pronta apenas para avaliacao

### Como a implementacao evita aprendizado automatico

O resultado aprovado do handoff e `ready_for_evaluation`, nao conhecimento.

Nenhum caminho promove a trilha para memoria permanente, score ou verdade da residencia.

### Como a duvida e preservada

O handoff carrega limites explicitos no `evaluationInput`, lembrando que:

- confianca ainda e preliminar
- hipotese ainda nao e conhecimento confirmado
- a avaliacao continua sendo etapa posterior

## O que nao foi alterado

- frontend
- React
- rotas
- paginas
- parser
- score
- ranking
- persistencia
- banco
- Hermes
- LearningEngine final

## Proximos passos logicos

1. Definir a primeira versao real do `LearningEngine` consumindo `LearningEvaluationInput`.
2. Formalizar quando uma avaliacao aprovada altera memoria ou conhecimento.
3. Criar politica de reavaliacao temporal para trilhas antigas.
