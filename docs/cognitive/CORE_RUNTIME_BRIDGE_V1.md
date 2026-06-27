# Core Runtime Bridge V1

## Objetivo

Conectar o estado atual da jornada da Score ao `CoreExperience` sem mover regras cognitivas para a UI.

## O que foi criado

- `src/lib/cognitive/buildRuntimeCoreExperience.ts`

## Responsabilidade

O bridge adapta dados ja existentes do runtime:

- `journeyState`
- `userId`
- `memorySnapshot`
- `scoreState`

Para o contrato unico:

- `CoreExperience`

## Fluxo

`MvpJourneyState`
-> `buildRuntimeCoreExperience`
-> `buildCoreExperienceFromJourney`
-> `CoreExperience`
-> UI

## Guardrails respeitados

- nenhuma logica cognitiva nova foi criada
- nenhum parser foi alterado
- nenhum score foi alterado
- nenhuma persistencia foi alterada
- nenhum contrato de dominio foi alterado

## Resultado arquitetural

O hero principal deixa de montar frases cognitivas manualmente e passa a renderizar:

- `experience.status`
- `experience.house`
- `experience.primaryClue`
- `experience.speech`
- `experience.primaryAction`

Quando a experiencia ainda nao existe, a UI mostra apenas um estado vazio honesto.
