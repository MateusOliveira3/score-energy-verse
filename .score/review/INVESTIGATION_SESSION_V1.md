# Investigation Session V1

## O fenomeno representado

O fenomeno representado e a trilha investigativa como ciclo de vida proprio.

Uma investigacao nao e apenas:

- a curiosidade que a abriu
- a pergunta que apareceu
- a resposta recebida

Ela e a continuidade entre esses pontos.

## Por que isso nao pertence ao CuriosityEngine

Porque curiosidade decide prioridade de incerteza.

Ela responde:

`o que merece atencao agora?`

A InvestigationSession responde outra pergunta:

`o que aconteceu com essa atencao depois que ela virou trilha?`

Misturar isso faria o CuriosityEngine deixar de ser priorizador para virar gestor de historico local.

## Por que isso ainda nao pertence ao LearningEngine

Porque ainda nao estamos transformando a trilha em conhecimento.

Ainda estamos apenas avaliando:

- se houve progresso
- se houve repeticao
- se a trilha saturou
- se existe material minimo para futuro handoff

O LearningEngine deve entrar depois, quando a trilha ja tiver produzido material digno de consolidacao.

## Responsabilidades mantidas fora da InvestigationSession

- priorizacao global de curiosidades
- geracao de novas perguntas
- comunicacao com o usuario
- persistencia de sessao
- confirmacao de conhecimento
- qualquer alteracao de frontend, backend, banco, parser, score ou ranking

## Hipotese arquitetural corrigida

Sim.

A missao sugeria uma estrutura de sessao, e a analise confirmou que ela faz sentido.

Mas a implementacao corrigiu um risco implicito:

a sessao nao virou um novo motor decisor global.

Ela foi mantida como camada local da trilha atual, enquanto o `CuriosityEngine` continua dono da priorizacao global.

## Arquitetura implementada

### Tipos criados

- `InvestigationSessionStatus`
- `InvestigationSessionClosureReason`
- `InvestigationSession`
- `InvestigationSessionHandoffCandidate`

### Funcoes criadas

- `createInvestigationSession`
- `updateInvestigationSession`

### Fluxo de integracao

1. a trilha nasce da `nextInvestigation` atual
2. `applyInvestigationAnswer` gera evidencia e atualiza a casa
3. `runCuriosityEngine` continua propondo sinais cognitivos
4. `updateInvestigationSession` decide se a trilha:
   - segue aberta
   - entra em andamento
   - satura
   - encerra
   - ou fica pronta para handoff futuro
5. se a trilha saturar, ela pode bloquear a reabertura imediata do mesmo foco e forcar migracao ou pausa honesta

## Separacao entre motores

- `CuriosityEngine`
  prioriza incerteza relevante
- `InvestigationSession`
  acompanha a saude da trilha investigativa
- `InvestigationRuntime`
  transforma resposta em evidencia e aplica a integracao
- `LearningEngine`
  permanece futuro destinatario de trilhas maduras, mas ainda sem alteracao funcional nesta missao

## Comportamento cognitivo novo

### O que a Score passou a demonstrar

Ela passou a reconhecer que uma trilha investigativa pode saturar antes de virar conhecimento.

### Como a implementacao evita insistencia ou reabertura prematura

Quando uma resposta nao aumenta compreensao de forma relevante e a curiosidade tenta continuar na mesma trilha, a sessao pode marcar saturacao e bloquear essa reabertura imediata.

### Como o principio "um foco por vez" foi preservado

A sessao nao abre focos concorrentes.

Ela apenas valida se o foco atual ainda merece continuar.

Se nao merecer, libera a vez para outra curiosidade ou para pausa honesta.

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
- contratos publicos externos
- Hermes

## Proximos passos logicos

1. Persistir trilhas apenas quando existir um ponto seguro no estado maior da jornada.
2. Criar politica explicita de envelhecimento de trilhas.
3. Formalizar o handoff de `ready_for_learning` para um futuro `LearningEngine`.
4. Decidir quando varias trilhas encerradas passam a compor patrimonio cognitivo mais duradouro.
