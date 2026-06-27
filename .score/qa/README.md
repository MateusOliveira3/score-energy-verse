# QA Journey

## Objetivo

Executar uma jornada limpa e repetivel da Score em ambiente local, sem depender de email real nem de limpeza manual de banco.

## Comandos

```bash
npm run qa:seed-user
npm run qa:journey
```

## Credenciais QA locais

```text
email: qa.residencia.zero@score.local
senha: ScoreQA123!
```

## Quando usar cada comando

### `npm run qa:seed-user`

1. gera `qa-runtime.seed.json` para host local
2. cria ou reaproveita a conta QA local no browser que carregar a aplicacao
3. limpa sessao anterior, jornada persistida, identidade fallback e faturas locais desse usuario
4. deixa a conta pronta para simular um primeiro uso limpo
5. imprime as credenciais no terminal

Use este comando para QA manual no navegador ou para preparar uma conta previsivel antes de uma validacao exploratoria. Se a aplicacao ja estiver aberta, recarregue `/login` depois do seed para aplicar o runtime local no browser manual.

### `npm run qa:journey`

1. sobe a aplicacao local em Vite
2. forca provider local e auth local fallback para execucao repetivel
3. abre o navegador Chromium local via `playwright-core`
4. percorre landing, cadastro, login, perfil minimo e upload de fixture
5. captura screenshots e trace
6. gera o relatorio cognitivo institucional em `.score/qa/COGNITIVE_JOURNEY_AUDIT_001.md`

O `qa:journey` continua autonomo de proposito: ele ainda limpa o estado local e recria seu proprio usuario de teste para preservar a cobertura de primeiro cadastro e primeiro login. O `qa:seed-user` existe para acelerar QA manual e tornar esse seed reutilizavel pela equipe sem depender de conta real.

O seed manual agora e carregado pelo proprio navegador local via `/qa-runtime.js` + `/qa-runtime.seed.json`, entao o login manual funciona tanto em `dev` quanto em `preview`, desde que o host seja local e o seed tenha sido gerado.

## Ambiente esperado

- execucao local
- URL alvo em `127.0.0.1` ou `localhost`
- provider da jornada em modo `local`
- auth local fallback
- sem URL remota de producao configurada para a execucao de QA

## Garantias contra producao

Os scripts de QA abortam se detectarem sinais de ambiente inseguro, incluindo:

- `NODE_ENV=production`
- provider diferente de `local`
- URL remota de Supabase ou app publico configurada
- alvo diferente de `localhost`, `127.0.0.1` ou `::1`
- ausencia da confirmacao explicita interna de ambiente local seguro

## Como rodar uma jornada limpa

### QA manual

```bash
npm run qa:seed-user
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

Depois, abra ou recarregue `/login`, entre com as credenciais QA locais e siga a jornada a partir do login.

### QA automatizado

```bash
npm run qa:journey
```

## Dependencias operacionais

- `playwright-core`
- um navegador Chromium instalado localmente

Se o navegador nao for encontrado automaticamente, defina:

```bash
QA_BROWSER_EXECUTABLE=/caminho/do/navegador
```
