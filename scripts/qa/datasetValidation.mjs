import { mkdir, rm, writeFile, readFile, stat } from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { chromium } from 'playwright-core';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const reportPath = resolve(rootDir, '.score', 'qa', 'QA_DATASET_VALIDATION_001.md');
const artifactsDir = resolve(rootDir, 'qa-artifacts', 'dataset-validation');
const serverLogPath = resolve(artifactsDir, 'vite-server.log');
const qaUrl = 'http://127.0.0.1:4173';

const cases = [
  {
    id: 'png-direct',
    uploadMode: 'input direto',
    fixturePath: resolve(rootDir, 'test-fixtures-invoices', 'qa-journey-fixture.png'),
  },
  {
    id: 'png-filechooser',
    uploadMode: 'file chooser',
    fixturePath: resolve(rootDir, 'test-fixtures-invoices', 'qa-journey-fixture.png'),
  },
  {
    id: 'pdf-direct',
    uploadMode: 'input direto',
    fixturePath: resolve(rootDir, 'test-fixtures-invoices', 'celesc-sample-01.pdf'),
  },
  {
    id: 'pdf-filechooser',
    uploadMode: 'file chooser',
    fixturePath: resolve(rootDir, 'test-fixtures-invoices', 'celesc-sample-01.pdf'),
  },
];

const timestamp = new Date().toISOString();
const branchName = await runAndRead('git', ['branch', '--show-current'], { cwd: rootDir });
const results = [];
const findings = [];
const recommendations = [];

await mkdir(resolve(rootDir, '.score', 'qa'), { recursive: true });
await rm(artifactsDir, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });

const fixtureMetadata = await collectFixtureMetadata();
const chromeExecutable = findBrowserExecutable();

if (!chromeExecutable) {
  throw new Error(
    'Nao foi possivel localizar um navegador Chromium local. Defina QA_BROWSER_EXECUTABLE para executar a validacao do dataset.'
  );
}

const serverLog = createWriteStream(serverLogPath, { flags: 'w' });
let serverProcess;
let browser;

try {
  serverProcess = startViteServer(serverLog);
  await waitForServer(`${qaUrl}/`, 60_000);

  browser = await chromium.launch({
    headless: true,
    executablePath: chromeExecutable,
    args: ['--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check'],
  });

  for (const testCase of cases) {
    results.push(await runCase(browser, testCase));
  }
} finally {
  if (browser) {
    await browser.close().catch(() => undefined);
  }

  await stopServerProcess(serverProcess);
  serverLog.end();
}

const pngCases = results.filter((item) => item.fixtureExt === '.png');
const pdfCases = results.filter((item) => item.fixtureExt === '.pdf');
const pngReachedReady = pngCases.every((item) => item.analysisStatus === 'ready');
const pdfReachedReady = pdfCases.every((item) => item.analysisStatus === 'ready');
const directVsChooserSame =
  serializeComparableCase(pngCases[0]) === serializeComparableCase(pngCases[1]) &&
  serializeComparableCase(pdfCases[0]) === serializeComparableCase(pdfCases[1]);

if (fixtureMetadata.qaFixture.matchesMobileScreenshot) {
  findings.push(
    'A fixture `qa-journey-fixture.png` nao representa uma conta de energia real: ela possui o mesmo hash SHA-256 de `qa-artifacts/mobile.png`, um screenshot previo do projeto.'
  );
}

if (pngCases.every((item) => item.parserTextSource === 'unsupported')) {
  findings.push(
    'Nos dois experimentos com PNG, o parser registrou `textSource=unsupported` e `rawTextAvailable=false`.'
  );
}

if (pdfCases.every((item) => item.parserTextSource === 'pdf-text')) {
  findings.push(
    'Nos dois experimentos com PDF real, o parser registrou `textSource=pdf-text` com campos canonicos preenchidos.'
  );
}

if (pngReachedReady && pdfReachedReady) {
  findings.push(
    'A jornada atingiu `analysis.status=ready` tanto com PNG quanto com PDF, portanto o travamento observado na Missao 038 nao foi um bloqueio persistente do estado de produto.'
  );
}

if (directVsChooserSame) {
  findings.push(
    'Nao houve diferenca material entre `input direto` e `file chooser`: nome, tipo, tamanho, `fingerprint`, `analysis.status` e saida do parser ficaram equivalentes por fixture.'
  );
}

if (pngReachedReady && pdfReachedReady && directVsChooserSame) {
  recommendations.push(
    'Atualizar a infraestrutura de QA principal para usar uma fixture representativa de conta real anonimizda em PDF, em vez do PNG derivado de screenshot.'
  );
}

recommendations.push(
  'Institucionalizar uma fixture oficial de energia anonimizda para QA, com validacao explicita da equipe e reutilizacao em testes automatizados.'
);

await writeReport({
  branchName,
  timestamp,
  browserLabel: chromeExecutable.toLowerCase().includes('edge') ? 'Edge local' : 'Chrome local',
  fixtureMetadata,
  results,
  findings,
  recommendations,
  conclusion: resolveConclusion({
    fixtureMetadata,
    pngReachedReady,
    pdfReachedReady,
    directVsChooserSame,
    results,
  }),
});

async function runCase(browserInstance, testCase) {
  const fixtureExt = extname(testCase.fixturePath).toLowerCase();
  const caseArtifactsDir = resolve(artifactsDir, testCase.id);
  await mkdir(caseArtifactsDir, { recursive: true });

  const context = await browserInstance.newContext({
    viewport: { width: 1440, height: 1200 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const runtimeErrors = [];
  const debugLogs = [];

  page.on('pageerror', (error) => {
    runtimeErrors.push(`pageerror: ${error.message}`);
  });

  page.on('console', (message) => {
    const text = message.text();

    if (message.type() === 'error') {
      runtimeErrors.push(`console.error: ${text}`);
    }

    if (text.includes('[invoice-parser]') || text.includes('[invoice-flow]')) {
      debugLogs.push(`${message.type()}: ${text}`);
    }
  });

  try {
    const startedAt = Date.now();
    const qaEmail = `qa.dataset.${testCase.id}.${Date.now()}@score.test`;
    const qaPassword = 'ScoreJourney123!';

    await page.goto(`${qaUrl}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.goto(`${qaUrl}/`, { waitUntil: 'networkidle' });

    await clickByText(page, 'Comecar a jornada');
    await page.waitForURL('**/registro', { timeout: 20_000 });

    await fillInputByFieldLabel(page, 'Email', qaEmail);
    await fillInputByFieldLabel(page, 'Senha', qaPassword, 0);
    await fillInputByFieldLabel(page, 'Confirmar senha', qaPassword, 0);
    await clickByText(page, 'Criar conta');
    await page.waitForURL('**/login', { timeout: 10_000 });

    await fillInputByFieldLabel(page, 'Email', qaEmail);
    await fillInputByFieldLabel(page, 'Senha', qaPassword, 0);
    await clickByText(page, 'Entrar no Nucleo');
    await page.waitForURL('**/perfil', { timeout: 20_000 });

    await clickByText(page, 'Completar perfil');
    await page.waitForSelector('text=Perfil do Usuario', { timeout: 10_000 });
    await fillInputByFieldLabel(page, 'Localizacao', 'Sao Paulo, SP');
    await fillInputByFieldLabel(page, 'Tamanho do Imovel (m2)', '120');
    await fillInputByFieldLabel(page, 'Numero de Pessoas ou Funcionarios', '4');
    await clickByText(page, 'Salvar Perfil');
    await page.waitForSelector('text=Selecionar fatura', { timeout: 20_000 });

    if (testCase.uploadMode === 'file chooser') {
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        clickByText(page, 'Selecionar fatura'),
      ]);
      await chooser.setFiles(testCase.fixturePath);
    } else {
      await page.locator('#file-upload').setInputFiles(testCase.fixturePath);
    }

    const processingAppeared = await page
      .waitForFunction(
        () => document.body.innerText.includes('Estou lendo sua conta deste ciclo.'),
        undefined,
        { timeout: 10_000 }
      )
      .then(() => true)
      .catch(() => false);

    const readyReached = await page
      .waitForFunction(
        () => {
          const key = Object.keys(window.localStorage).find((candidate) =>
            candidate.startsWith('score-energy:mvp-journey:v1:')
          );

          if (!key) {
            return false;
          }

          try {
            const state = JSON.parse(window.localStorage.getItem(key) || 'null');
            return state?.analysis?.status === 'ready';
          } catch (_error) {
            return false;
          }
        },
        undefined,
        { timeout: fixtureExt === '.pdf' ? 30_000 : 15_000 }
      )
      .then(() => true)
      .catch(() => false);

    await page.waitForTimeout(1_500);
    const snapshot = await readJourneySnapshot(page);
    const bodyText = await page.locator('body').innerText();
    const screenshotPath = resolve(caseArtifactsDir, 'final.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    return {
      id: testCase.id,
      uploadMode: testCase.uploadMode,
      fixturePath: relativeFromRoot(testCase.fixturePath),
      fixtureExt,
      processingAppeared,
      readyReached,
      elapsedMs: Date.now() - startedAt,
      analysisStatus: snapshot.analysisStatus,
      journeyStage: snapshot.journeyStage,
      latestInvoice: snapshot.latestInvoice,
      parserTextSource: snapshot.parserTextSource,
      rawTextAvailable: snapshot.rawTextAvailable,
      parserFields: snapshot.parserFields,
      storageKey: snapshot.storageKey,
      uploadSuccessVisible: bodyText.includes('Fatura recebida e adicionada a jornada'),
      uploadErrorVisible: bodyText.includes('Erro no processamento'),
      processingTitleVisible: bodyText.includes('Estou lendo sua conta deste ciclo.'),
      readyTitleVisible: bodyText.includes('Analisei sua conta de'),
      runtimeErrors,
      debugLogs: debugLogs.slice(-20),
      screenshotPath: relativeFromRoot(screenshotPath),
    };
  } finally {
    await context.close().catch(() => undefined);
  }
}

async function readJourneySnapshot(page) {
  return page.evaluate(() => {
    const storageKey = Object.keys(window.localStorage).find((candidate) =>
      candidate.startsWith('score-energy:mvp-journey:v1:')
    );

    if (!storageKey) {
      return {
        storageKey: undefined,
        analysisStatus: undefined,
        journeyStage: undefined,
        latestInvoice: undefined,
        parserTextSource: undefined,
        rawTextAvailable: undefined,
        parserFields: undefined,
      };
    }

    try {
      const state = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
      const latestInvoice = state?.analysis?.latestInvoice;
      const parser = latestInvoice?.parser;

      return {
        storageKey,
        analysisStatus: state?.analysis?.status,
        journeyStage: state?.journeyStage,
        latestInvoice: latestInvoice
          ? {
              fingerprint: latestInvoice.fingerprint,
              fileName: latestInvoice.fileName,
              fileType: latestInvoice.fileType,
              fileSize: latestInvoice.fileSize,
              month: latestInvoice.month,
            }
          : undefined,
        parserTextSource: parser?.textSource,
        rawTextAvailable: parser?.rawTextAvailable,
        parserFields: parser?.fields
          ? {
              referenceMonth: parser.fields.referenceMonth?.value,
              dueDate: parser.fields.dueDate?.value,
              totalValue: parser.fields.totalValue?.value,
              consumptionKwh: parser.fields.consumptionKwh?.value,
            }
          : undefined,
      };
    } catch (_error) {
      return {
        storageKey,
        analysisStatus: 'storage-parse-error',
        journeyStage: undefined,
        latestInvoice: undefined,
        parserTextSource: undefined,
        rawTextAvailable: undefined,
        parserFields: undefined,
      };
    }
  });
}

async function collectFixtureMetadata() {
  const qaFixturePath = resolve(rootDir, 'test-fixtures-invoices', 'qa-journey-fixture.png');
  const pdfFixturePath = resolve(rootDir, 'test-fixtures-invoices', 'celesc-sample-01.pdf');
  const mobileScreenshotPath = resolve(rootDir, 'qa-artifacts', 'mobile.png');

  const [qaFixture, pdfFixture, mobileScreenshot] = await Promise.all([
    readFixtureMetadata(qaFixturePath),
    readFixtureMetadata(pdfFixturePath),
    readFixtureMetadata(mobileScreenshotPath),
  ]);

  return {
    qaFixture: {
      ...qaFixture,
      matchesMobileScreenshot: qaFixture.sha256 === mobileScreenshot.sha256,
      matchedPath: relativeFromRoot(mobileScreenshotPath),
    },
    pdfFixture,
  };
}

async function readFixtureMetadata(filePath) {
  const [fileBuffer, fileStats] = await Promise.all([readFile(filePath), stat(filePath)]);

  return {
    path: relativeFromRoot(filePath),
    size: fileStats.size,
    sha256: createHash('sha256').update(fileBuffer).digest('hex'),
  };
}

function resolveConclusion({
  fixtureMetadata,
  pngReachedReady,
  pdfReachedReady,
  directVsChooserSame,
  results: caseResults,
}) {
  if (fixtureMetadata.qaFixture.matchesMobileScreenshot) {
    return 'fixture incorreta';
  }

  if (!directVsChooserSame) {
    return 'automacao incorreta';
  }

  if (caseResults.some((item) => item.runtimeErrors.length > 0 && item.analysisStatus !== 'ready')) {
    return 'produto incorreto';
  }

  if (pngReachedReady && pdfReachedReady) {
    return 'infraestrutura correta';
  }

  return 'inconclusivo';
}

async function writeReport({
  branchName: currentBranchName,
  timestamp: currentTimestamp,
  browserLabel,
  fixtureMetadata: currentFixtureMetadata,
  results: caseResults,
  findings: currentFindings,
  recommendations: currentRecommendations,
  conclusion,
}) {
  const experimentsLines = caseResults
    .map((result) => {
      const latestInvoice = result.latestInvoice
        ? `invoice=${result.latestInvoice.fileName} (${result.latestInvoice.fileType}, ${result.latestInvoice.fileSize} bytes)`
        : 'invoice=ausente';
      const parserSummary = `parser=${result.parserTextSource ?? 'indefinido'} rawText=${String(result.rawTextAvailable)}`;
      const stageSummary = `status=${result.analysisStatus ?? 'indefinido'} stage=${result.journeyStage ?? 'indefinido'}`;
      return `- \`${result.id}\`: fixture=\`${result.fixturePath}\`, modo=\`${result.uploadMode}\`, ${latestInvoice}, ${parserSummary}, ${stageSummary}, readyReached=${result.readyReached}, processingTitleVisible=${result.processingTitleVisible}`;
    })
    .join('\n');

  const evidenceBlocks = caseResults
    .map((result) => {
      const debugLogLines =
        result.debugLogs.length > 0
          ? result.debugLogs.map((line) => `  - ${line}`).join('\n')
          : '  - nenhum log debug capturado';
      const runtimeLines =
        result.runtimeErrors.length > 0
          ? result.runtimeErrors.map((line) => `  - ${line}`).join('\n')
          : '  - nenhum erro de runtime capturado';
      const parserFields = result.parserFields
        ? `referencia=${result.parserFields.referenceMonth ?? 'n/d'}, vencimento=${result.parserFields.dueDate ?? 'n/d'}, total=${result.parserFields.totalValue ?? 'n/d'}, consumo=${result.parserFields.consumptionKwh ?? 'n/d'}`
        : 'campos do parser nao disponiveis';

      return `### ${result.id}

- fixture: \`${result.fixturePath}\`
- modo: \`${result.uploadMode}\`
- storage key: \`${result.storageKey ?? 'nao encontrado'}\`
- elapsedMs: \`${result.elapsedMs}\`
- processing apareceu: \`${result.processingAppeared}\`
- readyReached: \`${result.readyReached}\`
- analysis.status: \`${result.analysisStatus ?? 'indefinido'}\`
- journeyStage: \`${result.journeyStage ?? 'indefinido'}\`
- upload success visivel: \`${result.uploadSuccessVisible}\`
- upload error visivel: \`${result.uploadErrorVisible}\`
- titulo processing visivel ao final: \`${result.processingTitleVisible}\`
- titulo ready visivel ao final: \`${result.readyTitleVisible}\`
- parser: \`${result.parserTextSource ?? 'indefinido'}\`
- rawTextAvailable: \`${result.rawTextAvailable}\`
- campos: ${parserFields}
- screenshot: \`${result.screenshotPath}\`
- runtime:
${runtimeLines}
- logs debug relevantes:
${debugLogLines}`;
    })
    .join('\n\n');

  const content = `# QA_DATASET_VALIDATION_001

## Ambiente

- data: \`${currentTimestamp}\`
- branch: \`${currentBranchName}\`
- URL testada: \`${qaUrl}\`
- navegador: \`${browserLabel}\`
- servidor local: \`${relativeFromRoot(serverLogPath)}\`

## Fixture

### qa-journey-fixture.png

- origem observada: \`${currentFixtureMetadata.qaFixture.path}\`
- formato: \`png\`
- tamanho: \`${currentFixtureMetadata.qaFixture.size}\` bytes
- sha256: \`${currentFixtureMetadata.qaFixture.sha256}\`
- representatividade: ${
    currentFixtureMetadata.qaFixture.matchesMobileScreenshot
      ? `nao representativa; hash identico a \`${currentFixtureMetadata.qaFixture.matchedPath}\``
      : 'nao conclusiva'
  }

### celesc-sample-01.pdf

- origem observada: \`${currentFixtureMetadata.pdfFixture.path}\`
- formato: \`pdf\`
- tamanho: \`${currentFixtureMetadata.pdfFixture.size}\` bytes
- sha256: \`${currentFixtureMetadata.pdfFixture.sha256}\`
- representatividade: PDF real anonimizdo ja usado nos testes de parser do repositorio

## Experimentos realizados

${experimentsLines}

## Evidencias

${currentFindings.map((item) => `- ${item}`).join('\n')}

${evidenceBlocks}

## Conclusao

\`${conclusion}\`

Base objetiva da conclusao:

- A fixture PNG atual nao representa uma conta real; ela e identica ao screenshot \`qa-artifacts/mobile.png\`.
- O parser aceita PDF real e extrai campos canonicos; com PNG ele registra \`unsupported\`.
- O fluxo automatizado atingiu \`analysis.status=ready\` nos casos observados, inclusive com \`file chooser\`, entao nao houve evidencia de diferenca material entre upload automatizado e upload manual-like.
- O problema principal da Missao 038 foi o experimento de QA ter usado uma fixture inadequada como evidencia de produto.

## Recomendacoes

${currentRecommendations.map((item) => `- ${item}`).join('\n')}
`;

  await writeFile(reportPath, content, 'utf8');
}

function serializeComparableCase(result) {
  return JSON.stringify({
    analysisStatus: result.analysisStatus,
    journeyStage: result.journeyStage,
    latestInvoice: result.latestInvoice,
    parserTextSource: result.parserTextSource,
    rawTextAvailable: result.rawTextAvailable,
    parserFields: result.parserFields,
    processingAppeared: result.processingAppeared,
    readyReached: result.readyReached,
    uploadSuccessVisible: result.uploadSuccessVisible,
    uploadErrorVisible: result.uploadErrorVisible,
    processingTitleVisible: result.processingTitleVisible,
    readyTitleVisible: result.readyTitleVisible,
  });
}

function startViteServer(serverLog) {
  const env = {
    ...process.env,
    CI: '1',
    VITE_MVP_JOURNEY_PROVIDER: 'local',
    VITE_SUPABASE_URL: '',
    VITE_SUPABASE_ANON_KEY: '',
  };

  const child =
    process.platform === 'win32'
      ? spawn(
          process.env.ComSpec || 'cmd.exe',
          ['/d', '/s', '/c', 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort'],
          {
            cwd: rootDir,
            env,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
          }
        )
      : spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
          cwd: rootDir,
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

  child.stdout.pipe(serverLog);
  child.stderr.pipe(serverLog);
  return child;
}

async function waitForServer(url, timeoutMs) {
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

async function clickByText(page, text) {
  await page
    .locator('button, a')
    .filter({ hasText: text })
    .first()
    .click();
}

async function fillInputByFieldLabel(page, label, value, index = 0) {
  const directLocator = page.getByLabel(label);
  const directCount = await directLocator.count();

  if (directCount > 0) {
    await directLocator.nth(index).fill(value);
    return;
  }

  const fieldLocator = page
    .locator('label')
    .filter({ hasText: label })
    .nth(index)
    .locator('..')
    .locator('input');
  const fieldCount = await fieldLocator.count();

  if (fieldCount === 0) {
    throw new Error(`Campo nao encontrado para label: ${label}`);
  }

  await fieldLocator.first().fill(value);
}

async function stopServerProcess(child) {
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

function findBrowserExecutable() {
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
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'];

  return candidates.find((candidate) => existsSync(candidate));
}

function relativeFromRoot(filePath) {
  return filePath.replace(`${rootDir}\\`, '').replace(`${rootDir}/`, '');
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAndRead(command, args, options) {
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
