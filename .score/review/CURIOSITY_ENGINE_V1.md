# Curiosity Engine V1

## Branch utilizada

`feature/curiosity-engine-v1`

## O fenomeno representado

O fenomeno representado e a curiosidade como detector e priorizador de incerteza relevante.

Ela nao foi tratada como pergunta pronta nem como componente de UX.
Ela foi tratada como a decisao cognitiva sobre qual fronteira ainda merece ser investigada agora.

## Quais responsabilidades pertencem naturalmente a ela

- perceber lacunas abertas no `HouseModel`
- comparar valor informacional entre perguntas, ambientes, baseline e custo
- manter um unico foco investigativo ativo
- redirecionar a investigacao quando uma pista enfraquece
- reconhecer quando ainda falta base real antes de seguir

## Houve responsabilidade removida por nao pertencer?

Sim.

A escolha da proxima investigacao estava espalhada dentro de:

- `buildHouseModelFromJourney.ts`
- `investigationRuntime.ts`

Essa responsabilidade foi retirada desses pontos e centralizada em `curiosityEngine.ts`.

Esses arquivos continuam donos de adaptacao e atualizacao de estado, mas nao decidem sozinhos a curiosidade da casa.

## Algum novo fenomeno foi descoberto?

Sim, de forma ainda nao institucionalizada como motor proprio.

Durante a implementacao ficou claro um fenomeno vizinho:

`tensao de persistencia investigativa`

Isto e:

- curiosidade decide o que abrir
- investigacao transforma resposta em evidencia
- mas ainda nao existe uma sessao explicita que registre trilhas abertas, insistencias, saturacao e encerramento de curiosidades

Esse fenomeno apareceu, mas nao foi implementado nesta missao para nao misturar responsabilidades.

## Arquitetura proposta

`CuriosityEngine` entrou como motor puro entre o estado cognitivo da casa e a proxima direcao investigativa.

Fluxo atual:

1. `buildHouseModelFromJourney`
   monta identidade, rooms, memoria, conhecimento, hipoteses e baseline
2. `runCuriosityEngine`
   observa a casa pronta e escolhe a primeira `nextInvestigation`
3. `HouseClueEngine`
   transforma essa prioridade cognitiva em pista acionavel
4. `applyInvestigationAnswer`
   transforma resposta em evidencia e ajusta hipotese/comodo
5. `runCuriosityEngine`
   recalibra a proxima fronteira investigativa

## Como isso integra com outros motores cognitivos

- `InvestigationRuntime`
  continua sendo o motor que transforma resposta em evidencia
- `CuriosityEngine`
  passa a decidir qual incerteza merece a vez seguinte
- `HouseClueEngine`
  continua sendo a camada que revela a pista ao sistema superior
- `LearningEngine`
  permanece fora desta missao, mas deve no futuro decidir quando uma curiosidade resolvida vira aprendizado estavel

## O que NAO foi alterado

- frontend
- backend
- banco
- parser
- score
- ranking
- contratos de persistencia
- assistente Hermes
- logica de UI

## Validacao esperada

- `npx tsc --noEmit`
- `npm run test`
- `npm run build`

## Reflexao

### A curiosidade virou apenas um gerador de perguntas?

Nao.

Pergunta aberta e apenas um dos sinais avaliados. O motor tambem considera misterios de ambiente, baseline em construcao e fronteiras de custo.

### O sistema ficou mais fiel ao fenomeno ou apenas mais organizado?

Os dois, mas primeiro mais fiel ao fenomeno.

Organizacao aqui foi consequencia de nomear corretamente a responsabilidade cognitiva.

### O runtime ficou mais prudente ou mais apressado?

Mais prudente.

Ele agora reconhece melhor quando deve:

- migrar de pista
- insistir no ambiente
- esperar mais historico

### O que ainda esta faltando para a curiosidade amadurecer?

Falta uma sessao de investigacao que registre historico de curiosidades abertas, repeticao evitada, saturacao e encerramento.

## Sugestoes e proximos passos logicos

1. Criar `InvestigationSession` pura para registrar trilha de curiosidades abertas e resolvidas.
2. Impedir reabertura prematura da mesma pergunta quando a evidencia nova nao muda a casa.
3. Introduzir criterio explicito de handoff entre curiosidade e aprendizado.
4. So depois disso considerar persistencia dessa trilha no estado maior da jornada.
