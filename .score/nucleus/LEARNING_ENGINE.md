# Learning Engine

## Manifesto

A Score nao aprende porque recebeu uma atualizacao.

Ela aprende quando uma investigacao melhora a proxima sem perder prudencia, explicabilidade e identidade.

No repositorio atual, esse aprendizado acontece em tres camadas diferentes:

1. **aprendizado individual**: o que a Score passa a saber sobre aquela jornada, aquela casa e aquele historico
2. **aprendizado educativo**: o que o usuario passa a saber sobre energia e confirma como aprendido
3. **aprendizado institucional**: o que a propria empresa consolida depois de repeticao suficiente em codigo, produto, testes e sprints

Este documento descreve essas tres camadas e o mecanismo que as conecta.

Fontes principais desta descoberta:

- [src/lib/memorySnapshot.ts](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- [src/lib/energyKnowledge.ts](/C:/Users/Pichau/score-energy-verse/src/lib/energyKnowledge.ts)
- [src/lib/mvpJourneyState.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [src/lib/mvpPersistence.ts](/C:/Users/Pichau/score-energy-verse/src/lib/mvpPersistence.ts)
- [src/hooks/useMvpJourney.ts](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts)
- [src/lib/scoreAssistant/buildScoreAssistantContext.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts)
- [.score/nucleus/NUCLEUS.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)
- [.score/nucleus/INVESTIGATION_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/nucleus/INVESTIGATION_ENGINE.md)
- [.score/review/REFLECTION_ENGINE.md](/C:/Users/Pichau/score-energy-verse/.score/review/REFLECTION_ENGINE.md)
- [.score/roadmap/SPRINT_LIFECYCLE.md](/C:/Users/Pichau/score-energy-verse/.score/roadmap/SPRINT_LIFECYCLE.md)

## O que Significa Aprender

No estado atual do projeto, aprender nao significa "ter mais dados".

Aprender significa uma destas coisas:

- reduzir uma incerteza relevante
- confirmar uma hipotese que antes era apenas sinal
- transformar contexto solto em memoria reutilizavel
- observar o mesmo padrao ao longo de ciclos
- registrar que o usuario incorporou um conhecimento energetico
- consolidar institucionalmente um padrao que apareceu mais de uma vez

Se a informacao nao muda a proxima leitura, a proxima orientacao ou a clareza futura do sistema, ela ainda nao virou aprendizado real.

## O Ciclo de Aprendizado

No repositorio atual, o ciclo mais fiel da Score e:

1. observar uma conta, uma resposta ou um evento de jornada
2. decidir se aquilo reduz uma lacuna relevante
3. guardar o que foi validado como memoria reutilizavel
4. reaproveitar essa memoria na proxima analise, explicacao ou acao
5. consolidar institucionalmente apenas o que se repetiu o bastante

Essa ultima etapa e decisiva para entender o pedido desta missao:

- nem toda descoberta local deve mudar a empresa
- nem toda memoria deve virar principio
- nem todo padrao de um usuario deve virar conhecimento coletivo

## Quais Aprendizados Existem

### 1. Aprendizados sobre perfil e residencia

- tipo de consumidor
- localizacao
- tamanho do imovel
- quantidade de moradores
- preferencia energetica

Esses aprendizados costumam entrar cedo e permanecer estaveis por longos periodos.

### 2. Aprendizados sobre equipamentos e cargas

- existencia de chuveiro eletrico
- quantidade de chuveiros
- presenca de ar-condicionado
- existencia de carga continua extra, como geladeira ou freezer adicional

Esses aprendizados mudam a leitura de consumo de forma recorrente e explicam boa parte das perguntas adaptativas do sistema.

### 3. Aprendizados sobre habitos

- periodo dominante de uso
- uso concentrado entre 18h e 22h
- cargas pesadas a noite
- frequencia de lavanderia
- intensidade de climatizacao
- sensibilidade termica do imovel

Aqui a Score ja aprende algo menos estrutural e mais dependente de rotina.

### 4. Aprendizados sobre intencao

- objetivo principal da jornada
- interesse em conforto termico
- interesse em analise solar
- abertura para apoio consultivo

Esses aprendizados nao explicam a conta sozinhos, mas qualificam a proxima orientacao.

### 5. Aprendizados sobre historico e ciclos

- comparacao entre faturas
- estabilidade ou mudanca no padrao
- evidencias que se repetem entre ciclos
- momento em que o sistema ja possui base suficiente para comparar

Esse grupo e central para a Score amadurecer com o tempo.

### 6. Aprendizados educativos

- conhecimentos do catalogo que o usuario marcou como entendidos

Esse grupo nao muda o diagnostico. Ele muda o repertorio do usuario.

### 7. Aprendizados institucionais

- guardrails que reaparecem em varias sprints
- convencoes recorrentes no codigo
- separacoes de responsabilidade que deixam de ser experimentais
- linguagem que se repete em produto, docs e implementacao

Esse e o nivel em que a empresa aprende, nao apenas a jornada.

## Memoria

No projeto atual, memoria e a forma primaria de aprendizado individual da Score.

Ela junta:

- perfil conhecido
- sinais confirmados
- fatos da fatura
- contexto confirmado
- comportamento observado
- acoes registradas
- lacunas abertas
- evidencias usadas na recomendacao

### Quando uma memoria deixa de ser apenas memoria e passa a ser aprendizado consolidado

Dentro da jornada de um usuario, isso acontece quando a informacao:

- foi confirmada explicitamente pelo usuario
- foi observada com base real na fatura ou no historico
- passou a ser reutilizada em mais de um momento da jornada
- deixou de ser apenas pista e passou a orientar leitura ou recomendacao

Em outras palavras:

- memoria momentanea = contexto local ainda pouco reaproveitado
- memoria consolidada = contexto que a proxima investigacao ja pode assumir como base

### Quando precisa ser revisitada

Uma memoria precisa ser revisitada quando:

- um novo ciclo enfraquece a leitura anterior
- ela foi util como pista, mas ainda e leve demais para suportar recomendacao futura
- a jornada mudou de foco e a mesma informacao voltou a ser critica
- o sistema precisa distinguir se algo era estrutural ou apenas daquele ciclo

### Quando envelhece

No estado atual do repositorio, envelhecer nao e um estado formal. Mesmo assim, o comportamento ja aparece.

Uma memoria envelhece quando:

- continua armazenada, mas perde centralidade
- ficou antiga demais para explicar o momento atual
- depende de reconfirmacao por novo ciclo ou nova resposta

### Quando deve ser esquecida

Hoje a Score nao possui um subsistema formal de esquecimento automatico. O "esquecimento" acontece mais por:

- substituicao por evidencia mais forte
- perda de prioridade na investigacao
- remocao de dados da jornada
- nao consolidacao institucional

Portanto, o projeto atual ainda esquece mais por prudencia de uso do que por politica formal de expurgo.

## Conhecimento

No repositorio atual, Conhecimento Energetico nao e memoria da empresa nem memoria do usuario sobre si mesmo.

Ele e um catalogo controlado de conteudos educativos com estado de aprendizado explicitamente persistido.

Isso significa que o crescimento do Conhecimento Energetico e:

- finito por catalogo
- discreto por `id`
- confirmado por acao explicita do usuario
- persistido separadamente da memoria

### Existe hierarquia?

Nao existe hierarquia formal entre conhecimentos.

O que existe hoje e:

- um catalogo de itens
- selecao contextual do proximo conhecimento relevante
- contagem de aprendidos versus nao aprendidos
- registro do ultimo conhecimento aprendido

### Existe confianca?

Existe, mas nao como numero global.

A confianca aqui e binaria e operacional:

- se o usuario marcou `Entendi`, aquele conhecimento pode ser tratado como aprendido
- se nao marcou, ele continua disponivel para reapresentacao contextual

### Existe validade temporal?

Ainda nao como campo formal.

O comportamento atual sugere apenas que:

- conhecimento aprendido nao deve reaparecer com frequencia
- vale reforcar apenas quando o contexto tornar aquilo de novo util

### Existe contexto?

Sim. O proximo conhecimento nao e escolhido aleatoriamente.

`pickEnergyKnowledge` usa o contexto atual da jornada, incluindo:

- objetivo ativo
- dica ativa
- view atual
- sinais da analise
- guidance
- proxima acao
- perfil
- energyBehaviorProfile

Ou seja: o conhecimento cresce como catalogo persistente, mas aparece de forma contextual.

### Existe origem?

Sim.

A origem de um conhecimento aprendido e sempre uma destas:

- um item do catalogo educativo
- apresentado em momento coerente com a jornada
- confirmado explicitamente pelo usuario

## Confianca

O Learning Engine atual da Score nao trabalha com um unico score formal de confianca. Em vez disso, a confianca aparece por fonte, recorrencia e forma de confirmacao.

Hoje, a confianca sobe quando a informacao vem de:

- resposta explicita do usuario
- fato observado na fatura
- comparacao entre ciclos
- repeticao consistente em historico
- confirmacao educativa explicita no caso de conhecimento

E cai quando a informacao e apenas:

- hipotese
- gap aberto
- sinal isolado de um unico ciclo
- intuicao textual ainda nao confirmada

Isso significa que a Score aprende melhor quando cruza fontes, nao quando acumula afirmacoes.

## Revisao

Revisao e o mecanismo que impede a Score de confundir memoria com verdade eterna.

### Revisao na jornada

A revisao da jornada ja acontece quando:

- nova fatura recompoe a analise
- novas respostas recalculam proxima acao e resumo
- memoria reaparece como contexto na leitura seguinte
- retorno apos inatividade reabre a jornada como `return-visit`

Portanto, a revisao do aprendizado individual e ciclica.

### Revisao institucional

A revisao da empresa acontece por:

- reflection ao fim de sprint
- consolidacao apenas com evidencia suficiente
- manutencao da `.score`
- recusa em oficializar decisoes isoladas cedo demais

O repositorio ja formaliza isso em `REFLECTION_ENGINE.md` e `SPRINT_LIFECYCLE.md`.

## Esquecimento

O que a Score deve esquecer e tao importante quanto o que ela deve guardar.

### No nivel individual

A Score nao deveria tratar como permanente:

- hipotese nao confirmada
- leitura forte de um unico ciclo sem repeticao
- contexto que perdeu valor para a jornada atual
- conhecimento apenas exibido, mas nao confirmado como aprendido

### No nivel institucional

A empresa nao deveria consolidar:

- decisao que apareceu uma unica vez
- workaround circunstancial
- linguagem ainda disputada
- principio ainda sem repeticao suficiente

Nesse sentido, o esquecimento institucional da Score hoje nao e apagar arquivo. E nao promover cedo demais algo para a `.score`.

## Aprendizado Individual

O aprendizado individual e o que melhora a proxima investigacao daquela mesma jornada.

Ele vive em estado persistido por usuario, principalmente em:

- `profile`
- `analysis`
- `userContext`
- `energyBehaviorProfile`
- `actions`
- `scoreEvents`
- `knowledge`
- `lastActiveAt`

Esse aprendizado melhora a proxima investigacao porque:

- evita repetir perguntas ja resolvidas
- permite comparacao entre ciclos
- muda a proxima acao com base em contexto real
- enriquece a memoria reaproveitada por assistente e Nucleo

Em resumo:

uma investigacao melhora a proxima quando deixa rastros reutilizaveis no `MvpState`.

## Aprendizado Coletivo

Nem todo aprendizado deve sair da jornada individual.

No projeto atual, existem pelo menos dois tipos de aprendizado coletivo legitimos.

### 1. Coletivo de produto

Beneficia todos os usuarios, mas nao descreve uma unidade consumidora especifica.

Exemplos reais no repositorio:

- catalogo de Conhecimento Energetico
- guardrails de linguagem do assistente
- principios da jornada
- separacao entre memoria, conhecimento, diagnostico e orientacao

Esse aprendizado coletivo vive em artefatos compartilhados de codigo e documentacao.

### 2. Coletivo institucional

Beneficia a empresa como organizacao construtora do produto.

Exemplos reais:

- Reflection Engine
- Sprint Lifecycle
- CORE
- NUCLEUS
- ENGINEERING
- DESIGN

### O que deve permanecer local

Deve permanecer local a cada usuario ou unidade:

- sinais de memoria energetica daquela casa
- respostas contextuais
- hipoteses daquela jornada
- acao atual sugerida
- historico de faturas
- contexto de habitos e equipamentos

O principio consolidado aqui e simples:

o que descreve uma pessoa, uma casa ou uma jornada continua local; o que melhora a propria capacidade da Score de explicar, orientar e ensinar pode virar coletivo se houver repeticao suficiente.

## Papel do Hermes

No estado atual do repositorio, Hermes nao aprende. Hermes consulta.

Isso aparece por tres evidencias fortes:

1. o contexto do assistente e construido de forma somente leitura em `buildScoreAssistantContext`
2. o fallback do assistente consome memoria, lacunas e hipoteses, mas nao grava nada
3. nao existe caminho de persistencia do assistente escrevendo memoria, conhecimento ou regra de negocio

Portanto, Hermes pode:

- ler contexto
- explicar contexto
- reorganizar contexto em linguagem humana
- apontar limites e proximo passo

Hermes nao pode:

- guardar memoria nova por conta propria
- marcar conhecimento como aprendido
- alterar score
- promover hipotese a fato
- consolidar aprendizado institucional

Se a Score aprende, ela aprende no estado da jornada e no processo institucional da `.score`, nao dentro do assistente.

## Como uma Investigacao Melhora a Proxima

Uma investigacao melhora a proxima quando transforma interacao em contexto reaproveitavel.

No estado atual do produto, isso acontece quando a investigacao:

- responde uma lacuna relevante
- confirma um sinal importante
- recalcula a proxima acao
- enriquece a memoria snapshot
- adiciona historico para comparacao futura
- registra um conhecimento aprendido

Ou seja:

- **uma investigacao** melhora a proxima porque deixa memoria util
- **dez investigacoes** melhoram cem porque constroem historico comparavel e estabilidade de leitura
- **cem investigacoes** melhoram mil apenas quando seus padroes se repetem o bastante para virar catalogo, guardrail ou documento institucional

Esse ultimo salto nao acontece automaticamente. Ele depende de reflection e consolidacao.

## Como Evitar que a Score Aprenda Coisas Erradas

O repositorio atual combate aprendizado errado por meio de freios recorrentes.

### 1. Separar hipotese de memoria consolidada

Nem todo sinal deve virar verdade de jornada.

### 2. Separar memoria de conhecimento

O que a Score sabe sobre o usuario nao e o mesmo que o usuario aprendeu sobre energia.

### 3. Reaproveitar apenas estado normalizado

Persistencia e normalizacao acontecem antes da reutilizacao.

### 4. Exigir repeticao para aprendizado institucional

Uma sprint sozinha nao reescreve a empresa.

### 5. Manter Hermes fora da escrita

O assistente nao tem permissao arquitetural para inventar ou salvar aprendizado.

## Anti-padroes

### Memorias eternas

Tratar qualquer resposta antiga como verdade permanente.

### Conhecimento sem evidencia

Promover explicacao, insight ou hipotese a aprendizado consolidado sem confirmacao suficiente.

### Generalizacoes

Transformar padrao local de uma casa em verdade de produto para todas as outras.

### Aprendizado precipitado

Consolidar na `.score` o que ainda so apareceu uma vez.

### Hipoteses transformadas em fatos

Usar sinais fracos como conclusao definitiva.

### Esquecimento inadequado

Perder contexto importante entre ciclos e obrigar a Score a recomecar do zero sem necessidade.

### Acumular dados sem reorganizar entendimento

Guardar mais volume sem melhorar a proxima leitura, a proxima pergunta ou a proxima acao.

## Conceitos Experimentais

Alguns conceitos ja apontam direcao, mas ainda nao parecem institucionalmente fechados.

- politica formal de envelhecimento de memoria
- politica formal de esquecimento automatico
- hierarquia entre conhecimentos educativos
- camada explicita de confianca unificada para todos os tipos de sinal
- mecanismo institucional de promover padroes coletivos de produto para alem da documentacao atual

Hoje esses temas ja aparecem como necessidade implicita, mas ainda nao como sistema consolidado.

## Reflection

### O que faz a Score ficar mais inteligente depois de um ano?

- mais ciclos observados com comparacao honesta
- mais memoria reutilizavel por jornada
- mais clareza sobre o que perguntar e o que nao perguntar
- mais conhecimento educativo confirmado
- mais principios consolidados na `.score` a partir de repeticao real

### O que faz ela ficar apenas maior?

- mais dados sem revisao
- mais textos sem consolidacao
- mais contexto salvo sem diferenciar hipotese de fato
- mais funcionalidades sem reflection

### Qual a diferenca entre acumular dados e acumular inteligencia?

Acumular dados e guardar mais coisas.

Acumular inteligencia e aumentar a capacidade de:

- fazer a proxima pergunta melhor
- explicar a proxima conta com menos genericidade
- orientar com menos ambiguidade
- reaprender menos a mesma licao em sprints futuras

## Conclusao

O Learning Engine da Score, no estado atual do repositorio, nao e um modelo que se autoaperfeicoa.

Ele e um sistema de camadas:

- a jornada aprende sobre um usuario
- o usuario aprende sobre energia
- a empresa aprende sobre si mesma

A Score so melhora de verdade quando essas tres camadas continuam separadas, mas conectadas.

Se tudo virar apenas armazenamento, a Score fica maior.

Se cada investigacao deixa memoria util, cada conhecimento vira repertorio confirmado e cada sprint consolida apenas o que mereceu repeticao, a Score fica mais inteligente.
