# .score

`.score` e a memoria institucional da Score Energy.

Ela existe para registrar por que o produto e a engenharia evoluem de determinada forma, sem misturar isso com a implementacao em `src/`.

## O que ela guarda

- principios que surgirem repetidamente do desenvolvimento real
- decisoes consolidadas depois de mais de uma sprint
- organizacao do conhecimento de produto, UX, linguagem e nucleo
- processos leves para revisao e consolidacao
- prompts-base e mecanismos de continuidade

## O que ela nao faz

- nao substitui o codigo
- nao redefine regras de negocio por conta propria
- nao cria verdade paralela ao que existe no repositorio
- nao deve ser preenchida com conhecimento hipotetico

## Como ela evolui

Novos documentos devem nascer de uma destas fontes:

- padroes repetidos no codigo
- decisoes recorrentes em sprints diferentes
- guardrails que precisaram ser reafirmados varias vezes
- documentacao existente em `docs/`
- comportamentos que viraram convencao do produto ou da engenharia

## Como novos documentos surgem

O fluxo esperado e:

1. uma sprint gera aprendizado real
2. a reflection identifica repeticao, padrao ou principio
3. o conhecimento e consolidado no lugar correto da `.score`
4. o documento passa a servir de referencia para sprints futuras

## Quem pode modificar

Qualquer pessoa contribuindo no repositorio pode atualizar a `.score`, desde que a mudanca:

- esteja ancorada no projeto real
- cite ou reflita comportamento existente
- nao invente processo desnecessario
- preserve simplicidade e estabilidade

## Quando atualizar

Atualize a `.score` quando:

- uma sprint encerrar com aprendizado recorrente
- uma decisao aparecer repetidamente
- um guardrail virar padrao
- um documento da propria `.score` estiver desatualizado em relacao ao repositorio

Se nao houver evidencia suficiente, o correto e nao documentar ainda.
