# House Clue Engine V1

`selectPrimaryHouseClue(house)` escolhe uma unica pista inicial a partir do `HouseModel`, sem UI, sem Hermes e sem persistencia.

## Objetivo

Transformar o estado cognitivo da casa em uma revelacao inicial:

- honesta
- humana
- util
- conservadora

## Ordem de prioridade

1. `nextInvestigation.suggestedQuestion` com alto ganho e pronta para pergunta
2. hipotese ativa com confianca media/alta ou status fortalecido
3. comodo com maior misterio
4. baseline ainda em construcao
5. fallback honesto de baixa confianca

## Regras principais

- nunca confirmar causa sem evidencia
- nunca inventar percentual
- quando nao houver base suficiente, devolver pista de descoberta inicial
- confianca alta so permanece quando ha evidencia real sustentando a pista

## Estruturas criadas

- `HouseClue`
- `HouseClueKind`
- `HouseClueConfidence`
- `HouseClueAction`

## Resultado esperado

Uma pista que a Core poderia revelar naturalmente, como:

- "Achei uma pista no banheiro."
- "Ainda estou conhecendo sua casa."
- "A cozinha ainda e um misterio para mim."
