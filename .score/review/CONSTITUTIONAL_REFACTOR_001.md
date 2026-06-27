# Constitutional Refactor 001

## Objetivo

Reduzir a distancia entre a Constituicao da Score e a experiencia central do `/perfil`, com foco exclusivo no ecossistema do `DynamicContextPanel` e na forma como a jornada aprofundada aparece para o usuario.

Esta sprint nao criou regra nova, nao alterou dominio, nao mexeu em parser, score, ranking, persistencia, backend ou assistente.

## Auditoria inicial

Antes da refatoracao, o `DynamicContextPanel` ja traduzia partes importantes do pensamento da Score, mas fazia isso como um agregador muito amplo.

Ele acumulava ao mesmo tempo:

- traducao de leitura atual
- relacao com historico
- continuidade da proxima acao
- aprendizado energetico
- feedback de memoria
- perguntas estrategicas
- historico visual
- estado de upload
- composicao visual de seis experiencias diferentes

Essa concentracao criava uma tensao institucional: o painel ajudava a Score a explicar a jornada, mas sua propria estrutura ainda parecia um hub de cards, nao um tradutor do Nucleo.

Separacao encontrada na auditoria:

- Nucleo: leitura atual, relacao entre sinais, continuidade da jornada e limites explicitos
- Memoria Energetica: continuidade do que foi confirmado sobre o usuario
- Conhecimento Energetico: aprendizado adquirido pelo usuario
- Assistente: aprofundamento sob demanda, sem competir com a interface
- Interface: transicoes, barra historica, CTA, composicao e foco visual

## Ajustes realizados

### 1. O `DynamicContextPanel` deixou de concentrar tudo em um unico arquivo

Foi criada uma camada pura em [src/lib/dynamicContextPanel.ts](/C:/Users/Pichau/score-energy-verse/src/lib/dynamicContextPanel.ts) para reunir:

- helpers de leitura
- normalizacao de textos
- configuracao de diagnostico adaptativo
- formatacao de historico
- tipos de feedback local

Com isso, a camada visual deixou de carregar regras utilitarias demais.

### 2. O painel passou a ser composto por tradutores menores

Foram extraidos componentes com responsabilidades explicitas:

- [DynamicContextSummaryView](/C:/Users/Pichau/score-energy-verse/src/components/dynamic-context/DynamicContextSummaryView.tsx)
- [DynamicContextHistoryView](/C:/Users/Pichau/score-energy-verse/src/components/dynamic-context/DynamicContextHistoryView.tsx)
- [DynamicContextActionsView](/C:/Users/Pichau/score-energy-verse/src/components/dynamic-context/DynamicContextActionsView.tsx)
- [DynamicContextKnowledgeView](/C:/Users/Pichau/score-energy-verse/src/components/dynamic-context/DynamicContextKnowledgeView.tsx)
- [DynamicContextProfileView](/C:/Users/Pichau/score-energy-verse/src/components/dynamic-context/DynamicContextProfileView.tsx)

O `DynamicContextPanel` permaneceu como orquestrador de estado local e selecao de visao, mas deixou de ser o lugar onde todas as responsabilidades visuais e cognitivas se misturavam.

### 3. A experiencia central do `/perfil` ficou menos modular e mais guiada

Em [src/pages/Index.tsx](/C:/Users/Pichau/score-energy-verse/src/pages/Index.tsx), os nomes e descricoes das camadas secundarias foram reescritos para reforcar leitura guiada:

- `Perfil e configuracao` virou `Base da jornada`
- `Leitura detalhada` virou `Leitura do ciclo`
- `Acoes e diagnostico adaptativo` virou `Continuidade do ciclo`
- `Historico de faturas` virou `Evolucao entre contas`
- `Memoria Energetica e Conhecimento Energetico` virou `O que permanece com a Score`

O bloco antes descrito como `Camadas complementares` tambem passou a explicitar que cada camada existe para melhorar uma decisao, e nao para expor mais modulos.

## Evidencias de alinhamento

### Mais proximo do DESIGN

- O usuario aprofunda a leitura em vez de alternar entre modulos nomeados como departamentos do produto.
- Conhecimento Energetico ganhou um tradutor proprio, separado de leitura, historico e memoria.
- Historico deixou de soar como deposito de faturas e passou a comunicar evolucao entre ciclos.
- Proxima acao passou a aparecer mais claramente como continuidade da jornada.

### Mais proximo do NUCLEUS

- O resumo sintetiza.
- O historico mostra relacao entre ciclos.
- Acoes representam orientacao.
- Perfil sustenta contexto.
- Conhecimento representa o que o usuario aprendeu.

Essa separacao aproxima o painel da logica `observa`, `relaciona`, `memoriza` e `orienta`, mesmo sem mudar nenhum contrato de dominio.

## Coerencia antes

- Boa intencao institucional.
- Boa cobertura funcional.
- Excesso de concentracao em um unico componente.
- Fronteiras cognitivas pouco explicitas.
- Experiencia ainda com cheiro de agregador de informacoes.

## Coerencia depois

- Mesma funcionalidade.
- Mesma logica de negocio.
- Menos concentracao estrutural.
- Fronteiras mais claras entre leitura, continuidade, memoria e aprendizado.
- Copys mais coerentes com jornada e entendimento.

## O que ficou mais simples

- Ler e manter o ecossistema do `DynamicContextPanel`.
- Entender o papel de cada visao sem percorrer um arquivo gigante.
- Evoluir o painel sem misturar conhecimento, memoria, historico e continuidade no mesmo bloco.

## O que ficou mais proximo do DESIGN

- A interface parece mais aprofundamento de leitura do que navegacao de modulos.
- O aprendizado do usuario ganhou um lugar mais nitido.
- A acao deixou de soar como CTA solto e passou a soar como continuidade.

## O que ficou mais proximo do NUCLEUS

- O painel hoje traduz melhor estados cognitivos diferentes.
- Leitura, relacao, memoria e orientacao aparecem com menos interferencia entre si.
- O sistema continua invisivel como infraestrutura e mais visivel como entendimento.

## Qual parte da Score antiga ainda permaneceu

- A experiencia do `/perfil` ainda depende de uma selecao explicita de secoes secundarias abaixo do Nucleo.
- O `DynamicContextPanel` ainda centraliza parte do estado local de feedback e diagnostico adaptativo.
- Ainda existe heranca de um hub contextual multiproposito, mesmo que mais organizado.

## Inconsistencias remanescentes

- O `DynamicContextPanel` continua sendo um ponto importante de acoplamento entre fluxo, feedback local e apresentacao.
- O ecossistema do mascote ainda convive com a logica de painel lateral/abaixo do Nucleo, em vez de habitar uma experiencia completamente propria.
- A distincao entre detalhes secundarias e aprofundamento principal ainda pode evoluir mais em uma sprint futura de UX.

## Proximo alvo natural

O alvo natural da proxima refatoracao constitucional e a fronteira entre:

- Nucleo principal
- ecossistema do mascote
- paineis secundarios de aprofundamento

Hoje essa fronteira esta melhor nomeada e melhor organizada, mas ainda nao esta totalmente resolvida como experiencia.

## Validacao

- `npm.cmd run test` -> 80 testes passaram
- `npm.cmd run build` -> build de producao passou

Observacoes de validacao:

- O bloqueio inicial do PowerShell foi contornado executando `npm.cmd`.
- O build exibiu apenas warnings nao bloqueantes de chunk size e `browserslist` desatualizado.

## Nota institucional atualizada

Esta sprint reduziu contradicoes sem criar novidade artificial.

O produto ficou mais proximo da Constituicao porque o `DynamicContextPanel` passou a representar melhor o papel de tradutor do Nucleo, e nao apenas de agregador visual de informacoes.
