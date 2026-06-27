# HouseModel Adapter V1

`buildHouseModelFromJourney` cria uma representacao cognitiva inicial da residencia a partir do estado ja existente da Score, sem persistencia e sem alterar qualquer fluxo atual.

## Objetivo

Transformar sinais atuais da jornada em um `HouseModel` read-only e conservador:

- identidade basica da residencia
- entendimento inicial do ciclo
- ambientes padronizados
- evidencias tipadas
- hipoteses iniciais
- memoria convertida
- conhecimento convertido
- baseline inicial
- proxima investigacao sugerida

## Entradas usadas

- `userId`
- fatura atual
- historico de faturas
- `analysisSummary`
- `memorySnapshot`
- respostas estrategicas
- `energyBehaviorProfile`
- `knowledgeState`

## Regras de conservadorismo

- sem dado confiavel, o adaptador retorna `unknown`
- hipoteses nunca sao confirmadas nesta V1
- percentuais sao coarse e limitados, usados apenas como leitura inicial
- nenhuma inferencia altera score, parser, ranking ou persistencia

## Decisoes principais

- o adaptador e puro e deterministico a partir do input recebido
- a leitura de baseline usa apenas faturas disponiveis
- `MemorySnapshot` e `knowledgeState` sao reaproveitados como fontes read-only
- os ambientes sao sempre criados para manter estrutura cognitiva estavel

## Limites desta V1

- nao integra com UI
- nao grava HouseModel em lugar algum
- nao tenta explicar a conta com alta precisao
- nao fecha hipoteses como fatos
