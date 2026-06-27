# 011 - Residential Energy Map Bathroom Block V1

## Contexto

A Score precisa voltar ao calculo util.

Nas ultimas sprints, avancamos na experiencia de investigacao, na visibilidade da compreensao e no alinhamento com o briefing.

Entretanto, o valor mais direto para o usuario e simples:

> Quanto cada parte da casa pesa na minha conta?

Neste momento, a Score nao precisa entregar um calculo isolado.

Ela precisa comecar a montar o Mapa Energetico da Residencia de forma simples, honesta e explicavel.

A arquitetura cognitiva nao sera abandonada.

Ela sera colocada a servico de uma resposta que o usuario entende em menos de 30 segundos.

## Objetivo

Criar o primeiro bloco do Mapa Energetico da Residencia.

A V1 deve comecar pelo fenomeno de maior impacto e melhor explicacao:

### Chuveiro eletrico

O chuveiro nao deve ser tratado como um calculo isolado.

Ele e a primeira peca do mapa.

A missao deve entregar uma funcao testavel capaz de estimar:

- consumo mensal em kWh
- custo estimado em R$
- percentual estimado da fatura
- contribuicao de cobertura para o mapa
- premissas utilizadas
- confianca da estimativa
- frase explicavel para a Core

## Mudanca de mentalidade

O produto da Score nao e estimar o chuveiro.

O produto da Score e transformar uma fatura em uma casa compreensivel.

Hoje:

- banheiro
- iluminacao
- refrigeracao
- lavanderia
- cozinha

Amanha:

- a Core podera dizer quanto da conta ja consegue explicar
- o usuario podera perceber progresso por compreensao, e nao por pontuacao

Exemplo de progresso esperado:

- hoje consigo explicar cerca de 30% da sua conta
- agora consigo explicar 58%
- ja compreendo aproximadamente 81%

## Principio de produto

A Score nao deve apenas perguntar.

A Score deve calcular de forma que o usuario sinta que cada resposta aproxima a plataforma de responder:

> Qual parte da minha casa mais pesa na conta?

Cada sprint deve transformar mais um pedaco da conta de luz em um pedaco compreensivel da residencia.

## Formula base

Para o chuveiro:

```text
potencia em kW x horas de uso por dia x dias do ciclo = consumo estimado em kWh
```

Onde:

```text
potencia em kW = potencia em W / 1000
```

E:

```text
horas de uso por dia = moradores x banhos por morador por dia x minutos por banho / 60
```

Depois:

```text
consumo estimado em kWh x tarifa media = custo estimado
```

Depois:

```text
custo estimado / valor total da fatura = percentual estimado da fatura
```

## Exemplo

Entrada:

- potencia: 5000 W
- moradores: 4
- minutos por banho: 12
- banhos por morador por dia: 1
- dias no ciclo: 30
- tarifa media: R$ 1,10/kWh
- valor total da fatura: R$ 440

Calculo:

```text
5 kW x 0,8 h/dia x 30 dias = 120 kWh/mes
```

```text
120 x R$ 1,10 = R$ 132
```

```text
132 / 440 = 30%
```

Saida esperada:

> O banheiro pode representar cerca de R$ 132 da sua conta, algo proximo de 30% da fatura. Usei como base 4 moradores, banhos de 12 minutos e chuveiro de 5.000 W.

## Escopo inicial obrigatorio

Implementar prioritariamente:

### 1. Banheiro via chuveiro eletrico

Obrigatorio.

### 2. Iluminacao

Opcional, apenas se for simples e nao aumentar complexidade.

### 3. Refrigeracao basica

Opcional, apenas se for simples e nao aumentar complexidade.

Se houver duvida, implementar somente banheiro com excelencia.

## Estrutura sugerida

Nao criar `showerEstimator.ts` como centro da ideia.

Preferir uma estrutura ja compativel com o futuro mapa:

```text
src/lib/energy-map/
  bathroom.ts
  index.ts
```

Direcao futura esperada:

```text
src/lib/energy-map/
  bathroom.ts
  lighting.ts
  kitchen.ts
  refrigeration.ts
  laundry.ts
  buildEnergyMap.ts
```

## Entrada minima para o bloco de banheiro

A funcao devera aceitar:

- `powerWatts`, opcional
- `residents`
- `minutesPerShower`
- `showersPerResidentPerDay`
- `cycleDays`
- `averageTariffPerKwh`
- `invoiceTotalValue`

## Defaults permitidos

Se `powerWatts` nao for informado, utilizar default conservador:

```text
5000 W
```

O default deve aparecer explicitamente nas premissas.

Nao esconder defaults.

## Saida esperada

Retornar objeto contendo ao menos:

- `room`
- `estimatedKwh`
- `estimatedCost`
- `estimatedShare`
- `coverageContribution`
- `confidence`
- `assumptions`
- `explanationForCore`
- `warnings` ou `limitations`, se necessario

Exemplo de shape:

```ts
{
  room: "bathroom",
  estimatedKwh: 120,
  estimatedCost: 132,
  estimatedShare: 30,
  coverageContribution: 30,
  confidence: "medium",
  assumptions: [...],
  explanationForCore: "...",
  warnings: [...]
}
```

## Composicao futura

O bloco de banheiro deve nascer compativel com uma futura composicao unica da residencia.

Exemplo de direcao:

```ts
buildEnergyMap()
```

Retornando algo como:

```ts
{
  coveragePercent: 30,
  rooms: [
    { room: "bathroom", estimatedShare: 30, estimatedCost: 132, coverageContribution: 30 }
  ]
}
```

## Relacao arquitetural esperada

O HouseModel nao e o produto final visivel para o usuario.

Ele deve alimentar:

```text
HouseModel
  ->
Energy Map
  ->
Core
```

O usuario nao precisa ver o HouseModel.

Ele precisa ver o mapa energetico.

## Confianca

A confianca nao deve ser alta quando a estimativa usar defaults importantes.

Exemplo:

- potencia informada + dados completos: confianca maior
- potencia default + dados completos: confianca media
- dados ausentes ou fatura invalida: confianca baixa ou estimativa indisponivel

Nao criar falsa precisao.

## Regras obrigatorias

- nao afirmar como certeza
- sempre dizer que e estimativa
- sempre mostrar as premissas
- nunca inventar dado se ele nao existir
- se faltar dado essencial, retornar estimativa indisponivel ou usar default explicito apenas quando autorizado
- nao gerar porcentagem se `invoiceTotalValue` for zero ou ausente
- nao quebrar com valores ausentes, zero ou invalidos
- nao alterar parser
- nao alterar backend
- nao alterar persistencia
- nao alterar UI
- nao alterar Hermes
- nao criar documento teorico grande
- nao criar novo Engine

## Testes obrigatorios

Criar testes cobrindo:

1. calcula kWh mensal do banheiro via chuveiro corretamente
2. calcula custo estimado usando tarifa media
3. calcula percentual da fatura
4. usa default de potencia quando potencia nao for informada
5. registra nas premissas quando usou default
6. nao retorna confianca alta quando usa defaults
7. gera frase explicavel para a Core
8. nao quebra com fatura ausente
9. nao calcula percentual com valor total da fatura zero
10. retorna estimativa indisponivel quando dados essenciais forem invalidos
11. retorna `coverageContribution` compativel com `estimatedShare`
12. retorna shape compativel com futura composicao do mapa

## O que nao fazer nesta missao

- nao conectar ainda a UI
- nao alterar fala da Core
- nao alterar painel "por tras da conta"
- nao criar calculo por todos os comodos
- nao criar estimativas complexas
- nao criar IA
- nao criar modelo causal completo

A missao e pequena, util, fundacional e orientada ao mapa.

## Impacto no usuario

Mesmo sem UI nesta missao, responder:

1. O que ficou mais util para o usuario?
2. Que pergunta real do usuario esse primeiro bloco aproxima a Score de responder?
3. Que dados ainda precisamos perguntar para melhorar a estimativa?
4. Como essa estimativa pode aparecer na fala da Core sem parecer certeza absoluta?
5. Qual comodo ou fenomeno deve entrar depois para aumentar a cobertura do mapa?

## Validacao

Executar:

```bash
npx tsc --noEmit
npm run test
npm run build
```

Nao e obrigatorio rodar `npm run qa:journey`, pois esta missao nao altera experiencia visual.

Se rodar, registrar separadamente.

## Reflection

Responder:

- O que ficou mais simples depois desta missao?
- Onde a estimativa ainda e fragil?
- Quais defaults podem gerar maior risco de interpretacao incorreta?
- O que precisa existir antes de conectar isso a Core?
- Como esta missao recoloca a Score no caminho do briefing?

## Futuro esperado

Este estimador nao representa um calculo isolado.

Ele representa o primeiro componente do Mapa Energetico da Residencia.

Todos os futuros estimadores deverao produzir resultados compativeis com uma futura composicao unica da residencia.

## Criterio de sucesso

Esta missao sera considerada concluida quando a Score possuir um calculo puro, testado e explicavel para responder, inicialmente:

> Quanto o banheiro pode pesar na minha conta?

Mas o verdadeiro sinal de acerto sera maior:

> Agora eu consigo enxergar qual pedaco da minha casa ja explica parte da conta e qual pedaco ainda falta mapear.
