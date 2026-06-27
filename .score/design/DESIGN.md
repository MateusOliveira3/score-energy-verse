# Design Cognitivo da Score Energy

## Manifesto

O design da Score Energy, como aparece hoje no repositorio, nao existe para ornamentar uma plataforma de leitura de faturas. Ele existe para tornar visivel uma inteligencia energetica guiada.

A interface da Score se comporta de forma recorrente como uma camada de traducao entre complexidade e entendimento: recebe conta, organiza sinais, preserva memoria util, registra aprendizado e aponta um proximo passo claro. O design nao cria esse comportamento. O design torna esse comportamento perceptivel.

Esse padrao aparece de forma repetida em [CORE](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md), [NUCLEUS](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md), [ENGINEERING](/C:/Users/Pichau/score-energy-verse/.score/engineering/ENGINEERING.md), [LandingPage](/C:/Users/Pichau/score-energy-verse/src/pages/LandingPage.tsx), [NucleoShell](/C:/Users/Pichau/score-energy-verse/src/components/nucleo/NucleoShell.tsx), [MemoryPanel](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx) e [Assistant](/C:/Users/Pichau/score-energy-verse/src/pages/Assistant.tsx).

## Filosofia Visual

A filosofia visual mais recorrente da Score pode ser resumida assim:

- a pessoa nao deve sentir que abriu um dashboard; deve sentir que entrou em uma jornada guiada
- a pessoa nao deve ser empurrada para interpretar dados sozinha; a Score interpreta antes
- a pessoa nao deve perceber infraestrutura; deve perceber entendimento, contexto e prudencia
- a pessoa nao deve ver memoria e conhecimento como a mesma coisa; cada camada precisa ser reconhecivel

Esse padrao aparece explicitamente em [docs/product/vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md), na landing atual e na reorganizacao recente do `/perfil`, que desloca os detalhes para segundo plano enquanto o Nucleo conduz a experiencia.

## A Inteligencia Visivel

A Score comunica inteligencia quando transforma dados conhecidos em sentido util.

Ela faz isso, de forma recorrente, por cinco movimentos visiveis:

1. ancora a experiencia em fatos concretos da fatura
2. relaciona a leitura com historico, perfil e sinais respondidos
3. separa o que aprendeu sobre o usuario do que ensinou ao usuario
4. explicita o que ainda nao sabe
5. reduz o proximo passo a uma acao compreensivel

O design cognitivo da Score, portanto, nao trata inteligencia como volume de dados exibidos. Trata inteligencia como qualidade de organizacao, contexto e explicacao.

## O Papel do Nucleo

O Nucleo aparece no repositorio como a principal traducao visual do comportamento cognitivo da Score. Ele nao e um layout arbitrario. Ele organiza a experiencia nos movimentos `observa`, `relaciona`, `memoriza` e `orienta`, como fica explicito em [nucleoSession](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts) e [NucleoShell](/C:/Users/Pichau/score-energy-verse/src/components/nucleo/NucleoShell.tsx).

Quando o Nucleo aparece corretamente, a pessoa entende que:

- primeiro a Score le a conta
- depois ela conecta sinais
- depois ela guarda contexto util
- so entao ela orienta

O Nucleo nao deve parecer um carrossel de cards nem um resumo executivo generico. Ele deve parecer uma sessao de entendimento progressivo.

## O Papel da Interface

A interface da Score existe para reduzir carga interpretativa.

No repositorio atual, esse papel aparece assim:

- apresentar significado antes de detalhe
- manter detalhes completos acessiveis, mas secundarios
- explicar por que uma recomendacao existe
- usar memoria e historico para evitar repeticao burra
- preservar ausencia segura quando ainda falta contexto

Em [Index](/C:/Users/Pichau/score-energy-verse/src/pages/Index.tsx), isso aparece de forma explicita: "o Nucleo guia a jornada; os detalhes ficam aqui". Esse padrao mostra que a interface principal da Score deve conduzir; os paineis complementares devem aprofundar.

## O Papel do Assistente

O assistente da Score nao aparece como protagonista livre. Ele aparece como extensao explicativa do contexto ja resolvido pela jornada.

Padroes recorrentes:

- responde como Score, nao como engine ou infraestrutura
- usa Memoria Energetica, leitura atual e proximo passo
- admite quando ainda falta contexto
- prioriza entendimento antes de recomendacao
- evita improviso, causalidade inventada e tom de chatbot generico

Esses comportamentos aparecem em [Assistant](/C:/Users/Pichau/score-energy-verse/src/pages/Assistant.tsx), [scoreSystemPrompt](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts), [fallback](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/fallback.ts) e [docs/skills/score-energy/energy-culture.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-culture.md).

## O Papel do Mascote

O mascote aparece de forma cada vez mais consolidada como guia educativo, nao como marca decorativa e nao como container de qualquer conteudo solto.

Padroes recorrentes:

- o mascote ensina
- o mascote concentra curiosidade e aprendizado
- o mascote nao deve competir com score, diagnostico ou memoria
- o mascote nao deve carregar leitura tecnica da fatura
- o mascote nao deve virar chatbot

Isso esta explicitado em [docs/product/mascot-role.md](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md), [LiveMascotJourney](/C:/Users/Pichau/score-energy-verse/src/components/LiveMascotJourney.tsx) e nas sprints recentes que moveram conhecimento energetico e "voce sabia?" para o ecossistema do mascote.

## Informacao

Na Score, informacao nunca deve aparecer como bloco neutro.

A informacao correta:

- vem ancorada na fatura
- aparece em linguagem compreensivel
- traz contexto suficiente para nao parecer numero solto
- se conecta com evidencias e comparacoes honestas
- serve a leitura atual ou a proxima decisao

O repositorio repete diversas vezes a ideia de que leitura, observacao e comparacao importam mais do que volume de metricas. Esse padrao aparece em [mvpCoreFlow](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts), [mvpJourneyState](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts), [DynamicContextPanel](/C:/Users/Pichau/score-energy-verse/src/components/DynamicContextPanel.tsx) e [Ranking](/C:/Users/Pichau/score-energy-verse/src/pages/Ranking.tsx).

## Contexto

Contexto, no design da Score, vem antes de interpretacao final.

Isso significa que a interface deve deixar perceptivel:

- qual fatura esta em foco
- qual historico existe
- qual perfil foi informado
- quais sinais ja foram confirmados
- quais lacunas ainda existem

A Score nao depende de mostrar tudo ao mesmo tempo. Ela depende de mostrar o bastante para a pessoa confiar que a leitura tem base real.

## Aprendizado

Aprendizado aparece no repositorio como uma experiencia separada do diagnostico.

Conhecimento Energetico nao e:

- score
- memoria sobre o usuario
- recomendacao
- gamificacao paralela

Conhecimento Energetico e o que o usuario aprendeu com a Score e incorporou na jornada. Esse principio aparece em [energyKnowledge](/C:/Users/Pichau/score-energy-verse/src/lib/energyKnowledge.ts), [MemoryPanel](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx), [DynamicContextPanel](/C:/Users/Pichau/score-energy-verse/src/components/DynamicContextPanel.tsx) e [LiveMascotJourney](/C:/Users/Pichau/score-energy-verse/src/components/LiveMascotJourney.tsx).

Visualmente, aprendizado deve parecer conquista discreta e acumulativa, nunca gamificacao vazia.

## Decisao

A Score trata decisao como desdobramento da leitura, nao como pressao comercial nem promessa de economia imediata.

Quando a decisao aparece corretamente, ela:

- tem um foco claro
- nasce de evidencias legiveis
- respeita o contexto disponivel
- admite quando ainda precisa de mais observacao
- aponta um proximo passo observavel

Isso aparece repetidamente em `next actions`, nos textos do assistente e no proprio Nucleo, especialmente no beat `orienta`.

## Memoria

Memoria Energetica, do ponto de vista visual, deve parecer contexto reaproveitavel e confiavel.

Ela precisa comunicar que:

- a Score lembra sinais confirmados
- a Score separa fato de hipotese
- a memoria melhora leituras futuras
- a memoria nao e escrita livre nem IA inventando perfil
- memoria parcial continua sendo memoria honesta

Esse padrao esta muito claro em [energy-memory.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-memory.md) e [MemoryPanel](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx).

## Conhecimento

Conhecimento Energetico, do ponto de vista visual, deve parecer repertorio adquirido.

Ele comunica que:

- o usuario nao apenas usa a Score; ele aprende com ela
- esse aprendizado e persistido
- ele pode reaparecer como contexto leve
- ele nao redefine score nem diagnostico

Quando bem apresentado, o usuario entende rapidamente a diferenca entre:

- "o que a Score aprendeu sobre mim"
- "o que eu aprendi com a Score"

Essa separacao ja esta consolidada no produto atual e precisa permanecer visivel.

## Progressao

A progressao da Score nao e apenas pontuacao. Ela e acumulacao de contexto, historico, memoria, conhecimento e clareza de acao.

O score ajuda a dar continuidade, mas a percepcao de evolucao depende de outros sinais:

- mais de uma fatura no historico
- comparacao entre ciclos
- memoria mais rica
- conhecimento aprendido
- acao testada
- proximo ciclo mais legivel

Essa visao aparece em [CORE](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md), [Ranking](/C:/Users/Pichau/score-energy-verse/src/pages/Ranking.tsx), [LiveMascotJourney](/C:/Users/Pichau/score-energy-verse/src/components/LiveMascotJourney.tsx) e [NucleoShell](/C:/Users/Pichau/score-energy-verse/src/components/nucleo/NucleoShell.tsx).

## Transparencia

Transparencia, na Score, nao significa expor infraestrutura. Significa expor limites.

A interface deve deixar claro quando:

- ainda falta contexto
- ainda nao ha historico suficiente
- a memoria esta rasa
- a recomendacao e prudente, nao conclusiva
- a comparacao ainda nao prova causa

Esse principio aparece repetidamente em textos como "ainda falta historico", "sem inventar dados", "ausencia segura" e "vale observar o proximo ciclo".

## Principios Consolidados

### 1. Entendimento vem antes de recomendacao

Evidencia recorrente em [CORE](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md), [CONSTITUTION_REVIEW_001](/C:/Users/Pichau/score-energy-verse/.score/review/CONSTITUTION_REVIEW_001.md), [scoreSystemPrompt](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts) e no shell do Nucleo.

### 2. A fatura e a ancora de confianca

Evidencia recorrente em [vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md), [NUCLEUS](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md), [NucleoShell](/C:/Users/Pichau/score-energy-verse/src/components/nucleo/NucleoShell.tsx) e fluxos de leitura.

### 3. A Score precisa parecer jornada, nao dashboard

Evidencia recorrente em [LandingPage](/C:/Users/Pichau/score-energy-verse/src/pages/LandingPage.tsx), [vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md), [Index](/C:/Users/Pichau/score-energy-verse/src/pages/Index.tsx) e [CONSTITUTION_REVIEW_001](/C:/Users/Pichau/score-energy-verse/.score/review/CONSTITUTION_REVIEW_001.md).

### 4. Memoria e conhecimento precisam ser distinguidos visualmente

Evidencia recorrente em [MemoryPanel](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx), [DynamicContextPanel](/C:/Users/Pichau/score-energy-verse/src/components/DynamicContextPanel.tsx), [NUCLEUS](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md) e sprints recentes de visibilidade e feedback.

### 5. O mascote ensina; nao centraliza todo o produto

Evidencia recorrente em [mascot-role.md](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md), [CORE](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md) e [LiveMascotJourney](/C:/Users/Pichau/score-energy-verse/src/components/LiveMascotJourney.tsx).

### 6. O assistente explica contexto; nao substitui a jornada

Evidencia recorrente em [Assistant](/C:/Users/Pichau/score-energy-verse/src/pages/Assistant.tsx), [fallback](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/fallback.ts) e [NUCLEUS](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md).

### 7. O design deve esconder complexidade e mostrar criterio

Evidencia recorrente em [ENGINEERING](/C:/Users/Pichau/score-energy-verse/.score/engineering/ENGINEERING.md), [Index](/C:/Users/Pichau/score-energy-verse/src/pages/Index.tsx), [NucleoShell](/C:/Users/Pichau/score-energy-verse/src/components/nucleo/NucleoShell.tsx) e na adaptacao de view-models.

### 8. Cada dado exibido precisa melhorar uma decisao, uma leitura ou um aprendizado

Evidencia recorrente em [vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md), [energy-culture.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-culture.md), [DynamicContextPanel](/C:/Users/Pichau/score-energy-verse/src/components/DynamicContextPanel.tsx) e [Ranking](/C:/Users/Pichau/score-energy-verse/src/pages/Ranking.tsx).

## Anti-padroes

Os anti-padroes mais claros encontrados no projeto sao:

- dashboard generico sem narrativa de jornada
- chatbot protagonista que improvisa sem contexto
- mascote decorativo ou usado como deposito de conteudo heterogeneo
- metricas sem interpretacao
- score sem explicacao de progresso
- memoria misturada com conhecimento
- paineis grandes sem responsabilidade clara
- gamificacao paralela sem relacao com decisao energetica
- recomendacao mostrada antes de leitura suficiente
- linguagem de infraestrutura aparecendo para o usuario

Esses anti-padroes nao foram inferidos por preferencia estetica. Eles aparecem como riscos combatidos diretamente pelo repositorio, especialmente nas auditorias institucionais, no CORE e nas sprints de reorganizacao do mascote, memoria e conhecimento.

## Conceitos ainda experimentais

Alguns conceitos aparecem com direcao clara, mas ainda parecem em consolidacao:

- o limite exato entre ecossistema do mascote e paineis secundarios ainda depende de maturacao adicional de UX
- o grau ideal de protagonismo visual do assistente versus do Nucleo ainda esta sendo calibrado
- a melhor forma de apresentar conhecimento adquirido sem parecer gamificacao ainda esta amadurecendo
- algumas responsabilidades ainda convivem parcialmente em componentes amplos, especialmente em areas contextuais antigas

Esses pontos nao contradizem a filosofia principal, mas ainda nao parecem tao permanentes quanto os pilares centrais.

## Reflection

Durante esta investigacao, os principios que mais apareceram foram:

- entendimento antes de recomendacao
- jornada antes de dashboard
- contexto antes de conclusao
- memoria como ativo estrutural
- conhecimento como camada distinta
- mascote como guia educativo
- transparencia de limite em vez de exibicao de complexidade

Algumas telas e componentes ainda carregam tensoes residuais:

- certos paineis contextuais ainda acumulam responsabilidades demais
- o ecossistema do mascote ja tem direcao institucional clara, mas ainda convive com herancas de layout anteriores
- partes do assistente ainda exigem vigilancia constante para nao deixar escapar linguagem operacional

As decisoes visuais que mais parecem permanentes hoje sao:

- ancora na fatura
- organizacao por jornada
- separacao entre memoria e conhecimento
- next action clara
- contexto exposto com prudencia

As decisoes que ainda parecem experimentais sao:

- formato final do hub do mascote
- densidade ideal dos paineis secundarios
- grau de ritualizacao da progressao de conhecimento
