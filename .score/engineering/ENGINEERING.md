# ENGINEERING

Este documento nao define uma engenharia idealizada.

Ele consolida a engenharia que ja aparece repetidamente no repositorio da Score Energy: como responsabilidades sao separadas, como contratos sao preservados, quando adaptadores entram, quando a UI recebe view-models read-only, como o dominio permanece explicavel e como Hermes fica fora da regra de negocio.

Quando um principio aparece aqui, e porque ele reaparece em codigo, docs, contratos, tarefas e historico recente de evolucao.

## Filosofia da Engenharia

A engenharia da Score, no estado atual do repositorio, existe para preservar continuidade, memoria, explicabilidade e evolucao segura do produto.

Ela nao se organiza em torno de "usar tecnologia X". Ela se organiza em torno de:

- continuidade da jornada
- Memoria Energetica
- Conhecimento Energetico
- transparencia
- rastreabilidade
- simplicidade
- evolucao incremental

Esse comportamento aparece em:

- [.score/README.md](/C:/Users/Pichau/score-energy-verse/.score/README.md)
- [.score/roadmap/SPRINT_LIFECYCLE.md](/C:/Users/Pichau/score-energy-verse/.score/roadmap/SPRINT_LIFECYCLE.md)
- [.score/brain/CORE.md](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md)
- [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
- [docs/tasks/003-mvp-persistence-layer.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/003-mvp-persistence-layer.md)
- [docs/tasks/004-backend-contracts.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/004-backend-contracts.md)

O historico recente tambem reforca isso. Os ultimos commits repetem termos como `checkpoint`, `stabilize`, `consolidate` e `continuity`, sinalizando que a engenharia da Score prefere consolidar antes de expandir.

## Principios Fundamentais

### 1. O dominio precisa continuar explicavel

Este principio aparece porque score, analise, proximas acoes e memoria sao calculados por regras visiveis e derivacoes rastreaveis.

Evidencias:

- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)

### 2. A interface nao deve carregar regra de negocio central

Este principio aparece porque calculos de score, analise, diagnostico, normalizacao e estado resolvido vivem em `src/lib/`, enquanto hooks e componentes consomem esses resultados.

Evidencias:

- [src/hooks/useMvpJourney.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts)
- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)

### 3. A persistencia deve ficar atras de contratos

Este principio aparece porque o frontend conversa com services e adapters, nao diretamente com localStorage ou Supabase.

Evidencias:

- [src/services/mvpJourney/contracts.ts](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney/contracts.ts)
- [src/services/mvpJourney/localAdapter.ts](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney/localAdapter.ts)
- [src/services/mvpJourney/supabaseAdapter.ts](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney/supabaseAdapter.ts)
- [docs/tasks/004-backend-contracts.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/004-backend-contracts.md)

### 4. Fallback seguro vale mais do que acoplamento prematuro

Este principio aparece porque local adapter, auth fallback, development fallback identity e fallback educativo do assistente sao mantidos como caminhos oficiais, nao como gambiarras escondidas.

Evidencias:

- [src/contexts/AuthContext.tsx](/C:/Users/Pichau/score-energy-verse/src/contexts/AuthContext.tsx)
- [src/lib/journeyIdentity.ts](/C:/Users/Pichau/score-energy-verse/src/lib/journeyIdentity.ts)
- [src/lib/scoreAssistant/fallback.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/fallback.ts)
- [docs/HERMES_SETUP_SCORE.md](/C:/Users/Pichau/score-energy-verse/docs/HERMES_SETUP_SCORE.md)

### 5. Normalizar antes de reutilizar

Este principio aparece porque o projeto normaliza estado persistido, score events, acoes, invoices, conhecimento e perfil antes de voltar a usar qualquer dado.

Evidencias:

- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [src/lib/mvpPersistence.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpPersistence.ts)
- [src/services/ranking/helpers.ts](/C:/Users/Pichau/score-energy-verse/src/services/ranking/helpers.ts)

## Evolucao Incremental

A Score evolui em passos pequenos, reversiveis e compatíveis com o fluxo atual.

Esse padrao aparece porque:

- o provider local continua existindo mesmo depois da chegada do Supabase
- a jornada persiste um blob unico antes de tentar normalizar entidades no backend
- ranking nasce primeiro como derivacao local, depois ganha read model compartilhado
- Hermes entra como camada opcional, sem substituir fallback nem dominio
- documentos de tarefa repetem "nao quebrar o fluxo atual" e "manter contratos"

Evidencias:

- [docs/tasks/003-mvp-persistence-layer.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/003-mvp-persistence-layer.md)
- [docs/tasks/005-supabase-adapter.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/005-supabase-adapter.md)
- [docs/tasks/009-ranking-real-users.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/009-ranking-real-users.md)
- [docs/tasks/010-ranking-shared-read-model.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/010-ranking-shared-read-model.md)
- [.score/roadmap/SPRINT_LIFECYCLE.md](/C:/Users/Pichau/score-energy-verse/.score/roadmap/SPRINT_LIFECYCLE.md)

## Preservacao de Contratos

Preservar contrato e um dos comportamentos mais recorrentes do repositorio.

Isso aparece de varias formas:

- services expõem interfaces estaveis antes do provider real
- hooks mantem a mesma forma geral enquanto a persistencia troca por baixo
- adapters implementam o mesmo contrato
- read models compartilham shape publico enxuto
- dominio continua retornando `MvpState` ou derivados normalizados

A Score parece considerar contrato como mecanismo de continuidade, nao apenas de tipagem.

Evidencias:

- [src/services/mvpJourney/contracts.ts](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney/contracts.ts)
- [src/services/ranking/contracts.ts](/C:/Users/Pichau/score-energy-verse/src/services/ranking/contracts.ts)
- [docs/tasks/004-backend-contracts.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/004-backend-contracts.md)
- [docs/tasks/005-supabase-adapter.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/005-supabase-adapter.md)

## Adaptadores

Adaptadores aparecem repetidamente quando a Score quer trocar infraestrutura sem reescrever comportamento de produto.

Hoje eles servem para:

- esconder localStorage da jornada
- esconder Supabase da jornada
- esconder a origem do ranking
- manter provider local como fallback seguro

### Quando criar um adapter

O padrao observado sugere criar adapter quando:

- a mesma capacidade pode ter mais de um provider
- a interface nao deve conhecer detalhes de infraestrutura
- a escolha do provider pode mudar por ambiente
- a regra de produto precisa sobreviver a troca de backend

### Quando nao criar um adapter

O projeto nao cria adapter para tudo. Ele nao faz isso para:

- regra de score
- analise da fatura
- memoria
- diagnostico

Essas partes continuam em libs de dominio, porque o problema ali nao e trocar infraestrutura.

Evidencias:

- [src/services/mvpJourney/index.ts](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney/index.ts)
- [src/services/ranking/index.ts](/C:/Users/Pichau/score-energy-verse/src/services/ranking/index.ts)
- [docs/tasks/004-backend-contracts.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/004-backend-contracts.md)
- [docs/tasks/005-supabase-adapter.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/005-supabase-adapter.md)

## ViewModels

ViewModels aparecem quando o estado real do dominio precisa ser reorganizado para uma experiencia especifica sem mutar a regra central.

Os dois exemplos mais claros hoje sao:

- `buildNucleoSessionViewModel`
- `buildScoreAssistantContext`

Ambos:

- recebem estado ja resolvido
- leem score, memoria, historico e acoes
- organizam a saida para um consumidor especifico
- nao persistem nada
- nao mudam score, parser ou recomendacao

### Quando criar um ViewModel

O padrao observado sugere criar ViewModel quando:

- um consumidor precisa de uma leitura composta de varios blocos de estado
- a apresentacao exige outra organizacao sem mexer no dominio
- a saida deve ser read-only
- a mesma regra central precisa sustentar superficies diferentes

### Quando nao criar um ViewModel

Nao parece necessario criar ViewModel quando:

- o componente consome o estado quase cru
- a transformacao e pequena e local
- a regra pertence claramente ao dominio, nao a uma superficie

Evidencias:

- [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)
- [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts)
- [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)

## Hooks

Os hooks da Score aparecem como orquestradores de fluxo e efeito, nao como donos do dominio.

### O que os hooks fazem hoje

- resolvem identidade
- carregam estado
- chamam service
- expõem mutacoes para a pagina
- derivam alguns memos de consumo imediato

### O que os hooks evitam fazer

- guardar regra central de score
- recalcular dominio complexo no JSX
- importar infraestrutura diretamente nos componentes

O exemplo mais importante e `useMvpJourney`, que:

- resolve identidade
- carrega a jornada pelo service
- salva o estado inteiro pelo mesmo service
- delega regra para `mvpCoreFlow` e `mvpJourneyState`

Evidencias:

- [src/hooks/useMvpJourney.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts)
- [src/hooks/useRanking.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useRanking.ts)
- [src/hooks/useJourneyIdentity.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useJourneyIdentity.ts)

## Services

Services aparecem quando a Score quer uma borda operacional explicita entre UI e infraestrutura.

Hoje eles sao usados para:

- jornada MVP
- ranking

O padrao e consistente:

- `contracts.ts` define a borda
- `index.ts` resolve provider
- `localAdapter.ts` implementa o caminho seguro
- `supabaseAdapter.ts` implementa o provider externo

Isso mostra que service, neste repositorio, significa "porta de entrada de capacidade externa", nao "lugar generico para qualquer funcao".

Evidencias:

- [src/services/mvpJourney/contracts.ts](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney/contracts.ts)
- [src/services/ranking/contracts.ts](/C:/Users/Pichau/score-energy-verse/src/services/ranking/contracts.ts)
- [docs/tasks/009-ranking-real-users.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/009-ranking-real-users.md)

## Dominio

O dominio da Score hoje vive principalmente em `src/lib/`.

Nessa camada ficam:

- score
- interpretacao da fatura
- analise
- proximas acoes
- guidance do mascote
- explicacao de score
- normalizacao de jornada
- memoria
- conhecimento

### Quando uma regra pertence ao dominio

O comportamento observado sugere que uma regra pertence ao dominio quando:

- altera o significado da jornada
- muda score, analise, memoria, acoes ou comparacao
- precisa permanecer valida independentemente da interface
- deve ser testavel como funcao ou transicao de estado

### Quando preservar codigo legado do dominio

O projeto tende a preservar codigo legado do dominio quando:

- ele ainda sustenta contrato central
- a refatoracao nao e necessaria para o objetivo atual
- existe risco de quebrar score, parser, ranking ou persistencia

### Quando refatorar dominio

O projeto refatora dominio quando:

- a normalizacao ficou espalhada
- uma transicao precisa virar funcao nomeada
- a persistencia precisa ser desacoplada da UI
- o mesmo comportamento esta sendo reafirmado em varias sprints

Evidencias:

- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- [src/lib/energyKnowledge.ts](/C:/Users/Pichau/score-energy-verse/src/lib/energyKnowledge.ts)

## Interface

A interface da Score, pelo padrao atual, deve representar inteligencia existente sem criar regra paralela.

Ela:

- consome hooks, snapshots e view-models
- mostra feedback imediato
- expõe contexto, memoria e orientacao
- evita promessa maior que o dado permite

Ela nao deve:

- recalcular score central
- criar regra de analise local
- decidir recomendacao por conta propria
- acoplar escrita ao painel read-only

O padrao `read-only` aparece repetidamente justamente para proteger esse limite.

Evidencias:

- [src/components/MemoryPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx)
- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)
- [src/components/SmartRecommendations.tsx](/C:/Users/Pichau/score-energy-verse/src/components/SmartRecommendations.tsx)

## Backend

O backend da Score, no estado atual do repositorio, e tratado como provider substituivel e progressivo.

Padroes observados:

- o frontend fala com contracts, nao com Supabase direto
- a jornada persiste um blob unico enquanto o modelo ainda amadurece
- RLS e tabela privada protegem `mvp_journey_state`
- read model separado entra quando compartilhamento seguro e necessario
- fallback local continua como caminho oficial de desenvolvimento

Isso mostra uma engenharia que prefere compatibilidade e isolamento antes de otimizar a modelagem final.

Evidencias:

- [src/services/mvpJourney/supabaseAdapter.ts](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney/supabaseAdapter.ts)
- [src/services/mvpJourney/supabaseClient.ts](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney/supabaseClient.ts)
- [docs/tasks/008-supabase-rls-and-policies.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/008-supabase-rls-and-policies.md)
- [docs/tasks/010-ranking-shared-read-model.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/010-ranking-shared-read-model.md)

## Hermes

Hermes entra como camada opcional de assistencia, nunca como fonte primaria de regra.

### Responsabilidades de Hermes

- responder perguntas do usuario
- usar o contexto montado pela Score
- devolver explicacao educativa
- operar por BFF sem expor segredo no browser

### Responsabilidades que nao pertencem ao Hermes

- decidir score
- decidir diagnostico central
- escrever memoria energetica
- alterar recomendacao principal
- substituir o Nucleo
- virar contrato de persistencia

### Como evitar que Hermes vire regra de negocio

O proprio projeto ja faz isso por engenharia:

- contexto e montado por `buildScoreAssistantContext`
- prompt e guardrails sao montados pela Score
- frontend fala apenas com `/api/score-assistant/*`
- fallback local continua funcional
- mode `hermes` ou `fallback` afeta resposta, nao a regra do produto

Evidencias:

- [docs/HERMES_SETUP_SCORE.md](/C:/Users/Pichau/score-energy-verse/docs/HERMES_SETUP_SCORE.md)
- [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts)
- [src/lib/scoreAssistant/scoreSystemPrompt.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts)
- [src/lib/scoreAssistant/hermesClient.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/hermesClient.ts)
- [src/lib/scoreAssistant/fallback.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/fallback.ts)

## Nucleo

Do ponto de vista de engenharia, o Nucleo nao e um componente. Ele e um consumidor organizado do dominio resolvido da jornada.

Isso significa:

- o Nucleo nao substitui `mvpCoreFlow`
- o Nucleo nao substitui `mvpJourneyState`
- o Nucleo depende de memoria, score, analise e acoes ja resolvidos
- o Nucleo usa view-model para representar esses blocos sem reescrever regra

O padrao observado e: primeiro resolver a jornada, depois organizar sua leitura.

Evidencias:

- [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
- [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)
- [src/hooks/useMvpJourney.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts)

## Memoria Energetica

Do ponto de vista de engenharia, Memoria Energetica e uma leitura consolidada e read-only sobre o estado da jornada.

Padroes observados:

- ela nasce de dados ja persistidos
- usa selectors e agregacoes, nao escrita acoplada ao painel
- serve como contexto para interface e assistente
- explicita fatos, sinais, lacunas e evidencias

Isso mostra que a engenharia trata memoria como produto derivado do estado, nao como camada magica.

Evidencias:

- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- [src/components/MemoryPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx)
- [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts)

## Conhecimento Energetico

Do ponto de vista de engenharia, Conhecimento Energetico e um catalogo controlado com estado de aprendizado explicitamente persistido.

Padroes observados:

- catalogo fixo em modulo proprio
- normalizacao de estado propria
- aprendizado marcado por id
- leitura reaproveitada por memoria e Nucleo
- sem efeito colateral sobre score, parser ou diagnostico

Evidencias:

- [src/lib/energyKnowledge.ts](/C:/Users/Pichau/score-energy-verse/src/lib/energyKnowledge.ts)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)

## Criterios para Refatoracao

A engenharia atual da Score parece refatorar quando ao menos um destes sinais aparece repetidamente:

- regra importante esta espalhada
- infraestrutura vazou para a interface
- estado precisa ser normalizado em mais de um lugar
- o mesmo guardrail foi reafirmado em varias sprints
- a evolucao futura ficaria insegura sem uma borda explicita

Ela evita refatorar quando:

- a tarefa atual nao exige isso
- o beneficio e apenas estetico
- o contrato central ficaria em risco
- a mudanca ampliaria demais o raio de regressao

## Criterios para Novas Funcionalidades

Uma funcionalidade nova, pelo padrao do repositorio, deve surgir assim:

1. partir de necessidade real da jornada
2. definir guardrails explicitos
3. reutilizar estado e contratos existentes quando possivel
4. introduzir nova estrutura apenas na menor borda necessaria
5. manter o fallback anterior funcional quando houver troca de provider
6. terminar com build, teste e reflection

Evidencias:

- [.score/prompts/BASE_SPRINT_PROMPT.md](/C:/Users/Pichau/score-energy-verse/.score/prompts/BASE_SPRINT_PROMPT.md)
- [.score/review/REFLECTION_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/review/REFLECTION_ENGINE.md)
- [docs/product/ai-development-rules.md](/C:/Users/Pichau/score-energy-verse/docs/product/ai-development-rules.md)

## Criterios para Abstracao

A Score abstrai quando a abstracao protege contrato, provider ou consumidor.

Ela evita abstracao quando seria apenas "engenharia bonita".

### Sinais de abstracao valida

- multiplos providers reais ou iminentes
- consumidor precisa de shape diferente sem mudar regra
- persistencia precisa ficar isolada
- backend ou assistente nao pode conhecer detalhes internos da interface

### Sinais de abstracao prematura

- criar service para logica que ainda e puramente local e unica
- normalizar entidades demais antes de amadurecer o modelo
- substituir regra simples por camada genérica sem repeticao suficiente

O melhor exemplo de equilibrio atual e:

- adapter para provider
- view-model para consumidor
- dominio puro para regra

## Criterios para Documentacao

A documentacao da engenharia da Score surge quando o comportamento ja apareceu varias vezes.

Padroes observados:

- tarefa antes e depois da implementacao
- docs de branch explicando objetivo, o que mudou e o que ainda nao mudou
- consolidacao posterior na `.score` quando ha repeticao suficiente

Quando atualizar documentacao existente:

- quando o codigo ja mudou o contrato descrito
- quando um guardrail reaparece em mais de uma sprint
- quando uma decisao estrutural virou padrão, nao caso isolado

Quando nao documentar ainda:

- quando a direcao ainda esta em disputa
- quando a abstracao ainda apareceu uma vez so
- quando a implementacao ainda e evidentemente provisoria

## Padroes Consolidados

Os padroes de engenharia mais consolidados hoje parecem ser:

- usar um estado raiz coerente para a jornada
- normalizar antes de reusar qualquer dado persistido
- manter regra de negocio em libs e nao em componentes
- isolar infraestrutura atras de contracts e adapters
- criar fallback local antes de depender totalmente de servico externo
- usar read-only selectors e snapshots para expor inteligencia sem acoplar escrita
- derivar score de eventos validos em vez de armazenar numero arbitrario
- introduzir read models separados quando seguranca e compartilhamento entram em conflito
- tratar Hermes como camada de explicacao, nao de regra

## Conceitos ainda experimentais

Alguns pontos ja existem, mas ainda nao parecem totalmente maduros como constituicao permanente:

- o papel definitivo do Nucleo como contrato tecnico alem de contrato cognitivo
- a extensao futura de `Conhecimento Energetico` na arquitetura
- o endurecimento server-side da integridade do ranking
- a modelagem final do estado blob da jornada versus registros mais normalizados
- a fronteira final entre mascote e assistente como consumidores do mesmo contexto

## Reflection

### Quais padroes arquiteturais aparecem repetidamente?

- contracts + adapters para infraestrutura variavel
- dominio puro em `src/lib`
- hooks como orquestradores de fluxo
- normalizacao agressiva antes de reidratacao
- fallback local como caminho oficial
- read models e snapshots para leitura segura

### Existe duplicacao saudavel?

Sim. Existe duplicacao saudavel quando local e Supabase implementam o mesmo contrato, e quando ranking e jornada repetem a mesma estrategia de service boundary. Essa duplicacao protege compatibilidade.

### Existe duplicacao desnecessaria?

Existe alguma duplicacao leve de logicas utilitarias de normalizacao textual e de presentation shaping em componentes diferentes. Hoje isso ainda nao parece comprometer o produto, mas merece observacao se continuar crescendo.

### Alguma abstracao parece prematura?

Pouca abstracao parece prematura no nucleo da engenharia. O repositorio, em geral, abstrai com cautela. O ponto mais sensivel ainda e o quanto o estado blob da jornada sera sustentado antes de uma modelagem mais granular.

### Existe acoplamento que ainda precisa amadurecer?

Sim. A fronteira entre Nucleo, assistente e mascote ainda esta funcionalmente coerente, mas conceitualmente jovem. Tambem existe acoplamento aceitavel entre persistencia da jornada e sincronizacao de ranking, que provavelmente vai amadurecer com backend trusted.

### O uso de adapters esta consistente?

Sim. O uso de adapters para jornada e ranking e um dos comportamentos mais consistentes do projeto.

### A separacao entre dominio, Nucleo e Hermes esta clara?

Ja esta relativamente clara:

- dominio calcula e resolve
- Nucleo organiza e expõe leitura
- Hermes explica usando contexto dado pela Score

Ainda assim, essa fronteira precisa continuar sendo vigiada para Hermes nao invadir regra de negocio.

### Quais principios de engenharia parecem maduros o suficiente para nunca mais serem discutidos?

- preservar contratos centrais
- preferir mudanca incremental
- isolar infraestrutura em adapters
- manter fallback seguro
- normalizar antes de reutilizar
- nao deixar a interface reimplementar o dominio

### Quais ainda precisam evoluir?

- integridade server-side do ranking
- forma final da modelagem de persistencia
- fronteira estrutural entre Nucleo, mascote e assistente
- criterios definitivos para quando um view-model vira linguagem permanente da plataforma
