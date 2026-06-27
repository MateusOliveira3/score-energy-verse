# PROJECT_CARTOGRAPHY_001

## Escopo auditado

Esta cartografia foi produzida a partir do estado atual do repositorio `score-energy-verse`, cruzando:

- raiz do projeto
- pasta `.score`
- pasta `docs`
- migrations
- scripts
- arquivos centrais de `src/`
- historico de branches locais e remotas relevantes

Ela nao cria conceitos novos. Ela apenas organiza o que o repositorio ja afirma hoje.

## Panorama geral

A Score hoje possui cinco camadas documentais distintas:

- documentos constitucionais, que definem identidade, comportamento cognitivo, engenharia e design
- documentos de universo, que tornam perceptivel a presenca da Core e a relacao com Hermes
- documentos de review, que registram tensoes, incoerencias e consolidacoes por sprint
- documentos de produto historicos, que formaram a base do MVP antes da Constituicao
- documentos de implementacao, que registram a evolucao tecnica da jornada, persistencia, ranking e integracao

O repositorio tambem usa o proprio codigo como fonte de verdade operacional. Em varios assuntos, o documento explica a intencao e o codigo confirma a implementacao real.

## 1. Quais documentos definem a identidade da empresa

- Fonte principal: [.score/brain/CORE.md](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md)
- Base anterior de produto: [docs/product/vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md)
- Base anterior de posicionamento de ecossistema: [docs/product/ecosystem-triangle.md](/C:/Users/Pichau/score-energy-verse/docs/product/ecosystem-triangle.md)
- Tradução pública atual da identidade: [src/pages/LandingPage.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/LandingPage.tsx)
- Índice institucional da pasta `.score`: [.score/README.md](/C:/Users/Pichau/score-energy-verse/.score/README.md)

## 2. Quais documentos definem comportamento

- Fonte principal do comportamento cognitivo: [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
- Fonte principal da conversa e do ritmo da jornada: [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)
- Fonte principal da logica de investigacao: [.score/nucleus/INVESTIGATION_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/INVESTIGATION_ENGINE.md)
- Fonte principal da logica de aprendizado: [.score/nucleus/LEARNING_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/LEARNING_ENGINE.md)
- Base historica do fluxo MVP: [docs/product/user-journey.md](/C:/Users/Pichau/score-energy-verse/docs/product/user-journey.md)
- Base historica do papel do mascote: [docs/product/mascot-role.md](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md)

## 3. Quais documentos definem arquitetura

- Fonte principal da arquitetura: [.score/engineering/ENGINEERING.md](/C:/Users/Pichau/score-energy-verse/.score/engineering/ENGINEERING.md)
- Plano arquitetural da Teoria Cognitiva v2.0: [PLANO_DA_TEORIA_COGNITIVA.md](/C:/Users/Pichau/score-energy-verse/PLANO_DA_TEORIA_COGNITIVA.md)
- Visao operacional consolidada do app: [README.md](/C:/Users/Pichau/score-energy-verse/README.md)
- Contrato de integracao do assistente/Hermes: [docs/HERMES_SETUP_SCORE.md](/C:/Users/Pichau/score-energy-verse/docs/HERMES_SETUP_SCORE.md)
- Linha historica da arquitetura MVP:
- [docs/tasks/002-mvp-core-flow.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/002-mvp-core-flow.md)
- [docs/tasks/003-mvp-persistence-layer.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/003-mvp-persistence-layer.md)
- [docs/tasks/004-backend-contracts.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/004-backend-contracts.md)
- [docs/tasks/005-supabase-adapter.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/005-supabase-adapter.md)
- [docs/tasks/006-mvp-invoice-flow-unification.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/006-mvp-invoice-flow-unification.md)
- [docs/tasks/007-journey-auth-user-binding.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/007-journey-auth-user-binding.md)
- [docs/tasks/008-supabase-rls-and-policies.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/008-supabase-rls-and-policies.md)
- [docs/tasks/009-ranking-real-users.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/009-ranking-real-users.md)
- [docs/tasks/010-ranking-shared-read-model.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/010-ranking-shared-read-model.md)

## 4. Quais documentos definem UX

- Fonte principal de design cognitivo: [.score/design/DESIGN.md](/C:/Users/Pichau/score-energy-verse/.score/design/DESIGN.md)
- Fonte principal da jornada conversacional: [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)
- Estudo de tensao entre login vivo e app com cara de dashboard: [.score/review/LIVING_PRODUCT_STUDY.md](/C:/Users/Pichau/score-energy-verse/.score/review/LIVING_PRODUCT_STUDY.md)
- Traducao publica atual do tom da Score: [src/pages/LandingPage.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/LandingPage.tsx)
- Traducao autenticada atual da experiencia central: [src/pages/Index.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/Index.tsx)
- Base historica do papel do mascote: [docs/product/mascot-role.md](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md)

## 5. Quais documentos definem Core

- Fonte principal da personagem e natureza da Core: [.score/universe/CORE_CHARACTER.md](/C:/Users/Pichau/score-energy-verse/.score/universe/CORE_CHARACTER.md)
- Relacao Core e Hermes: [.score/universe/CORE_AND_HERMES.md](/C:/Users/Pichau/score-energy-verse/.score/universe/CORE_AND_HERMES.md)
- Primeira presenca emocional: [.score/universe/THE_BIRTH_OF_CORE.md](/C:/Users/Pichau/score-energy-verse/.score/universe/THE_BIRTH_OF_CORE.md)
- Primeiro encontro com o usuario: [.score/universe/FIRST_CONTACT.md](/C:/Users/Pichau/score-energy-verse/.score/universe/FIRST_CONTACT.md)
- Guia de voz: [.score/universe/VOICE_GUIDE.md](/C:/Users/Pichau/score-energy-verse/.score/universe/VOICE_GUIDE.md)
- Modelo emocional: [.score/universe/EMOTIONAL_MODEL.md](/C:/Users/Pichau/score-energy-verse/.score/universe/EMOTIONAL_MODEL.md)
- Reflexao de rollout real: [.score/review/CORE_REVEAL.md](/C:/Users/Pichau/score-energy-verse/.score/review/CORE_REVEAL.md)

## 6. Quais documentos definem Hermes

- Contrato tecnico de integracao: [docs/HERMES_SETUP_SCORE.md](/C:/Users/Pichau/score-energy-verse/docs/HERMES_SETUP_SCORE.md)
- Papel institucional versus Core: [.score/universe/CORE_AND_HERMES.md](/C:/Users/Pichau/score-energy-verse/.score/universe/CORE_AND_HERMES.md)
- Papel dentro do Nucleo: [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
- Papel dentro da jornada: [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)
- Regras de engenharia para nao virar regra de negocio: [.score/engineering/ENGINEERING.md](/C:/Users/Pichau/score-energy-verse/.score/engineering/ENGINEERING.md)

## 7. Quais documentos definem o Nucleo

- Fonte principal: [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
- Motor de investigacao: [.score/nucleus/INVESTIGATION_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/INVESTIGATION_ENGINE.md)
- Motor de aprendizado: [.score/nucleus/LEARNING_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/LEARNING_ENGINE.md)
- Manifesto visual que o torna perceptivel: [.score/design/DESIGN.md](/C:/Users/Pichau/score-energy-verse/.score/design/DESIGN.md)
- Jornada que o torna utilizavel: [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)
- Traducao de runtime: [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)

## 8. Quais documentos tratam da Memoria Energetica

- Fonte explicativa curta: [docs/skills/score-energy/energy-memory.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-memory.md)
- Fonte conceitual principal: [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
- Fonte de aprendizado e envelhecimento: [.score/nucleus/LEARNING_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/LEARNING_ENGINE.md)
- Fonte visual/read-only: [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- Superficie de exibicao: [src/components/MemoryPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx)

## 9. Quais documentos tratam do Conhecimento Energetico

- Fonte de runtime: [src/lib/energyKnowledge.ts](/C:/Users/Pichau/score-energy-verse/src/lib/energyKnowledge.ts)
- Fonte conceitual que separa memoria de conhecimento: [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
- Fonte de design que explica como ele deve parecer: [.score/design/DESIGN.md](/C:/Users/Pichau/score-energy-verse/.score/design/DESIGN.md)
- Fonte de jornada que explica como ele nasce: [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)
- Superficies atuais: [src/components/MemoryPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx) e [src/components/DynamicContextPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/DynamicContextPanel.tsx)

## 10. Quais documentos possuem conceitos repetidos

- `CORE`, `DESIGN`, `JOURNEY` e `NUCLEUS` repetem com frequencia: jornada guiada, entendimento antes de recomendacao, memoria como continuidade, score como progressao e rejeicao a dashboard frio
- `CORE`, `NUCLEUS`, `ENGINEERING` e `JOURNEY` repetem a separacao entre regra de negocio, explicacao e assistencia
- `CORE_CHARACTER`, `FIRST_CONTACT`, `VOICE_GUIDE`, `EMOTIONAL_MODEL` e `THE_BIRTH_OF_CORE` repetem presenca silenciosa, cuidado, proximidade e companhia
- `docs/product/vision.md`, `docs/product/user-journey.md` e `docs/product/mascot-role.md` repetem a fundacao do produto anterior a Constituicao
- `docs/tasks/002` a `010` repetem a narrativa de arquitetura incremental, contratos, adaptadores, persistencia unica de jornada e ranking derivado

## 11. Quais documentos parecem desatualizados

- [SUPABASE_SETUP.md](/C:/Users/Pichau/score-energy-verse/SUPABASE_SETUP.md)
  Explica o caminho legado da tabela `public.invoices`, enquanto o fluxo ativo de `/perfil` usa `MvpState` e `mvp_journey_state`.
- [supabase_migration.sql](/C:/Users/Pichau/score-energy-verse/supabase_migration.sql)
  Continua valido para o caminho legado de faturas, mas nao descreve a persistencia principal atual da jornada.
- [DESIGN2D_BLUEPRINT.md](/C:/Users/Pichau/score-energy-verse/DESIGN2D_BLUEPRINT.md)
  Funciona hoje como referencia historica de um hub visual anterior, nao como fonte ativa da UX constitucional.
- [docs/product/user-journey.md](/C:/Users/Pichau/score-energy-verse/docs/product/user-journey.md)
  Continua importante como fundacao do MVP, mas ja nao e a melhor fonte para a UX atual baseada em Nucleo, Core e leitura viva.
- [docs/product/mascot-role.md](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md)
  Continua relevante, mas antecede a separacao posterior entre Core, Hermes, Nucleo, Memoria e Conhecimento.
- [docs/tasks/002-mvp-core-flow.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/002-mvp-core-flow.md)
  Registra a fase em que a leitura ainda era deterministica/mock; hoje o parser real ja esta integrado.

## 12. Quais documentos parecem se contradizer

- [docs/product/mascot-role.md](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md) versus [.score/universe/CORE_AND_HERMES.md](/C:/Users/Pichau/score-energy-verse/.score/universe/CORE_AND_HERMES.md)
  O primeiro nasce da fase em que o mascote concentrava mais a camada guia; o segundo redistribui papeis entre Core, Hermes e Nucleo.
- [docs/product/user-journey.md](/C:/Users/Pichau/score-energy-verse/docs/product/user-journey.md) versus [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)
  O primeiro descreve sequencia MVP por etapas; o segundo descreve conversa/investigacao como experiencia principal.
- [SUPABASE_SETUP.md](/C:/Users/Pichau/score-energy-verse/SUPABASE_SETUP.md) versus [README.md](/C:/Users/Pichau/score-energy-verse/README.md)
  O primeiro trata `invoices` como caminho central; o segundo documenta `mvp_journey_state` como fluxo ativo.
- [DESIGN2D_BLUEPRINT.md](/C:/Users/Pichau/score-energy-verse/DESIGN2D_BLUEPRINT.md) versus [.score/design/DESIGN.md](/C:/Users/Pichau/score-energy-verse/.score/design/DESIGN.md)
  O blueprint descreve uma composicao visual especifica; o manifesto de design define principios cognitivos que sobrevivem ao layout.

## 13. Existe documentacao que poderia ser fundida

- Os cinco documentos em `.score/universe/` poderiam futuramente virar um conjunto mais compacto em torno de presenca, voz e primeiro contato da Core
- `docs/product/vision.md`, `docs/product/user-journey.md` e `docs/product/mascot-role.md` poderiam virar um unico bloco de “fundacoes historicas do MVP”
- `docs/tasks/002` a `010` poderiam futuramente ser indexados por uma linha do tempo unica, porque hoje formam uma cadeia bem clara

## 14. Existe documentacao criada cedo demais

- As pastas `.score/language/` e `.score/ux/` existem apenas com `README`, mostrando que o terreno foi criado antes da consolidacao dos documentos finais desses pilares
- `.score/prompts/BASE_SPRINT_PROMPT.md` foi criado como infraestrutura antes de haver catalogo maior de prompts institucionais
- Parte dos documentos de universo foi criada antes da implementacao plena da Core; eles funcionam mais como consolidacao de intencao do que como reflexo de runtime completo

## 15. Qual documento deve ser considerado a principal fonte de verdade para cada assunto

- Identidade da empresa: [.score/brain/CORE.md](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md)
- Comportamento cognitivo da Score: [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
- Logica da proxima pergunta: [.score/nucleus/INVESTIGATION_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/INVESTIGATION_ENGINE.md)
- Logica de aprendizado ao longo do tempo: [.score/nucleus/LEARNING_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/LEARNING_ENGINE.md)
- Design cognitivo: [.score/design/DESIGN.md](/C:/Users/Pichau/score-energy-verse/.score/design/DESIGN.md)
- Ritmo da jornada: [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)
- Arquitetura de engenharia: [.score/engineering/ENGINEERING.md](/C:/Users/Pichau/score-energy-verse/.score/engineering/ENGINEERING.md)
- Runtime do produto autenticado: [README.md](/C:/Users/Pichau/score-energy-verse/README.md) junto do codigo central em [src/hooks/useMvpJourney.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts), [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts) e [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- Memoria Energetica em runtime: [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- Conhecimento Energetico em runtime: [src/lib/energyKnowledge.ts](/C:/Users/Pichau/score-energy-verse/src/lib/energyKnowledge.ts)
- Assistente/Hermes em runtime: [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts), [src/lib/scoreAssistant/scoreSystemPrompt.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts) e [docs/HERMES_SETUP_SCORE.md](/C:/Users/Pichau/score-energy-verse/docs/HERMES_SETUP_SCORE.md)
- Parser de fatura: [src/lib/invoiceParser.ts](/C:/Users/Pichau/score-energy-verse/src/lib/invoiceParser.ts)
- Persistencia de jornada: [src/services/mvpJourney/](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney) e [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- Ranking: [src/services/ranking/](/C:/Users/Pichau/score-energy-verse/src/services/ranking) e [README.md](/C:/Users/Pichau/score-energy-verse/README.md)

## Linhas historicas relevantes

- `main`
  Base publica antiga anterior a consolidacao constitucional.
- `product-core-v1`
  Ponto em que a fundacao conceitual do produto foi consolidada.
- `docs/product-foundation-v1`
  Origem dos documentos de produto pre-Constituicao.
- `sprint/stability-core-v1`
  Linha que consolidou memoria, continuidade e estabilizacao do modelo atual.
- `sprint/hermes-core-v1`
  Linha de preparacao do ecossistema Hermes/Core antes do refactor visual atual.
- `sprint/design-refactor-v1`
  Branch atual; substitui a experiencia principal pelo conceito Nucleo/Core sem trocar os contratos centrais.

## Sequencia de leitura recomendada para um novo engenheiro

Se um novo engenheiro entrasse hoje na Score, a sequencia de leitura mais segura seria:

1. [.score/README.md](/C:/Users/Pichau/score-energy-verse/.score/README.md)
2. [.score/brain/CORE.md](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md)
3. [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
4. [.score/design/DESIGN.md](/C:/Users/Pichau/score-energy-verse/.score/design/DESIGN.md)
5. [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)
6. [.score/engineering/ENGINEERING.md](/C:/Users/Pichau/score-energy-verse/.score/engineering/ENGINEERING.md)
7. [.score/nucleus/INVESTIGATION_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/INVESTIGATION_ENGINE.md)
8. [.score/nucleus/LEARNING_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/LEARNING_ENGINE.md)
9. [.score/universe/CORE_CHARACTER.md](/C:/Users/Pichau/score-energy-verse/.score/universe/CORE_CHARACTER.md)
10. [.score/universe/CORE_AND_HERMES.md](/C:/Users/Pichau/score-energy-verse/.score/universe/CORE_AND_HERMES.md)
11. [README.md](/C:/Users/Pichau/score-energy-verse/README.md)
12. [src/hooks/useMvpJourney.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts)
13. [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
14. [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
15. [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
16. [src/lib/energyKnowledge.ts](/C:/Users/Pichau/score-energy-verse/src/lib/energyKnowledge.ts)
17. [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts)
18. [docs/HERMES_SETUP_SCORE.md](/C:/Users/Pichau/score-energy-verse/docs/HERMES_SETUP_SCORE.md)
19. `docs/tasks/002` a `010` apenas como linha historica de como a arquitetura chegou aqui

Essa ordem leva da identidade para o comportamento, do comportamento para a engenharia e da engenharia para o runtime real.
