import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const reviewsRoot = resolve(rootDir, '.score', 'reviews');
const latestDir = resolve(reviewsRoot, 'latest');
const tmpArtifactsDir = resolve(rootDir, 'qa-artifacts', 'review-package');
const previewLogPath = resolve(tmpArtifactsDir, 'preview.log');
const qaUrl = process.env.REVIEW_PACKAGE_URL || 'http://127.0.0.1:4173';
const invoiceFixturePath = resolve(rootDir, 'test-fixtures-invoices', 'celesc-sample-01.pdf');
const qaEmail = 'qa.residencia.zero@score.local';
const qaPassword = 'ScoreQA123!';
const productDocPaths = [
  'PRODUCT_VISION.md',
  'PRODUCT_PHILOSOPHY.md',
  'HERMES.md',
  'SCORE_APP.md',
  'VOICE.md',
  'DISCOVERY.md',
  'MEMORY.md',
  'SCORE_EXPERIENCE.md',
];
const auditDocPaths = [
  '.score/product-runtime-alignment-audit.md',
  '.score/experience-boundary-final-audit.md',
  '.score/qa/UX_AUDIT_001.md',
  '.score/qa/COGNITIVE_JOURNEY_AUDIT_001.md',
];

const now = new Date();
const isoTimestamp = now.toISOString();
const reviewDate = isoTimestamp.slice(0, 10);
const branchName = await runAndRead('git', ['branch', '--show-current'], { cwd: rootDir }).catch(
  () => 'unknown-branch'
);
const commitHash = await runAndRead('git', ['rev-parse', 'HEAD'], { cwd: rootDir }).catch(
  () => null
);
const reviewSlug = resolveReviewSlug({
  argv: process.argv.slice(2),
  branchName,
});
const datedDir = resolve(reviewsRoot, `${reviewDate}-${reviewSlug}`);
const screenshotsDir = resolve(datedDir, 'screenshots');
const videoTempDir = resolve(tmpArtifactsDir, 'video');

const captureState = {
  errors: [],
  screenshots: [],
  video: {
    generated: false,
    mp4Generated: false,
    reason: '',
    relativePath: null,
  },
};

await mkdir(reviewsRoot, { recursive: true });
await mkdir(tmpArtifactsDir, { recursive: true });

const docs = await loadSourceDocuments();
const audits = await loadAuditDocuments();
const productChanges = await collectProductChangeFiles();

await rm(datedDir, { recursive: true, force: true });
await mkdir(screenshotsDir, { recursive: true });

await runCommand(commandForCurrentPlatform('npm'), ['run', 'qa:seed-user'], { cwd: rootDir });

const captureResult = await captureReviewAssets({
  datedDir,
  screenshotsDir,
});

const knownLimitations = buildKnownLimitations({
  audits,
  captureResult,
});

const generatedDocs = buildReviewDocuments({
  audits,
  branchName,
  captureResult,
  commitHash,
  docs,
  isoTimestamp,
  knownLimitations,
  productChanges,
  reviewDate,
  reviewSlug,
});

for (const [name, content] of Object.entries(generatedDocs)) {
  await writeFile(resolve(datedDir, name), content, 'utf8');
}

const manifest = await buildManifest({
  branchName,
  captureResult,
  commitHash,
  datedDir,
  isoTimestamp,
  reviewDate,
  reviewSlug,
});

await writeFile(resolve(datedDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2), 'utf8');

await rm(latestDir, { recursive: true, force: true });
await cp(datedDir, latestDir, { recursive: true });

async function loadSourceDocuments() {
  const entries = await Promise.all(
    productDocPaths.map(async (filePath) => {
      const absolutePath = resolve(rootDir, filePath);
      const content = await readFile(absolutePath, 'utf8');

      return [filePath, content];
    })
  );

  return Object.fromEntries(entries);
}

async function loadAuditDocuments() {
  const entries = await Promise.all(
    auditDocPaths.map(async (filePath) => {
      const absolutePath = resolve(rootDir, filePath);
      const content = await readFile(absolutePath, 'utf8').catch(() => '');

      return [filePath, content];
    })
  );

  return Object.fromEntries(entries);
}

async function collectProductChangeFiles() {
  const output = await runAndRead('git', ['status', '--short'], { cwd: rootDir }).catch(() => '');

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[A-Z?]+\s+/, '').trim())
    .filter((filePath) => !filePath.startsWith('.score/reviews/'))
    .filter((filePath) => !filePath.startsWith('scripts/review/'))
    .filter((filePath) => filePath !== 'package.json');
}

function buildReviewDocuments({
  audits,
  branchName,
  captureResult,
  commitHash,
  docs,
  isoTimestamp,
  knownLimitations,
  productChanges,
  reviewDate,
  reviewSlug,
}) {
  const screenshots = captureResult.screenshots.map((item) => `- \`${item.relativePath}\``).join('\n');
  const changelogFiles = productChanges.length > 0
    ? productChanges.map((filePath) => `- \`${filePath}\``).join('\n')
    : '- Nenhum arquivo adicional de produto foi detectado no working tree desta revisao.';
  const limitationsList = knownLimitations.map((item) => `- ${item}`).join('\n');
  const videoLine = captureResult.video.relativePath
    ? `- Video fallback gerado: \`${captureResult.video.relativePath}\``
    : `- Video mp4 nao gerado: ${captureResult.video.reason}`;
  const reviewGoal =
    'Validar se a experiencia atual do app realmente materializa a filosofia "Hermes conversa. Score revela." sem voltar a parecer dashboard, formulario ou sistema interno.';
  const currentState =
    'A Hero ja trabalha com descoberta protagonista, meaning, acao unica e aprofundamento opcional. Os estados pre-ready e o pos-resposta foram aproximados do runtime, e o aprofundamento foi limpo para soar mais como leitura do que como painel.';
  const philosophySummary =
    'Hermes e o canal de conversa, memoria e acompanhamento. Score App e a superficie de revelacao visual. O usuario deve sentir que alguem ja trabalhou por ele antes de pedir qualquer esforco adicional.';
  const sprintChangeSummary =
    'A ultima sprint de produto empurrou tres pontos para mais perto da filosofia oficial: estados pre-ready dentro do Product Runtime, feedback pos-resposta com menos linguagem de sistema e aprofundamento com copy mais humana.';
  const unchangedSummary =
    'Nao mudaram parser, backend, HouseModel, InvestigationState, NextBestQuestion, Product Runtime calculando novos sinais, UI base ou arquitetura cognitiva. A revisao deve focar superficie, narrativa e fronteira de papeis.';
  const validationTargets = [
    'Se a Hero parece leitura pronta ou ainda carrega relatorio interno.',
    'Se existe apenas um proximo passo dominante e se ele parece consequencia da leitura.',
    'Se o app revela melhor do que conversa.',
    'Se o aprofundamento secundario continua silencioso e util.',
    'Se a experiencia esta com gosto de produto e nao de sistema.',
  ];

  const review = `# Review

## Objetivo desta revisao

${reviewGoal}

## Estado atual do produto

${currentState}

Hoje a experiencia principal ja responde com mais clareza:

- quanto foi a conta;
- quanto consumiu;
- o que mais parece pesar;
- qual leitura vale aprofundar agora.

Os artefatos desta pasta refletem o estado atual da branch \`${branchName}\` em \`${reviewDate}\`.

## Filosofia do produto

${philosophySummary}

Em uma frase:

Hermes cria vinculo e continuidade.  
Score App cristaliza leitura, significado e acao.

## O que mudou na sprint sob revisao

${sprintChangeSummary}

## O que nao mudou

${unchangedSummary}

## O que desejamos validar

${validationTargets.map((item) => `- ${item}`).join('\n')}

## Artefatos principais deste pacote

- \`BRIEFING.md\`
- \`CHANGELOG.md\`
- \`KNOWN_LIMITATIONS.md\`
- \`SCREENSHOTS.md\`
- \`CLAUDE_PROMPT.md\`
- pasta \`screenshots/\`

## Contexto de revisao

- branch: \`${branchName}\`
- commit: \`${commitHash ?? 'nao disponivel'}\`
- gerado em: \`${isoTimestamp}\`
`;

  const briefing = `# Briefing

## Tese central

A Score existe para transformar uma conta em clareza percebida. Ela nao quer apenas calcular consumo. Ela quer revelar o que mais pesa, o que mudou e o que merece atencao agora.

## Divisao de papeis

- Hermes conversa, acompanha, pergunta pouco e retorna com contexto.
- Score App revela a leitura energetica, a descoberta mais util, seu significado e a proxima acao.

## Como o produto deve soar

- claro;
- humano;
- sereno;
- educativo sem parecer aula;
- especifico sem explicar algoritmo;
- seguro sem ser absoluto.

## O que o produto deve evitar

- parecer dashboard;
- parecer chatbot comum;
- parecer formulario;
- parecer relatorio tecnico;
- mostrar bastidores cognitivos na superficie principal.

## O que uma boa leitura deve entregar

- uma descoberta protagonista;
- um significado curto;
- uma acao unica;
- memoria percebida;
- aprofundamento opcional.

## Regra de ouro para esta revisao

Se a experiencia parece escrita para impressionar, ela esta errada.  
Se parece organizada para clarear, ela esta mais perto do norte da Score.
`;

  const changelog = `# Changelog

## Sprint sob revisao

Experience Boundary Cleanup, consolidada nesta branch antes da criacao do pacote de review.

## Arquivos alterados na superficie/produto

${changelogFiles}

## Impacto percebido

- a abertura ficou mais coerente com a fronteira Hermes/Score;
- estados pre-ready passaram a depender menos de decisao filosofica no React;
- o pos-resposta ficou menos mecanico e menos sistemico;
- o aprofundamento ficou mais humano e menos painel.

## Reflection

- o produto esta mais silencioso visualmente;
- a Hero esta mais perto de viver sozinha;
- o App esta mais proximo de revelar do que de conversar;
- ainda existe espaco para tornar o detalhe expandido ainda menos estrutural.
`;

  const knownLimitationsDoc = `# Known Limitations

${limitationsList}

## Observacao visual

${videoLine}
`;

  const screenshotsDoc = `# Screenshots

## Capturas geradas

${screenshots || '- Nenhuma captura foi gerada.'}

## Video

${captureResult.video.relativePath
  ? `- Fallback em video: \`${captureResult.video.relativePath}\``
  : `- \`flow.mp4\` nao foi gerado. Motivo: ${captureResult.video.reason}`}

## Falhas registradas

${captureResult.errors.length > 0
  ? captureResult.errors.map((item) => `- ${item}`).join('\n')
  : '- Nenhuma falha de captura registrada.'}
`;

  const claudePrompt = `# Claude Prompt

Voce esta revisando a experiencia atual do produto Score Energy.

Leia este pacote inteiro antes de opinar:

- REVIEW.md
- BRIEFING.md
- CHANGELOG.md
- KNOWN_LIMITATIONS.md
- SCREENSHOTS.md
- screenshots/

Contexto central:

- Hermes conversa.
- Score revela.
- O app nao deve parecer dashboard.
- O app nao deve parecer formulario.
- O app nao deve parecer chatbot.
- O usuario deve sentir que alguem ja trabalhou por ele antes de pedir mais contexto.

Seu objetivo e fazer uma critica severa, honesta e de alto nivel sobre a experiencia atual do produto.

Foque especialmente em:

1. Se a Hero parece uma descoberta revelada ou ainda parece um relatorio.
2. Se a fronteira entre Hermes e Score esta clara.
3. Se o app esta silencioso o suficiente.
4. Se o aprofundamento ainda parece painel, sistema ou auditoria interna.
5. Se a experiencia transmite gosto de produto maduro.
6. Se a narrativa parece premium, inevitavel e clara.

Leve em conta a sensibilidade de produto e interface que se espera de empresas como:

- Apple
- Google
- Microsoft
- OpenAI
- Linear
- Duolingo
- Notion

Quero que voce use essas referencias nao para copiar estilo visual, mas para avaliar disciplina de produto, clareza, foco, hierarquia, ritmo e eliminacao de ruido.

Responda obrigatoriamente nestas secoes:

## 1. Veredito executivo

Em 5 a 10 linhas, diga se a experiencia esta pronta para uma fase mais seria de refinamento externo ou se ainda carrega ruido estrutural demais.

## 2. O que esta forte

Liste os pontos que realmente aproximam a Score de um produto memoravel.

## 3. O que ainda esta fraco

Liste os pontos que ainda fazem a experiencia parecer sistema, dashboard, fluxo interno ou conversa mal resolvida.

## 4. Top 5 problemas prioritarios

Para cada problema:

- nome curto;
- por que isso importa;
- onde aparece;
- severidade: alta / media / baixa;
- recomendacao objetiva.

## 5. Leitura por referencia

Explique como essa experiencia se compara, em disciplina de produto, com:

- Apple
- Google
- Microsoft
- OpenAI
- Linear
- Duolingo
- Notion

Nao faca elogio generico. Mostre onde a Score esta mais proxima ou mais distante dessas referencias.

## 6. O que removeria primeiro

Quais elementos voce cortaria imediatamente para aumentar clareza?

## 7. O que refinaria sem reescrever tudo

Quais pequenos ajustes teriam maior retorno?

## 8. O que ainda nao deve ser mexido

Quais partes parecem estruturalmente corretas e deveriam ser preservadas por enquanto?

## 9. Recomendacao da proxima sprint

Se voce pudesse escolher apenas uma sprint de produto depois desta revisao, qual seria?

Tom esperado:

- severo sem ser performatico;
- objetivo;
- sem diplomacia inutil;
- com gosto de produto;
- com foco em clareza, percepcao de inteligencia e maturidade da experiencia.
`;

  const readme = `# Claude Review Package

Este pacote foi gerado automaticamente para revisao do estado atual da Score.

## O que existe aqui

- \`REVIEW.md\`: resumo executivo do que esta sendo validado.
- \`BRIEFING.md\`: filosofia do produto em formato curto.
- \`CHANGELOG.md\`: resumo da sprint sob revisao.
- \`KNOWN_LIMITATIONS.md\`: limitacoes conhecidas antes da leitura externa.
- \`SCREENSHOTS.md\`: inventario das capturas.
- \`CLAUDE_PROMPT.md\`: prompt pronto para copiar e colar no Claude.
- \`MANIFEST.json\`: indice tecnico do pacote.
- \`screenshots/\`: imagens finais para revisao visual.

## Como usar

1. Abra esta pasta.
2. Envie os documentos e a pasta \`screenshots/\` para o Claude.
3. Use \`CLAUDE_PROMPT.md\` sem editar manualmente.

## Origem

- review slug: \`${reviewSlug}\`
- branch: \`${branchName}\`
- commit: \`${commitHash ?? 'nao disponivel'}\`
- data: \`${isoTimestamp}\`
`;

  return {
    'README.md': readme,
    'REVIEW.md': review,
    'BRIEFING.md': briefing,
    'CHANGELOG.md': changelog,
    'KNOWN_LIMITATIONS.md': knownLimitationsDoc,
    'SCREENSHOTS.md': screenshotsDoc,
    'CLAUDE_PROMPT.md': claudePrompt,
  };
}

function buildKnownLimitations({ audits, captureResult }) {
  const items = [];
  const experienceAudit = audits['.score/experience-boundary-final-audit.md'] || '';
  const runtimeAudit = audits['.score/product-runtime-alignment-audit.md'] || '';
  const uxAudit = audits['.score/qa/UX_AUDIT_001.md'] || '';
  const cognitiveAudit = audits['.score/qa/COGNITIVE_JOURNEY_AUDIT_001.md'] || '';

  if (
    experienceAudit.includes('aprofundamento') ||
    runtimeAudit.includes('Index.tsx')
  ) {
    items.push(
      'O aprofundamento ainda depende parcialmente de composicao local em Index.tsx e pode ficar ainda mais governado por runtime.'
    );
  }

  if (
    uxAudit.includes('Upload terminou sem feedback claramente observavel') ||
    cognitiveAudit.includes('feedback de upload')
  ) {
    items.push(
      'O feedback de upload ainda nao fica claramente visivel para toda leitura automatizada, o que reduz a percepcao de progresso em um ponto sensivel da jornada.'
    );
  }

  if (
    uxAudit.includes('transicao entre perguntas') ||
    cognitiveAudit.includes('continuidade entre perguntas')
  ) {
    items.push(
      'A continuidade entre perguntas ainda nao parece tao inevitavel quanto a filosofia do produto pede; existe espaco para parecer menos troca mecanica.'
    );
  }

  if (
    uxAudit.includes('ERR_NETWORK_ACCESS_DENIED') ||
    cognitiveAudit.includes('ERR_NETWORK_ACCESS_DENIED')
  ) {
    items.push(
      'Os QA logs ainda registram erros de rede bloqueada em recursos secundarios, mesmo com a jornada principal concluindo com sucesso.'
    );
  }

  items.push(
    'O canal externo de Hermes ainda esta representado apenas filosoficamente; a conversa continua simulada dentro do app, nao em um canal dedicado como WhatsApp.'
  );

  if (!captureResult.video.mp4Generated) {
    items.push(
      `O pacote nao inclui \`flow.mp4\`: ${captureResult.video.reason}`
    );
  }

  return Array.from(new Set(items));
}

async function buildManifest({
  branchName,
  captureResult,
  commitHash,
  datedDir,
  isoTimestamp,
  reviewDate,
  reviewSlug,
}) {
  const files = await collectRelativeFiles(datedDir);
  if (!files.includes('MANIFEST.json')) {
    files.push('MANIFEST.json');
    files.sort();
  }
  const documents = files.filter(
    (filePath) =>
      filePath.endsWith('.md') || filePath.endsWith('.json')
  );
  const screenshots = files.filter((filePath) =>
    /\.(png|jpg|jpeg|webp)$/i.test(filePath)
  );

  return {
    version: 1,
    branch: branchName,
    commit: commitHash,
    date: reviewDate,
    generatedAt: isoTimestamp,
    reviewSlug,
    files,
    screenshotsFound: screenshots,
    documentsFound: documents,
    video: captureResult.video,
  };
}

async function captureReviewAssets({ datedDir, screenshotsDir }) {
  await mkdir(tmpArtifactsDir, { recursive: true });
  await rm(videoTempDir, { recursive: true, force: true });
  await mkdir(videoTempDir, { recursive: true });
  const previewLog = createWriteStream(previewLogPath, { flags: 'w' });
  const browserExecutable = findBrowserExecutable();

  if (!browserExecutable) {
    captureState.errors.push(
      'Nao foi possivel localizar um navegador Chromium local para capturar as telas de review.'
    );
    captureState.video.reason =
      'Playwright-core nao encontrou um executavel Chromium local.';
    previewLog.end();
    return captureState;
  }

  let previewProcess;
  let browser;

  try {
    previewProcess = startPreviewServer(previewLog);
    await waitForServer(`${qaUrl}/`, 60_000);

    browser = await chromium.launch({
      headless: true,
      executablePath: browserExecutable,
      args: ['--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check'],
    });

    await captureDesktopState({
      browser,
      screenshotsDir,
    });
    await captureMobileState({
      browser,
      screenshotsDir,
    });
    await captureFlowVideo({
      browser,
      screenshotsDir,
    });
  } catch (error) {
    captureState.errors.push(
      `Falha geral ao capturar os artefatos visuais: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    if (!captureState.video.reason) {
      captureState.video.reason =
        error instanceof Error ? error.message : String(error);
    }
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }

    await stopServerProcess(previewProcess);
    previewLog.end();
  }

  return captureState;
}

async function captureDesktopState({ browser, screenshotsDir }) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    ignoreHTTPSErrors: true,
  });

  try {
    const page = await context.newPage();
    await runSeededJourney(page);
    await saveScreenshot({
      name: 'desktop-home.png',
      page,
      screenshotsDir,
    });
    await openDetails(page);
    await saveScreenshot({
      name: 'desktop-details.png',
      page,
      screenshotsDir,
    });
  } catch (error) {
    captureState.errors.push(
      `Falha ao capturar desktop: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    await context.close().catch(() => undefined);
  }
}

async function captureMobileState({ browser, screenshotsDir }) {
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    ignoreHTTPSErrors: true,
  });

  try {
    const page = await context.newPage();
    await runSeededJourney(page);
    await saveScreenshot({
      name: 'mobile-home.png',
      page,
      screenshotsDir,
    });
    await openDetails(page);
    await saveScreenshot({
      name: 'mobile-details.png',
      page,
      screenshotsDir,
    });
  } catch (error) {
    captureState.errors.push(
      `Falha ao capturar mobile: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    await context.close().catch(() => undefined);
  }
}

async function captureFlowVideo({ browser, screenshotsDir }) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    ignoreHTTPSErrors: true,
    recordVideo: {
      dir: videoTempDir,
      size: { width: 1440, height: 1200 },
    },
  });

  try {
    const page = await context.newPage();
    await runSeededJourney(page);
    await delay(1000);
    await openDetails(page);
    await delay(1000);
    await clickByText(page, 'Fechar detalhes');
    await delay(1000);
  } catch (error) {
    const normalizedReason = normalizeVideoFailureReason(
      error instanceof Error ? error.message : String(error)
    );
    captureState.errors.push(
      `Falha ao registrar video da jornada: ${normalizedReason}`
    );
    captureState.video.reason = normalizedReason;
  } finally {
    await context.close().catch(() => undefined);
  }

  const recordedFiles = await readdir(videoTempDir).catch(() => []);
  const webmFile = recordedFiles.find((fileName) => fileName.endsWith('.webm'));

  if (!webmFile) {
    if (!captureState.video.reason) {
      captureState.video.reason =
        'Playwright nao retornou um arquivo de video depois da captura.';
    }
    return;
  }

  const sourcePath = resolve(videoTempDir, webmFile);
  const targetPath = resolve(screenshotsDir, 'flow.webm');
  await cp(sourcePath, targetPath);
  captureState.video.generated = true;
  captureState.video.relativePath = relativePathFromPackage(targetPath, resolve(screenshotsDir, '..'));
  captureState.video.reason =
    'flow.mp4 nao foi gerado porque ffmpeg nao esta disponivel no ambiente; flow.webm foi salvo como fallback.';
}

async function runSeededJourney(page) {
  await page.goto(`${qaUrl}/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto(`${qaUrl}/login`, { waitUntil: 'networkidle' });

  await fillInputByFieldLabel(page, 'Email', qaEmail);
  await fillInputByFieldLabel(page, 'Senha', qaPassword, 0);
  await clickByText(page, 'Entrar no Nucleo');

  await Promise.race([
    page.waitForURL('**/perfil', { timeout: 20_000 }),
    page.waitForURL('**/', { timeout: 20_000 }),
  ]);

  if (page.url().includes('/perfil')) {
    await clickByText(page, 'Completar perfil');
    await page.waitForSelector('text=Perfil do Usuario', { timeout: 10_000 });
    await fillInputByFieldLabel(page, 'Localizacao', 'Sao Paulo, SP');
    await fillInputByFieldLabel(page, 'Tamanho do Imovel (m2)', '120');
    await fillInputByFieldLabel(page, 'Numero de Pessoas ou Funcionarios', '4');
    await clickByText(page, 'Salvar Perfil');
  }

  await page.waitForSelector('#file-upload', { state: 'attached', timeout: 20_000 });
  await page.locator('#file-upload').setInputFiles(invoiceFixturePath);

  await waitForJourneyReady(page);
  await page.waitForFunction(
    () => document.body.innerText.includes('Ver mais sobre esta conta'),
    undefined,
    { timeout: 20_000 }
  );
}

async function waitForJourneyReady(page) {
  await page.waitForFunction(
    () => {
      const storageKey = Object.keys(window.localStorage).find((candidate) =>
        candidate.startsWith('score-energy:mvp-journey:v1:')
      );

      if (!storageKey) {
        return false;
      }

      try {
        const state = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
        return state?.analysis?.status === 'ready' && state?.journeyStage === 'analysis-ready';
      } catch (_error) {
        return false;
      }
    },
    undefined,
    { timeout: 120_000 }
  );
}

async function openDetails(page) {
  await clickByText(page, 'Ver mais sobre esta conta');
  await page.waitForFunction(
    () => {
      const text = document.body.innerText || '';
      return text.includes('Detalhes da leitura') && text.includes('Fechar detalhes');
    },
    undefined,
    { timeout: 20_000 }
  );
}

async function saveScreenshot({ name, page, screenshotsDir }) {
  const targetPath = resolve(screenshotsDir, name);
  await page.screenshot({ path: targetPath, fullPage: true });
  captureState.screenshots.push({
    name,
    relativePath: relativePathFromPackage(targetPath, resolve(screenshotsDir, '..')),
  });
}

function resolveReviewSlug({ argv, branchName }) {
  const slugIndex = argv.findIndex((item) => item === '--slug');

  if (slugIndex >= 0 && argv[slugIndex + 1]) {
    return sanitizeSlug(argv[slugIndex + 1]);
  }

  return sanitizeSlug(
    branchName
      .replace(/^feature\//, '')
      .replace(/^codex\//, '')
      .replace(/^fix\//, '')
  );
}

function sanitizeSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function commandForCurrentPlatform(command) {
  if (process.platform !== 'win32') {
    return command;
  }

  if (command === 'npm') {
    return 'npm.cmd';
  }

  return command;
}

function startPreviewServer(serverLog) {
  const child =
    process.platform === 'win32'
      ? spawn(
          process.env.ComSpec || 'cmd.exe',
          ['/d', '/s', '/c', 'npm run preview -- --host 127.0.0.1 --port 4173'],
          {
            cwd: rootDir,
            env: {
              ...process.env,
              CI: '1',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
          }
        )
      : spawn(
          'npm',
          ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'],
          {
            cwd: rootDir,
            env: {
              ...process.env,
              CI: '1',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
          }
        );

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

async function clickByText(page, text) {
  const normalizedText = normalizeInlineText(text);
  const candidates = [
    page
      .locator('main button:visible, main a:visible')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(normalizedText)}\\s*$`, 'i') })
      .first(),
    page
      .locator('button:visible, a:visible')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(normalizedText)}\\s*$`, 'i') })
      .first(),
    page
      .locator('main button:visible, main a:visible')
      .filter({ hasText: normalizedText })
      .first(),
    page
      .locator('button:visible, a:visible')
      .filter({ hasText: normalizedText })
      .first(),
  ];

  for (const locator of candidates) {
    if ((await locator.count()) === 0) {
      continue;
    }

    await locator.click();
    return;
  }

  throw new Error(`Botao ou link visivel nao encontrado para texto: ${text}`);
}

function normalizeInlineText(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        : [
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/snap/bin/chromium',
          ];

  return candidates.find((candidate) => existsSyncSafe(candidate));
}

function existsSyncSafe(filePath) {
  try {
    return existsSync(filePath);
  } catch (_error) {
    return false;
  }
}

async function collectRelativeFiles(baseDir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = resolve(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      files.push(relative(baseDir, absolutePath).replace(/\\/g, '/'));
    }
  }

  await walk(baseDir);

  return files.sort();
}

function relativePathFromPackage(filePath, packageDir) {
  return relative(packageDir, filePath).replace(/\\/g, '/');
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function normalizeVideoFailureReason(message) {
  if (message.includes('ffmpeg')) {
    return 'Playwright video requer ffmpeg local; execute "npx playwright install ffmpeg" para habilitar flow.mp4.';
  }

  return normalizeInlineText(message);
}

async function runCommand(command, args, options) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child =
      process.platform === 'win32' && command.toLowerCase().endsWith('.cmd')
        ? spawn(
            process.env.ComSpec || 'cmd.exe',
            ['/d', '/s', '/c', formatWindowsCommand(command, args)],
            {
              ...options,
              stdio: ['ignore', 'pipe', 'pipe'],
              windowsHide: true,
            }
          )
        : spawn(command, args, {
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

async function runAndRead(command, args, options) {
  return runCommand(command, args, options);
}

function formatWindowsCommand(command, args) {
  return [command, ...args.map(escapeWindowsArgument)].join(' ');
}

function escapeWindowsArgument(value) {
  if (/[\s"]/u.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  return value;
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
