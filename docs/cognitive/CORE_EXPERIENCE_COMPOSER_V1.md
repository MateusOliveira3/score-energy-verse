# Core Experience Composer V1

`buildCoreExperienceFromJourney(input)` compoe a primeira experiencia cognitiva completa da Score a partir da jornada atual.

## Pipeline

`input`

`-> buildHouseModelFromJourney(input)`

`-> selectPrimaryHouseClue(house)`

`-> buildCoreSpeech(clue)`

`-> CoreExperience`

## O que o CoreExperience entrega

- `status`
- `house`
- `primaryClue`
- `speech`
- `primaryAction`
- `secondaryActions`
- `debug` opcional

## Regras de composicao

- apenas uma pista principal
- apenas uma fala principal
- sem UI
- sem persistencia
- sem Hermes
- sem inventar dados

## Status iniciais

- `no_data`
- `building_baseline`
- `clue_ready`
- `question_ready`
- `needs_more_context`
- `stable_observation`

## Resultado esperado

Um unico objeto read-only pronto para alimentar uma experiencia futura da Core, sem acoplar o produto atual.
