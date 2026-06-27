# DOCUMENT_DEPENDENCY_MAP

## Regra geral de dependencia

Na Score, a dependencia documental atual segue este principio:

- identidade vem antes de comportamento
- comportamento vem antes de design
- design vem antes de interface
- engenharia protege tudo isso no runtime
- `PLANO_DA_TEORIA_COGNITIVA.md` funciona como plano arquitetural da futura Teoria Cognitiva da Residencia v2.0, depende da hierarquia institucional vigente e antecede a teoria final

## Cadeia principal da Constituicao

1. [.score/README.md](/C:/Users/Pichau/score-energy-verse/.score/README.md)
2. [.score/brain/CORE.md](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md)
3. [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
4. [.score/design/DESIGN.md](/C:/Users/Pichau/score-energy-verse/.score/design/DESIGN.md)
5. [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)
6. [.score/engineering/ENGINEERING.md](/C:/Users/Pichau/score-energy-verse/.score/engineering/ENGINEERING.md)

Leitura correta:

- `CORE` responde quem a Score e
- `NUCLEUS` responde como a Score pensa
- `DESIGN` responde como isso deve aparecer
- `JOURNEY` responde como isso acontece no tempo
- `ENGINEERING` responde como tudo isso e preservado no codigo

## Cadeia cognitiva

- `CORE` alimenta `NUCLEUS`
- `NUCLEUS` alimenta `INVESTIGATION_ENGINE`
- `NUCLEUS` alimenta `LEARNING_ENGINE`
- `DESIGN` e `JOURNEY` dependem de `CORE` e `NUCLEUS`
- `ENGINEERING` depende de `CORE` e `NUCLEUS`, mas valida tudo no runtime

Documentos:

- [.score/brain/CORE.md](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md)
- [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
- [.score/nucleus/INVESTIGATION_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/INVESTIGATION_ENGINE.md)
- [.score/nucleus/LEARNING_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/LEARNING_ENGINE.md)

## Cadeia de design e experiencia

- `DESIGN` depende de `CORE`, `NUCLEUS` e auditorias de UX
- `JOURNEY` depende de `DESIGN`, `NUCLEUS` e do fluxo real do produto
- `LIVING_PRODUCT_STUDY` depende do choque entre login, `/perfil` e a Constituicao
- os documentos de universo dependem de `DESIGN`, `JOURNEY` e `NUCLEUS`

Documentos:

- [.score/design/DESIGN.md](/C:/Users/Pichau/score-energy-verse/.score/design/DESIGN.md)
- [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)
- [.score/review/LIVING_PRODUCT_STUDY.md](/C:/Users/Pichau/score-energy-verse/.score/review/LIVING_PRODUCT_STUDY.md)
- [.score/universe/CORE_CHARACTER.md](/C:/Users/Pichau/score-energy-verse/.score/universe/CORE_CHARACTER.md)
- [.score/universe/CORE_AND_HERMES.md](/C:/Users/Pichau/score-energy-verse/.score/universe/CORE_AND_HERMES.md)
- [.score/universe/FIRST_CONTACT.md](/C:/Users/Pichau/score-energy-verse/.score/universe/FIRST_CONTACT.md)
- [.score/universe/VOICE_GUIDE.md](/C:/Users/Pichau/score-energy-verse/.score/universe/VOICE_GUIDE.md)
- [.score/universe/EMOTIONAL_MODEL.md](/C:/Users/Pichau/score-energy-verse/.score/universe/EMOTIONAL_MODEL.md)
- [.score/universe/THE_BIRTH_OF_CORE.md](/C:/Users/Pichau/score-energy-verse/.score/universe/THE_BIRTH_OF_CORE.md)

## Cadeia de engenharia

- `ENGINEERING` depende da Constituicao e do codigo real
- `README` depende do codigo real e funciona como mapa operacional do estado atual
- `docs/tasks/002-010` dependem da linha historica de implementacao e hoje servem como memoria tecnica, nao como regra principal

Leitura correta:

1. `ENGINEERING`
2. `README`
3. `docs/tasks/002-010`
4. codigo central

## Cadeia do assistente e Hermes

- `CORE_AND_HERMES` define papel institucional
- `NUCLEUS` define limite cognitivo
- `JOURNEY` define quando Hermes aparece
- `ENGINEERING` define como Hermes nao invade regra
- `HERMES_SETUP_SCORE` define a integracao tecnica
- o runtime confirma isso em `buildScoreAssistantContext`, `scoreSystemPrompt`, `fallback` e no plugin Vite

Leitura correta:

1. [.score/universe/CORE_AND_HERMES.md](/C:/Users/Pichau/score-energy-verse/.score/universe/CORE_AND_HERMES.md)
2. [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
3. [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)
4. [.score/engineering/ENGINEERING.md](/C:/Users/Pichau/score-energy-verse/.score/engineering/ENGINEERING.md)
5. [docs/HERMES_SETUP_SCORE.md](/C:/Users/Pichau/score-energy-verse/docs/HERMES_SETUP_SCORE.md)
6. [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts)
7. [src/lib/scoreAssistant/scoreSystemPrompt.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts)

## Cadeia de memoria e conhecimento

- `NUCLEUS` define a diferenca conceitual
- `LEARNING_ENGINE` define como isso amadurece no tempo
- `energy-memory.md` resume Memoria Energetica em linguagem curta
- `memorySnapshot.ts` transforma estado em memoria visivel
- `energyKnowledge.ts` transforma aprendizado em catalogo e status
- `MemoryPanel.tsx` torna as duas camadas visiveis

Leitura correta:

1. [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
2. [.score/nucleus/LEARNING_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/LEARNING_ENGINE.md)
3. [docs/skills/score-energy/energy-memory.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-memory.md)
4. [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
5. [src/lib/energyKnowledge.ts](/C:/Users/Pichau/score-energy-verse/src/lib/energyKnowledge.ts)
6. [src/components/MemoryPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx)

## Cadeia do runtime

- `README` aponta para as rotas, hooks, libs e services principais
- `useMvpJourney` orquestra o fluxo real
- `mvpJourneyState` resolve e normaliza estado
- `mvpCoreFlow` interpreta fatura, analise, acoes, score e feedback
- `nucleoSession` e `guidedConversation` reorganizam o mesmo estado em view-models
- `Index.tsx` compoe a experiencia autenticada principal

Leitura correta:

1. [README.md](/C:/Users/Pichau/score-energy-verse/README.md)
2. [src/hooks/useMvpJourney.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts)
3. [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
4. [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
5. [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)
6. [src/lib/guidedConversation.ts](/C:/Users/Pichau/score-energy-verse/src/lib/guidedConversation.ts)
7. [src/pages/Index.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/Index.tsx)

## Documentos que devem ser lidos depois, nao antes

- `docs/tasks/002-010`
  Devem ser lidos depois da Constituicao e do README, porque hoje sao memoria da construcao, nao mapa principal do presente.
- `SUPABASE_SETUP.md`
  Deve ser lido apenas se alguem estiver investigando o caminho legado de `public.invoices`.
- `DESIGN2D_BLUEPRINT.md`
  Deve ser lido apenas como referencia historica de design, nao como fundamento cognitivo.

## Documentos que puxam outros documentos

- `CORE` puxa `vision`, `user-journey`, `README`, `mvpCoreFlow`, `mvpJourneyState`, `memorySnapshot`, `score assistant`
- `NUCLEUS` puxa `useMvpJourney`, `mvpJourneyState`, `mvpCoreFlow`, `memorySnapshot`, `energyKnowledge`, `score assistant`
- `DESIGN` puxa `CORE`, `NUCLEUS`, `ENGINEERING`, `LandingPage`, `Index`, `MemoryPanel`, `Assistant`
- `JOURNEY` puxa `CORE`, `DESIGN`, `NUCLEUS`, `mvpCoreFlow`, `mvpJourneyState`, `score assistant`
- `LIVING_PRODUCT_STUDY` puxa `DESIGN`, `JOURNEY`, `Index`, `GuidedConversationSession`, `LivingCore`

## Documentos que funcionam como derivados

- As auditorias de `.score/review/` dependem da Constituicao e do runtime vigente
- Os documentos de universo dependem da Constituicao, especialmente `DESIGN` e `JOURNEY`
- Os documentos de `docs/tasks/` dependem da fase historica em que foram escritos
- O `README` depende do codigo atual; quando o codigo muda bastante, ele precisa ser revisado

## Ordem final recomendada

Para entender completamente a empresa hoje, a melhor ordem continua sendo:

1. `.score/README.md`
2. `CORE.md`
3. `NUCLEUS.md`
4. `DESIGN.md`
5. `JOURNEY.md`
6. `ENGINEERING.md`
7. `INVESTIGATION_ENGINE.md`
8. `LEARNING_ENGINE.md`
9. `CORE_CHARACTER.md`
10. `CORE_AND_HERMES.md`
11. `README.md`
12. `useMvpJourney.ts`
13. `mvpJourneyState.ts`
14. `mvpCoreFlow.ts`
15. `memorySnapshot.ts`
16. `energyKnowledge.ts`
17. `buildScoreAssistantContext.ts`
18. `HERMES_SETUP_SCORE.md`
19. `docs/tasks/002-010`

Essa ordem respeita a dependencia real entre identidade, comportamento, design, engenharia e implementacao.
