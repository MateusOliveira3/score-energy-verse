# House Clue Engine V1

## Objetivo

Criar o primeiro motor puro de pistas da casa a partir do `HouseModel`.

## O que foi criado

- `src/lib/cognitive/houseClueEngine.ts`
- `src/lib/cognitive/houseClueEngine.test.ts`
- novos tipos de pista em `src/lib/cognitive/types.ts`
- export publico em `src/lib/cognitive/index.ts`

## Decisao central

O motor escolhe apenas UMA pista por vez.

Essa pista prioriza:

1. pergunta valiosa
2. hipotese relevante
3. misterio de comodo
4. baseline em construcao
5. fallback honesto

## Guardrails preservados

- nao altera UI
- nao altera parser
- nao altera score
- nao altera ranking
- nao altera Hermes
- nao altera persistencia
- nao altera backend

## Limites desta V1

- nao existe priorizacao probabilistica complexa
- nao ha aprendizado automatico
- a pista nao executa nada; apenas escolhe o foco inicial

## Resultado institucional

A Score agora consegue olhar para uma representacao cognitiva da residencia e escolher uma primeira pista que parece humana, prudente e util.
