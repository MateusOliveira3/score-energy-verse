# Core Speech Engine V1

`buildCoreSpeech(clue)` transforma uma `HouseClue` em uma fala curta da Core.

## Objetivo

Dar voz humana a uma pista cognitiva sem depender de UI, Hermes ou backend.

## O que a fala entrega

- `opening`
- `clueLine`
- `optionalQuestionLine`
- `actionLabel`
- `evidenceLabel`
- `confidenceLabel`
- `steps` opcionais

## Regras de voz

- nunca soar como sistema
- nunca usar linguagem tecnica
- nunca prometer economia
- nunca confirmar causa sem evidencia
- admitir incerteza quando a confianca for baixa
- despertar curiosidade antes de explicar
- falar pouco

## Mapeamento inicial

- `discovery` e `baseline`: voz humilde e exploratoria
- `question`: confirmacao leve e curiosa
- `hypothesis`: suspeita prudente
- `room_mystery`: ambiente como misterio vivo

## Resultado esperado

Uma linha que a Core poderia dizer naturalmente, como:

- "Achei uma pista."
- "Ainda nao tenho certeza, mas isso vale olhar."
- "Tem uma parte da casa que eu ainda nao entendi."
