# Sprint Lifecycle

Este e o ciclo oficial de engenharia da Score Energy.

```text
Ideia
↓
Discussao
↓
Planejamento
↓
Implementacao
↓
Reflection
↓
Consolidacao
↓
Review
↓
Merge
```

## 1. Ideia

Responsabilidade:

- formular a necessidade real
- explicitar o problema
- evitar começar por solucao antes de entender o objetivo

## 2. Discussao

Responsabilidade:

- alinhar produto, guardrails e impacto
- identificar conflitos entre inovacao e estabilidade
- separar o que e essencial do que e acessorio

## 3. Planejamento

Responsabilidade:

- definir escopo
- definir restricoes
- listar arquivos ou camadas envolvidas
- tornar explicito o que nao pode ser alterado

## 4. Implementacao

Responsabilidade:

- executar a mudanca no menor raio seguro
- reaproveitar arquitetura atual sempre que possivel
- validar sem reinventar contratos centrais

## 5. Reflection

Responsabilidade:

- revisar o que foi aprendido
- identificar padroes reais da sprint
- decidir se algo merece virar memoria institucional

Esta etapa segue o processo definido em `review/REFLECTION_ENGINE.md`.

## 6. Consolidacao

Responsabilidade:

- atualizar a `.score` somente quando existir evidencia suficiente
- mover conhecimento recorrente para documentacao oficial
- evitar que decisoes relevantes fiquem apenas no diff

## 7. Review

Responsabilidade:

- auditar regressao, estabilidade e aderencia ao escopo
- confirmar o que mudou e o que permaneceu intacto
- verificar build, testes e riscos conhecidos

## 8. Merge

Responsabilidade:

- integrar somente depois que implementacao, reflexao e review estiverem coerentes
- preservar historico claro de decisao
- evitar misturar trabalho nao relacionado

## Regra geral

O ciclo existe para manter a Score evoluindo sem perder identidade.

Se houver conflito entre velocidade e clareza estrutural, a decisao deve favorecer estabilidade.
