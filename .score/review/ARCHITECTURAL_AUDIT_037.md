# ARCHITECTURAL_AUDIT_037

## Contexto

Esta auditoria revisa o estado arquitetural geral da Score apos as missoes 031 a 036, com foco em coerencia institucional, arquitetura cognitiva, modelo de residencia, jornada, parser, validacao e aderencia a Constituicao da Inteligencia Score.

Escopo desta missao:

- diagnosticar o estado atual
- nao alterar implementacao
- nao refatorar
- nao criar motor novo
- nao alterar arquitetura existente

## Escopo auditado

1. Documentos institucionais e hierarquia documental
2. Arquitetura cognitiva e cadeia investigativa
3. Modelo de residencia, estado da jornada e memoria
4. Jornada principal e UX cognitiva
5. Parser de fatura, evidencias e leitura
6. Testes e validacao estrutural
7. Duvidas arquiteturais abertas
8. Coerencia com a Constituicao

## Leitura institucional consolidada

### Hierarquia observada

A hierarquia institucional declarada esta consistente no repositorio:

`CONSTITUICAO_DA_INTELIGENCIA_SCORE.md`

`-> Arquitetura Cognitiva`

`-> Documentos institucionais .score`

`-> Roadmaps`

`-> Implementacoes`

`-> Interface`

### Fontes principais auditadas

- `CONSTITUICAO_DA_INTELIGENCIA_SCORE.md`
- `PLANO_DA_TEORIA_COGNITIVA.md`
- `README.md`
- `.score/design/JOURNEY.md`
- `.score/nucleus/NUCLEUS.md`
- `.score/nucleus/LEARNING_ENGINE.md`
- `.score/review/PROJECT_CARTOGRAPHY_001.md`
- `.score/review/PROJECT_TREE.md`
- `.score/review/DOCUMENT_DEPENDENCY_MAP.md`
- `docs/cognitive/*.md`
- runtime real em `src/hooks`, `src/lib`, `src/components`, `src/pages`, `src/services`

### Veredito institucional

Os documentos institucionais ja descrevem com clareza crescente a identidade da Score como inteligencia investigativa, nao como dashboard, chatbot livre ou camada apenas visual. A base documental esta forte e coerente.

O principal desalinhamento nao esta mais na linguagem institucional. Esta na fronteira entre o que a arquitetura recente ja formalizou como cadeia cognitiva completa e o que o runtime principal realmente consome hoje.

## Principais achados

### Achado 1 — Alto impacto

A cadeia cognitiva mais nova das missoes 032 a 036 existe no codigo, esta testada, mas ainda nao esta conectada ao runtime principal do produto.

Evidencias:

- `src/lib/cognitive/buildRuntimeCoreExperience.ts:25-35` monta a experiencia principal a partir de `buildCoreExperienceFromJourney(...)`
- `src/lib/cognitive/coreExperienceComposer.ts:1-3` compoe a experiencia somente com `buildHouseModelFromJourney`, `selectPrimaryHouseClue` e `buildCoreSpeech`
- `src/lib/cognitive/investigationRuntime.ts:466-482` contem a cadeia completa de `investigation session -> learning handoff -> evaluation -> knowledge promotion -> persistence boundary`
- a busca por uso real de `investigationRuntime` no app aponta apenas export e testes, sem consumo por `hooks`, `pages`, `services` ou `components`

Leitura arquitetural:

- `CuriosityEngine`, `HouseModel`, `HouseClue`, `CoreSpeech` e `CoreExperience` ja influenciam a superficie principal
- `InvestigationSession`, `LearningEngineHandoff`, `LearningEngineEvaluation`, `KnowledgePromotion`, `KnowledgePersistenceBoundary` e `TemporalAuthority` ainda estao fora do caminho principal da jornada

Consequencia:

- a arquitetura cognitiva documentada ja avancou para uma cadeia mais completa
- o produto em execucao ainda opera majoritariamente numa fase anterior dessa arquitetura
- conhecimento candidato, persistibilidade e autoridade temporal ainda nao alteram a memoria real da jornada nem a retomada entre ciclos

### Achado 2 — Medio impacto

A regra institucional de `uma pergunta ativa` pode ser violada na experiencia atual quando o hero e o painel de detalhes coexistem.

Evidencias:

- `.score/design/JOURNEY.md:137` afirma `uma pergunta ativa`
- `.score/design/JOURNEY.md:431` reforca `sempre existe apenas uma pergunta ativa`
- `src/pages/Index.tsx:302-309` injeta `mascotContextQuestion` no `GuidedConversationViewModel`
- `src/pages/Index.tsx:427-471` injeta o mesmo `mascotContextQuestion` no `DynamicContextPanel`
- `src/components/nucleo/CorePresence.tsx:64` consome `viewModel.currentQuestion`
- `src/components/DynamicContextPanel.tsx:471-482` repassa `contextQuestion` para a view de contexto

Leitura arquitetural:

quando a pergunta contextual existe e o usuario abre detalhes, a mesma autoridade de pergunta pode aparecer em duas superficies da mesma sessao. Isso enfraquece o contrato de foco unico que a jornada institucional considera absoluto.

### Achado 3 — Medio impacto

O modelo de residencia ainda esta mais proximo de um mapa de evidencias do que de um modelo arquitetural de residencia propriamente dito.

Evidencias:

- `src/lib/cognitive/buildHouseModelFromJourney.ts:427-443` fixa `residenceType: 'unknown'`
- o mesmo bloco aproveita moradores, rotina e clima, mas nao consolida tipologia real da residencia
- `HouseModel` cria ambientes estaveis e hipoteses utilmente conservadoras, mas a identidade da casa ainda nasce rasa

Leitura arquitetural:

- ha um adaptador cognitivo promissor
- mas a ontologia da residencia ainda nao esta madura
- o sistema hoje conhece melhor pistas sobre consumo do que a estrutura da residencia em si

Isso nao invalida a V1. Mas significa que a Teoria Cognitiva da Residencia ainda nao voltou por completo ao dominio real implementado.

### Achado 4 — Medio impacto

A validacao dos motores cognitivos esta melhor que a validacao da costura entre eles e a UX principal.

Evidencias:

- existem testes dedicados para os motores recentes em `src/lib/cognitive/*.test.ts`
- `src/components/nucleo/GuidedConversationSession.test.ts:11-28` faz validacao por leitura de arquivo e regex, nao por comportamento em execucao

Leitura arquitetural:

- a confianca unit-level dos motores esta boa
- a confianca integration-level entre runtime cognitivo, sessao guiada, detalhe e memoria ainda e limitada

### Achado 5 — Baixo impacto, mas estrutural

O parser e a camada de evidencia estao entre as partes mais maduras do repositorio atual.

Evidencias:

- `src/lib/invoiceParser.ts` possui heuristicas extensas para PDF, texto, campos, cross-validation e fallback com `pdfjs`
- `src/lib/memorySnapshot.ts` preserva uma separacao consistente entre memoria, lacunas, evidencia e conhecimento
- `src/hooks/useMvpJourney.ts` mantem a jornada reidratada, com historico, score, acoes e sincronizacao persistente

Leitura arquitetural:

o alicerce factual da Score esta mais avancado do que a institucionalizacao runtime da cadeia cognitiva mais nova. A base de leitura da realidade esta melhor resolvida do que o ciclo de promocao de conhecimento.

## Duvidas criticas

1. A cadeia `InvestigationSession -> Learning -> Promotion -> Persistence Boundary -> Temporal Authority` deve entrar no runtime principal antes de qualquer nova expansao visual?
2. A autoridade da pergunta pertence ao hero principal ou ao painel detalhado, mas nao aos dois. Qual superficie sera a soberana?
3. `HouseModel` deve continuar read-only e efemero nesta fase, ou ja precisa de um contrato futuro de persistencia cognitiva?
4. `residenceType` deve nascer do perfil atual, de inferencia conservadora, ou permanecer desconhecido ate uma ontologia mais robusta?
5. Quando conhecimento candidato se tornar persistivel, ele deve alimentar qual memoria primeiro:
   - memoria energetica operacional
   - memoria cognitiva de residencia
   - camada intermediaria ainda nao implementada

## Conceitos que devem voltar para a Teoria

1. Distincao entre `arquitetura cognitiva implementada` e `arquitetura cognitiva ativa no runtime`
2. Soberania da `pergunta unica` como regra de interface, nao apenas de motor
3. Definicao mais explicita de `modelo de residencia` versus `modelo de evidencias da residencia`
4. Papel exato de `persistible knowledge candidate` antes da memoria final
5. Relacao entre `autoridade temporal inicial`, revalidacao e retomada de ciclo
6. Fronteira oficial entre `CoreExperience` e `InvestigationRuntime`

## Proximas missoes recomendadas

1. Conectar o `InvestigationRuntime` ao runtime principal da jornada, sem romper os guardrails atuais
2. Definir uma unica superficie soberana para pergunta ativa e rebaixar as demais a suporte
3. Consolidar a ontologia minima da residencia para que `HouseModel` deixe de nascer com `residenceType: unknown`
4. Criar testes de integracao da sessao guiada cobrindo:
   - pergunta unica
   - memoria apos resposta
   - handoff cognitivo
   - ausencia de duplicacao entre hero e detalhes
5. Especificar a camada futura que recebera `persistibleKnowledgeCandidate` quando ele deixar de ser apenas artefato de runtime

## Coerencia com a Constituicao

Veredito de coerencia: parcialmente coerente, com boa base e uma fronteira de execucao ainda incompleta.

Coerencias fortes:

- a Score continua se comportando como inteligencia investigativa
- a fatura permanece ancora epistemica principal
- memoria e conhecimento seguem separados
- a arquitetura recente adicionou prudencia, temporalidade e fronteira de persistencia

Incoerencias ou tensoes:

- a cadeia cognitiva mais profunda ainda nao governa o runtime principal
- a regra de foco unico da pergunta pode ser quebrada pela composicao atual da UI
- a teoria da residencia ainda esta parcialmente representada por heuristica e placeholder

## Validacao

Comandos previstos para esta auditoria:

- `npx tsc --noEmit`
- `npm run test`
- `npm run build`

Resultado:

- `npx tsc --noEmit`: aprovado
- `npm run test`: aprovado
- `npm run build`: aprovado

Observacoes:

- os comandos `test` e `build` exigiram execucao fora da sandbox por restricao ambiental do `esbuild`, nao por falha do branch
- a suite atual fechou com `155` testes passando
- o build concluiu com warnings ja conhecidos de empacotamento:
  - `caniuse-lite` desatualizado no `Browserslist`
  - chunks acima de `500 kB` apos minificacao

## Veredito arquitetural

Arquitetura promissora, institucionalmente forte e cognitivamente mais madura do que a superficie principal hoje exposta.

O repositorio ja nao sofre por falta de direcao. O ponto critico atual e de acoplamento arquitetural:

- a teoria avancou
- os motores avancaram
- os testes unitarios avancaram
- mas o runtime principal ainda nao incorporou integralmente a cadeia cognitiva que o proprio repositorio ja reconhece como proxima verdade operacional

Em sintese:

`a Score ja sabe mais sobre o que quer ser do que o runtime principal ainda consegue encenar de ponta a ponta`
