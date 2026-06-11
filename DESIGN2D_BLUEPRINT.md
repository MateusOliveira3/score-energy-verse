# DESIGN2D Blueprint

## Objetivo

Transformar `reference design/design2D.png` em um blueprint tecnico de layout para orientar uma futura implementacao fiel ao visual da referencia, sem alterar logica funcional.

## Fonte analisada

- Arquivo: `reference design/design2D.png`
- Dimensoes da imagem: `1536 x 1024`
- Papel da imagem: especificacao visual principal do hub

## Leitura geral da composicao

- Estrutura macro: header superior fino + hub principal centralizado em duas colunas.
- Hierarquia dominante: coluna esquerda ampla com a jornada 2D; coluna direita mais estreita com score no topo e painel ativo abaixo.
- Sensacao visual: interface gamificada leve, escura no contorno geral, mas com uma cena central clara e de leitura imediata.
- Leitura priorizada em desktop: o usuario entende score, etapa e proxima acao sem scroll.

## Proporcao geral do layout

- Area util principal abaixo do header: aproximadamente `93%` da largura da tela.
- Coluna esquerda: aproximadamente `66%` do hub.
- Coluna direita: aproximadamente `32%` do hub.
- Espaco entre colunas: aproximadamente `1.5%` a `2%` da largura do hub.
- Razao visual aproximada esquerda/direita: `2.05 : 1`.

## Grid aproximado

- Grid macro: `12 colunas`.
- Distribuicao sugerida:
  - Esquerda: `8 colunas`
  - Gap: `0.5 a 1 coluna`
  - Direita: `3.5 a 4 colunas`
- Grid vertical interno do hub esquerdo:
  - Bloco de cabecalho textual
  - Cena 2D principal
  - Rodape do hub com progressao e card de proxima chamada
  - Faixa de acessos rapidos

## Medidas aproximadas do hub principal

- Altura do hub principal total: `860 a 890 px` dentro da imagem.
- Inicio do hub: cerca de `96 px` abaixo do topo da tela.
- Hub esquerdo:
  - largura aproximada: `945 a 960 px`
  - altura aproximada: `885 px`
- Hub direito:
  - largura aproximada: `480 a 495 px`
  - altura aproximada: `885 px`

## Blueprint de posicionamento

### Header

- Logo e nome no canto superior esquerdo.
- Navegacao e conta no topo direito.
- Altura visual do header: `70 a 80 px`.

### Painel esquerdo

- Container escuro com borda suave e cantos arredondados.
- Padding interno aproximado: `28 a 32 px`.

### Cabecalho do painel esquerdo

- Badge `JORNADA` no topo esquerdo.
- Titulo principal grande logo abaixo.
- Subtitulo curto imediatamente abaixo.
- Chips de contexto no topo direito do painel: `Residencial` e `3 faturas`.

### Cena da planta

- Posicao: centro do painel esquerdo, abaixo do bloco textual.
- Caixa da cena:
  - largura aproximada: `100%` da area interna disponivel
  - altura aproximada: `355 a 375 px`
- Fundo da cena:
  - claro, pastel, levemente esverdeado
  - sem profundidade dramatica
  - com nuvens simples e linhas horizontais discretas

### Posicao da planta

- Alinhamento horizontal: centralizado.
- Base da planta: encostada no solo visual.
- Posicao vertical: aproximadamente `72%` da altura da cena.

### Tamanho aproximado da planta

- Altura total visivel da planta com base de terra: `150 a 170 px`.
- Largura aproximada: `95 a 115 px`.
- Dominancia: pequena para media, nunca heroica.
- Papel visual: guia de progresso, nao protagonista absoluto.

### Posicao dos CO2

- Quantidade visivel: `3`.
- Alinhamento: borda direita da cena.
- Distribuicao vertical:
  - um em faixa alta, perto da linha `ALTO`
  - um em faixa media, perto da linha `MEDIO`
  - um em faixa baixa, perto da linha `BAIXO`
- Recuo da borda direita: `24 a 36 px`.

### Linhas de alcance

- Tres linhas horizontais tracejadas.
- Marcas laterais:
  - `ALTO` no terco superior
  - `MEDIO` no meio
  - `BAIXO` no terco inferior
- Linha media coincide aproximadamente com o balcao `ALCANCE MEDIO`.

### Card de alcance

- Posicao: acima da planta, centralizado.
- Dimensoes aproximadas: `100 a 120 px` de largura por `58 a 70 px` de altura.
- Aparencia: bloco verde compacto com pequena seta inferior.

### Progressao inferior

- Localizacao: imediatamente abaixo da cena, lado esquerdo do rodape do hub.
- Itens visiveis:
  - `Perfil`
  - `Fatura`
  - `Leitura`
  - `Acao`
  - `Proximo`
- Aparencia:
  - checkpoints circulares simples
  - linha horizontal ligando os pontos
  - item atual com destaque verde
- Largura ocupada: cerca de `60%` a `64%` do rodape do hub esquerdo.

### Card de proxima chamada

- Localizacao: abaixo da cena, lado direito do rodape do hub esquerdo.
- Largura relativa: `32%` a `36%` do rodape do painel esquerdo.
- Altura aproximada: `145 a 160 px`.
- Conteudo:
  - label pequeno `PROXIMA CHAMADA`
  - titulo curto da tarefa
  - CTA unico e claro

### Botoes inferiores

- Localizacao: faixa inferior do painel esquerdo, apos progressao e proxima chamada.
- Quantidade: `5`.
- Ordem visual:
  - `Score`
  - `Historico`
  - `Acoes`
  - `Leitura`
  - `Perfil`
- Tamanho relativo:
  - mesma altura
  - largura quase uniforme
- Espacamento entre botoes: `12 a 18 px`.

## Painel direito

### Score card

- Posicao: topo da coluna direita.
- Altura aproximada: `430 a 450 px`.
- Conteudo estrutural:
  - titulo `SCORE ENERGY`
  - score numerico grande
  - pill `Nivel 4` no topo direito
  - barra de progresso horizontal
  - metricas compactas em 3 cards
  - chips inferiores de contexto

### Painel ativo

- Posicao: logo abaixo do score card.
- Altura aproximada: `425 a 445 px`.
- Estrutura:
  - titulo `PAINEL ATIVO`
  - pill de estado no topo direito
  - titulo da acao atual
  - subtitulo curto
  - card interno de apoio
  - CTA inferior unico

## Espacamentos principais

- Margem externa do hub para a tela: `30 a 36 px`.
- Gap entre coluna esquerda e direita: `20 a 24 px`.
- Padding interno dos grandes cards: `26 a 32 px`.
- Gap vertical entre blocos internos: `18 a 24 px`.
- Distancia entre cena e rodape do hub esquerdo: `18 a 24 px`.
- Distancia entre score card e painel ativo: `22 a 28 px`.

## Paleta aproximada

- Fundo global: verde petroleo profundo
  - aproximacao: `#082c28` a `#0e3531`
- Container escuro do hub:
  - aproximacao: `#103a35` a `#15423b`
- Cena clara:
  - aproximacao: `#dcefd5`, `#eaf6e4`, `#f4fbef`
- Verde de destaque:
  - aproximacao: `#68b66f`
- Verde medio de cards:
  - aproximacao: `#3e7b59`, `#4f8f66`
- Texto principal claro:
  - aproximacao: `#f5f8f3`
- Texto secundario:
  - aproximacao: `#c5d8c8`
- Linha tracejada:
  - aproximacao: `#7da18d`

## Blueprint sintetico de layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: logo/esquerda + nav/conta/direita                                   │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ Painel esquerdo amplo         │ Painel direito estreito                      │
│ Badge jornada                 │ Score card                                  │
│ Titulo + subtitulo            │ - titulo                                    │
│ Chips de contexto             │ - numero grande                             │
│                               │ - nivel                                     │
│ Cena 2D clara                 │ - barra de progresso                        │
│ - linhas horizontais          │ - 3 metricas                               │
│ - planta pequena central      │ - chips de contexto                         │
│ - 3 CO2 na direita            │                                              │
│                               ├──────────────────────────────────────────────┤
│ Progressao inferior           │ Painel ativo                                │
│ Card proxima chamada          │ - titulo + estado                           │
│                               │ - acao atual                                │
│ Acessos rapidos               │ - card de apoio                             │
│ 5 botoes                      │ - CTA unico                                 │
└───────────────────────────────┴──────────────────────────────────────────────┘
```

## Diferencas em relacao a implementacao atual do workspace

- A referencia usa fundo global escuro e hub com contraste alto; a implementacao atual do workspace usa fundo geral claro.
- A referencia concentra toda a narrativa em um unico hub alto; a implementacao atual continua expandindo a experiencia para secoes adicionais abaixo do hub.
- A referencia inclui uma faixa de `Acessos rapidos` com 5 botoes no mesmo bloco principal; a implementacao atual nao reproduz essa faixa.
- A referencia posiciona a progressao inferior e o card de proxima chamada como rodape integrado do painel esquerdo; a implementacao atual simplifica essa base e remove parte da densidade funcional.
- A referencia mostra o score e o painel ativo como dois blocos grandes empilhados, visualmente equivalentes; a implementacao atual aproxima isso, mas com aparencia mais limpa e menos proxima do acabamento escuro original.
- A referencia tem cabecalho superior completo com navegação e conta dentro da mesma linguagem visual; a implementacao atual auditada aqui nao reproduz esse header dentro do hub.
- A referencia usa uma cena 2D mais “game screen”, com borda, solo e nuvens em linguagem mais ilustrada; a implementacao atual interpreta isso em CSS simplificado.
- A referencia tem score card com mais massa visual e microcards internos mais definidos; a implementacao atual usa uma versao mais enxuta.

## Recomendacao de implementacao

- Implementar primeiro a macroestrutura: `header + hub 2 colunas + rodape interno do painel esquerdo`.
- Tratar a coluna esquerda como composicao unica, sem quebrar a cena, progressao, proxima chamada e acessos rapidos em muitos containers concorrentes.
- Tratar a coluna direita como pilha fixa de dois blocos: `score` em cima, `painel ativo` embaixo.
- So depois ajustar detalhes de cena: planta, linhas, nuvens, `CO2` e badge de alcance.
- Preservar logica atual da jornada e usar este documento apenas como mapa visual para o refactor posterior.
