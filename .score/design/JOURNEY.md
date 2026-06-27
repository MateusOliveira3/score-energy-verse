# Jornada da Score Energy

## Manifesto da Jornada

A Score nao entrega informacoes. Ela conduz uma investigacao energetica.

A pessoa nao entra para navegar modulos. Ela entra para ser ajudada a entender algo que ainda esta difuso.

No repositorio atual, essa jornada aparece repetidamente como um ciclo de:

- observar um contexto real
- reduzir incerteza com a proxima pergunta necessaria
- transformar resposta em memoria util
- transformar memoria em leitura melhor
- transformar leitura em uma orientacao clara

Esse padrao aparece em [CORE](/C:/Users/Pichau/score-energy-verse/.score/brain/CORE.md), [NUCLEUS](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md), [DESIGN](/C:/Users/Pichau/score-energy-verse/.score/design/DESIGN.md), [useMvpJourney](/C:/Users/Pichau/score-energy-verse/src/hooks/useMvpJourney.ts), [mvpJourneyState](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts), [mvpCoreFlow](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts) e [mascot-role](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md).

A melhor analogia externa nao e "aplicativo educacional" nem "chat". E uma conversa adaptativa com tres propriedades:

- cada pergunta existe para reduzir o espaco do desconhecido
- cada resposta altera a proxima pergunta
- cada sessao termina quando ja existe contexto suficiente para uma boa orientacao

Por analogia com experiencias como Akinator, Duolingo, Khan Academy, entrevistas adaptativas e jogos de investigacao, a Score nao precisa de volume de interacao. Ela precisa de sequenciamento inteligente.

## A primeira conversa

### O que a pessoa sente antes da primeira frase

Antes da Score falar, a pessoa chega com pelo menos uma destas tensoes:

- quer entender a conta, mas nao sabe por onde comecar
- suspeita que gasta mais do que deveria, mas nao sabe com que certeza
- quer ajuda, mas nao quer ser forcada a aprender linguagem tecnica
- quer orientacao, mas nao quer ser julgada

A primeira conversa da Score precisa reduzir essas quatro tensoes ao mesmo tempo:

- ansiedade
- ambiguidade
- vergonha
- sobrecarga

### A primeira frase da Score

Sintese mais fiel ao projeto atual:

`Eu vou te ajudar a entender sua energia sem te fazer descobrir tudo sozinho.`

Essa frase nao foi copiada literalmente do repositorio. Ela foi sintetizada a partir de padroes recorrentes:

- o mascote deve reduzir ansiedade e orientar sem burocracia
- a Score interpreta antes de pedir leitura do usuario
- a jornada existe para transformar conta em entendimento
- o sistema deve parecer guia, nao dashboard nem chatbot

Evidencias:

- [docs/product/mascot-role.md](/C:/Users/Pichau/score-energy-verse/docs/product/mascot-role.md)
- [docs/product/user-journey.md](/C:/Users/Pichau/score-energy-verse/docs/product/user-journey.md)
- [src/lib/scoreAssistant/scoreSystemPrompt.ts](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts)
- [src/lib/nucleoSession.ts](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)

### Por que ela comeca assim

Ela comeca assim porque a primeira responsabilidade da Score nao e perguntar. E reduzir a incerteza emocional da conversa.

Se a Score comecar pedindo dados cedo demais, ela parece formulario.

Se a Score comecar explicando demais, ela parece aula.

Se a Score comecar prometendo recomendacao demais, ela parece marketing.

Ela precisa comecar assumindo trabalho.

## Como nasce uma pergunta

Uma pergunta da Score nao nasce de curiosidade. Ela nasce de insuficiencia de contexto.

No estado atual do produto, perguntas aparecem quando a Score ainda nao consegue:

- orientar com seguranca
- distinguir duas hipoteses de consumo concorrentes
- personalizar uma recomendacao relevante
- decidir se ja sabe o bastante para comparar dois ciclos

Isso ja aparece no produto de duas formas:

- perguntas contextuais do mascote, quando faltam sinais estruturais importantes
- perguntas adaptativas ligadas a acoes, quando falta contexto pratico para orientar o proximo passo

Evidencias:

- [buildMascotContextQuestion](/C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts)
- [mvpCoreFlow](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [DynamicContextActionsView](/C:/Users/Pichau/score-energy-verse/src/components/dynamic-context/DynamicContextActionsView.tsx)

### A primeira pergunta

A primeira pergunta da Score nao deve ser "qual e seu consumo?" nem "o que voce quer fazer?".

Ela precisa nascer do menor contexto que desbloqueia entendimento futuro.

No projeto atual, isso aparece em dois momentos legitimos:

1. antes da primeira conta, a Score pede apenas o minimo para nao personalizar no escuro
2. depois que a conta existe, a Score pergunta apenas o que muda a leitura

Por isso, a primeira pergunta estrutural da Score nao e "me conte tudo sobre sua casa". E:

`Posso comecar pela sua conta mais recente?`

Essa formulacao sintetiza o principio mais repetido do repositorio: a fatura e a ancora de confianca da Score.

Quando a conta ja existe e a conversa avancou, a primeira pergunta adaptativa valida passa a ser algo como:

`Antes de eu te orientar melhor, me diz so o que mais importa agora: economizar, conforto ou sustentabilidade?`

Essa pergunta existe no produto porque `primary_goal` muda a qualidade da orientacao futura, nao apenas o tom da conversa.

### Regras para uma pergunta existir

Uma pergunta da Score so deve existir quando todos estes criterios forem verdadeiros:

- ainda existe uma incerteza real
- a resposta muda a qualidade da leitura ou da orientacao
- a Score consegue explicar por que esta perguntando
- a resposta ainda nao foi inferida com seguranca suficiente

Se qualquer um falhar, a pergunta deve desaparecer.

### Uma pergunta por vez

Esse principio precisa permanecer absoluto:

- uma pergunta ativa
- uma duvida em foco
- um microcontexto por vez

Por analogia com Akinator e entrevistas adaptativas, a sensacao de inteligencia nao vem de perguntar muito. Vem de perguntar a proxima melhor coisa.

## Como nasce uma memoria

Memoria Energetica nasce quando a Score para de tratar algo como possibilidade e passa a trata-lo como contexto reaproveitavel.

Isso acontece hoje quando entram, com confianca suficiente:

- dados de perfil
- fatos extraidos da fatura
- respostas contextuais respondidas
- sinais de comportamento observados
- acoes iniciadas ou testadas
- evidencias recorrentes entre ciclos

Evidencias:

- [memorySnapshot](/C:/Users/Pichau/score-energy-verse/src/lib/memorySnapshot.ts)
- [energy-memory.md](/C:/Users/Pichau/score-energy-verse/docs/skills/score-energy/energy-memory.md)
- [NUCLEUS](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)

### Como a pessoa percebe que a Score lembrou

A pessoa nao percebe memoria vendo uma tabela. Ela percebe memoria quando a Score:

- nao repete pergunta que ja teria resposta suficiente
- retoma um detalhe importante sem pedir novamente
- melhora a explicacao do proximo ciclo
- usa um contexto anterior com naturalidade e prudencia

A memoria precisa ser percebida como reconhecimento, nao como arquivo.

Emocionalmente, a sensacao correta e:

`Ela nao esta comecando do zero comigo.`

### O momento da primeira memoria criada

A primeira memoria da Score nasce cedo, mas nao deve ser celebrada cedo demais.

Ela nasce assim que o sistema consegue dizer, com honestidade:

- "agora eu sei um pouco mais sobre como essa energia funciona na sua realidade"

Isso pode vir do perfil, da primeira fatura ou da primeira resposta contextual. O que importa nao e a origem. O que importa e a validacao.

## Como nasce um conhecimento

Conhecimento Energetico nao nasce quando a Score fala. Nasce quando a pessoa reconhece que entendeu algo.

Essa diferenca e essencial.

No projeto atual, conhecimento:

- vem de um catalogo limitado
- depende de confirmacao explicita
- nao altera score nem diagnostico
- nao descreve o usuario; descreve o que ele absorveu

Evidencias:

- [energyKnowledge](/C:/Users/Pichau/score-energy-verse/src/lib/energyKnowledge.ts)
- [MemoryPanel](/C:/Users/Pichau/score-energy-verse/src/components/MemoryPanel.tsx)
- [NUCLEUS](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)

### Como a pessoa percebe que aprendeu

A pessoa percebe aprendizado quando tres coisas acontecem juntas:

1. a explicacao cabe em uma frase curta
2. essa frase se conecta ao proprio consumo dela
3. a Score nao a trata como aluna, e sim como alguem que acabou de ganhar repertorio

Por isso a Score nao deve ensinar como curso.

Ela deve ensinar como descoberta curta.

Por analogia com Duolingo e Khan Academy, o mecanismo psicologico certo nao e "longo conteudo". E:

- uma unidade pequena
- uma confirmacao rapida
- uma sensacao clara de progresso

### A forma correta da celebracao

A Score so deve comemorar conhecimento quando a pessoa acabou de ganhar clareza.

A celebracao certa e curta:

- reconhecimento
- incorporacao
- continuidade

Nunca:

- festa vazia
- recompensa inflada
- performance escolar

## Como nasce uma recomendacao

Uma recomendacao da Score nao nasce quando ela tem algo para dizer. Nasce quando ela ja sabe o suficiente para reduzir ambiguidade.

No projeto atual, recomendacao nasce de:

- leitura da fatura em foco
- relacao com historico quando existir
- perfil conhecido
- habitos confirmados
- lacunas ainda abertas
- uma unica prioridade atual

Evidencias:

- [mvpCoreFlow](/C:/Users/Pichau/score-energy-verse/src/lib/mvpCoreFlow.ts)
- [nucleoSession](/C:/Users/Pichau/score-energy-verse/src/lib/nucleoSession.ts)
- [scoreAssistant/fallback](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/fallback.ts)

### Quando a Score explica

A Score explica quando a explicacao reduz medo ou melhora decisao.

Ela explica:

- antes de uma pergunta importante
- depois de uma resposta que muda a memoria
- quando a recomendacao poderia parecer arbitraria
- quando ainda falta dado e o limite precisa ser dito

### Quando a Score apenas pergunta

A Score apenas pergunta quando:

- o usuario ja sabe por que a pergunta importa
- a incerteza esta bem delimitada
- a proxima resposta vai desbloquear uma leitura melhor imediatamente

### Quando a Score escuta

A Score escuta sempre que o usuario responde.

Mas ela demonstra escuta de verdade quando:

- registra a resposta
- adapta a proxima pergunta
- deixa de repetir o que ja foi respondido
- muda a orientacao com base nisso

### Quando a Score desafia

A Score desafia pouco.

Ela so desafia quando o usuario ja acumulou contexto suficiente para suportar um pequeno deslocamento de comportamento.

Mesmo assim, o desafio nunca deve soar como bronca.

Deve soar como:

`Antes de mudar tudo, vamos testar so este eixo aqui.`

## Como termina uma sessao

Uma sessao da Score termina quando ja existe:

- um entendimento claro do momento
- uma memoria nova ou reforcada
- uma unica acao principal
- uma frase que prepara o proximo retorno

A sessao nao termina quando a interface acabou. Termina quando a Score ja sabe o suficiente por agora.

### O ultimo gesto da sessao

O ultimo gesto da Score deve sempre combinar:

- sintese
- reconhecimento
- continuidade

Forma emocional correta:

`Hoje ja foi o bastante. No proximo ciclo, eu volto daqui.`

### Quando a Score fica em silencio

A Score deve ficar em silencio quando:

- a pergunta nao mudaria nada importante
- a leitura principal ja foi compreendida
- o usuario acabou de receber orientacao suficiente
- insistir diminuiria a sensacao de inteligencia

Silencio, aqui, e respeito cognitivo.

## Como comeca o proximo ciclo

O proximo ciclo nao comeca do zero. Ele comeca com reconhecimento.

O primeiro trabalho da Score no retorno e provar, sem ostentacao, que ela lembra.

Ela faz isso quando:

- retoma a ultima acao principal
- usa o objetivo ja informado
- reconhece a fase da jornada
- compara o novo ciclo com o anterior
- evita reabrir perguntas que ja nao precisam voltar

### O momento do reconhecimento

O reconhecimento nao deve soar como relatorio.

Ele deve soar como:

`Da ultima vez, o que mais importava para voce era X. Agora eu consigo olhar este novo ciclo com isso em mente.`

Essa e a forma emocional correta da memoria no retorno.

## Papel do Hermes

Hermes, pelo que o repositorio mostra hoje, nao e narrador principal, nem mascote, nem entrevistador inicial.

Hermes e melhor descrito como:

`tradutor consultivo do Nucleo`

Justificativa:

- o contexto dele e montado pela Score, nao por ele
- ele nao decide score, memoria, diagnostico ou recomendacao
- ele responde sob demanda
- ele transforma contexto resolvido em explicacao humana
- ele tem fallback equivalente, o que prova que sua funcao e interpretativa, nao estrutural

Evidencias:

- [buildScoreAssistantContext](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/buildScoreAssistantContext.ts)
- [scoreSystemPrompt](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/scoreSystemPrompt.ts)
- [fallback](/C:/Users/Pichau/score-energy-verse/src/lib/scoreAssistant/fallback.ts)
- [HERMES_SETUP_SCORE](/C:/Users/Pichau/score-energy-verse/docs/HERMES_SETUP_SCORE.md)
- [NUCLEUS](/C:/Users/Pichau/score-energy-verse/.score/nucleus/NUCLEUS.md)

### O que Hermes nao deve ser

Hermes nao deve ser:

- a primeira voz da Score
- o lugar onde a investigacao principal acontece
- um chat infinito de companhia
- um oraculo que inventa conclusoes
- um substituto da jornada principal

Hermes entra quando a pessoa quer aprofundar entendimento.

Nao quando a Score ainda nem organizou o proprio raciocinio.

## Papel invisivel do Nucleo

O Nucleo organiza a conversa, mas nao precisa aparecer como conceito para o usuario.

Seu papel invisivel e garantir que:

- a proxima pergunta seja a mais util
- a memoria seja preservada
- a leitura seja coerente
- a orientacao seja curta e explicavel
- o proximo ciclo comece melhor do que o anterior

O usuario nao deve perceber "o Nucleo".

Deve perceber:

- clareza
- continuidade
- criterio

## Ritmo da conversa

O ritmo correto da Score e:

1. acolhe
2. explica por que vai perguntar
3. pergunta uma coisa
4. reconhece a resposta
5. transforma isso em memoria ou entendimento
6. aponta um proximo passo
7. encerra antes de cansar

### Regras permanentes de ritmo

- sempre existe apenas uma pergunta ativa
- sempre existe apenas uma acao principal
- sempre existe apenas um gesto principal de avancar
- a Score nunca pergunta sem explicar por que importa
- a Score nunca repete uma pergunta se ja possui evidencia suficiente
- a Score nunca estende a sessao so porque ainda ha informacao possivel

### O botao principal

Mesmo sem depender de tela, a jornada pressupoe um unico verbo de avancar:

`Continuar`

Esse verbo funciona porque a conversa da Score nao e sobre escolhas paralelas. E sobre investigacao guiada.

## Fluxo completo da conversa

### Primeira visita

A pessoa chega sem contexto, mas com inquietacao.

A Score acolhe e assume trabalho.

### Primeira pergunta

A Score pergunta apenas o minimo necessario para sair do generico.

### Primeira resposta

A resposta nao e tratada como formulario preenchido.

Ela e tratada como reducao de incerteza.

### Primeira memoria criada

A Score passa a ter algo que pode reaparecer no proximo raciocinio.

### Primeira orientacao

O sistema aponta uma unica continuidade plausivel.

### Fim da sessao

A Score encerra com sintese curta, sem sugar toda a atencao disponivel.

### Retorno no proximo ciclo

A Score reabre a conversa mostrando que nao esqueceu.

### Reconhecimento da memoria

A pessoa sente que a investigacao continua, em vez de recomecar.

### Nova investigacao

O novo ciclo nao amplia ruido. Ele aprofunda criterio.

## Anti-padroes

Os anti-padroes reais mais destrutivos para uma conversa da Score, a partir do repositorio, sao:

- perguntar cedo demais e explicar tarde demais
- fazer varias perguntas concorrentes
- transformar a conta em pretexto para um dashboard
- transformar aprofundamento em chat infinito
- pedir ao usuario interpretacao antes de oferecer leitura
- repetir pergunta ja suficientemente respondida
- comemorar sem mudanca real de entendimento
- mostrar memoria como arquivo cru em vez de reconhecimento
- mostrar conhecimento como conteudo escolar em vez de descoberta curta
- usar linguagem interna, tecnica ou operacional na conversa
- oferecer varias direcoes ao mesmo tempo e dissolver a acao principal
- prolongar a sessao quando ja existe uma boa conclusao para agora

## Conceitos experimentais

Alguns pontos ainda aparecem como promissores, mas nao totalmente consolidados:

- o grau exato em que o mascote deve carregar a primeira conversa
- a fronteira final entre mascote e Hermes como superficies diferentes da mesma inteligencia
- o momento ideal para transformar comparacao entre ciclos em desafio mais explicito
- a ritualizacao exata do encerramento de sessao e da reabertura do proximo ciclo

Esses pontos ainda pedem maturacao, mas o contrato principal ja parece claro:

- a Score conversa investigando
- lembra sem ostentar
- ensina sem dar aula
- orienta sem pressionar
- encerra antes de cansar
