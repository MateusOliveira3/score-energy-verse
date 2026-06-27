# CORE

Este documento nao inventa a filosofia da Score Energy.

Ele consolida padroes que aparecem repetidamente no repositorio em codigo, documentacao, prompts, arquitetura e UX. Quando um ponto abaixo aparece como principio, e porque ele sobreviveu a varias camadas do projeto, e nao porque pareceu uma boa ideia isolada.

## Identidade

A Score Energy se comporta no repositorio como uma plataforma de jornada energetica guiada, ancorada na fatura de energia, com foco em transformar dado disperso em entendimento acionavel.

Essa identidade aparece de forma recorrente em:

- [README.md](/C:/Users/Pichau/score-energy-verse/README.md) ao definir o MVP como uma jornada persistida em `/perfil`
- [docs/product/vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md) ao dizer que a Score nao quer ser apenas dashboard
- [docs/product/user-journey.md](/C:/Users/Pichau/score-energy-verse/docs/product/user-journey.md) ao organizar o produto como sequencia de passos, score e proximas acoes
- [src/hooks/useMvpJourney.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts) ao centralizar o fluxo real da jornada

## Missao

Descoberta no repositorio: transformar a conta de luz em leitura energetica compreensivel, contextual e progressiva, para que o usuario tome melhores decisoes ao longo do tempo.

Esta formulacao deriva de evidencias repetidas:

- a fatura e o ponto de entrada mais recorrente do produto
- a analise e sempre acompanhada de contexto, historico, proximos passos e score
- a jornada insiste em continuidade entre ciclos, nao apenas leitura pontual

As fontes mais consistentes sao:

- [docs/product/vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md)
- [docs/product/user-journey.md](/C:/Users/Pichau/score-energy-verse/docs/product/user-journey.md)
- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)

## Visao

A visao mais estavel encontrada nao e "fazer um app bonito para ler conta", e sim construir um sistema que acompanhe a evolucao energetica do usuario entre ciclos, com memoria, orientacao e progressao visivel.

Em documentacao mais estrategica, a Score tambem aparece como futura mediadora entre usuarios, consultores e provedores, mas essa parte ainda esta mais forte em direcao de produto do que em operacao consolidada.

Evidencias principais:

- [docs/product/vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md)
- [docs/product/ecosystem-triangle.md](/C:/Users/Pichau/score-energy-verse/docs/product/ecosystem-triangle.md)
- [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)

## Filosofia

### Entendimento antes de recomendacao

A Score repete continuamente que a recomendacao so tem valor quando nasce de contexto suficiente.

Isso aparece em:

- [src/lib/scoreAssistant/scoreSystemPrompt.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts): "Priorize entendimento antes de recomendacao."
- [docs/skills/score-energy/energy-bill-reading.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-bill-reading.md)
- [docs/skills/score-energy/energy-culture.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-culture.md)
- [src/lib/scoreAssistant/fallback.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/fallback.ts)

### Contexto real vale mais do que resposta generica

A plataforma privilegia sinais reais da jornada: perfil, fatura, historico, habitos confirmados e acoes acompanhadas.

Esse principio aparece porque:

- o fluxo principal gira em torno de `profile`, `invoiceHistory`, `analysis`, `actions` e `scoreEvents`
- a memoria energetica existe para evitar perda de contexto entre ciclos
- as recomendacoes insistem em usar a fatura em foco como referencia

Fontes principais:

- [README.md](/C:/Users/Pichau/score-energy-verse/README.md)
- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- [src/components/SmartRecommendations.tsx](/C:/Users/Pichau/score-energy-verse/src/components/SmartRecommendations.tsx)
- [src/components/DynamicContextPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/DynamicContextPanel.tsx)

### Honestidade e limite explicito sao mais importantes do que parecer inteligente

A Score prefere admitir ausencia de dado, evitar causalidade forjada e nao prometer economia sem evidencia.

Esse comportamento aparece repetidamente em:

- [src/lib/scoreAssistant/scoreSystemPrompt.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts)
- [docs/skills/score-energy/energy-memory.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-memory.md)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)

### A jornada precisa ser explicavel

Score, analise, progresso e proximos passos foram estruturados para poderem ser explicados depois.

Evidencias:

- o score e derivado de eventos, nao de um numero solto
- a explicacao do score e reconstruida a partir dos eventos validos
- a jornada persistida mantem estado suficiente para reidratar contexto

Fontes:

- [README.md](/C:/Users/Pichau/score-energy-verse/README.md)
- [docs/product/user-journey.md](/C:/Users/Pichau/score-energy-verse/docs/product/user-journey.md)
- [docs/tasks/003-mvp-persistence-layer.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/003-mvp-persistence-layer.md)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)

## Principios

### 1. A fatura e a ancora principal da Score

Este principio foi identificado porque a fatura aparece como entrada, evidencia, comparacao, gatilho de score e base de acompanhamento em codigo e documentacao.

Evidencias:

- [docs/product/vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md)
- [docs/tasks/006-mvp-invoice-flow-unification.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/006-mvp-invoice-flow-unification.md)
- [src/components/InvoiceUpload.tsx](/C:/Users/Pichau/score-energy-verse/src/components/InvoiceUpload.tsx)
- [src/components/InvoiceHistory.tsx](/C:/Users/Pichau/score-energy-verse/src/components/InvoiceHistory.tsx)

### 2. O produto existe para criar continuidade entre ciclos

Este principio foi identificado porque historico, comparacao, proxima fatura, memoria e score reaparecem como mecanismos de retorno e nao como detalhes de interface.

Evidencias:

- [docs/product/user-journey.md](/C:/Users/Pichau/score-energy-verse/docs/product/user-journey.md)
- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)

### 3. O score precisa representar progresso observavel

Este principio foi identificado porque o score sempre aparece ligado a eventos explicitos, progresso de jornada e acoes concretas, e nao a uma formula opaca.

Evidencias:

- [docs/product/score-model-draft.md](/C:/Users/Pichau/score-energy-verse/docs/product/score-model-draft.md)
- [README.md](/C:/Users/Pichau/score-energy-verse/README.md)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [src/services/ranking/helpers.ts](/C:/Users/Pichau/score-energy-verse/src/services/ranking/helpers.ts)

### 4. Memoria Energetica e um ativo central, nao um adorno

Este principio foi identificado porque memoria ja tem documentacao propria, snapshot consolidado, painel dedicado, contexto para assistente e papel direto na personalizacao da jornada.

Evidencias:

- [docs/skills/score-energy/energy-memory.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-memory.md)
- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- [src/components/MemoryPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx)
- [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts)

### 5. O mascote e guia educativo, nao componente decorativo

Este principio foi identificado porque a documentacao do mascote, os fluxos contextuais e a linguagem recente insistem em separar o papel educativo do mascote do restante do sistema.

Evidencias:

- [docs/product/mascot-role.md](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md)
- [src/components/DynamicContextPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/DynamicContextPanel.tsx)
- [src/lib/energyKnowledge.ts](/C:/Users/Pichau/score-energy-verse/src/lib/energyKnowledge.ts)

### 6. A arquitetura prefere adaptadores e evolucao incremental

Este principio foi identificado porque persistencia, ranking, assistente e jornada foram construidos com contratos adaptaveis, fallback local e substituicao progressiva de infraestrutura.

Evidencias:

- [README.md](/C:/Users/Pichau/score-energy-verse/README.md)
- [docs/tasks/004-backend-contracts.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/004-backend-contracts.md)
- [docs/tasks/005-supabase-adapter.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/005-supabase-adapter.md)
- [docs/HERMES_SETUP_SCORE.md](/C:/Users/Pichau/score-energy-verse/docs/HERMES_SETUP_SCORE.md)

### 7. Estabilidade e rastreabilidade valem mais do que complexidade

Este principio foi identificado porque o repositorio repete solucoes simples, estado unico da jornada, regras explicitas e fallback seguro em vez de expandir arquitetura antes da hora.

Evidencias:

- [docs/tasks/002-mvp-core-flow.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/002-mvp-core-flow.md)
- [docs/tasks/003-mvp-persistence-layer.md](/C:/Users/Pichau/score-energy-verse/docs/tasks/003-mvp-persistence-layer.md)
- [docs/product/ai-development-rules.md](/C:/Users/Pichau/score-energy-verse/docs/product/ai-development-rules.md)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)

## Ativos Intelectuais

Os ativos intelectuais mais claros que ja existem no repositorio hoje sao:

- a jornada persistida do usuario, centrada em `MvpState`
- o modelo de score por eventos explicaveis
- a leitura de fatura como ancora de contexto e comparacao
- a Memoria Energetica como continuidade entre ciclos
- o papel educativo do mascote
- a separacao crescente entre memoria do sistema e conhecimento aprendido pelo usuario
- a arquitetura por adaptadores para persistencia, ranking e assistente
- o fallback local e consultivo do assistente, com Hermes como camada opcional

Esses ativos foram identificados porque aparecem ao mesmo tempo em documentacao de produto, codigo de dominio e camadas de interface.

## O que a Score nunca sera

Com base no repositorio atual, a Score claramente nao quer ser:

- apenas um dashboard estatico de contas e graficos
- um chatbot generico que improvisa resposta sem contexto
- um mascote decorativo sem responsabilidade real
- um sistema que promete economia exata sem evidencia
- um marketplace generico de leads sem contexto, tempo e confianca

Esse bloco foi consolidado a partir de:

- [docs/product/vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md)
- [docs/product/mascot-role.md](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md)
- [docs/product/ecosystem-triangle.md](/C:/Users/Pichau/score-energy-verse/docs/product/ecosystem-triangle.md)
- [src/lib/scoreAssistant/scoreSystemPrompt.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts)

## O que a Score esta construindo

O repositorio indica que a Score esta construindo:

- uma jornada energetica guiada e persistente
- uma camada de memoria que torna a proxima leitura menos generica
- um sistema de progresso explicavel por score
- um ecossistema em que leitura, orientacao, memoria e aprendizado deixam de ser partes soltas
- uma base para mediacao futura entre usuario, consultoria e oferta, sem abandonar o contexto real da jornada

Esse entendimento aparece de forma transversal em:

- [docs/product/vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md)
- [docs/product/ecosystem-triangle.md](/C:/Users/Pichau/score-energy-verse/docs/product/ecosystem-triangle.md)
- [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)
- [src/pages/LandingPage.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/LandingPage.tsx)

## Conceitos Fundamentais

Os conceitos mais recorrentes e mais consolidados hoje sao:

- fatura como ancora
- jornada
- score explicavel
- historico entre ciclos
- memoria energetica
- recomendacao contextual
- proxima acao clara
- honestidade sobre limite de evidencia

Os conceitos recorrentes, mas ainda menos sedimentados, sao:

- conhecimento energetico
- Nucleo como shell principal da experiencia
- Hermes como extensao assistiva da Score
- ecossistema triangular usuario-consultor-provedor

## Decisoes consolidadas

As decisoes abaixo parecem consolidadas porque aparecem repetidamente em implementacao e documentacao:

- manter uma fonte principal de verdade para a jornada do usuario
- derivar score de eventos validos em vez de armazenar um numero arbitrario
- separar escrita da jornada de leituras compartilhadas, como ranking
- preservar fallback local sempre que a infraestrutura externa nao estiver disponivel
- nao misturar recomendacao com causalidade nao comprovada
- tornar o sistema capaz de explicar o que aprendeu, o que observou e o que ainda nao sabe

## Conceitos ainda experimentais

Os pontos abaixo existem no repositorio, mas ainda nao parecem tao sedimentados quanto os principios acima:

- `Nucleo` como linguagem oficial e permanente da plataforma
- `Conhecimento Energetico` como segunda memoria institucional do produto, complementar a memoria energetica
- Hermes como parte estrutural do produto, e nao apenas camada opcional do assistente
- o papel operacional do triangulo usuario-consultoria-provedor

Esses pontos foram colocados aqui porque ja aparecem em codigo e documentos, mas ainda com concentracao maior em sprints recentes ou em direcao de produto, e menor repeticao historica.

## Reflection

### Conceitos que apareceram mais do que o esperado

- rastreabilidade
- honestidade sobre limite de evidencia
- continuidade entre ciclos
- recomendacao contextual
- memoria como diferencial do produto
- score como explicacao de progresso, nao apenas numero

### Documentos que parecem desatualizados ou em tensao

- [README.md](/C:/Users/Pichau/score-energy-verse/README.md) ainda descreve o fluxo ativo como sem extracao real de conteudo da fatura, mas o codigo e os testes atuais ja mostram parser real e preservacao de campos extraidos
- alguns documentos de `docs/tasks/` registram estados historicos importantes, mas nao devem ser lidos como retrato fiel do estado atual sem contexto de sprint
- [.score/nucleus/README.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/README.md) ainda trata o Nucleo como algo em maturacao; isso continua parcialmente verdadeiro, mas a implementacao recente aumentou sua presenca no produto

### Conflitos de filosofia identificados

- existe tensao entre "MVP deterministico e simples" e a evolucao real do parser para leitura mais concreta de faturas
- existe tensao entre "mascote educativo" e momentos do fluxo em que o mascote ainda acumula funcao de interface e orientacao operacional
- existe tensao entre "assistente opcional" e a tentacao de ampliar Hermes alem do papel de apoio contextual

### Documentos que deveriam nascer ou ser revisitados futuramente

- `.score/language/LANGUAGE.md` para consolidar termos como memoria, conhecimento, diagnostico, jornada e Nucleo
- `.score/ux/UX.md` para registrar principios recorrentes de clareza, um passo por vez e feedback nao invasivo
- `.score/engineering/ENGINEERING.md` conforme a fronteira entre Nucleo, mascote e assistente amadurecer mais algumas sprints
- `.score/nucleus/NUCLEUS.md` quando o conceito deixar de ser apenas shell recente e virar convencao mais estavel em produto e interface

### Conceitos que ainda precisam amadurecer antes de virar CORE permanente

- Nucleo como linguagem definitiva da plataforma
- Conhecimento Energetico como ativo tao central quanto Memoria Energetica
- a forma final do ecossistema triangular
- o lugar estrutural de Hermes dentro da proposta da Score
