# Environment Diagnostic 001

## Objetivo

Investigar por que `npm run test` e `npm run build` falhavam antes de validar o codigo, com erro:

- `Cannot read directory "..": Access is denied.`

## Comandos executados

Dentro do sandbox:

- `npm.cmd run test`
- `npm.cmd run build`
- `npx.cmd tsc --noEmit`
- `npm.cmd ls vite vitest`
- `Get-ChildItem ..`
- `fs.statSync(...)` e `fs.readdirSync(..)` via Node
- probe minimo com `esbuild`

Fora do sandbox:

- `Get-ChildItem ..`
- `npm.cmd run test`
- `npm.cmd run build`

## Achados principais

### 1. O erro nao veio do modulo cognitive

Evidencias:

- `npx.cmd tsc --noEmit` passou dentro do sandbox.
- O build falhava antes mesmo de carregar `vite.config.ts`.
- O runner de testes falhava antes mesmo de resolver `src/lib/mvpJourneyState.test.ts`.
- O problema aparecia tambem em probe minimo com `esbuild`, sem depender do fluxo novo.

Conclusao:

O modulo `src/lib/cognitive/` nao foi a causa do bloqueio observado.

### 2. O problema estava na leitura do diretorio pai do repo

Evidencias:

- `Get-ChildItem ..` falhou dentro do sandbox com acesso negado em `C:\Users\Pichau`.
- `fs.readdirSync(path.resolve(process.cwd(), '..'))` falhou dentro do sandbox com `EPERM`.
- `fs.statSync(...)` no mesmo caminho funcionou.
- `esbuild` falhou com `Cannot read directory "..": Access is denied.`

Conclusao:

O ambiente permitia verificar existencia de caminhos, mas nao enumerar o diretorio pai do repositório. Isso e suficiente para quebrar `esbuild` e `vite`, que sobem a arvore de diretorios e fazem `scandir` durante resolucao de arquivos/configuracoes.

### 3. O TypeScript puro nao dependia desse acesso

Evidencia:

- `npx.cmd tsc --noEmit` passou normalmente dentro do sandbox.

Conclusao:

O compilador TypeScript, nesse caminho especifico do projeto, conseguiu validar os arquivos sem precisar enumerar `C:\Users\Pichau` da mesma forma que `esbuild`/`vite`.

### 4. O problema nao foi causado pelo import do novo teste em `mvpJourneyState.test.ts`

Evidencias:

- O build tambem falhava em `vite.config.ts`, que nao depende desse import.
- O erro principal era o mesmo: leitura negada de `..`.
- Ao rodar fora do sandbox, os testes passaram com o import atual sem qualquer ajuste adicional.

Conclusao:

O acoplamento do teste novo dentro de `mvpJourneyState.test.ts` nao foi a origem da falha ambiental.

## Validacao final

Fora do sandbox:

- `npm.cmd run test` passou com `85/85` testes verdes.
- `npm.cmd run build` passou com sucesso.

Dentro do sandbox:

- `npm.cmd run test` falhou por restricao de acesso do ambiente.
- `npm.cmd run build` falhou pela mesma restricao.

## Causa provavel

Restricao do ambiente/sandbox Windows que impede `scandir` no diretorio pai do repo (`C:\Users\Pichau`).

Como `vite` e o runner atual de testes dependem de `esbuild`, e `esbuild` tenta enumerar diretorios acima do projeto durante a resolucao, o processo falha antes de validar o codigo.

## Impacto sobre o Cognitive Module

- O modulo foi validado por TypeScript dentro do sandbox.
- O modulo foi validado pelos testes completos fora do sandbox.
- Nao ha evidencia de regressao causada pelo adaptador `buildHouseModelFromJourney`.

## Recomendacao

- Tratar isso como limitacao do ambiente de execucao sandboxado, nao como defeito do produto.
- Quando for necessario validar `vite` ou `esbuild` neste workspace, rodar fora do sandbox ou com permissao ampliada.
- Nao introduzir workaround artificial no produto apenas para contornar essa restricao ambiental.
