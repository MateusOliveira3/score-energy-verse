# Core Experience Composer V1

## Objetivo

Unir `HouseModel`, pista cognitiva e fala da Core em uma composicao unica e read-only.

## O que foi criado

- `src/lib/cognitive/coreExperienceComposer.ts`
- `src/lib/cognitive/coreExperienceComposer.test.ts`
- novos tipos de experiencia em `src/lib/cognitive/types.ts`
- export publico em `src/lib/cognitive/index.ts`

## Decisao central

O compositor nao cria inteligencia nova.

Ele apenas organiza o pipeline cognitivo que ja existe em uma estrutura unica:

- casa
- pista principal
- fala principal
- acao principal

## Guardrails preservados

- nao altera UI
- nao altera parser
- nao altera score
- nao altera ranking
- nao altera Hermes
- nao altera persistencia
- nao altera backend
- nao altera contratos centrais

## Limites desta V1

- ainda nao existe acoplamento com interface
- `secondaryActions` sao apenas identificadores internos
- o status ainda usa heuristicas simples e conservadoras

## Resultado institucional

A Score agora consegue transformar o estado atual da jornada em uma experiencia cognitiva completa da Core, pronta para ser exibida futuramente sem mudar o produto atual.
