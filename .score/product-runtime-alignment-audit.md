# Product Runtime Alignment Audit

## Escopo

Auditoria de alinhamento entre a implementacao atual e a filosofia institucional da Score, com foco em:

- `PRODUCT_PHILOSOPHY.md`
- `PRODUCT_VISION.md`
- `SCORE_EXPERIENCE.md`
- `HERMES.md`
- `SCORE_APP.md`
- `DESIGN_PRINCIPLES.md`
- `VOICE.md`
- `DISCOVERY.md`
- `MEMORY.md`
- `PRODUCT_FLOW_2030.md`
- `ROADMAP_PRODUCT.md`

Arquivos comparados:

- `src/lib/productRuntime/productRuntime.ts`
- `src/lib/guidedConversation.ts`
- `src/components/nucleo/CorePresence.tsx`
- `src/components/nucleo/GuidedConversationSession.tsx`
- `src/pages/Index.tsx`

---

## Resumo executivo

O Product Runtime ja existe e materializa uma parte importante da Constituicao da Score: uma descoberta por vez, um CTA principal, memoria percebida, aprofundamento opcional e complexidade parcialmente escondida.

O principal desalinhamento atual nao esta no algoritmo de leitura.
Ele esta na fronteira entre runtime e superficie.

Hoje a Hero ja se aproxima de uma leitura com descoberta, meaning e acao, mas a aplicacao ainda mistura dois papeis:

- o App revelando leitura;
- a propria tela perguntando diretamente.

Em outras palavras:

A Score ja revela melhor do que antes.
Mas Hermes ainda nao esta suficientemente separado da superficie principal.

---

## Avaliacao dos 10 pontos

### 1. A tela atual respeita "Hermes conversa, Score revela"?

Classificacao: `Atencao`

O fluxo principal ja privilegia leitura antes de aprofundamento, e a Hero passou a mostrar descoberta, significado e proximo passo.

Mas a conversa ainda aparece diretamente dentro da superficie principal do App, especialmente quando a pergunta curta entra no proprio bloco da Hero. Isso reduz a separacao entre canal conversacional e canal de revelacao.

### 2. A Hero mostra uma descoberta ou ainda mostra um relatorio?

Classificacao: `OK`

A Hero atual ja se organiza majoritariamente como descoberta:

- abertura curta;
- protagonista unico;
- meaning;
- acao.

Ela nao abre mais com um relatorio tecnico nem com uma lista de achados equivalentes. O protagonismo principal ja saiu de um modo "painel de sistema" e foi para uma leitura mais focada.

### 3. Existe apenas um CTA principal?

Classificacao: `Atencao`

O Product Runtime ja materializa um CTA unico por leitura, e esse CTA virou parte central do objeto de runtime.

Mesmo assim, ainda existem caminhos secundarios proximos da superficie principal, como abertura de detalhes e botoes/toggles locais decididos no componente. O protagonismo principal existe, mas a disciplina de "um CTA por tela" ainda nao esta 100% consolidada na implementacao da superficie.

### 4. Existe complexidade visivel que deveria estar escondida?

Classificacao: `Violacao`

Partes da experiencia expandida ainda expoem linguagem e estruturas que parecem painel interno, diagnostico operacional ou mapa de investigacao em vez de leitura revelada.

Exemplos observados:

- "O que ja percebi"
- "Leitura por ambiente"
- contagem de "pistas"
- "Em aberto"
- nivel de compreensao por categoria

Mesmo fora da Hero, essa camada ainda deixa visivel mais complexidade filosofica do que a documentacao recomenda.

### 5. Alguma pergunta ainda aparece onde deveria existir Hermes?

Classificacao: `Violacao`

Sim.
Quando existe pergunta ativa, ela pode aparecer dentro da propria Hero em `CorePresence.tsx`, no bloco "Pergunta curta".

Isso contraria diretamente a filosofia registrada em:

- `PRODUCT_PHILOSOPHY.md`
- `HERMES.md`
- `SCORE_APP.md`
- `DESIGN_PRINCIPLES.md`

O App deveria revelar.
Hermes deveria conversar.

### 6. Algum texto parece dashboard, relatorio ou sistema?

Classificacao: `Violacao`

Ainda existem textos e estruturas que soam mais como sistema do que como leitura energetica.

Exemplos relevantes:

- `buildAccountUnderstandingPanel()` em `guidedConversation.ts`:
  - "Este painel nao mostra resposta final. Ele mostra o estado atual da compreensao da Score..."
- `Index.tsx`:
  - "Leitura expandida"
  - "Mais sobre esta conta"
  - tabs de aprofundamento por secao
- cards do painel de entendimento:
  - "1 pista"
  - "Em aberto"
  - niveis de compreensao

Esses elementos nao quebram a Hero principal, mas ainda fazem o aprofundamento parecer mais dashboard e relatorio do que lente de clareza.

### 7. O Product Runtime realmente decide o que aparece?

Classificacao: `Atencao`

Ele ja decide bastante:

- secoes visiveis;
- secoes ocultas;
- CTA principal;
- memoria conversacional;
- descoberta protagonista;
- sinais secundarios;
- disponibilidade de aprofundamento.

Mas ele ainda nao decide a composicao filosofica inteira da superficie.
Partes importantes continuam distribuindo regras de exibicao nos componentes React e no `guidedConversation.ts`.

### 8. Algum componente React ainda esta tomando decisao filosofica sozinho?

Classificacao: `Violacao`

Sim.

Os principais casos:

- `GuidedConversationSession.tsx`
  - monta fallbacks de titulo, mensagem, support e helperText com cadeias locais de prioridade;
- `CorePresence.tsx`
  - decide `ctaLabel`;
  - decide `detailSection`;
  - decide quando pergunta entra na Hero;
- `Index.tsx`
  - decide a estrutura de aprofundamento e suas secoes conceituais.

Esses componentes nao estao apenas renderizando.
Eles ainda interpretam a filosofia em tempo de tela.

### 9. Quais principios ja estao materializados?

Classificacao: `OK`

Principios claramente materializados:

- uma descoberta por vez;
- CTA principal unico no runtime;
- memoria percebida;
- aprofundamento opcional;
- complexidade parcialmente escondida;
- Hero como protagonista;
- descoberta + meaning + action;
- valor antes de mais perguntas;
- leitura inicial antes de explicacao metodologica.

### 10. Quais principios ainda sao apenas documentacao?

Classificacao: `Atencao`

Principios ainda incompletos ou parcialmente documentais:

- Hermes conversa em canal proprio;
- perguntas fora da superficie principal;
- App nao parecer dashboard nem no aprofundamento;
- componentes React nao tomarem decisoes filosoficas;
- Product Runtime como autoridade plena de composicao;
- silencio visual total no segundo plano;
- aprofundamento sem linguagem de auditoria interna.

---

## Achados classificados

### OK

#### OK 1 — O Product Runtime ja existe como camada real

Arquivo: `src/lib/productRuntime/productRuntime.ts`

O runtime nao e apenas conceito.
Ele ja organiza descoberta, acao, visibilidade, aprofundamento, memoria e CTA.

Isso materializa no codigo a passagem de filosofia para regra executavel.

#### OK 2 — A Hero ja privilegia descoberta, meaning e acao

Arquivos:

- `src/lib/guidedConversation.ts`
- `src/components/nucleo/GuidedConversationSession.tsx`

A Hero nao abre mais com um racional tecnico.
Ela abre com leitura percebida, protagonista unico e significado curto.

#### OK 3 — Memoria ja comeca a ser percebida

Arquivo: `src/lib/guidedConversation.ts`

A camada `buildConversationMemory()` ja aproxima a experiencia da ideia de continuidade sem inventar intimidade nem explicar mecanismo.

#### OK 4 — Aprofundamento ja foi rebaixado para segundo plano

Arquivos:

- `src/pages/Index.tsx`
- `src/components/nucleo/CorePresence.tsx`

O aprofundamento nao nasce mais como superficie principal.
Ele depende de abertura posterior.

---

### Atencao

#### Atencao 1 — O CTA principal existe, mas a disciplina ainda nao esta completamente centralizada

O runtime ja define CTA, mas a interface ainda mantem decisoes locais de rotulo, abertura e navegacao secundaria.

#### Atencao 2 — O Product Runtime ainda nao e autoridade total da superficie

Ele decide parte importante do que aparece, mas ainda nao resolve sozinho a narrativa completa, os fallbacks e o lugar filosofico da pergunta.

#### Atencao 3 — A tela principal esta mais proxima de "Score revela", mas Hermes ainda nao foi isolado

A experiencia melhorou bastante, mas a conversa ainda e parcialmente encenada dentro do App.

---

## Violacoes

### Violacao 1

- Principio violado: `Hermes conversa. Score revela.`
- Onde aparece: `src/components/nucleo/CorePresence.tsx`
- Por que viola:
  - A Hero ainda pode renderizar a pergunta diretamente no bloco principal, em vez de manter a superficie como leitura e deixar a pergunta como continuidade conversacional.
  - Isso mistura canal de revelacao com canal de conversa.
- Correcao sugerida:
  - Remover a pergunta ativa da Hero principal.
  - Manter a Hero como leitura.
  - Rebaixar a pergunta para uma continuidade secundaria ou para uma camada explicitamente hermetica/conversacional.
- Prioridade: `alta`

### Violacao 2

- Principio violado: `Nenhum componente React deve decidir a filosofia sozinho.`
- Onde aparece:
  - `src/components/nucleo/GuidedConversationSession.tsx`
  - `src/components/nucleo/CorePresence.tsx`
  - `src/pages/Index.tsx`
- Por que viola:
  - Ainda existem cadeias locais de fallback e decisoes de composicao que deveriam nascer do Product Runtime.
  - Os componentes ainda escolhem texto protagonista, CTA efetivo, secao de aprofundamento e comportamento da pergunta.
- Correcao sugerida:
  - Expandir o Product Runtime para definir com mais precisao:
    - tipo de abertura;
    - papel da pergunta;
    - secao de aprofundamento padrao;
    - CTA efetivo;
    - blocos realmente renderizaveis.
  - Reduzir componentes para papel de renderer.
- Prioridade: `alta`

### Violacao 3

- Principio violado: `O app nao deve parecer dashboard.`
- Onde aparece:
  - `src/pages/Index.tsx`
  - `src/components/nucleo/GuidedConversationSession.tsx`
  - `src/lib/guidedConversation.ts`
- Por que viola:
  - O aprofundamento ainda expõe secoes, categorias, estados e contagens que pedem leitura analitica do usuario.
  - O painel de entendimento por ambiente ainda soa como painel de auditoria ou painel interno.
- Correcao sugerida:
  - Reescrever o aprofundamento para linguagem de leitura e memoria consolidada.
  - Reduzir ou esconder indicadores como "pistas", "em aberto" e niveis de compreensao.
  - Trocar estruturas de navegacao por secoes tecnicas por camadas mais silenciosas de revelacao.
- Prioridade: `media`

### Violacao 4

- Principio violado: `Complexidade escondida.`
- Onde aparece:
  - `buildAccountUnderstandingPanel()` em `src/lib/guidedConversation.ts`
  - painel de detalhe em `src/pages/Index.tsx`
- Por que viola:
  - O texto "estado atual da compreensao da Score" e a classificacao por categoria com niveis e pistas expõem bastidor cognitivo demais.
- Correcao sugerida:
  - Reposicionar esse painel como camada estritamente interna ou reformular seu conteudo para memoria e leitura consolidada, sem linguagem de mecanismo.
- Prioridade: `media`

### Violacao 5

- Principio violado: `Nunca parecer relatorio.`
- Onde aparece:
  - `src/pages/Index.tsx`
  - `src/lib/guidedConversation.ts`
- Por que viola:
  - Termos como "Leitura expandida", "Mais sobre esta conta", "Leitura por ambiente" e textos explicativos de painel ainda soam como relatorio organizado, nao como experiencia revelada.
- Correcao sugerida:
  - Reescrever o aprofundamento com linguagem mais proxima de descoberta acumulada, memoria da casa e comparacoes utilitarias.
- Prioridade: `media`

---

## Principios ja materializados no codigo

- Uma descoberta por vez.
- Um CTA principal no runtime.
- Valor antes da interacao adicional.
- Meaning entre descoberta e acao.
- Memoria percebida.
- Aprofundamento opcional.
- Hero como superficie de leitura.
- Complexidade mais escondida do que nas sprints anteriores.

---

## Principios ainda mais documentais do que executaveis

- Hermes como canal realmente separado da superficie principal.
- Product Runtime como unica autoridade de composicao filosofica.
- Perguntas fora da Hero.
- Aprofundamento sem cara de dashboard.
- Silencio visual mais radical.
- Superficie principal quase encerrada apos Hero + CTA.

---

## Recomendacao da proxima sprint

Recomendacao principal:

**Separar definitivamente leitura e pergunta na superficie.**

Direcao sugerida:

1. Fazer o Product Runtime decidir explicitamente se a pergunta aparece, onde aparece e com qual papel.
2. Remover pergunta ativa de dentro da Hero.
3. Rebaixar o aprofundamento tecnico para uma camada menos seccionada e menos analitica.
4. Transformar componentes React em renderizadores mais literais do runtime.

Se houver apenas uma prioridade para a proxima sprint, ela deve ser:

**tirar a conversa da Hero sem perder continuidade.**

---

## Conclusao

A implementacao atual ja representa um avanço real em relacao a fases anteriores.
O produto ja mostra sinais claros de:

- foco;
- descoberta protagonista;
- memoria percebida;
- acao unica;
- maior silencio.

Mas ainda existe um desalinhamento estrutural entre a filosofia oficial e a superficie real:

o App ainda conversa mais do que deveria,
e os componentes ainda pensam mais do que deveriam.

O Product Runtime ja nasceu.
Agora ele precisa virar autoridade de verdade.
