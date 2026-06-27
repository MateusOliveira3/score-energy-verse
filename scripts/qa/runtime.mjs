import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

export const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const qaUrl = 'http://127.0.0.1:4173';
export const qaReadmePath = resolve(rootDir, '.score', 'qa', 'README.md');
export const publicQaRuntimeSeedPath = resolve(rootDir, 'public', 'qa-runtime.seed.json');
export const distQaRuntimeSeedPath = resolve(rootDir, 'dist', 'qa-runtime.seed.json');
export const QA_LOCAL_CONFIRMATION = 'score-local-qa-confirmed';
export const QA_SEED_EMAIL = 'qa.residencia.zero@score.local';
export const QA_SEED_PASSWORD = 'ScoreQA123!';
export const QA_SEED_USER_ID = 'qa-seed-user-residencia-zero';

export const QA_README_CONTENT = `# QA Journey

## Objetivo

Executar uma jornada limpa e repetivel da Score em ambiente local, sem depender de email real nem de limpeza manual de banco.

## Comandos

\`\`\`bash
npm run qa:seed-user
npm run qa:journey
\`\`\`

## Credenciais QA locais

\`\`\`text
email: ${QA_SEED_EMAIL}
senha: ${QA_SEED_PASSWORD}
\`\`\`

## Quando usar cada comando

### \`npm run qa:seed-user\`

1. gera \`qa-runtime.seed.json\` para host local
2. cria ou reaproveita a conta QA local no browser que carregar a aplicacao
3. limpa sessao anterior, jornada persistida, identidade fallback e faturas locais desse usuario
4. deixa a conta pronta para simular um primeiro uso limpo
5. imprime as credenciais no terminal

Use este comando para QA manual no navegador ou para preparar uma conta previsivel antes de uma validacao exploratoria. Se a aplicacao ja estiver aberta, recarregue \`/login\` depois do seed para aplicar o runtime local no browser manual.

### \`npm run qa:journey\`

1. sobe a aplicacao local em Vite
2. forca provider local e auth local fallback para execucao repetivel
3. abre o navegador Chromium local via \`playwright-core\`
4. percorre landing, cadastro, login, perfil minimo e upload de fixture
5. captura screenshots e trace
6. gera o relatorio cognitivo institucional em \`.score/qa/COGNITIVE_JOURNEY_AUDIT_001.md\`

O \`qa:journey\` continua autonomo de proposito: ele ainda limpa o estado local e recria seu proprio usuario de teste para preservar a cobertura de primeiro cadastro e primeiro login. O \`qa:seed-user\` existe para acelerar QA manual e tornar esse seed reutilizavel pela equipe sem depender de conta real.

O seed manual agora e carregado pelo proprio navegador local via \`/qa-runtime.js\` + \`/qa-runtime.seed.json\`, entao o login manual funciona tanto em \`dev\` quanto em \`preview\`, desde que o host seja local e o seed tenha sido gerado.

## Ambiente esperado

- execucao local
- URL alvo em \`127.0.0.1\` ou \`localhost\`
- provider da jornada em modo \`local\`
- auth local fallback
- sem URL remota de producao configurada para a execucao de QA

## Garantias contra producao

Os scripts de QA abortam se detectarem sinais de ambiente inseguro, incluindo:

- \`NODE_ENV=production\`
- provider diferente de \`local\`
- URL remota de Supabase ou app publico configurada
- alvo diferente de \`localhost\`, \`127.0.0.1\` ou \`::1\`
- ausencia da confirmacao explicita interna de ambiente local seguro

## Como rodar uma jornada limpa

### QA manual

\`\`\`bash
npm run qa:seed-user
npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
\`\`\`

Depois, abra ou recarregue \`/login\`, entre com as credenciais QA locais e siga a jornada a partir do login.

### QA automatizado

\`\`\`bash
npm run qa:journey
\`\`\`

## Dependencias operacionais

- \`playwright-core\`
- um navegador Chromium instalado localmente

Se o navegador nao for encontrado automaticamente, defina:

\`\`\`bash
QA_BROWSER_EXECUTABLE=/caminho/do/navegador
\`\`\`
`;

export function createSafeQaEnv() {
  return {
    ...process.env,
    CI: '1',
    VITE_MVP_JOURNEY_PROVIDER: 'local',
    VITE_SUPABASE_URL: '',
    VITE_SUPABASE_ANON_KEY: '',
    SCORE_QA_LOCAL_CONFIRMATION: QA_LOCAL_CONFIRMATION,
  };
}

export async function ensureQaReadme() {
  await mkdir(resolve(rootDir, '.score', 'qa'), { recursive: true });
  await writeFile(qaReadmePath, QA_README_CONTENT, 'utf8');
}

export async function writeQaRuntimeArtifacts({
  createdAt = new Date().toISOString(),
  email = QA_SEED_EMAIL,
  password = QA_SEED_PASSWORD,
  seedVersion = `qa-seed-${Date.now()}`,
  userId = QA_SEED_USER_ID,
} = {}) {
  const runtimeSeed = JSON.stringify(
    {
      createdAt,
      email,
      password,
      seedVersion,
      userId,
    },
    null,
    2
  );

  await mkdir(resolve(rootDir, 'public'), { recursive: true });
  await writeFile(publicQaRuntimeSeedPath, runtimeSeed, 'utf8');

  let wroteDistRuntime = false;
  if (existsSyncSafe(resolve(rootDir, 'dist'))) {
    await writeFile(distQaRuntimeSeedPath, runtimeSeed, 'utf8');
    wroteDistRuntime = true;
  }

  return {
    createdAt,
    seedVersion,
    wroteDistRuntime,
    wrotePublicRuntime: true,
  };
}

export function assertSafeQaEnvironment({
  commandName,
  confirmation,
  env = process.env,
  targetUrl = qaUrl,
} = {}) {
  if (confirmation !== QA_LOCAL_CONFIRMATION) {
    throw new Error(
      `[${commandName ?? 'qa'}] Confirmacao explicita de ambiente local seguro ausente.`
    );
  }

  const nodeEnv = normalizeEnvValue(env.NODE_ENV);
  if (nodeEnv === 'production') {
    throw new Error(`[${commandName ?? 'qa'}] Abortado: NODE_ENV=production.`);
  }

  const provider = normalizeEnvValue(env.VITE_MVP_JOURNEY_PROVIDER || env.SCORE_MVP_JOURNEY_PROVIDER);
  if (provider && provider !== 'local') {
    throw new Error(
      `[${commandName ?? 'qa'}] Abortado: provider inseguro detectado (${provider}).`
    );
  }

  for (const [envKey, value] of Object.entries(env)) {
    if (!value || typeof value !== 'string') {
      continue;
    }

    if (!looksLikeRelevantUrlEnv(envKey)) {
      continue;
    }

    if (isUnsafeConfiguredUrl(value)) {
      throw new Error(
        `[${commandName ?? 'qa'}] Abortado: ${envKey} aponta para ambiente remoto (${value}).`
      );
    }
  }

  if (!isSafeLocalUrl(targetUrl)) {
    throw new Error(
      `[${commandName ?? 'qa'}] Abortado: URL alvo nao e local (${targetUrl}).`
    );
  }
}

export function findBrowserExecutable() {
  if (process.env.QA_BROWSER_EXECUTABLE) {
    return process.env.QA_BROWSER_EXECUTABLE;
  }

  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
      : process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
          ]
        : [
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/snap/bin/chromium',
          ];

  return candidates.find((candidate) => existsSyncSafe(candidate));
}

export function startViteServer(serverLog, { commandName = 'qa' } = {}) {
  assertSafeQaEnvironment({
    commandName,
    confirmation: QA_LOCAL_CONFIRMATION,
    env: process.env,
    targetUrl: qaUrl,
  });

  const env = createSafeQaEnv();
  const child =
    process.platform === 'win32'
      ? spawn(
          process.env.ComSpec || 'cmd.exe',
          [
            '/d',
            '/s',
            '/c',
            'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
          ],
          {
            cwd: rootDir,
            env,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
          }
        )
      : spawn(
          'npm',
          ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
          {
            cwd: rootDir,
            env,
            stdio: ['ignore', 'pipe', 'pipe'],
          }
        );

  child.stdout.pipe(serverLog);
  child.stderr.pipe(serverLog);

  child.on('exit', (code) => {
    if (code !== 0) {
      serverLog.write(`\n[vite-exit] code=${code}\n`);
    }
  });

  return child;
}

export async function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch (_error) {
      // retry
    }

    await delay(750);
  }

  throw new Error(`Servidor local nao respondeu em ${timeoutMs}ms.`);
}

export async function stopServerProcess(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === 'win32') {
    await runAndRead('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      cwd: rootDir,
    }).catch(() => undefined);
    return;
  }

  child.kill();
}

export async function runAndRead(command, args, options) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise(stdout.trim());
        return;
      }

      rejectPromise(new Error(stderr || stdout || `Falha ao executar ${command}`));
    });
  });
}

function existsSyncSafe(filePath) {
  try {
    return existsSync(filePath);
  } catch (_error) {
    return false;
  }
}

function normalizeEnvValue(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function looksLikeRelevantUrlEnv(envKey) {
  return /(SUPABASE_URL|PUBLIC_APP_URL|APP_URL|QA_TARGET_URL)$/i.test(envKey);
}

function isUnsafeConfiguredUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim();
  if (!normalized) {
    return false;
  }

  if (isSafeLocalUrl(normalized)) {
    return false;
  }

  if (normalized.includes('://')) {
    return true;
  }

  return /^https?:/i.test(normalized);
}

function isSafeLocalUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(value);
    return ['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname);
  } catch (_error) {
    return false;
  }
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
