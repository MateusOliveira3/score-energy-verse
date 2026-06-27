# Reflection Engine

## Objetivo

O Reflection Engine define como uma sprint da Score deve ser encerrada para que o desenvolvimento gere conhecimento institucional de forma continua.

Ele nao cria respostas prontas.

Ele cria o processo para descobrir, a partir da sprint concluida, se algo merece virar memoria oficial da `.score`.

## Principio central

Toda reflexao deve nascer da realidade observavel do repositorio.

As entradas validas sao:

- diff final da sprint
- arquivos criados ou alterados
- testes executados
- riscos identificados
- guardrails reafirmados
- documentos existentes em `docs/`
- comportamento real do produto ou da arquitetura

Nao usar:

- opinioes sem evidencia
- principios inventados para parecer organizacao
- generalizacoes que ainda apareceram so uma vez

## Momento de execucao

Toda sprint deve passar por reflection depois da implementacao e antes da consolidacao final.

Fluxo minimo:

1. revisar o objetivo da sprint
2. revisar o que realmente mudou
3. comparar as mudancas com guardrails, arquitetura e documentos existentes
4. identificar repeticoes e aprendizados
5. decidir se algo deve ou nao virar documentacao oficial

## Perguntas obrigatorias

Ao encerrar a sprint, a reflexao deve investigar:

- o que aprendemos nesta sprint?
- quais padroes apareceram?
- alguma decisao repetiu mais de tres vezes?
- algum comportamento virou principio?
- alguma convencao deveria virar documentacao oficial?
- algum documento da `.score` precisa ser atualizado?

## Metodo para responder

Para cada pergunta:

1. localizar evidencia concreta no codigo, nos testes ou nos documentos
2. separar o que foi evento isolado do que foi padrao
3. verificar se o mesmo comportamento ja apareceu em sprints anteriores
4. classificar o resultado em uma destas saidas:

- `nao consolidar ainda`
- `acompanhar nas proximas sprints`
- `consolidar na .score`

## Sinais de consolidacao

Um item deve ser candidato forte a consolidacao quando:

- apareceu em mais de uma sprint
- foi reafirmado por guardrail varias vezes
- virou convencao implicita no codigo
- explica uma decisao estrutural relevante
- reduz ambiguidade para implementacoes futuras

## Sinais de nao consolidacao

Nao consolidar quando:

- a decisao foi circunstancial
- o comportamento apareceu uma unica vez
- ainda existe disputa legitima sobre a direcao
- o conhecimento ainda nao encontrou sua forma estavel

## Saidas esperadas da reflection

A reflection deve sempre produzir:

- resumo do que foi aprendido
- lista de padroes observados
- lista de possiveis principios
- documentos da `.score` que talvez precisem revisao
- decisao explicita sobre consolidar agora ou esperar

## Destinos possiveis dentro da .score

Quando um item merecer consolidacao, ele deve ser encaminhado para a pasta adequada:

- `engineering/` para convencoes tecnicas
- `design/` para direcoes visuais repetidas
- `ux/` para padroes de jornada e clareza
- `language/` para nomenclatura e tom
- `nucleus/` para identidade conceitual do produto
- `brain/` para sinteses mais amplas de pensamento
- `roadmap/` para cadencias e organizacao do trabalho

## Regra de disciplina

Reflection nao existe para gerar volume documental.

Ela existe para evitar que a Score reaprenda a mesma coisa em toda sprint.
