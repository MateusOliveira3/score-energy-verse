# HouseModel Adapter V1

## Objetivo

Criar a primeira ponte read-only entre o estado atual da Score e o `HouseModel` cognitivo, sem tocar no produto em execucao.

## O que foi criado

- `src/lib/cognitive/buildHouseModelFromJourney.ts`
- `src/lib/cognitive/buildHouseModelFromJourney.test.ts`
- export publico em `src/lib/cognitive/index.ts`
- documentacao tecnica em `docs/cognitive/HOUSE_MODEL_ADAPTER_V1.md`

## O que o adaptador reaproveita

- fatura atual e historico
- `analysisSummary`
- `memorySnapshot`
- respostas estrategicas
- `energyBehaviorProfile`
- `knowledgeState`

## O que ele NAO faz

- nao persiste HouseModel
- nao altera parser
- nao altera score
- nao altera ranking
- nao altera Hermes
- nao altera contratos centrais
- nao muda UI

## Resultado institucional

A Score agora consegue montar um esqueleto cognitivo inicial da residencia usando apenas sinais que ja existem no sistema. Isso preserva estabilidade e prepara a proxima camada sem acoplamento prematuro.

## Limites percebidos

- a cobertura de testes do projeto ainda depende de um entrypoint unico
- o build e os testes continuam sujeitos ao problema ambiental ja observado neste workspace
- a leitura de `residenceType` permanece `unknown` porque o estado atual nao oferece evidencia suficiente
