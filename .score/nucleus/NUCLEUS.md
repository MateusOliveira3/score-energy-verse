# NUCLEUS

Este documento nao descreve telas.

Ele consolida o comportamento cognitivo que ja aparece repetidamente no repositorio: como a Score recebe contexto, transforma leitura em entendimento, guarda memoria util, separa conhecimento do usuario e prepara a proxima decisao.

Quando este documento usa a palavra `Nucleo`, ela significa contrato cognitivo da Score, nao layout.

## O que e o Nucleo

O Nucleo e a camada que organiza a jornada da Score em quatro movimentos recorrentes:

- observar a conta e o contexto disponivel
- relacionar sinais entre fatura, historico, perfil e habitos
- memorizar o que foi confirmado sem misturar isso com aprendizado do usuario
- orientar o proximo passo sem inventar causa nem trocar regras centrais

No repositorio, esse comportamento aparece de forma mais explicita em:

- [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)
- [src/hooks/useMvpJourney.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [docs/product/user-journey.md](/C:/Users/Pichau/score-energy-verse/docs/product/user-journey.md)

## Responsabilidades

O Nucleo ja se comporta no projeto como responsavel por:

- receber um estado resolvido da jornada
- transformar esse estado em leitura atual, historico, memoria, lacunas e orientacao
- separar o que a Score aprendeu sobre o usuario do que o usuario aprendeu com a Score
- manter a proxima decisao conectada a evidencias e ao contexto disponivel
- preparar contexto explicavel para mascote e assistente
- preservar continuidade entre ciclos

Ele nao parece ser responsavel por criar regras novas. Ele consolida e expoe o que as regras atuais ja produziram.

Evidencias principais:

- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts) resolve estado, acoes, score e jornada
- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts) transforma estado em memoria legivel
- [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts) reaproveita o mesmo contexto para explicacao

## Limites

O Nucleo nao e:

- o parser da fatura
- a regra de score
- o backend
- o layout do produto
- um chatbot livre
- um motor de causalidade
- o decisor final da vida do usuario

Na pratica, o Nucleo respeita limites claros:

- nao inventa dados ausentes
- nao promete economia exata sem base suficiente
- nao confunde acao observada com prova de causa
- nao substitui a escolha do usuario
- nao muda score, parser ou ranking para parecer mais inteligente

Evidencias:

- [src/lib/scoreAssistant/scoreSystemPrompt.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts)
- [docs/skills/score-energy/energy-memory.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-memory.md)
- [docs/skills/score-energy/energy-culture.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-culture.md)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)

## Entradas

As entradas cognitivas mais claras do Nucleo hoje sao:

- perfil conhecido do usuario
- respostas contextuais do mascote em `userContext.questions`
- sinais estruturados em `energyBehaviorProfile`
- fatura atual
- historico de faturas
- resumo de analise atual
- lista de proximas acoes e seus status
- eventos de score e estado derivado de score
- conhecimentos ja aprendidos
- timestamps de atividade e estagio da jornada

Essas entradas existem porque a Score pensa com base em estado persistido e normalizado, nao em interacoes isoladas.

Fontes:

- [src/types/mvp.ts](/C:/Users/Pichau/score-energy-verse/src/types/mvp.ts)
- [src/hooks/useMvpJourney.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts)
- [README.md](/C:/Users/Pichau/score-energy-verse/README.md)

## Processos Cognitivos

### Observa

O Nucleo observa quando recebe uma fatura e transforma a conta em fatos legiveis sem extrapolacao.

Hoje isso inclui:

- referencia do ciclo
- consumo
- valor total
- distribuidora
- bandeira
- vencimento
- sinais extraidos com confianca

Se os campos estiverem parciais, a observacao continua honesta e preserva ausencia segura.

Evidencias:

- [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)
- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [src/lib/invoiceParser.ts](/C:/Users/Pichau/score-energy-verse/src/lib/invoiceParser.ts)

### Relaciona

O Nucleo relaciona quando conecta a leitura atual com:

- historico entre ciclos
- perfil do usuario
- habitos confirmados
- acoes anteriores
- objetivo principal
- sinais de custo, consumo e horario

Essa relacao e conservadora. O projeto repete que comparar nao significa provar causa.

O Nucleo tambem usa a comparacao para decidir se:

- ja existe base para tendencia
- ainda falta outra fatura
- uma acao anterior pode entrar como memoria contextual

Evidencias:

- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts)

### Memoriza

O Nucleo memoriza quando um dado deixa de ser hipotese solta e passa a fazer parte do contexto reaproveitavel da jornada.

Hoje entram nessa memoria:

- dados de perfil
- sinais confirmados por respostas do usuario
- fatos lidos da fatura
- contexto confirmado pela analise
- comportamento observado na jornada
- acoes iniciadas ou testadas
- lacunas ainda abertas
- evidencias usadas para recomendacao

Memorizar nao significa "concluir mais". Significa "nao perder o que ja foi validado".

Evidencias:

- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- [docs/skills/score-energy/energy-memory.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-memory.md)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)

### Orienta

O Nucleo orienta quando transforma o estado atual em um proximo passo claro.

Essa orientacao pode ser:

- completar perfil
- enviar primeira fatura
- revisar o resumo pronto
- iniciar uma acao priorizada
- acompanhar a proxima fatura
- focar em um eixo de observacao antes de ampliar decisoes

Quando o contexto e insuficiente, a orientacao nao some. Ela recua para construcao de base.

Isso significa que a Score nao orienta "menos"; ela orienta de forma mais humilde.

Evidencias:

- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)
- [docs/product/mascot-role.md](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md)

## Memoria Energetica

Memoria Energetica, no repositorio atual, e o que a Score aprende sobre:

- a casa ou perfil de consumo
- as faturas ja vistas
- habitos confirmados
- interesses energeticos informados
- acoes ja observadas
- evidencias e lacunas da jornada

Ela existe para que a proxima leitura seja menos generica.

Ela nao deve:

- afirmar algo nao confirmado
- se confundir com conhecimento adquirido pelo usuario
- virar promessa de previsao

No modelo atual, Memoria Energetica inclui fatos, sinais confirmados, timeline, lacunas e base de recomendacao.

Fontes:

- [docs/skills/score-energy/energy-memory.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-memory.md)
- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- [src/lib/scoreAssistant/fallback.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/fallback.ts)

## Conhecimento Energetico

Conhecimento Energetico, no estado atual do projeto, e o que o usuario aprende com a Score e reconhece explicitamente como aprendido.

Ele:

- vem de um catalogo finito de conhecimentos
- depende de confirmacao explicita do usuario
- e persistido separadamente da memoria
- nao altera score, parser, diagnostico nem recomendacao por si so

Ao contrario da memoria, ele nao descreve o usuario. Ele descreve conteudos que o usuario ja incorporou.

Evidencias:

- [src/lib/energyKnowledge.ts](/C:/Users/Pichau/score-energy-verse/src/lib/energyKnowledge.ts)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [src/lib/scoreAssistant/fallback.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/fallback.ts)

## Diagnostico

No projeto atual, diagnostico nao e um bloco separado da jornada. Ele e o mecanismo de qualificar melhor a leitura quando ainda faltam sinais importantes.

Esse diagnostico acontece por:

- perguntas contextuais leves
- perguntas ligadas a acoes
- recomputacao de analise e proximas acoes depois que novas respostas entram

O diagnostico serve para aumentar contexto e confianca. Ele nao e um fim em si mesmo.

Evidencias:

- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [src/types/mvp.ts](/C:/Users/Pichau/score-energy-verse/src/types/mvp.ts)

## Orientacao

A orientacao do Nucleo sai em um pacote recorrente:

- titulo do proximo passo
- resumo do por que isso importa agora
- evidencia usada
- follow-up esperado
- status da acao

Ela existe para reduzir ambiguidade, nao para multiplicar caminhos.

A regra mais estavel encontrada no repositorio e:

`uma proxima acao por vez, com base explicavel`

Evidencias:

- [docs/product/mascot-role.md](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md)
- [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)
- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)

## Papel do Usuario

O usuario nao e tratado como receptor passivo.

No comportamento atual da Score, o usuario:

- fornece contexto
- envia a fatura
- responde perguntas que refinam a leitura
- escolhe se quer iniciar ou concluir uma acao
- confirma conhecimentos aprendidos
- continua sendo o decisor final

O Nucleo depende da participacao do usuario para ficar menos generico, mas nao pode transferir para ele a carga de montar a interpretacao sozinho.

## Papel da Score

No Nucleo atual, a Score:

- organiza estado disperso
- preserva memoria util
- separa fato, contexto, hipotese e lacuna
- prioriza um proximo passo
- explica score, leitura e limites
- mantem continuidade entre ciclos

Ela nao atua como autoridade infalivel. Atua como sistema consultivo e guiado.

## Papel do Assistente

O assistente, no repositorio atual, aparece como consumidor do Nucleo, nao como dono dele.

Seu papel e:

- explicar contexto ja disponivel
- transformar recomendacao em entendimento
- responder sem inventar dados
- reforcar memoria, lacunas e proxima acao

Seu papel nao e:

- criar regra de negocio
- substituir a jornada principal
- operar sem contexto da Score

Hermes e fallback local cumprem o mesmo papel funcional: ambos recebem contexto da Score e devolvem explicacao educativa. O Nucleo continua sendo a fonte.

Evidencias:

- [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts)
- [src/lib/scoreAssistant/scoreSystemPrompt.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts)
- [src/lib/scoreAssistant/fallback.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/fallback.ts)
- [docs/HERMES_SETUP_SCORE.md](/C:/Users/Pichau/score-energy-verse/docs/HERMES_SETUP_SCORE.md)

## Estados Cognitivos

Os estados cognitivos mais estaveis identificados hoje sao:

### 1. Base incompleta

O sistema ainda nao tem contexto suficiente para personalizar com honestidade.

Sinal pratico:

- perfil incompleto

### 2. Base pronta para observar

O sistema ja conhece o minimo do usuario, mas ainda nao recebeu conta real.

Sinal pratico:

- `before-upload`

### 3. Observacao em andamento

O sistema recebeu a fatura e esta processando ou consolidando leitura.

Sinal pratico:

- `invoice-uploaded`

### 4. Leitura contextual pronta

Ja existe resumo suficiente para explicar o momento atual.

Sinal pratico:

- `analysis-ready`

### 5. Comparacao ainda rasa

Ja existe leitura, mas o historico ainda nao basta para tendencia forte.

Sinal pratico:

- primeira fatura ou falta de ciclo comparavel

### 6. Comparacao ativa

Ja existe mais de um ciclo e o sistema consegue relacionar mudancas sem forcar causalidade.

### 7. Retomada

O sistema identifica que havia jornada previa e usa memoria existente para reabrir o ciclo sem reiniciar contexto.

Sinal pratico:

- `return-visit`

## O que entra no Nucleo

Entra no Nucleo tudo o que ajuda a responder estas perguntas:

- o que sabemos com seguranca agora
- o que mudou entre ciclos
- o que ainda falta saber
- qual e o passo mais util neste momento

Por isso entram:

- perfil
- faturas
- historico
- respostas contextuais
- sinais de comportamento
- acoes acompanhadas
- conhecimentos aprendidos
- score explicavel

## O que sai do Nucleo

Sai do Nucleo tudo o que ajuda a interface a representar a inteligencia da Score sem reinventar regra:

- leitura do ciclo atual
- relacao com historico
- memoria consolidada
- lacunas abertas
- orientacao do proximo passo
- contexto explicavel para mascote
- contexto explicavel para assistente
- progresso visivel do score

## O que o usuario nunca deve perceber

O usuario nao precisa perceber os mecanismos internos que servem apenas para manter consistencia.

Hoje, devem permanecer invisiveis:

- normalizacao de estado antes de exibir a jornada
- deduplicacao e validacao de score events
- reconciliacao entre acoes persistidas e acoes recalculadas
- reidratacao de campos da fatura a partir do parser
- escolha entre Hermes e fallback local
- heuristica interna de prioridade para sugerir conhecimento

O usuario deve perceber o resultado explicavel dessas decisoes, nao a mecanica.

## Principios permanentes

Os principios cognitivos mais permanentes encontrados ate aqui sao:

- entendimento vem antes de recomendacao
- contexto real vale mais que resposta generica
- memoria e conhecimento nao sao a mesma coisa
- score explica progresso, nao substitui leitura
- cada ciclo deve deixar a proxima leitura menos cega
- a melhor orientacao e curta, clara e apoiada em evidencia
- lacunas devem ser expostas com honestidade
- a Score prepara decisoes; o usuario continua decidindo

## Conceitos ainda experimentais

Alguns pontos ja existem, mas ainda nao parecem totalmente consolidados como contrato permanente:

- `Nucleo` como nome definitivo dessa arquitetura cognitiva
- a extensao exata de `Conhecimento Energetico` dentro do produto
- a fronteira final entre mascote e assistente
- o peso estrutural de Hermes no ecossistema da Score

## Reflection

### Existe algum comportamento repetido que ainda esta espalhado?

Sim. A logica de explicar limites, evidencias e proximo passo aparece em varias camadas: jornada, assistente, memoria e view-models. O comportamento e consistente, mas ainda distribuido.

### Existem conceitos duplicados entre Memoria e Conhecimento?

Sim, em linguagem superficial eles se encostam, porque ambos falam de aprendizado. Mas o codigo atual ainda preserva uma diferenca clara:

- memoria = o que a Score aprende sobre o usuario e a jornada
- conhecimento = o que o usuario aprendeu com a Score

Essa fronteira ja existe, mas ainda precisa amadurecer como linguagem oficial.

### Existe alguma responsabilidade mal definida?

Sim. A fronteira entre mascote, assistente e Nucleo ainda nao esta totalmente estabilizada. O Nucleo parece ser a fonte cognitiva; o mascote e o assistente parecem ser superficies de explicacao. Isso ja aparece no repositorio, mas ainda nao esta documentado de forma definitiva fora deste documento.

### O assistente esta assumindo responsabilidades que deveriam ser do Nucleo?

Hoje, em geral nao. O assistente consome contexto montado pela Score e o explica. O risco futuro existe se Hermes passar a improvisar orientacoes fora do contexto resolvido da jornada.

### Alguma decisao arquitetural precisa migrar para ENGINEERING futuramente?

Sim. Estes pontos parecem mais de engenharia do que de Nucleo e devem migrar depois:

- normalizacao e reidratacao do estado da jornada
- adaptadores de persistencia e ranking
- BFF do assistente e fallback Hermes
- reconciliacao entre acoes recalculadas e status persistidos
- deduplicacao e validacao de score events
