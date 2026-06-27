# Experience Boundary Final Audit

## Escopo

Auditoria final da fronteira Hermes/Score apos a implementacao da Experience Boundary.

Arquivos revisados:

- `src/lib/productRuntime/productRuntime.ts`
- `src/lib/guidedConversation.ts`
- `src/components/nucleo/CorePresence.tsx`
- `src/components/nucleo/GuidedConversationSession.tsx`
- `src/pages/Index.tsx`
- `PRODUCT_PHILOSOPHY.md`
- `HERMES.md`
- `SCORE_APP.md`

---

## Resumo

A fronteira Hermes/Score agora existe de forma real no codigo.

O `Product Runtime` ja separa:

- `experience.hermes`
- `experience.score`

e os componentes principais da experiencia pronta passaram a consumir essa estrutura.

O maior avanço foi este:

Hermes deixou de ser apenas intencao de copy e passou a ser um bloco executavel do runtime.

O maior ponto pendente e este:

o App ainda carrega residuos de linguagem conversacional e de painel interno fora da Hero pronta, especialmente em estados pre-ready, transicoes pos-resposta e aprofundamento.

---

## 1. Onde Hermes ainda aparece dentro do App?

### 1.1 Hero pronta

Hermes ainda aparece explicitamente na Hero pronta por meio de:

- `experience.hermes.line`
- `experience.hermes.message`
- `experience.hermes.question`

Isso e aceitavel, porque hoje o App esta simulando a chegada da revelacao apos uma conversa iniciada pelo Hermes.

### 1.2 Estados pre-ready

Hermes ainda aparece de forma implicita e manual em estados fora do runtime:

- `loading`
- `profile`
- `upload`
- `processing`

Nesses estados, a abertura ainda vem de `viewModel.opening` e `viewModel.corePresence`, nao de uma estrutura `hermes/score` dentro do runtime.

### 1.3 Pos-resposta

Hermes ainda aparece parcialmente na transicao pos-resposta, mas sem passar por `Product Runtime`.

Hoje essa camada nasce em:

- `buildAnswerValueReturn()`
- `buildMemoryFeedback()`
- `describeAdaptiveAnswer()`

---

## 2. Onde Score ainda parece conversar demais?

### 2.1 Pergunta curta dentro da Hero

Em `CorePresence.tsx`, a Hero ainda pode renderizar:

- `Pergunta curta`
- prompt
- helperText
- opcoes

Isso ja vem do runtime, o que e bom.
Mas filosoficamente ainda deixa o App perguntando em vez de apenas revelar.

### 2.2 Blocos transitorios de resposta

Depois de uma resposta, o App ainda mostra textos como:

- `O que mudou na leitura`
- `Continuar leitura`
- mensagens montadas por `describeAdaptiveAnswer`

Isso melhora continuidade, mas ainda tem tom de conversa dentro da propria superficie do App.

### 2.3 Aprofundamento com tom de explicacao guiada

No aprofundamento, parte da experiencia ainda parece conduzir interpretacao com tom mais dialogado do que revelado.

---

## 3. Onde React ainda decide filosofia?

### 3.1 Estados pre-ready em `GuidedConversationSession.tsx`

Ainda existe decisao filosofica manual em:

- qual abertura mostrar;
- qual tom usar;
- como apresentar `loading`, `profile`, `upload`, `processing`.

Isso ainda nao esta materializado no runtime.

### 3.2 Feedback pos-resposta

React e a camada da sessao ainda decidem:

- quando mostrar feedback transitório;
- qual titulo usar;
- quando limpar feedback;
- quando revelar a pergunta novamente.

### 3.3 Aprofundamento em `Index.tsx`

`Index.tsx` ainda decide filosofia em:

- `detailMeta`
- nomes das secoes
- descricao das secoes
- estrutura de navegacao do aprofundamento

Isso ainda nao vem do `Product Runtime`.

---

## 4. Onde Product Runtime ja manda corretamente?

### 4.1 Hero pronta

Na experiencia `ready`, o runtime ja decide de forma correta:

- linha de Hermes;
- memoria percebida;
- descoberta protagonista;
- meaning;
- acao;
- sinais secundarios;
- preview de aprofundamento;
- alvo de aprofundamento;
- pergunta ativa.

### 4.2 Fronteira conceitual

`productRuntime.ts` ja materializa claramente:

- Hermes fala;
- Score revela;
- pergunta pertence a Hermes;
- descoberta/meaning/acao pertencem a Score.

### 4.3 CTA principal da leitura

O CTA principal e sua orientacao geral ja nascem do runtime:

- `question`
- `deep_reading`

Isso reduziu bastante a interpretacao filosofica local nos componentes.

---

## 5. Quais estados pre-ready ainda precisam entrar no runtime?

Os quatro estados abaixo ainda precisam de uma versao runtime-aware:

- `loading`
- `profile`
- `upload`
- `processing`

Hoje eles ainda dependem de:

- `buildOpening()`
- `buildCorePresence()`
- composicao manual em `GuidedConversationSession.tsx`

O ideal futuro seria que o runtime tambem pudesse devolver algo como:

- `experience.hermes.preReady`
- `experience.score.preReady`

ou outra estrutura equivalente, para manter a mesma fronteira antes do estado `ready`.

---

## 6. Quais textos transitorios pos-resposta ainda vazam filosofia?

Os principais:

- `O que mudou na leitura`
- `Continuar leitura`
- `Ainda preciso cruzar esse contexto com o restante da leitura antes de afirmar qualquer conclusao mais forte.`
- `Isso ajuda a encaixar melhor essa parte da casa na leitura.`

Esses textos nao sao ruins.
Mas ainda nao estao claramente sob o dominio do runtime.

Eles continuam mais proximos de uma camada de orquestracao local da sessao do que de uma fronteira formal Hermes/Score.

---

## 7. O que deve ser mostrado ao Claude?

Se o proximo passo for pedir leitura critica para o Claude, vale mostrar:

- `PRODUCT_PHILOSOPHY.md`
- `HERMES.md`
- `SCORE_APP.md`
- `src/lib/productRuntime/productRuntime.ts`
- `src/lib/guidedConversation.ts`
- `src/components/nucleo/CorePresence.tsx`
- `src/components/nucleo/GuidedConversationSession.tsx`
- `src/pages/Index.tsx`

E pedir foco em:

- separacao Hermes/Score;
- estados pre-ready;
- transicoes pos-resposta;
- aprofundamento;
- o quanto o App ainda parece conversar.

---

## 8. O que ainda nao deve ser mostrado ao Claude?

Ainda nao vale puxar o Claude para:

- parser;
- backend;
- investigation internals;
- discovery engine;
- meaning rules internas;
- refatoracao ampla de arquitetura;
- detalhes de persistencia;
- ajustes de algoritmo.

Nesta fase, o assunto correto para o Claude e:

**superficie, runtime de experiencia e fronteira de papeis.**

---

## Top 3 alinhamentos

### 1. O runtime agora separa Hermes e Score de forma explicita

Esse e o maior alinhamento.
Nao e mais apenas copy.
E estrutura executavel.

### 2. A Hero pronta passou a consumir a fronteira certa

Na experiencia `ready`, a Hero ja se organiza a partir de:

- Hermes line/memory/question
- Score discovery/meaning/action/deepReading

### 3. O Product Runtime ja comanda a experiencia mais importante

O momento central do produto, que e a leitura pronta da conta, ja esta muito mais governado pelo runtime do que pelo React.

---

## Top 3 desalinhamentos

### 1. Estados pre-ready ainda vivem fora do runtime

Isso impede que a separacao Hermes/Score seja completa em toda a experiencia.

### 2. Pos-resposta ainda e mais sessao do que runtime

A transicao depois de responder ainda tem logica e copy filosofica espalhadas fora do `Product Runtime`.

### 3. O aprofundamento ainda parece painel demais

Em `Index.tsx`, a camada expandida ainda tem mais cara de sistema/painel do que de leitura revelada.

---

## Recomendacao final

**Fazer mais um ajuste antes de chamar o Claude.**

Motivo:

O nucleo da fronteira ja esta bom o suficiente, mas ainda existe um ultimo bloco de incoerencia facil de apontar:

- estados pre-ready;
- feedback pos-resposta;
- aprofundamento.

Se esse ajuste minimo vier antes, o Claude provavelmente vai entrar num terreno mais limpo, com foco mais alto e menos ruido estrutural.

Se a decisao for chamar agora mesmo, ainda faz sentido.
Mas o melhor momento parece ser:

**depois de levar pre-ready e transicoes curtas um passo mais perto do runtime.**

---

## Conclusao

A separacao Hermes conversa / Score revela ja foi materializada na parte mais importante da experiencia.

Ela ainda nao esta completa.

Mas deixou de ser filosofia solta e passou a ser arquitetura de superficie.
