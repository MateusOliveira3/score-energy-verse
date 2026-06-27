# PROJECT_TREE

```text
Score Energy
├── Indice institucional
│   └── .score/README.md
├── Constituicao
│   ├── Identidade
│   │   └── .score/brain/CORE.md
│   ├── Design cognitivo
│   │   ├── .score/design/DESIGN.md
│   │   └── .score/design/JOURNEY.md
│   ├── Arquitetura cognitiva
│   │   ├── .score/nucleus/NUCLEUS.md
│   │   ├── .score/nucleus/INVESTIGATION_ENGINE.md
│   │   └── .score/nucleus/LEARNING_ENGINE.md
│   └── Arquitetura de engenharia
│       └── .score/engineering/ENGINEERING.md
|-- Planejamento institucional
|   `-- PLANO_DA_TEORIA_COGNITIVA.md
├── Universo
│   ├── Core
│   │   ├── .score/universe/CORE_CHARACTER.md
│   │   ├── .score/universe/THE_BIRTH_OF_CORE.md
│   │   ├── .score/universe/FIRST_CONTACT.md
│   │   ├── .score/universe/VOICE_GUIDE.md
│   │   └── .score/universe/EMOTIONAL_MODEL.md
│   └── Core e Hermes
│       └── .score/universe/CORE_AND_HERMES.md
├── Governanca
│   ├── Reflexao
│   │   └── .score/review/REFLECTION_ENGINE.md
│   ├── Auditorias e alinhamento
│   │   ├── .score/review/CONSTITUTION_REVIEW_001.md
│   │   ├── .score/review/ALIGNMENT_REPORT_001.md
│   │   ├── .score/review/CONSTITUTIONAL_REFACTOR_001.md
│   │   ├── .score/review/LIVING_PRODUCT_STUDY.md
│   │   ├── .score/review/GUIDED_CONVERSATION_ALPHA.md
│   │   ├── .score/review/GUIDED_CONVERSATION_ALPHA_FIX.md
│   │   └── .score/review/CORE_REVEAL.md
│   ├── Roadmap de processo
│   │   └── .score/roadmap/SPRINT_LIFECYCLE.md
│   └── Template de missao
│       └── .score/prompts/BASE_SPRINT_PROMPT.md
├── Fundacoes historicas de produto
│   ├── docs/product/vision.md
│   ├── docs/product/user-journey.md
│   ├── docs/product/score-model-draft.md
│   ├── docs/product/mascot-role.md
│   ├── docs/product/ecosystem-triangle.md
│   └── docs/product/ai-development-rules.md
├── Fundacoes historicas de implementacao
│   ├── docs/tasks/002-mvp-core-flow.md
│   ├── docs/tasks/003-mvp-persistence-layer.md
│   ├── docs/tasks/004-backend-contracts.md
│   ├── docs/tasks/005-supabase-adapter.md
│   ├── docs/tasks/006-mvp-invoice-flow-unification.md
│   ├── docs/tasks/007-journey-auth-user-binding.md
│   ├── docs/tasks/008-supabase-rls-and-policies.md
│   ├── docs/tasks/009-ranking-real-users.md
│   └── docs/tasks/010-ranking-shared-read-model.md
├── Operacao do assistente
│   └── docs/HERMES_SETUP_SCORE.md
├── Conhecimento interno de energia
│   └── docs/skills/score-energy
│       ├── energy-bill-reading.md
│       ├── energy-culture.md
│       ├── energy-memory.md
│       ├── home-office-energy.md
│       └── residential-loads.md
├── Runtime documentado
│   ├── README.md
│   ├── src/hooks/useMvpJourney.ts
│   ├── src/lib/mvpJourneyState.ts
│   ├── src/lib/mvpCoreFlow.ts
│   ├── src/lib/memorySnapshot.ts
│   ├── src/lib/energyKnowledge.ts
│   ├── src/lib/nucleoSession.ts
│   ├── src/lib/guidedConversation.ts
│   ├── src/lib/invoiceParser.ts
│   ├── src/lib/scoreAssistant/buildScoreAssistantContext.ts
│   ├── src/lib/scoreAssistant/scoreSystemPrompt.ts
│   └── src/pages
│       ├── LandingPage.tsx
│       ├── Index.tsx
│       ├── Assistant.tsx
│       ├── Ranking.tsx
│       ├── Login.tsx
│       └── Register.tsx
├── Persistencia e integracao
│   ├── src/services/mvpJourney
│   ├── src/services/ranking
│   ├── supabase/migrations/20260422_mvp_journey_state_rls.sql
│   ├── supabase/migrations/20260422_ranking_entries_shared_read_model.sql
│   ├── scripts/score-assistant/viteScoreAssistantPlugin.ts
│   └── scripts/run-domain-tests.mjs
└── Legado ainda presente
    ├── SUPABASE_SETUP.md
    ├── supabase_migration.sql
    ├── DESIGN2D_BLUEPRINT.md
    ├── src/hooks/useInvoices.ts
    ├── src/components/LiveMascotJourney.tsx
    └── src/pages/LoginPage.jsx
```

## Leitura do tree

- A `Constituicao` define a verdade institucional.
- `Planejamento institucional` registra o plano arquitetural da futura Teoria Cognitiva da Residencia v2.0.
- `Universo` define presenca, voz e papel emocional da Core.
- `Governanca` registra auditoria, reflexao e consolidacao.
- `Fundacoes historicas` mostram como o produto e a arquitetura chegaram ate aqui.
- `Runtime documentado` e `Persistencia e integracao` mostram o sistema real em funcionamento.
- `Legado ainda presente` nao e lixo; e material que ainda existe no repositorio, mas nao deve ser lido como fonte principal de verdade.
