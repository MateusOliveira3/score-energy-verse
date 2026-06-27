# Core Speech Engine V1

## Objetivo

Criar a primeira traducao de uma `HouseClue` para uma fala curta da Core.

## O que foi criado

- `src/lib/cognitive/coreSpeechEngine.ts`
- `src/lib/cognitive/coreSpeechEngine.test.ts`
- novos tipos de fala em `src/lib/cognitive/types.ts`
- export publico em `src/lib/cognitive/index.ts`

## Decisao central

A Core fala pouco.

Ela:

- desperta curiosidade
- admite incerteza
- evita linguagem de sistema
- convida o usuario a continuar olhando

## Guardrails preservados

- nao altera UI
- nao altera parser
- nao altera score
- nao altera ranking
- nao altera Hermes
- nao altera persistencia
- nao altera backend

## Limites desta V1

- ainda nao ha variacao profunda de personalidade
- a fala ainda depende apenas da `HouseClue`, nao de contexto mais amplo da jornada
- nao existe memoria conversacional

## Resultado institucional

A Score agora consegue transformar uma pista cognitiva em fala curta, curiosa e prudente, pronta para ser usada por uma futura presenca da Core.
