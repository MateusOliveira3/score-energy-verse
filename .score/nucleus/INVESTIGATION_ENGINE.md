# Investigation Engine

## Objetivo

Consolidar o mecanismo logico que ja aparece no projeto para responder uma pergunta central:

**como a Score escolhe a proxima pergunta sem perguntar por curiosidade?**

Este documento nao descreve React, prompts ou modelos. Ele descreve o contrato cognitivo que ja existe entre jornada, memoria, diagnostico e orientacao.

Fontes principais desta descoberta:

- [src/lib/mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts)
- [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
- [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md)

## Pergunta Central

A Score escolhe a proxima pergunta quando encontra uma lacuna que:

- reduz incerteza relevante
- melhora uma leitura atual da conta
- aumenta a qualidade da proxima recomendacao
- evita repetir perguntas no futuro
- cabe no momento atual da jornada

Se a lacuna nao melhora nada importante, a pergunta nao deveria nascer.

Essa logica aparece de forma repetida em dois mecanismos atuais do repositorio:

1. perguntas contextuais da jornada, hoje concentradas no fluxo do mascote em [mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
2. perguntas adaptativas ligadas a acoes e diagnostico em [mvpCoreFlow.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)

## Tipos de Informacao

No estado atual do projeto, a investigacao trabalha sobre grupos de informacao relativamente estaveis.

### 1. Perfil e residencia

- tipo de consumidor
- localizacao
- tamanho do imovel
- quantidade de pessoas
- preferencia energetica

### 2. Equipamentos e cargas

- quantidade de chuveiros
- existencia de chuveiro eletrico
- existencia de ar-condicionado
- existencia de geladeira, freezer ou carga fixa extra

### 3. Habitos e rotina

- frequencia de lavanderia
- uso de cargas pesadas a noite
- periodo dominante de uso
- intensidade entre 18h e 22h
- presenca da casa no fim da tarde/noite
- intensidade de uso de climatizacao
- sensibilidade termica do imovel

### 4. Intencoes e preferencia de decisao

- interesse em conforto termico
- interesse em analise solar
- abertura para consultoria
- objetivo principal da jornada

### 5. Fatura e historico

- leitura da fatura atual
- historico de faturas
- comparacao entre ciclos
- sinais recorrentes entre contas

### 6. Jornada e acoes

- acao atual sugerida
- acoes iniciadas, vistas ou concluidas
- respostas contextuais ja dadas
- progresso da investigacao por ciclo

### 7. Conhecimento energetico

- conhecimentos educativos ja reconhecidos pelo usuario

Esse ultimo grupo nao descreve o usuario. Ele descreve o que o usuario ja aprendeu.

## Estados da Informacao

O projeto atual nao possui um unico enum institucional para estados cognitivos. Mesmo assim, o comportamento repetido do codigo mostra estados claros.

### Estados explicitamente presentes

- **ausente**: ainda nao existe dado suficiente
- **respondida**: o usuario informou a resposta
- **ignorada**: a pergunta foi dispensada naquele contexto
- **observada**: o sistema encontrou sinal na fatura, no historico ou na analise
- **aprendida**: o usuario confirmou um conhecimento energetico
- **lacuna aberta**: o sistema reconhece que ainda nao sabe algo importante

### Estados implicitamente presentes

- **hipotese ativa**: existe suspeita util, mas ainda nao ha confirmacao suficiente
- **confirmada para reutilizacao**: o dado passou a ser usado como memoria reaproveitavel
- **relevancia baixa no momento**: a lacuna existe, mas nao vale virar pergunta agora

### O que ainda nao esta modelado de forma institucional

Estados como `contraditoria` ou `desatualizada` fazem sentido conceitualmente, mas hoje ainda nao aparecem como estado explicito consolidado no repositorio. O comportamento atual resolve isso mais por reforco, substituicao de contexto ou reabertura de lacuna do que por uma maquina de estados formal.

## Como Nasce uma Pergunta

A pergunta nasce quando a Score identifica uma lacuna com consequencia pratica.

No mecanismo atual, isso acontece assim:

1. a Score observa o momento da jornada e a acao em foco
2. ela identifica quais categorias mais importam para esse momento
3. ela calcula o nivel atual do diagnostico com base no que ja foi respondido
4. ela filtra perguntas ainda nao satisfeitas
5. ela prioriza as perguntas mais proximas do nivel atual e mais relevantes para a acao
6. ela exibe apenas a proxima melhor pergunta

Esse ranking ja aparece diretamente em [buildDiagnosisTrailForAction](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts), onde as perguntas sao ordenadas por:

- categoria preferencial da acao atual
- encaixe no nivel atual do diagnostico
- ausencia de resposta previa
- prioridade de follow-up
- deduplicacao da trilha final

## O que Aumenta o Valor de uma Pergunta

Uma pergunta vale mais quando faz mais do que preencher cadastro.

No projeto atual, o valor aumenta quando a pergunta:

- explica uma carga de grande impacto, como banho, climatizacao ou carga continua
- ajuda a localizar concentracao de uso por horario
- qualifica uma recomendacao sem prometer causalidade
- transforma uma suspeita em contexto reutilizavel
- evita que a mesma pergunta volte mais tarde
- melhora a linguagem da proxima orientacao
- prepara uma acao mais honesta

As proprias definicoes de `ENERGY_DIAGNOSIS_QUESTIONS` deixam isso explicito por meio de:

- `mapsToField`
- `whyItMatters`
- `category`
- `levelRange`
- `followUpPriority`

Isso mostra que a Score ja escolhe perguntas pela capacidade de melhorar entendimento, nao apenas pela vontade de coletar dados.

## Quando Nao Perguntar

A Score nao pergunta quando o ganho nao justifica o atrito.

No comportamento atual, isso acontece quando:

- a resposta ja esta suficientemente presente no estado
- a pergunta ja foi respondida
- a pergunta ja foi ignorada naquele contexto
- outra pergunta tem mais valor para a acao atual
- a fatura e o historico ja permitem seguir com honestidade
- a resposta nao muda diagnostico, memoria, recomendacao ou proxima acao
- a sessao ja possui contexto suficiente para entregar um proximo passo

O principio consolidado em [.score/design/JOURNEY.md](/C:/Users/Pichau/score-energy-verse/.score/design/JOURNEY.md) continua valido aqui:

- uma pergunta ativa
- uma duvida em foco
- uma acao principal

Perguntar alem disso transforma investigacao em fadiga.

## Como Nasce uma Hipotese

Hoje a Score nao possui uma entidade formal chamada `Hypothesis`. Mesmo assim, o repositorio trabalha com hipoteses de forma consistente.

Uma hipotese nasce quando:

- a fatura sugere um padrao ainda nao explicado sozinha
- o historico aponta variacao relevante entre ciclos
- uma acao pede contexto adicional para ficar mais precisa
- sinais de comportamento e resumo analitico apontam para uma mesma direcao

Na pratica, isso aparece em estruturas como:

- `behaviorHighlights`
- `whatMattersNext`
- `consultiveInsight`
- `loadHypotheses` do contexto do assistente

Portanto, uma hipotese na Score nao e um palpite livre. Ela e uma leitura provisoria baseada em sinais suficientes para orientar a proxima pergunta.

## Como uma Hipotese e Fortalecida

Uma hipotese ganha forca quando mais de uma fonte converge.

Hoje isso acontece quando se combinam:

- fatura atual
- comparacao historica
- respostas do usuario
- perfil conhecido
- sinais observados na jornada

Exemplos recorrentes no projeto:

- banho eletrico deixa de ser suspeita vaga quando existe chuveiro eletrico confirmado e rotina compativel
- concentracao no pico ganha forca quando horario dominante, intensidade 18h-22h e presenca da casa convergem
- necessidade de conforto termico ganha valor quando uso de climatizacao, sensibilidade termica e interesse declarado apontam juntos para esse eixo

## Como uma Hipotese Perde Forca ou e Descartada

No estado atual do projeto, o descarte de hipotese ainda nao e um objeto explicito. Ele acontece por perda de prioridade cognitiva.

Uma hipotese perde forca quando:

- o usuario informa algo que enfraquece a leitura anterior
- a fatura nao sustenta mais aquela explicacao
- outra categoria passa a explicar melhor o consumo
- a orientacao pode seguir com base mais segura em outro eixo

Hoje, mais do que "marcar descartada", a Score:

- deixa de insistir na pergunta
- substitui a suspeita por contexto melhor
- mantem a lacuna aberta se ainda faltar confirmacao suficiente

## Como Hermes Comunica Hipoteses

Hermes nao deve comunicar hipotese como certeza.

As regras do assistente ja deixam isso implicito e explicito:

- nunca inventar dados
- dizer o que falta quando faltarem dados
- conectar habitos, cargas, horarios e fatura
- nao prometer economia exata sem dados suficientes
- priorizar entendimento antes de recomendacao

Por isso, a forma correta de comunicar hipotese dentro da Score e:

- explicar que existe um sinal
- mostrar por que esse sinal importa
- dizer o que ainda falta confirmar
- transformar isso em pergunta curta ou proximo passo

Hermes nao usa a hipotese para parecer inteligente. Ele usa a hipotese para reduzir incerteza com prudencia.

## Como uma Informacao Entra na Memoria Energetica

Uma informacao entra na Memoria Energetica quando deixa de ser apenas input momentaneo e passa a ser contexto reaproveitavel.

Hoje isso acontece com:

- dados de perfil preenchidos
- fatos extraidos da fatura
- respostas contextuais respondidas
- respostas adaptativas ligadas a habitos, cargas e intencoes
- sinais observados pela analise
- acoes iniciadas ou concluidas
- lacunas ainda abertas
- evidencias usadas para recomendacao

Isso esta visivel na composicao do `memorySnapshot`, que consolida:

- sinais confirmados
- contexto confirmado
- comportamento observado
- timeline
- lacunas
- evidencias usadas
- conhecimentos aprendidos

Memoria, portanto, nao e "tudo o que passou". E o que passou a merecer reutilizacao.

## Quando uma Informacao Deve Sair, Ser Revisada ou Ser Confirmada de Novo

O projeto atual ainda nao modela remocao formal de memoria como mecanismo autonomo. Mesmo assim, o comportamento esperado ja pode ser inferido.

Uma informacao deve ser revisitada quando:

- o historico novo enfraquece a leitura anterior
- a resposta anterior era leve demais para sustentar recomendacao futura
- a jornada mudou de foco e a lacuna voltou a importar
- um novo ciclo abre uma pergunta mais precisa sobre o mesmo tema

Uma informacao perde centralidade quando:

- ja cumpriu seu papel para aquela investigacao
- outra evidencia mais forte a substitui
- ela continua verdadeira, mas nao e mais a duvida principal

No estado atual da Score, isso costuma resultar em tres comportamentos:

- manter a memoria
- reforcar a memoria
- reabrir uma lacuna

## Conhecimento Energetico

Conhecimento Energetico nao nasce da pergunta. Nasce da compreensao reconhecida.

No projeto atual, um conhecimento pode ser considerado aprendido quando:

- pertence ao catalogo finito de conhecimentos
- foi apresentado em contexto adequado
- o usuario confirmou explicitamente que entendeu

Depois disso:

- ele e persistido separadamente
- nao altera score, parser, diagnostico ou recomendacao por si so
- deixa de precisar reaparecer com frequencia

Vale reforcar um conhecimento apenas quando o contexto o tornar novamente util. Nao para repetir conteudo.

## Como a Score Decide Encerrar uma Sessao

A sessao deve acabar quando a investigacao ja produziu contexto suficiente para orientar.

Hoje isso significa que a Score ja consegue entregar com honestidade:

- o que foi observado
- o que ainda falta saber
- qual proxima acao faz mais sentido

A Score continua perguntando apenas enquanto a proxima pergunta melhora de fato esse trio.

Ela deve encerrar quando:

- ja existe uma leitura util da conta
- a memoria foi reforcada ou ampliada
- a principal lacuna do momento foi tratada
- ha uma unica proxima acao clara

Ela deve deixar um loop aberto para o proximo ciclo quando:

- ainda existem lacunas, mas sem valor imediato suficiente
- a proxima confirmacao depende de nova fatura
- a comparacao futura vale mais do que ampliar a entrevista agora

## Saidas de uma Investigacao

Ao final de cada investigacao, a Score deveria conseguir explicitar cinco coisas que ja estao espalhadas no comportamento atual do produto:

### 1. O que foi descoberto

- fatos da conta
- sinais do consumo
- contexto do usuario
- respostas que deixaram de ser hipotese

### 2. O que ainda nao sabemos

- lacunas relevantes que permanecem abertas

### 3. O que entrou na Memoria Energetica

- tudo que passou a ser reutilizavel na proxima leitura

### 4. Qual hipotese foi fortalecida ou perdeu forca

- nao como promessa de causalidade
- mas como leitura que ganhou ou perdeu sustentacao

### 5. Qual e a proxima investigacao natural

- a proxima pergunta
- a proxima acao
- ou o proximo ciclo a observar

## Anti-padroes

O repositorio atual ja deixa claro o que destroi uma investigacao da Score.

### Perguntas redundantes

Perguntar algo que ja esta respondido, observado ou irrelevante naquele momento.

### Perguntas sem ganho

Perguntar algo que nao muda memoria, diagnostico, recomendacao ou orientacao.

### Perguntas por curiosidade

Coletar dado sem consequencia pratica apenas para "conhecer mais".

### Hipoteses sem evidencia

Transformar suspeita fraca em afirmacao forte.

### Excesso de perguntas

Trocar inteligencia de priorizacao por volume de entrevista.

### Investigacao infinita

Continuar perguntando quando ja existe contexto suficiente para agir.

### Misturar memoria com conhecimento

Tratar "o que a Score sabe sobre voce" e "o que voce aprendeu com a Score" como a mesma coisa.

## Reflection

Durante esta descoberta, alguns padroes apareceram com mais forca do que o esperado.

### Qual e a menor quantidade de perguntas capaz de explicar a maior parte da conta?

O projeto atual sugere que poucas perguntas de alto impacto explicam grande parte do consumo residencial:

- chuveiro eletrico e quantidade de chuveiros
- presenca de ar-condicionado
- carga continua extra
- periodo dominante de uso
- intensidade do uso entre 18h e 22h
- objetivo principal da jornada

Isso revela uma preferencia institucional por poucas perguntas com alto ganho analitico.

### Quais perguntas provavelmente nunca precisarao ser feitas novamente?

As que descrevem contexto estrutural e persistente, quando ja confirmadas com seguranca suficiente:

- existencia de chuveiro eletrico
- existencia de ar-condicionado
- existencia de carga extra continua
- objetivo principal, enquanto ele nao mudar

### Quais informacoes tornam futuras conversas drasticamente melhores?

- sinais de cargas relevantes
- padrao dominante de horario
- intencoes do usuario
- historico de faturas suficiente para comparacao
- memoria de acoes ja iniciadas

### Quais informacoes tem baixo valor e podem deixar de existir?

O repositorio atual nao mostra um grupo inteiro de informacoes claramente descartavel, mas deixa um principio firme:

se uma informacao nao melhora a proxima leitura, a proxima orientacao ou a memoria reutilizavel, ela nao merece virar pergunta institucional.

## Conclusao

O Investigation Engine da Score, como ja existe hoje, nao escolhe a proxima pergunta pelo impulso de coletar mais dados.

Ele escolhe pela combinacao entre:

- lacuna relevante
- valor de entendimento
- utilidade para memoria
- impacto na proxima orientacao
- respeito ao ritmo da conversa

Esse e o mecanismo minimo que permite imaginar a Score funcionando de forma coerente mesmo sem IA: observar, priorizar, perguntar pouco, memorizar o que foi validado e encerrar assim que houver contexto suficiente para seguir.
