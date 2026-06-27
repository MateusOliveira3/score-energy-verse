# Investigation Runtime V1

`applyInvestigationAnswer(input)` e o primeiro runtime read-only/action-ready da investigacao da casa.

## O que ele faz

Recebe:

- `house`
- `clue`
- `answer`

E devolve:

- uma copia atualizada do `HouseModel`
- uma nova `Evidence`
- as hipoteses afetadas
- uma unica `nextInvestigation`
- uma fala curta para a Core

## Como resposta vira evidencia

Toda resposta do usuario vira `Evidence` com `source: "user_answer"`.

Essa evidencia usa o `answer.id` para manter id estavel e deterministico. Assim, o runtime pode ser testado sem depender de relogio, banco ou efeitos externos.

## Como evidencia afeta hipotese

Quando a resposta esta ligada a uma hipotese:

- resposta positiva fortalece de forma conservadora
- resposta negativa enfraquece sem descartar automaticamente
- resposta ambigua registra contexto, mas pede mais leitura

Uma unica resposta nunca confirma a hipotese. O runtime pode mover a pista de `low` para `medium`, mas nao salta para certeza.

## Como comodo ganha entendimento

Quando a resposta esta ligada a um comodo:

- o `understandingLevel` sobe de forma controlada
- o valor nunca passa de `100`
- a area entra em `knownAreas`
- a lacuna correspondente pode sair de `unknownAreas`

## Por que nao ha persistencia ainda

Esta V1 existe para validar a transformacao cognitiva com funcoes puras:

- sem UI
- sem backend
- sem Supabase
- sem Hermes
- sem gravacao

Isso deixa o comportamento auditavel, reproduzivel e seguro antes de integracoes maiores.

## Por que a Core nao deve afirmar certeza cedo demais

O runtime foi desenhado para preservar prudencia:

- nao confirma causa com uma unica resposta
- nao cria percentual inventado
- nao cria economia estimada
- nao transforma ausencia de confirmacao em descarte automatico

A Core continua humana e util, mas sem fingir certeza antes da hora.
