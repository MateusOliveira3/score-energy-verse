# Investigation Session V1

`InvestigationSession` e a primeira representacao executavel da trilha investigativa como fenomeno proprio da Score.

## O que ela representa

Ela nao representa curiosidade.

Ela nao representa aprendizado.

Ela representa a continuidade de uma investigacao depois que uma incerteza ja foi escolhida.

Em outras palavras:

- `CuriosityEngine` decide qual incerteza merece atencao
- `InvestigationSession` acompanha o que aconteceu com essa atencao ao longo da trilha

## Pergunta central

A trilha investigativa ainda esta:

- aberta
- em andamento
- saturada
- encerrada
- ou pronta para futuro handoff ao `LearningEngine`

## Responsabilidades naturais desta V1

- registrar a origem da trilha
- registrar foco, room e hipotese relacionados
- contar tentativas
- registrar evidencias recebidas
- detectar quando houve ou nao houve progresso cognitivo
- impedir insistencia ingenua na mesma trilha quando nao ha ganho novo
- sinalizar handoff potencial sem promover conhecimento

## O que permanece fora dela

- escolher a curiosidade global seguinte
- gerar perguntas novas
- falar com o usuario
- persistir sessao
- confirmar hipotese como conhecimento
- atualizar memoria institucional

## Integracao atual

Nesta V1, a sessao vive dentro do dominio puro da investigacao.

Fluxo:

1. `CuriosityEngine` prioriza uma `nextInvestigation`
2. `InvestigationSession` nasce a partir dessa origem
3. `InvestigationRuntime` transforma resposta em evidencia
4. `InvestigationSession` avalia se houve progresso, saturacao, encerramento ou handoff potencial
5. `CuriosityEngine` continua propondo sinais, mas a sessao pode bloquear a reabertura ingenua da mesma trilha

## Como a saturacao e tratada

Saturacao aqui nao significa que a realidade foi compreendida.

Significa apenas:

- a trilha nao ganhou compreensao suficiente
- e insistir nela agora seria cognitivamente fraco

Quando isso acontece, a sessao pode impedir que a mesma trilha reassuma a prioridade imediatamente.

## Como o handoff e tratado

`ready_for_learning` nao significa conhecimento confirmado.

Significa apenas que a trilha:

- produziu progresso suficiente
- deixou evidencias organizadas
- e pode ser entregue a um futuro `LearningEngine`

## Limites desta V1

- nao existe persistencia entre ciclos
- nao existe historico completo de todas as trilhas da casa
- nao existe politica formal de envelhecimento da trilha
- nao existe handoff real para aprendizado, apenas preparacao minima
