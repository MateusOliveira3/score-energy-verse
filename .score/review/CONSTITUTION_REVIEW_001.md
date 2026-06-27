# CONSTITUTION REVIEW 001

## Resumo Executivo

Nota geral de coerencia: **8.4 / 10**

Resposta curta: **sim, a Score continua coerente com a propria identidade**, e isso ja pode ser provado por codigo, produto, linguagem e arquitetura. O repositorio ainda preserva os pilares mais importantes: fatura como ancora, entendimento antes de recomendacao, score explicavel, memoria como ativo, assistente contextual e evolucao incremental com estabilidade.

A coerencia, porem, ainda nao e perfeita. As principais tensoes nao estao no dominio central. Elas aparecem em tres zonas:

- documentacao institucional e operacional que ficou parcialmente desatualizada
- mistura excessiva de responsabilidades dentro do ecossistema visual do mascote
- exposicao de termos internos em superficies que deveriam parecer mais humanas e menos tecnicas

Em outras palavras: **a identidade da Score esta viva**, mas parte da sua constituicao ainda depende de consolidacao institucional para nao voltar a se fragmentar.

## Filosofia

Nota: **8.8 / 10**

Comentarios:

- O `CORE` representa corretamente a empresa na maior parte do tempo. O produto continua se posicionando como jornada guiada, nao como dashboard, e isso e sustentado por [docs/product/vision.md](/C:/Users/Pichau/score-energy-verse/docs/product/vision.md:67), [src/pages/LandingPage.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/LandingPage.tsx:74) e [src/pages/Index.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/Index.tsx:429).
- A filosofia de "entendimento antes de recomendacao" continua viva no assistente e na jornada, especialmente em [src/lib/scoreAssistant/scoreSystemPrompt.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts:15) e [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts:2777).
- O que ainda falta consolidar oficialmente e a linguagem permanente que separa memoria, conhecimento, diagnostico, mascote, Nucleo e assistente. Essa lacuna ja foi percebida pelo proprio `CORE`, mas ainda nao virou documento definitivo.
- Ha uma incoerencia interna na propria `.score`: o bloco de reflexao do `CORE.md` ainda fala de `ENGINEERING.md` e `NUCLEUS.md` como documentos futuros, embora eles ja existam hoje em [.score/brain/CORE.md](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md:296).

## Nucleo

Nota: **8.2 / 10**

Comentarios:

- O Nucleo ja funciona mais como cerebro do que como layout. Isso fica claro porque [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts:231) recebe estado resolvido e apenas organiza leitura de `observa`, `relaciona`, `memoriza` e `orienta`, sem alterar parser, score ou recomendacao.
- A separacao entre Memoria Energetica e Conhecimento Energetico esta boa e hoje e visivel em [src/components/MemoryPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx:56) e [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts:476).
- Hermes respeita o papel esperado. O contexto continua sendo montado pela Score em [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts:30), e o prompt explicita que o assistente nao deve inventar dados em [src/lib/scoreAssistant/scoreSystemPrompt.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts:5).
- A principal tensao e que o ecossistema do mascote ainda nao esta completamente separado do restante da interface. O mesmo componente [src/components/DynamicContextPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/DynamicContextPanel.tsx:544) continua hospedando `Aprendizado Energetico`, `Voce sabia?`, historico, acoes, resumo e perfil. Isso enfraquece a fronteira institucional entre mascote, leitura e acoes.

## Engenharia

Nota: **8.7 / 10**

Comentarios:

- `ENGINEERING.md` representa bem o codigo atual. O padrao real do repositorio continua sendo: dominio em `src/lib`, hooks como orquestradores, services com contracts e adapters, fallback seguro e view-models read-only.
- O codigo segue isso de forma consistente em [src/hooks/useMvpJourney.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts:1), [src/services/mvpJourney/contracts.ts](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney/contracts.ts:1), [src/services/mvpJourney/localAdapter.ts](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney/localAdapter.ts:1) e [src/services/mvpJourney/supabaseAdapter.ts](/C:/Users/Pichau/score-energy-verse/src/services/mvpJourney/supabaseAdapter.ts:1).
- Os view-models continuam reorganizando informacao, nao recriando regra, especialmente em [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts:231) e [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts:30).
- O principal ponto de atencao de engenharia e concentracao excessiva de responsabilidade em [src/components/DynamicContextPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/DynamicContextPanel.tsx:544). Ele nao quebra a arquitetura, mas ja virou fronteira densa demais entre UX, aprendizado, acoes, historico e diagnostico.
- Tambem existe ruido estrutural leve com legado recente ainda presente, como [src/components/LiveMascotJourney.tsx](/C:/Users/Pichau/score-energy-verse/src/components/LiveMascotJourney.tsx:251), que continua no repositorio mesmo depois da adocao do Nucleo como shell principal.

## UX

Nota: **8.0 / 10**

Comentarios:

- O produto continua ensinando mais do que antes. Landing, Nucleo e painel de memoria deixam visivel o valor da Score em vez de esconder tudo em widgets.
- A landing ja comunica bem que a Score nao quer ser dashboard frio, em [src/pages/LandingPage.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/LandingPage.tsx:74).
- O `/perfil` tambem ficou mais coerente com a proposta de jornada guiada via [src/components/nucleo/NucleoShell.tsx](/C:/Users/Pichau/score-energy-verse/src/components/nucleo/NucleoShell.tsx:124).
- A maior contradicao de UX e que o conteudo educativo do mascote ainda nao esta isolado o suficiente. Hoje `Voce sabia?`, `Conhecimento adquirido` e `Aprendizado Energetico` continuam misturados a views de resumo, historico, acoes e perfil dentro de [src/components/DynamicContextPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/DynamicContextPanel.tsx:102).
- O produto ensina, mas em alguns pontos ainda pede que o usuario entenda a organizacao interna da Score, em vez de simplesmente sentir a jornada.

## Linguagem

Nota: **7.6 / 10**

Comentarios:

- A maior parte da linguagem continua humana, educativa e prudente. Isso aparece no mascote, no assistente e nas recomendacoes.
- O problema nao esta no tom principal. Esta nos vazamentos de linguagem tecnica ou meta-operacional.
- O assistente ainda mostra termos internos como `Hermes-ready`, `fallback seguro`, `Base usada` e `Modo da resposta` em [src/pages/Assistant.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/Assistant.tsx:166), [src/pages/Assistant.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/Assistant.tsx:275) e [src/pages/Assistant.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/Assistant.tsx:282). Isso ajuda auditoria tecnica, mas enfraquece a naturalidade da experiencia do usuario.
- Ainda ha mistura desnecessaria de portugues com termos institucionais em ingles, como `Memory Visibility` em [src/components/MemoryPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx:52).
- Ja existe evidencia suficiente para consolidar um documento institucional de linguagem, porque os termos centrais ja se repetem muito e hoje precisam de padronizacao oficial.

## Arquitetura

Nota: **8.5 / 10**

Comentarios:

- A arquitetura continua coerente com a identidade da empresa: contracts, adapters, fallback, BFF para Hermes e dominio explicavel.
- Parser, score, ranking, persistencia e assistente seguem responsabilidades distintas, o que preserva estabilidade.
- O parser real existe e esta ativo em [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts:568) usando [src/lib/invoiceParser.ts](/C:/Users/Pichau/score-energy-verse/src/lib/invoiceParser.ts:1560).
- Hermes continua corretamente isolado por BFF, conforme [docs/HERMES_SETUP_SCORE.md](/C:/Users/Pichau/score-energy-verse/docs/HERMES_SETUP_SCORE.md:20).
- O maior risco arquitetural nao e de dominio. E de concentracao de UX num unico componente e de documentacao desatualizada dando uma fotografia antiga da arquitetura real.

## Produto

Nota: **8.6 / 10**

Comentarios:

- O posicionamento da Score esta claro: nao e so plataforma de leitura; e jornada de inteligencia energetica baseada em contexto, memoria, orientacao e evolucao.
- Score, Memoria Energetica, Conhecimento Energetico, mascote e assistente ja formam um ecossistema reconhecivel.
- O produto ainda fortalece cultura energetica. Nao ficou reduzido a organizacao de informacoes.
- O principal risco de produto hoje e a fragmentacao sutil de papeis dentro da interface, nao a perda do posicionamento.

# Contradicoes encontradas

## Alta

- **README institucional-operacional desatualizado sobre capacidades reais do produto.** O `README.md` ainda afirma que o MVP nao parseia conteudo real da fatura e que a analise depende de metadados do arquivo em [README.md](/C:/Users/Pichau/score-energy-verse/README.md:245) e [README.md](/C:/Users/Pichau/score-energy-verse/README.md:561), mas o codigo atual ja usa parser real em [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts:568) e [src/lib/invoiceParser.ts](/C:/Users/Pichau/score-energy-verse/src/lib/invoiceParser.ts:1560). Isso distorce a memoria institucional sobre um pilar central da Score: a leitura da fatura.

## Media

- **O ecossistema do mascote ainda nao esta institucionalmente isolado.** O componente [src/components/DynamicContextPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/DynamicContextPanel.tsx:544) concentra `Voce sabia?`, `Aprendizado Energetico`, `Conhecimento adquirido`, historico, perfil, acoes e resumo. Isso contradiz parcialmente a separacao defendida nas sprints de consolidacao do mascote.
- **A propria `.score` ja possui reflexoes desatualizadas.** O `CORE.md` ainda registra `ENGINEERING.md` e `NUCLEUS.md` como futuros documentos em [.score/brain/CORE.md](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md:296), o que mostra que a memoria institucional ainda precisa de manutencao pos-consolidacao.
- **O assistente ainda vaza linguagem interna demais para a interface.** `Hermes-ready`, `fallback seguro`, `Modo da resposta` e `Base usada` aparecem para o usuario final em [src/pages/Assistant.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/Assistant.tsx:166), [src/pages/Assistant.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/Assistant.tsx:275) e [src/pages/Assistant.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/Assistant.tsx:282).
- **O README tambem omite parte da superficie atual.** Ele lista as rotas existentes, mas a aplicacao real ja inclui `/assistente` em [src/App.tsx](/C:/Users/Pichau/score-energy-verse/src/App.tsx:63). Isso e menor que o ponto do parser, mas reforca que o retrato institucional do sistema esta atrasado.

## Baixa

- **Mistura de idioma institucional.** `Memory Visibility` ainda aparece em [src/components/MemoryPanel.tsx](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx:52), enquanto o restante da camada de produto vem amadurecendo em portugues.
- **Codigo legado conceitual ainda presente.** [src/components/LiveMascotJourney.tsx](/C:/Users/Pichau/score-energy-verse/src/components/LiveMascotJourney.tsx:251) permanece no repositorio mesmo com o Nucleo ja assumindo o shell principal. Nao gera regressao funcional imediata, mas aumenta ambiguidade conceitual.

# Decisoes consolidadas

Os principios abaixo ja podem ser considerados permanentes com boa seguranca:

- a fatura continua sendo a ancora principal de confianca e contexto
- entendimento vem antes de recomendacao
- score deve ser explicavel por eventos, nao por numero arbitrario
- memoria energetica e ativo estrutural do produto
- conhecimento energetico e camada distinta da memoria
- a jornada deve criar continuidade entre ciclos
- a arquitetura deve preservar contratos e adapters antes de trocar infraestrutura
- fallback seguro faz parte da engenharia oficial
- Hermes e camada assistiva, nao dona da regra de negocio
- a Score nao quer parecer dashboard generico nem chatbot generico

# Recomendacoes

## Documentos da `.score` que deveriam nascer agora

- **`LANGUAGE.md`**: ja existe evidencia suficiente. Os termos centrais repetem demais e hoje precisam de padrao oficial.
- **`UX.md`**: ja ha repeticao suficiente de principios como "1 foco por vez", feedback curto, explicacao antes de pedido e separacao entre memoria, conhecimento, diagnostico e mascote.

## Documentos que ainda devem esperar

- **`DESIGN.md`**: ainda ha refatoracao visual recente demais. O desenho institucional parece promissor, mas ainda jovem para virar constituicao.
- **`COMPONENTS.md`**: ainda seria cedo; a composicao visual ainda esta se reorganizando.
- **`GOVERNANCE.md`**: ainda faltam sinais mais recorrentes de governanca de decisao alem do que ja esta no ciclo de sprint e reflection.

## Documentos que precisam de manutencao antes de expandir a `.score`

- [README.md](/C:/Users/Pichau/score-energy-verse/README.md:245)
- [.score/brain/CORE.md](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md:296)

# Roadmap sugerido

Somente evolucao institucional, sem propor funcionalidades:

1. atualizar os documentos que hoje descrevem uma Score antiga
2. consolidar `LANGUAGE.md`
3. consolidar `UX.md`
4. revisar `CORE.md`, `NUCLEUS.md` e `ENGINEERING.md` depois da criacao de `LANGUAGE.md` para alinhar terminologia
5. decidir se o ecossistema do mascote ja esta maduro o suficiente para um documento proprio de experiencia ou se ainda deve amadurecer dentro de `UX.md`

# Resposta final da auditoria

A Score e diferente porque ja nao organiza apenas dados energeticos.

Ela:

- observa a fatura com contexto
- transforma leitura em jornada
- guarda memoria util entre ciclos
- ensina o usuario sem depender de IA generica
- orienta a proxima decisao com limites explicitos

Hoje essa diferenca **ja esta no produto e na arquitetura**. O que ainda falta e garantir que a memoria institucional acompanhe com a mesma precisao a velocidade com que o produto amadureceu.
