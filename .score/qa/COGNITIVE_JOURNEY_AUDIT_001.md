# COGNITIVE_JOURNEY_AUDIT_001

## Resumo

A jornada entrega uma primeira pista concreta e o QA agora consegue representar melhor a pergunta ativa e a autoridade principal vistas pelo usuario.

Documento institucional ausente durante a leitura obrigatoria:

- `MEMORANDO_INTERNO_001_2026.md` nao existe no repositorio no momento desta execucao.

## Ambiente

- data: `2026-06-26T04:34:32.252Z`
- branch: `feature/knowledge-persistence-boundary-v1`
- comando executado: `npm run qa:journey`
- URL testada: `http://127.0.0.1:4173`
- navegador: `Chrome local`
- fixture principal: `test-fixtures-invoices\celesc-sample-01.pdf`
- auth usada: `local fallback`
- provider da jornada: `local`

## Momento 1

### Primeiro contato

- O usuario entende imediatamente o proposito da Score? Sim, parcialmente. O titulo `Sua energia precisa de contexto, nao de adivinhacao.` e o texto logo abaixo apontam para leitura de conta com contexto, nao para um dashboard generico.
- O que ele acredita que a plataforma faz? Ele tende a entender que a Score le a conta, guarda memoria energetica e transforma isso em proximo passo orientado.
- Existe curiosidade? Sim. O contraste entre a promessa principal e o CTA `Comecar a jornada, Acessar minha conta` convida exploracao.
- Existe confusao? Sim, em nivel leve. Conceitos como Nucleo, memoria, conhecimento e score aparecem cedo demais para um primeiro contato.
- Evidencias observaveis: `Sua energia precisa de contexto, nao de adivinhacao.`; `A Score Energy transforma leitura de fatura, memoria, diagnostico e conhecimento em uma jornada unica. O resultado nao e um dashboard frio: e um sistema que observa, lembra, ensina e orienta.`.

## Momento 2

### Cadastro

- Existe atrito? Baixo. O cadastro pediu apenas `Email, Senha, Confirmar senha`.
- Alguma informacao parece desnecessaria? Nao nesta etapa. O formulario ficou curto e proporcional ao compromisso inicial.
- O cadastro aproxima ou afasta o usuario? Aproxima, porque a friccao tecnica e pequena e a jornada volta rapido para o fluxo principal.
- Evidencias observaveis: formulario curto, sem campos de contexto prematuros nem interrupcoes externas.

## Momento 3

### Upload

- O usuario entende claramente o que deve fazer? Sim. A superficie principal diz `A primeira leitura comeca quando a fatura vira casa.` e o card de upload explicita PDF/JPG/PNG com CTA direto.
- Existe receio? Moderado. O usuario ainda entrega um documento sensivel sem ver um exemplo do retorno concreto que recebera.
- Existe confianca? Parcial. A interface parece cuidada e consistente, mas ainda pede um salto de fe antes do primeiro valor.
- Existe expectativa? Sim. O texto `Primeiro vem a leitura. Depois vem qualquer pergunta.` promete que a fatura vai virar leitura do ciclo.

## Momento 4

### Processamento

- O usuario acredita que a Score continua trabalhando? Sim. A mensagem `nao observado` somada ao corpo `A mensagem principal de processamento nao apareceu dentro do budget inicial.` reduz a sensacao de travamento.
- Ou acredita que ela travou? Nao nesta execucao, porque o feedback de processamento apareceu rapido.
- Existe feedback suficiente? Parcialmente. Existe feedback de atividade, mas nao existe previsao, etapa ou criterio de conclusao.
- Quanto tempo permaneceu sem resposta clara? `nao observado` ms ate a primeira mensagem explicita de processamento; depois disso o usuario recebeu presenca, mas nao recebeu progresso detalhado durante `20033`.

## Momento 5

### Primeira manifestacao da Core

- A Core parece compreender o contexto? Parcialmente. Ela usa dados reais do ciclo e mostra numeros da conta, mas a fala principal `Agora conheco um pouco melhor sua casa.` ainda e generica demais para soar profundamente contextual.
- Ou apenas repetir mensagens? Nao chega a repetir, mas ainda fala em nivel de pista ampla, sem conectar logo de inicio a conta enviada com uma explicacao nitida. 
- Sua presenca aumenta confianca? Sim, porque da continuidade e presenca ao sistema.
- Ou apenas ocupa espaco? Parcialmente ocupa espaco quando a fala permanece vaga e a explicacao mais concreta fica escondida nos detalhes.
- Evidencias observaveis: `Agora conheco um pouco melhor sua casa.`; `Encontrei o sinal mais forte da sua conta de 02/2026.`.

## Momento 6

### Primeira pergunta

- A pergunta parece natural? Sim. A pergunta aparece com enunciado explicito no Hero antes das opcoes.
- O usuario entende por que ela foi feita? Sim, com contexto suficiente antes das opcoes.
- Existe um local claro para responder? Sim. As opcoes de resposta ficam no mesmo bloco da pergunta ativa.
- Ela pertence ao estado cognitivo? Sim. O QA vinculou a pergunta renderizada a uma pergunta pendente do estado persistido da jornada.
- Ela reduz incerteza? Sim, parcialmente. A pergunta ja orienta a proxima leitura, mesmo que a fala inicial da Core ainda possa ser mais especifica.
- Evidencias observaveis: pergunta explicita visivel = `sim`; contexto antes das opcoes = `sim`; vinculacao ao estado cognitivo = `sim`; opcoes observadas = `Sim, Nao`; quantidade de gatilhos `Mostrar detalhes` na hero = `0`.

## Momento 6.1

### Devolucao entre perguntas

- O usuario recebeu algum valor antes da primeira pergunta? Sim. A Hero entregou uma leitura observavel antes de revelar a investigacao inicial.
- O usuario recebeu algum valor antes da proxima pergunta? Sim. Depois de cada resposta, a Hero entregou uma devolucao observavel antes de revelar a pergunta seguinte.
- Cada resposta aumentou a compreensao percebida? Sim. As devolucoes observadas explicaram o que mudou na leitura antes da continuidade.
- O usuario sente que a Score tambem trabalha entre uma pergunta e outra? Sim. A Hero mostrou leitura, hipotese e incerteza antes de seguir.

## Momento 6.2

### Continuidade investigativa

- A residencia parece estar ficando conhecida? Sim. O estado cognitivo passou de 0 para 7 sinais estruturais da residencia.
- Existe continuidade entre uma pergunta e outra? Nao. A troca entre perguntas ainda parece mecanica ou sem contexto suficiente.
- A investigacao parece conversa ou formulario? Conversa. A troca entre devolucao e pergunta fez a jornada soar interpretativa.
- As perguntas parecem consequencia da investigacao? Nao. A troca entre perguntas ainda ficou mais proxima de um cadastro do que de uma investigacao guiada.
- Log observado na execucao:
- air_conditioning_presence: Sim
- air_conditioning_count: 2
- dominant_usage_period: Noite
- cooking_type: Gas
- electric_oven_presence: Nao
- washing_machine_presence: Sim
- extra_fridge_presence: Nao

## Momento 6.3

### O Que Esta Por Tras da Conta

- O usuario consegue perceber que a Score esta compreendendo sua conta? Sim. As categorias evoluiram de forma coerente conforme a investigacao avancou.
- As categorias evoluem de forma coerente durante a investigacao? Sim. As categorias ligadas as respostas observadas ganharam compreensao ao longo da execucao.
- As mudancas parecem consequencia das respostas? Sim. As categorias mais relacionadas a resposta observada foram as que mudaram de estado.
- O painel transmite confianca sem parecer definitivo? Sim. O painel mostra categorias com sustentacao e tambem deixa algumas frentes em aberto.
- O usuario entende claramente o que ainda esta em aberto? Sim. As categorias em aberto seguem visiveis como parte da investigacao.

## Momento 7

### Primeiro Valor

- Qual foi o primeiro momento em que a Score entregou algo util? Quando a tela pronta exibiu uma pista principal e os tres numeros basicos do ciclo: valor total, consumo e custo medio.
- O upload valeu a pena? Parcialmente. O usuario recebe retorno real, mas ainda nao entende com precisao por que aquela pista importa agora.
- O usuario aprendeu algo novo? Sim, em nivel basico. Ele sai com ao menos um resumo numerico do ciclo e uma pista inicial a acompanhar.
- Esse momento aconteceu? sim. Quando aconteceu, foi mais forte como curiosidade orientada do que como compreensao fechada.

## Momento 8

### Proximo passo

- O usuario sabe exatamente o que fazer agora? Sim. A pergunta ativa concentra a atencao e as respostas estao no mesmo bloco do Hero.
- Existe apenas um CTA principal? Sim. A Hero registrou como acao dominante: `Responder pergunta ativa`.
- Existem CTAs concorrentes? Nao. Gatilhos de detalhe visiveis na Hero: `0`.
- Ou a jornada termina sem direcao? Nao. Existe um proximo passo dominante antes de abrir detalhes.

## Metricas cognitivas

- Tempo ate Primeiro Valor (TTFV): `20901` ms entre login concluido e primeira pista util observada.
- Numero de Perguntas ate Confianca (NPTC): 1 pergunta visivel antes da primeira confianca parcial.
- Compreensao da conta visivel: Sim. Justificativa: As categorias evoluiram de forma coerente conforme a investigacao avancou.
- Evolucao coerente das categorias: Sim.
- Categorias ligadas as respostas: Sim.
- Confianca sem finalismo: Sim.
- O que ainda esta em aberto continua visivel: Sim.
- Devolucao antes da proxima pergunta: Sim. Justificativa: Depois de cada resposta, a Hero entregou uma devolucao observavel antes de revelar a pergunta seguinte.
- Compreensao acumulada entre respostas: Sim.
- Conversa em vez de formulario: Sim.
- Proximo Passo Claro: Sim. Justificativa: A pergunta ativa concentra a atencao e as respostas estao no mesmo bloco do Hero.
- Conhecimento da residencia em progresso: Sim. Delta observado: `7`.
- Continuidade entre perguntas: Nao. Justificativa: A troca entre perguntas ainda parece mecanica ou sem contexto suficiente.
- Retorno Provavel: Sim, com mais conviccao. A jornada entrega uma pergunta orientada e uma devolucao observavel entre as etapas.

## Evolucao

### O que melhorou desde a auditoria anterior?

- Nenhuma melhoria nova foi reconhecida em relacao ao relatorio anterior.

### O que permanece igual?

- A leitura sobre a visibilidade da pergunta permaneceu estavel entre as auditorias.
- A contagem de gatilhos de detalhe na Hero permaneceu igual (0).
- A leitura sobre clareza do proximo passo permaneceu no mesmo patamar.
- A leitura sobre conhecimento progressivo da residencia permaneceu no mesmo patamar.
- A leitura sobre devolucao entre perguntas permaneceu no mesmo patamar.
- A leitura sobre visibilidade da compreensao da conta permaneceu no mesmo patamar.

### O que piorou?

- Nenhuma regressao nova foi detectada pela comparacao automatica.

### Maior obstaculo atual para percepcao de inteligencia

- O maior obstaculo atual deixou de ser a pergunta ativa e passou a ser a densidade interpretativa da fala inicial da Core.

## Artefatos

- `qa-artifacts\journey-qa\01-landing.png`
- `qa-artifacts\journey-qa\02-register.png`
- `qa-artifacts\journey-qa\03-profile-ready.png`
- `qa-artifacts\journey-qa\04-upload-ready.png`
- `qa-artifacts\journey-qa\06-after-upload.png`
- `qa-artifacts\journey-qa\07-details-open.png`
- `qa-artifacts\journey-qa\journey-trace.zip`
- `qa-artifacts\journey-qa\vite-server.log`

## Limitacoes

- console.error: Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED
- console.error: Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED

## Recomendacoes

- Tornar o feedback de upload persistente e menos dependente de toast temporario.
- Reforcar o contexto que liga uma pergunta a proxima antes de expandir novas trilhas.
- Revisar erros de runtime capturados no QA antes de ampliar a cobertura da jornada.
