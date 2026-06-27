# Learning Engine Handoff V1

`LearningEngine Handoff` e a primeira representacao executavel da fronteira entre uma investigacao madura e uma avaliacao futura de aprendizado.

## O que ele representa

Ele nao representa curiosidade.

Ele nao representa o ciclo de vida da trilha.

Ele nao representa confirmacao de conhecimento.

Ele representa a pergunta:

- esta trilha ja reuniu material minimo para ser avaliada pelo `LearningEngine`?

## Pergunta central

Uma investigacao concluida ou madura:

- ainda esta fraca demais
- apenas saturou
- foi substituida
- ou realmente merece avaliacao cognitiva?

## Responsabilidades naturais desta V1

- receber a trilha atual a partir da `InvestigationSession`
- exigir `handoffCandidate` explicito
- resolver evidencias reais associadas a essa trilha
- rejeitar handoffs vazios, frageis ou cognitivamente imaturos
- produzir uma entrada limpa para avaliacao futura
- preservar limites do que ainda nao pode ser afirmado

## O que permanece fora dele

- confirmar conhecimento
- alterar memoria permanente
- alterar score
- persistir handoff
- falar com o usuario
- decidir curiosidade global
- assumir a vida util inteira da investigacao

## Integracao atual

Fluxo:

1. `CuriosityEngine` escolhe uma incerteza relevante
2. `InvestigationSession` acompanha a trilha
3. `InvestigationRuntime` transforma resposta em evidencia
4. quando a sessao entra em `ready_for_learning`, o handoff valida se ha material minimo para avaliacao
5. somente entao surge uma `LearningEvaluationInput` limpa para futuro uso do `LearningEngine`

## Como a prudencia e preservada

Mesmo quando o handoff aceita a trilha para avaliacao:

- conhecimento ainda nao foi confirmado
- a confianca continua preliminar
- a hipotese ainda pode mudar
- novas evidencias ainda podem enfraquecer a leitura

## Limites desta V1

- nao existe persistencia do handoff
- nao existe avaliacao final do `LearningEngine`
- nao existe promocao automatica para memoria ou conhecimento
- nao existe politica temporal de reavaliacao
