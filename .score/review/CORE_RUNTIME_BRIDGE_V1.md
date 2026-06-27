# Core Runtime Bridge V1

## Objetivo

Conectar pela primeira vez o Motor Cognitivo ao frontend sem redesenhar a aplicacao.

## O que mudou

- o `/perfil` agora monta um `CoreExperience` unico a partir da jornada
- o hero principal deixou de depender de frases cognitivas montadas manualmente
- a UI passou a renderizar fala, pista e acao principal a partir do composer

## Evidencias

- `src/lib/cognitive/buildRuntimeCoreExperience.ts`
- `src/pages/Index.tsx`
- `src/components/nucleo/GuidedConversationSession.tsx`
- `src/components/nucleo/CorePresence.tsx`

## Antes

`Journey -> UI interpreta -> UI monta frases`

## Depois

`Journey -> CoreExperienceComposer -> CoreExperience -> UI renderiza`

## O que permaneceu igual

- layout geral do hero
- parser
- score
- ranking
- persistencia
- Hermes
- regras de dominio

## Limites desta versao

- a pergunta cognitiva ainda e apenas exibida
- nao ha resposta, persistencia ou abertura de investigacao por esta ponte
- a UI ainda preserva estados visuais antigos fora do caminho cognitivo principal

## Proximo passo natural

Usar o mesmo `CoreExperience` como unica fonte para a camada viva da Core, inclusive nos estados secundarios, sem reespalhar regras cognitivas pela interface.
