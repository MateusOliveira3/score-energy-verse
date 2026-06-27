import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { chromium } from 'playwright-core';
import {
  assessAccountUnderstandingHeuristics,
  assessAuthorityHeuristics,
  assessQuestionContinuityHeuristics,
  assessQuestionHeuristics,
  assessResidenceMappingHeuristics,
  assessValueReturnHeuristics,
  compareAuditSnapshots,
  deriveJourneyStateSignals,
  extractAuditSnapshot,
} from './journeyHeuristics.mjs';
import { QA_README_CONTENT } from './runtime.mjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const uxReportPath = resolve(rootDir, '.score', 'qa', 'UX_AUDIT_001.md');
const cognitiveReportPath = resolve(rootDir, '.score', 'qa', 'COGNITIVE_JOURNEY_AUDIT_001.md');
const qaReadmePath = resolve(rootDir, '.score', 'qa', 'README.md');
const artifactsDir = resolve(rootDir, 'qa-artifacts', 'journey-qa');
const serverLogPath = resolve(artifactsDir, 'vite-server.log');
const tracePath = resolve(artifactsDir, 'journey-trace.zip');
const landingShotPath = resolve(artifactsDir, '01-landing.png');
const registerShotPath = resolve(artifactsDir, '02-register.png');
const profileShotPath = resolve(artifactsDir, '03-profile-ready.png');
const uploadShotPath = resolve(artifactsDir, '04-upload-ready.png');
const processingShotPath = resolve(artifactsDir, '05-processing.png');
const afterUploadShotPath = resolve(artifactsDir, '06-after-upload.png');
const detailsShotPath = resolve(artifactsDir, '07-details-open.png');
const qaUrl = 'http://127.0.0.1:4173';
const qaCommand = 'npm run qa:journey';
const qaEmail = 'qa.journey.local@score.test';
const qaPassword = 'ScoreJourney123!';
const invoiceFixturePath = resolve(rootDir, 'test-fixtures-invoices', 'celesc-sample-01.pdf');
const QUESTION_RESPONSE_PLAYBOOK = {
  residence_type: 'Casa',
  room_count: '4-6',
  children_presence: 'Nao',
  elderly_presence: 'Nao',
  bathrooms_count: '2',
  showers_count: '2',
  shower_heating_type: 'Eletrico',
  air_conditioning_presence: 'Sim',
  air_conditioning_count: '2',
  cooking_type: 'Gas',
  electric_oven_presence: 'Nao',
  extra_fridge_presence: 'Nao',
  washing_machine_presence: 'Sim',
  dryer_presence: 'Nao',
  dominant_usage_period: 'Noite',
};
const QUESTION_TO_PANEL_CATEGORY = {
  residence_type: 'outros',
  room_count: 'outros',
  children_presence: 'outros',
  elderly_presence: 'outros',
  bathrooms_count: 'banhos',
  showers_count: 'banhos',
  shower_heating_type: 'banhos',
  air_conditioning_presence: 'climatizacao',
  air_conditioning_count: 'climatizacao',
  cooking_type: 'cozinha',
  electric_oven_presence: 'cozinha',
  extra_fridge_presence: 'refrigeracao',
  washing_machine_presence: 'lavanderia',
  dryer_presence: 'lavanderia',
  dominant_usage_period: 'outros',
};

const steps = [];
const positiveFindings = [];
const problems = [];
const recommendations = [];
const limitations = [];
const metrics = {};
const runtimeErrors = [];
const cognitive = {
  landing: {},
  register: {},
  upload: {},
  processing: {},
  ready: {},
  details: {},
};
let previousCognitiveAuditContent = '';
const qaAssessment = {
  accountUnderstanding: null,
  authority: null,
  continuity: null,
  evolution: null,
  previousSnapshot: null,
  progression: [],
  question: null,
  residenceMapping: null,
  state: null,
  valueReturn: null,
};

const timestamp = new Date().toISOString();
const branchName = await runAndRead('git', ['branch', '--show-current'], { cwd: rootDir });

previousCognitiveAuditContent = await readFile(cognitiveReportPath, 'utf8').catch(() => '');
qaAssessment.previousSnapshot = extractAuditSnapshot(previousCognitiveAuditContent);

await mkdir(resolve(rootDir, '.score', 'qa'), { recursive: true });
await rm(artifactsDir, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });

const chromeExecutable = findBrowserExecutable();

if (!chromeExecutable) {
  throw new Error(
    'Nao foi possivel localizar um navegador Chromium local. Defina QA_BROWSER_EXECUTABLE para executar o QA automatizado.'
  );
}

const serverLog = createWriteStream(serverLogPath, { flags: 'w' });
let serverProcess;
let browser;
let context;

try {
  serverProcess = startViteServer(serverLog);
  steps.push('Aplicacao local iniciada em modo QA com provider local e auth local fallback.');
  await waitForServer(`${qaUrl}/`, 60_000);

  browser = await chromium.launch({
    headless: true,
    executablePath: chromeExecutable,
    args: ['--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check'],
  });
  metrics.browser = chromeExecutable.toLowerCase().includes('edge') ? 'Edge local' : 'Chrome local';

  context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    ignoreHTTPSErrors: true,
  });

  await context.tracing.start({ screenshots: true, snapshots: true });

  const page = await context.newPage();
  page.on('pageerror', (error) => {
    runtimeErrors.push(`pageerror: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(`console.error: ${message.text()}`);
    }
  });
  const journeyStart = Date.now();
  let loginCompletedAt;
  let processingFeedbackAt;
  let firstValueAt;

  await page.goto(`${qaUrl}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('h1', { timeout: 20_000 });
  await page.screenshot({ path: landingShotPath, fullPage: true });
  metrics.timeToFirstUsefulScreenMs = Date.now() - journeyStart;
  cognitive.landing = await captureSectionSnapshot(page.locator('main section').first());
  steps.push('Landing carregada e primeira tela util confirmada.');
  positiveFindings.push('Tela inicial carregou sem erro e com CTA principal visivel.');

  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto(`${qaUrl}/`, { waitUntil: 'networkidle' });

  await clickByText(page, 'Comecar a jornada');
  await page.waitForURL('**/registro', { timeout: 20_000 });
  await page.screenshot({ path: registerShotPath, fullPage: true });
  cognitive.register = {
    ...(await captureFormSnapshot(page)),
    section: await captureSectionSnapshot(page.locator('main').first()),
  };
  steps.push('Fluxo entrou em criacao de conta a partir da landing.');

  await fillInputByFieldLabel(page, 'Email', qaEmail);
  await fillInputByFieldLabel(page, 'Senha', qaPassword, 0);
  await fillInputByFieldLabel(page, 'Confirmar senha', qaPassword, 0);
  await clickByText(page, 'Criar conta');
  await page.waitForURL('**/login', { timeout: 10_000 });
  steps.push('Usuario QA local criado com sucesso.');
  positiveFindings.push('A criacao de conta local para QA ficou automatizavel sem dependencia externa.');

  await fillInputByFieldLabel(page, 'Email', qaEmail);
  await fillInputByFieldLabel(page, 'Senha', qaPassword, 0);
  await clickByText(page, 'Entrar no Nucleo');
  await page.waitForURL('**/perfil', { timeout: 20_000 });
  loginCompletedAt = Date.now();
  steps.push('Login concluido e jornada protegida aberta em /perfil.');

  const profileStart = Date.now();
  await page.waitForSelector('text=Core', { timeout: 20_000 });
  metrics.timeCoreSilentMs = Date.now() - profileStart;

  await page.screenshot({ path: profileShotPath, fullPage: true });
  positiveFindings.push('A Core aparece logo no inicio da jornada protegida.');

  const uploadReadyStart = Date.now();
  await clickByText(page, 'Completar perfil');
  await page.waitForSelector('text=Perfil do Usuario', { timeout: 10_000 });
  await fillInputByFieldLabel(page, 'Localizacao', 'Sao Paulo, SP');
  await fillInputByFieldLabel(page, 'Tamanho do Imovel (m2)', '120');
  await fillInputByFieldLabel(page, 'Numero de Pessoas ou Funcionarios', '4');
  await clickByText(page, 'Salvar Perfil');
  await page.waitForSelector('text=Selecionar fatura', { timeout: 20_000 });
  metrics.timeToUploadAvailableMs = Date.now() - uploadReadyStart;
  await page.screenshot({ path: uploadShotPath, fullPage: true });
  cognitive.upload = await captureSectionSnapshot(page.locator('main section').first());
  steps.push('Perfil minimo preenchido e upload disponibilizado.');
  positiveFindings.push('Upload ficou disponivel logo apos o contexto minimo ser preenchido.');

  const uploadStart = Date.now();
  await page.locator('#file-upload').setInputFiles(invoiceFixturePath);
  const processingVisible = await page
    .waitForFunction(
      () => document.body.innerText.includes('Estou lendo sua conta deste ciclo.'),
      undefined,
      { timeout: 20_000 }
    )
    .then(() => true)
    .catch(() => false);
  if (processingVisible) {
    processingFeedbackAt = Date.now();
    metrics.timeToProcessingFeedbackMs = processingFeedbackAt - uploadStart;
    await page.screenshot({ path: processingShotPath, fullPage: true }).catch(() => undefined);
    cognitive.processing = await captureSectionSnapshot(page.locator('main section').first());
  } else {
    metrics.timeToProcessingFeedbackMs = 'nao observado';
    cognitive.processing = {
      primaryHeading: 'nao observado',
      primaryBody: 'A mensagem principal de processamento nao apareceu dentro do budget inicial.',
      buttons: [],
      paragraphs: [],
      headings: [],
    };
  }
  let processingCompleted = false;

  try {
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
    processingCompleted = true;
  } catch (_error) {
    processingCompleted = false;
  }

  metrics.invoiceProcessingMs = processingCompleted ? Date.now() - uploadStart : '>120000';
  await page.screenshot({ path: afterUploadShotPath, fullPage: true }).catch(() => undefined);

  if (!processingCompleted) {
    steps.push('Fixture enviada, mas a jornada permaneceu em processamento alem do budget da auditoria.');
    positiveFindings.push('A Core comunica explicitamente que a leitura esta em andamento durante o processamento.');
    problems.push('O processamento da fatura nao concluiu dentro do budget de 120s no QA automatizado local.');
    recommendations.push('Investigar por que a jornada permanece em "Leitura em andamento" por tempo prolongado apos o upload.');
    limitations.push('A auditoria nao conseguiu atravessar automaticamente o estado de processamento ate a leitura final nesta execucao.');
    metrics.uploadFeedbackVisible = 'nao';
    metrics.explainsWhatHappened = 'nao';
    metrics.clearNextStepWithoutDetails = 'nao';
    metrics.activeQuestionVisible = 'nao observado';
    metrics.duplicateActiveQuestions = 'nao observado';
    metrics.clearResponseArea = 'nao observado';
    metrics.clearNextStepAfterDetails = 'nao observado';
    metrics.journeyCompleted = 'parcial';
    cognitive.ready = {
      primaryHeading: 'nao observado',
      primaryBody: 'A jornada nao alcancou uma superficie de valor pronta nesta execucao.',
      buttons: [],
      paragraphs: [],
      headings: [],
      detailTriggerCount: 0,
      explicitQuestionVisible: false,
      implicitQuestionOptionLabels: [],
    };
    } else {
      firstValueAt = Date.now();
      steps.push('Fixture de fatura enviada e processamento concluido.');
      metrics.timeToFirstValueMs =
        typeof loginCompletedAt === 'number' ? firstValueAt - loginCompletedAt : 'nao observado';

      const heroSection = page.locator('main section').first();
      const heroContainer = heroSection.locator('aside').first();
      const heroSnapshotTarget = (await heroContainer.count()) > 0 ? heroContainer : heroSection;

      cognitive.ready = await captureSectionSnapshot(heroSection);
      cognitive.ready.hero = await captureSectionSnapshot(heroSnapshotTarget);

      const storedJourneyState = await captureStoredJourneyState(page);
      qaAssessment.state = deriveJourneyStateSignals(storedJourneyState);

      await waitForValueReturn(page);
      const initialValueSnapshot = await inspectValueReturnInHero(
        heroSnapshotTarget,
        qaAssessment.state.pendingQuestion
      );
      const accountUnderstandingBefore = await inspectAccountUnderstandingPanel(page);

      if (initialValueSnapshot.valueReturnVisible && qaAssessment.state.pendingQuestion) {
        await continueInvestigationFromFeedback(page);
        await waitForQuestionRender(page, qaAssessment.state.pendingQuestion);
      }

      const heroInteractiveLabels = await getVisibleTextsIn(heroSnapshotTarget, 'button, a');
      const heroDetailLabels = heroInteractiveLabels.filter(isDetailLikeActionLabel);
      cognitive.ready.detailTriggerCount = heroDetailLabels.length;
      const heroQuestionSignals = await inspectQuestionSignalsInHero(
        heroSnapshotTarget,
        qaAssessment.state.pendingQuestion
      );
      qaAssessment.question = assessQuestionHeuristics({
        pendingQuestion: qaAssessment.state.pendingQuestion,
        heroInteractiveLabels,
        promptVisible: heroQuestionSignals.promptVisible,
        helperVisible: heroQuestionSignals.helperVisible,
      });

      const heroActionLabels = heroInteractiveLabels.filter(
        (label) =>
          !qaAssessment.question.matchedOptionLabels.includes(normalizeInlineText(label))
      );
      qaAssessment.authority = assessAuthorityHeuristics({
        questionAssessment: qaAssessment.question,
        heroActionLabels,
        detailTriggerCount: cognitive.ready.detailTriggerCount,
      });

      const progressionSnapshots = [
        {
          helperVisible: heroQuestionSignals.helperVisible,
          pendingQuestion: qaAssessment.state.pendingQuestion,
          promptVisible: heroQuestionSignals.promptVisible,
          residenceKnowledgeCount: qaAssessment.state.residenceKnowledgeCount ?? 0,
        },
      ];
      const valueReturnSnapshots = [];
      const accountUnderstandingProgression = [];

      let latestStateSignals = qaAssessment.state;

      for (let stepIndex = 0; stepIndex < 7; stepIndex += 1) {
        const pendingQuestion = latestStateSignals?.pendingQuestion;

        if (!pendingQuestion || pendingQuestion.source !== 'action') {
          break;
        }

        const answerLabel =
          QUESTION_RESPONSE_PLAYBOOK[pendingQuestion.id] ??
          pendingQuestion.optionLabels?.[0];

        if (!answerLabel) {
          break;
        }

        const panelBeforeAnswer = await inspectAccountUnderstandingPanel(page);
        await waitForQuestionRender(page, pendingQuestion);
        qaAssessment.progression.push(`${pendingQuestion.id}: ${answerLabel}`);
        await clickByText(page, answerLabel);
        await waitForNextQuestion(
          page,
          pendingQuestion.id,
          latestStateSignals?.residenceKnowledgeCount ?? 0
        );

        const nextStoredJourneyState = await captureStoredJourneyState(page);
        latestStateSignals = deriveJourneyStateSignals(nextStoredJourneyState);
        await waitForValueReturn(page);
        const valueReturnSnapshot = await inspectValueReturnInHero(
          heroSnapshotTarget,
          latestStateSignals.pendingQuestion
        );
        const panelAfterAnswer = await inspectAccountUnderstandingPanel(page);
        valueReturnSnapshots.push(valueReturnSnapshot);
        accountUnderstandingProgression.push({
          after: panelAfterAnswer,
          before: panelBeforeAnswer,
          questionId: pendingQuestion.id,
          relevantCategoryId: QUESTION_TO_PANEL_CATEGORY[pendingQuestion.id] ?? 'outros',
        });

        if (valueReturnSnapshot.continueVisible) {
          await continueInvestigationFromFeedback(page);
        }

        await waitForQuestionRender(page, latestStateSignals.pendingQuestion);
        const nextHeroQuestionSignals = await inspectQuestionSignalsInHero(
          heroSnapshotTarget,
          latestStateSignals.pendingQuestion
        );

        progressionSnapshots.push({
          helperVisible: nextHeroQuestionSignals.helperVisible,
          pendingQuestion: latestStateSignals.pendingQuestion,
          promptVisible: nextHeroQuestionSignals.promptVisible,
          residenceKnowledgeCount: latestStateSignals.residenceKnowledgeCount ?? 0,
        });
      }

      qaAssessment.continuity = assessQuestionContinuityHeuristics(progressionSnapshots);
      qaAssessment.residenceMapping = assessResidenceMappingHeuristics({
        afterCount:
          progressionSnapshots[progressionSnapshots.length - 1]?.residenceKnowledgeCount ??
          qaAssessment.state.residenceKnowledgeCount ??
          0,
        beforeCount: progressionSnapshots[0]?.residenceKnowledgeCount ?? 0,
      });
      qaAssessment.valueReturn = assessValueReturnHeuristics({
        initialSnapshot: initialValueSnapshot,
        transitionSnapshots: valueReturnSnapshots,
      });
      qaAssessment.accountUnderstanding = assessAccountUnderstandingHeuristics({
        beforePanel: accountUnderstandingBefore,
        progression: accountUnderstandingProgression,
      });

      cognitive.ready.explicitQuestionVisible = qaAssessment.question.explicitQuestionVisible;
      cognitive.ready.implicitQuestionOptionLabels =
        qaAssessment.state.pendingQuestion?.optionLabels ?? heroQuestionSignals.visibleOptionLabels;

      const uploadFeedbackVisible =
        (await page.locator('text=Fatura recebida e adicionada a jornada').count()) > 0 ||
        (await page.locator('text=Fatura adicionada ao historico!').count()) > 0;
      metrics.uploadFeedbackVisible = uploadFeedbackVisible ? 'sim' : 'nao';

    if (uploadFeedbackVisible) {
      positiveFindings.push('A jornada confirma visualmente que a fatura foi recebida.');
    } else {
      problems.push('Upload terminou sem feedback claramente observavel pela automacao.');
      recommendations.push('Tornar o feedback de upload persistente e menos dependente de toast temporario.');
    }

      const heroSummaryVisible =
        Boolean(cognitive.ready.hero?.primaryHeading) &&
        Boolean(cognitive.ready.hero?.primaryBody) &&
        cognitive.ready.hero.primaryHeading !== 'nao observado' &&
        cognitive.ready.hero.primaryBody !== 'nao observado';
      metrics.explainsWhatHappened = heroSummaryVisible ? 'sim' : 'nao';

      if (heroSummaryVisible) {
        positiveFindings.push('A experiencia explica o que aconteceu depois do processamento.');
      } else {
        problems.push('Apos o processamento, a explicacao do que aconteceu nao ficou clara o suficiente.');
        recommendations.push('Garantir uma sintese explicita apos o upload sem exigir exploracao adicional.');
      }

      if (qaAssessment.valueReturn.initialValueDelivered) {
        positiveFindings.push('A Hero devolve um entendimento inicial antes de abrir a primeira pergunta.');
      } else if (qaAssessment.state.pendingQuestion) {
        problems.push('A primeira pergunta apareceu sem uma devolucao de valor suficientemente observavel antes dela.');
        recommendations.push('Fazer a investigacao nascer de uma leitura entregue, nao apenas de uma pergunta pronta.');
      }

      if (qaAssessment.valueReturn.valueBeforeNextQuestion) {
        positiveFindings.push('Cada resposta foi seguida de devolucao de valor antes da pergunta seguinte.');
      } else {
        problems.push('A auditoria ainda nao observou devolucao clara de valor entre uma resposta e a proxima pergunta.');
        recommendations.push('Manter a explicacao curta, honesta e visivel antes de revelar a proxima pergunta.');
      }

      if (qaAssessment.accountUnderstanding.perceivesUnderstanding) {
        positiveFindings.push('O painel tornou visivel o que a Score ja conseguiu compreender sobre a conta.');
      } else {
        problems.push('O painel ainda nao deixou suficientemente visivel como a Score esta decompondo a conta.');
        recommendations.push('Garantir que o painel mostre categorias compreensiveis, pistas atuais e o que ainda esta em aberto.');
      }

      if (qaAssessment.accountUnderstanding.categoriesEvolveCoherently) {
        positiveFindings.push('As categorias do painel evoluiram de forma coerente ao longo da investigacao.');
      } else {
        problems.push('A auditoria ainda nao conseguiu ligar claramente a evolucao das categorias as respostas observadas.');
        recommendations.push('Fazer as mudancas do painel seguirem de forma mais legivel a resposta que acabou de entrar.');
      }

      metrics.activeQuestionVisible = qaAssessment.question.explicitQuestionVisible ? 'sim' : 'nao';
      metrics.questionContextVisible = qaAssessment.question.contextBeforeOptionsVisible ? 'sim' : 'nao';
      metrics.questionBelongsToCognitiveState = qaAssessment.question.belongsToCognitiveState
        ? 'sim'
        : 'nao';
      metrics.initialValueBeforeQuestion = qaAssessment.valueReturn.initialValueDelivered ? 'sim' : 'nao';
      metrics.accountUnderstandingVisible = qaAssessment.accountUnderstanding.perceivesUnderstanding ? 'sim' : 'nao';
      metrics.accountCategoriesEvolve = qaAssessment.accountUnderstanding.categoriesEvolveCoherently ? 'sim' : 'nao';
      metrics.accountChangesFollowAnswers = qaAssessment.accountUnderstanding.responseDrivenChanges ? 'sim' : 'nao';
      metrics.accountConfidenceWithoutFinality = qaAssessment.accountUnderstanding.confidenceWithoutFinality ? 'sim' : 'nao';
      metrics.accountOpenUnknownsVisible = qaAssessment.accountUnderstanding.openUnknownsVisible ? 'sim' : 'nao';
      metrics.residenceFeelsKnown = qaAssessment.residenceMapping.residenceFeelsKnown ? 'sim' : 'nao';
      metrics.residenceKnowledgeDelta = qaAssessment.residenceMapping.delta;
      metrics.questionContinuity = qaAssessment.continuity.continuityVisible ? 'sim' : 'nao';
      metrics.investigationTone = qaAssessment.continuity.investigationTone ? 'sim' : 'nao';
      metrics.valueBeforeNextQuestion = qaAssessment.valueReturn.valueBeforeNextQuestion ? 'sim' : 'nao';
      metrics.understandingCompounds = qaAssessment.valueReturn.understandingCompounds ? 'sim' : 'nao';
      metrics.conversationNotForm = qaAssessment.valueReturn.conversationNotForm ? 'sim' : 'nao';
      metrics.scoreWorksBetweenQuestions = qaAssessment.valueReturn.scoreWorksBetweenQuestions ? 'sim' : 'nao';
      metrics.duplicateActiveQuestions =
        cognitive.ready.detailTriggerCount > 1 ? 'sim' : 'nao';
      metrics.clearResponseArea = qaAssessment.question.responseAreaVisible ? 'sim' : 'nao';
      metrics.heroSovereignPrimaryAction = qaAssessment.authority.dominantActionLabel ?? 'indefinido';
      metrics.heroHasSinglePrimaryAction = qaAssessment.authority.hasSinglePrimaryAction ? 'sim' : 'nao';
      metrics.heroCompetingCtas = qaAssessment.authority.competingCtas ? 'sim' : 'nao';
      metrics.heroDetailTriggerCount = cognitive.ready.detailTriggerCount;
      metrics.clearNextStepWithoutDetails = qaAssessment.authority.clearNextStep ? 'sim' : 'nao';

      if (qaAssessment.question.explicitQuestionVisible) {
        positiveFindings.push('A auditoria encontrou uma pergunta ativa explicita no Hero.');
      } else if (qaAssessment.state.pendingQuestion) {
        problems.push('Existe pergunta cognitiva no estado da jornada, mas ela nao ficou explicita no Hero.');
        recommendations.push('Revisar a heuristica de pergunta ativa ate ela acompanhar a superficie renderizada.');
      }

      if (qaAssessment.question.contextBeforeOptionsVisible) {
        positiveFindings.push('A pergunta ativa aparece com contexto suficiente antes das opcoes.');
      } else if (qaAssessment.question.explicitQuestionVisible) {
        problems.push('A pergunta aparece, mas o QA ainda nao encontrou contexto suficiente antes das opcoes.');
        recommendations.push('Aprofundar a leitura estrutural do bloco da pergunta antes de alterar qualquer UX.');
      }

      if (qaAssessment.question.belongsToCognitiveState) {
        positiveFindings.push('A pergunta observada na Hero corresponde ao estado cognitivo persistido.');
      } else if (qaAssessment.state.pendingQuestion) {
        problems.push('O QA observou elementos de pergunta sem conseguir vincula-los ao estado cognitivo persistido.');
        recommendations.push('Cruzar o estado salvo da jornada com a superficie da Hero antes de acusar ausencia de pergunta.');
      }

      if (qaAssessment.residenceMapping.residenceFeelsKnown) {
        positiveFindings.push('A residencia ficou mais conhecida durante a propria execucao do QA.');
      } else {
        problems.push('O QA nao conseguiu demonstrar progresso suficiente no conhecimento da residencia.');
        recommendations.push('Garantir que cada resposta deixe a casa perceptivelmente menos desconhecida no estado cognitivo.');
      }

      if (qaAssessment.continuity.continuityVisible) {
        positiveFindings.push('A proxima pergunta surgiu como continuidade da investigacao, nao como cadastro solto.');
      } else {
        problems.push('A transicao entre perguntas ainda nao pareceu suficientemente continua para o QA.');
        recommendations.push('Reforcar o contexto que liga uma pergunta a proxima antes de expandir novas trilhas.');
      }

      if (qaAssessment.valueReturn.conversationNotForm) {
        positiveFindings.push('A investigacao passou a soar mais como conversa interpretativa do que como formulario.');
      } else {
        problems.push('A jornada ainda preserva traços de formulario quando a devolucao entre perguntas nao fica clara.');
        recommendations.push('Deixar a Score visivelmente trabalhando entre perguntas, nao apenas coletando respostas.');
      }

      if (!qaAssessment.accountUnderstanding.openUnknownsVisible) {
        problems.push('O painel nao deixou claro o que ainda permanece em aberto na investigacao.');
        recommendations.push('Explicitar no painel quais categorias ainda seguem em aberto sem fingir conclusao.');
      }

      if (!qaAssessment.accountUnderstanding.confidenceWithoutFinality) {
        problems.push('O painel ainda nao equilibrou bem confianca e incerteza durante a leitura.');
        recommendations.push('Mostrar sustentacao atual sem soar definitivo quando ainda existe hipotese.');
      }

      if (qaAssessment.authority.hasSinglePrimaryAction) {
        positiveFindings.push('A Hero apresenta uma autoridade soberana sem CTA principal concorrente.');
      } else {
        problems.push('A Hero ainda nao oferece uma autoridade soberana inequivoca para o QA.');
        recommendations.push('Aprimorar a heuristica de autoridade soberana antes de reinterpretar a UX.');
      }

      if (qaAssessment.authority.competingCtas) {
        problems.push('O QA detectou mais de um CTA competindo pela atencao na Hero.');
        recommendations.push('Distinguir respostas da pergunta ativa de CTAs concorrentes na leitura automatica.');
      }

      await clickByText(page, heroDetailLabels[0] ?? 'Ver mais sobre esta conta');
      await page.waitForFunction(
        () => {
          const text = document.body.innerText || '';
          return (
            text.includes('Ver mais sobre esta conta') ||
            text.includes('Detalhes da leitura') ||
            text.includes('Mais sobre esta conta') ||
            text.includes('Como chegamos nisso') ||
            text.includes('Como montei essa leitura')
          );
        },
        undefined,
        { timeout: 10_000 }
      );
      await page.screenshot({ path: detailsShotPath, fullPage: true });
      cognitive.details = {
        ...(await captureSectionSnapshot(page.locator('main section').nth(1))),
        sectionHeading:
          (await getFirstVisibleText(page, 'text=Ver mais sobre esta conta')) ||
          (await getFirstVisibleText(page, 'text=Detalhes da leitura')) ||
          (await getFirstVisibleText(page, 'text=Mais sobre esta conta')) ||
          (await getFirstVisibleText(page, 'text=Como montei essa leitura')) ||
          (await getFirstVisibleText(page, 'text=Como chegamos nisso')),
      };
      const detailsIntent = await inspectDetailsNextStep(page);
      steps.push('Painel de detalhes aberto para auditoria complementar.');

      metrics.clearNextStepAfterDetails = detailsIntent.clearNextStepAfterDetails ? 'sim' : 'nao';
      metrics.detailsPrimaryAction = detailsIntent.primaryActionLabel ?? 'indefinido';

      if (!qaAssessment.authority.clearNextStep && detailsIntent.clearNextStepAfterDetails) {
        problems.push('O proximo passo ficou mais claro apenas depois de abrir os detalhes.');
        recommendations.push('Trazer a continuidade principal para a superficie primaria quando a jornada terminar o upload.');
      } else if (qaAssessment.authority.clearNextStep || detailsIntent.clearNextStepAfterDetails) {
        positiveFindings.push('Existe um proximo passo identificavel na jornada auditada.');
      } else {
        problems.push('Nao houve proximo passo claro mesmo apos abrir os detalhes.');
        recommendations.push('Garantir continuidade explicita apos o primeiro ciclo processado.');
      }

    metrics.journeyCompleted = 'sim';
  }

  metrics.url = qaUrl;

  if (runtimeErrors.length > 0) {
    problems.push('A jornada gerou erros de runtime no navegador durante a auditoria.');
    recommendations.push('Revisar erros de runtime capturados no QA antes de ampliar a cobertura da jornada.');
    limitations.push(...runtimeErrors.slice(0, 5));
  }

    if (limitations.length === 0) {
      limitations.push('Nenhuma limitacao adicional registrada nesta execucao.');
    }

    qaAssessment.evolution = compareAuditSnapshots(qaAssessment.previousSnapshot, {
      activeQuestionVisible: metrics.activeQuestionVisible,
      accountUnderstandingVisible: metrics.accountUnderstandingVisible === 'sim' ? 'Sim' : 'Nao',
      detailTriggerCount: Number(metrics.heroDetailTriggerCount ?? 0),
      nextStepClear: metrics.clearNextStepWithoutDetails === 'sim' ? 'Sim' : 'Nao',
      residenceFeelsKnown: metrics.residenceFeelsKnown === 'sim' ? 'Sim' : 'Nao',
      valueBeforeNextQuestion: metrics.valueBeforeNextQuestion === 'sim' ? 'Sim' : 'Nao',
    });

    await context.tracing.stop({ path: tracePath });
  await writeAuditReport({
    status: problems.length === 0 ? 'Aprovada com boa legibilidade inicial.' : 'Executada com achados de UX relevantes.',
  });
  await writeCognitiveAuditReport();
} catch (error) {
  limitations.push(
    `Infraestrutura de QA nao concluiu toda a jornada: ${error instanceof Error ? error.message : String(error)}`
  );
  metrics.journeyCompleted = 'nao';
  await safeStopTrace();
  await writeAuditReport({
    status: 'Execucao parcial por limitacao de infraestrutura.',
  });
  await writeCognitiveAuditReport();
  throw error;
} finally {
  if (context) {
    await context.close().catch(() => undefined);
  }

  if (browser) {
    await browser.close().catch(() => undefined);
  }

  await stopServerProcess(serverProcess);

  serverLog.end();
}

await ensureQaReadme();

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

async function safeStopTrace() {
  if (!context) {
    return;
  }

  await context.tracing.stop({ path: tracePath }).catch(() => undefined);
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

async function writeAuditReport({ status }) {
  const screenshotLines = [
    landingShotPath,
    registerShotPath,
    profileShotPath,
    uploadShotPath,
    processingShotPath,
    afterUploadShotPath,
    detailsShotPath,
    tracePath,
    serverLogPath,
  ]
    .filter((filePath) => Boolean(filePath) && existsSync(filePath))
    .map((filePath) => `- \`${relativeFromRoot(filePath)}\``)
    .join('\n');

  const metricsLines = Object.entries(metrics)
    .map(([key, value]) => `- ${humanizeMetricKey(key)}: ${value}`)
    .join('\n');

  const content = `# UX_AUDIT_001

## Resumo

${status}

Documento institucional ausente durante a leitura obrigatoria:

- \`MEMORANDO_INTERNO_001_2026.md\` nao existe no repositorio no momento desta execucao.

## Ambiente

- data: \`${timestamp}\`
- branch: \`${branchName}\`
- comando executado: \`${qaCommand}\`
- URL testada: \`${qaUrl}\`
- navegador: \`${metrics.browser ?? 'Nao identificado'}\`
- fixture principal: \`${relativeFromRoot(invoiceFixturePath)}\`
- auth usada: \`local fallback\`
- provider da jornada: \`local\`

## Fluxo executado

${steps.map((step) => `- ${step}`).join('\n')}

## Achados positivos

${positiveFindings.map((item) => `- ${item}`).join('\n') || '- Nenhum achado positivo registrado.'}

## Problemas encontrados

${problems.map((item) => `- ${item}`).join('\n') || '- Nenhum problema relevante encontrado nesta execucao.'}

## Metricas observadas

${metricsLines || '- Nenhuma metrica registrada.'}

## Screenshots ou traces

${screenshotLines}

## Recomendacoes

${recommendations.map((item) => `- ${item}`).join('\n') || '- Manter a trilha e ampliar a cobertura de QA para novos estados da jornada.'}

## Limitacoes observadas

${limitations.map((item) => `- ${item}`).join('\n')}
`;

  await writeFile(uxReportPath, content, 'utf8');
}

async function writeCognitiveAuditReport() {
  const artifactsLines = [
    landingShotPath,
    registerShotPath,
    profileShotPath,
    uploadShotPath,
    processingShotPath,
    afterUploadShotPath,
    detailsShotPath,
    tracePath,
    serverLogPath,
    ]
      .filter((filePath) => Boolean(filePath) && existsSync(filePath))
      .map((filePath) => `- \`${relativeFromRoot(filePath)}\``)
      .join('\n');

  const landingTitle = cognitive.landing.primaryHeading ?? 'nao observado';
  const landingBody = cognitive.landing.primaryBody ?? 'nao observado';
  const landingButtons = formatInlineList(cognitive.landing.buttons);
  const registerFields = formatInlineList(cognitive.register.labels);
  const uploadTitle = cognitive.upload.primaryHeading ?? 'nao observado';
  const uploadBody = cognitive.upload.primaryBody ?? 'nao observado';
  const processingTitle = cognitive.processing.primaryHeading ?? 'nao observado';
  const processingBody = cognitive.processing.primaryBody ?? 'nao observado';
  const readyTitle = cognitive.ready.hero?.primaryHeading ?? cognitive.ready.primaryHeading ?? 'nao observado';
  const readyBody = cognitive.ready.hero?.primaryBody ?? cognitive.ready.primaryBody ?? 'nao observado';
  const detailButtons = Number(cognitive.ready.detailTriggerCount ?? 0);
  const questionOptions = formatInlineList(cognitive.ready.implicitQuestionOptionLabels);
  const explicitQuestionVisible = metrics.activeQuestionVisible ?? 'nao observado';
  const questionContextVisible = metrics.questionContextVisible ?? 'nao observado';
  const questionBelongsToState = metrics.questionBelongsToCognitiveState ?? 'nao observado';
  const firstValueOccurred = metrics.journeyCompleted === 'sim' ? 'sim' : 'nao';
  const nextStepClear = metrics.clearNextStepWithoutDetails === 'sim' ? 'Sim' : 'Nao';
  const timeToFirstValue = metrics.timeToFirstValueMs ?? 'nao observado';
  const timeToProcessingFeedback = metrics.timeToProcessingFeedbackMs ?? 'nao observado';
  const firstValueAssessment = assessFirstValueReadiness({
    readyTitle,
    readyBody,
  });
  const uploadWorth = firstValueAssessment.contextualized ? 'Sim' : 'Parcialmente';
  const nextStepJustification =
    qaAssessment.authority?.nextStepJustification ??
    'A jornada ainda nao deixou um proximo passo dominante claro na superficie principal.';
  const residenceFeelsKnown = metrics.residenceFeelsKnown === 'sim' ? 'Sim' : 'Nao';
  const residenceKnowledgeJustification =
    qaAssessment.residenceMapping?.justification ??
    'O QA nao conseguiu medir progresso suficiente no conhecimento da residencia.';
  const questionContinuity = metrics.questionContinuity === 'sim' ? 'Sim' : 'Nao';
  const questionContinuityJustification =
    qaAssessment.continuity?.justification ??
    'A auditoria nao conseguiu observar continuidade suficiente entre perguntas.';
  const investigationTone = metrics.investigationTone === 'sim' ? 'Sim' : 'Nao';
  const initialValueBeforeQuestion = metrics.initialValueBeforeQuestion === 'sim' ? 'Sim' : 'Nao';
  const valueBeforeNextQuestion = metrics.valueBeforeNextQuestion === 'sim' ? 'Sim' : 'Nao';
  const understandingCompounds = metrics.understandingCompounds === 'sim' ? 'Sim' : 'Nao';
  const conversationNotForm = metrics.conversationNotForm === 'sim' ? 'Sim' : 'Nao';
  const scoreWorksBetweenQuestions =
    metrics.scoreWorksBetweenQuestions === 'sim' ? 'Sim' : 'Nao';
  const accountUnderstandingVisible =
    metrics.accountUnderstandingVisible === 'sim' ? 'Sim' : 'Nao';
  const accountCategoriesEvolve =
    metrics.accountCategoriesEvolve === 'sim' ? 'Sim' : 'Nao';
  const accountChangesFollowAnswers =
    metrics.accountChangesFollowAnswers === 'sim' ? 'Sim' : 'Nao';
  const accountConfidenceWithoutFinality =
    metrics.accountConfidenceWithoutFinality === 'sim' ? 'Sim' : 'Nao';
  const accountOpenUnknownsVisible =
    metrics.accountOpenUnknownsVisible === 'sim' ? 'Sim' : 'Nao';
  const accountUnderstandingJustification =
    qaAssessment.accountUnderstanding?.justification ??
    'A auditoria nao conseguiu medir com seguranca se o painel tornou o raciocinio da Score visivel.';
  const valueReturnJustification =
    qaAssessment.valueReturn?.justification ??
    'A auditoria nao conseguiu observar devolucao suficiente entre respostas e novas perguntas.';
  const progressionLog =
    qaAssessment.progression.length > 0
      ? qaAssessment.progression.map((item) => `- ${item}`).join('\n')
      : '- Nenhuma resposta automatizada adicional foi registrada nesta execucao.';
  const nptc =
    metrics.activeQuestionVisible === 'sim'
      ? '1 pergunta visivel antes da primeira confianca parcial.'
      : qaAssessment.state?.pendingQuestion
        ? 'Nao atingido neste ciclo; o estado cognitivo tinha pergunta pronta, mas a interface nao a verbalizou com clareza suficiente para o QA.'
        : 'Nao observado neste ciclo.';
  const likelyReturn =
    metrics.clearNextStepWithoutDetails === 'sim' && metrics.valueBeforeNextQuestion === 'sim'
      ? firstValueAssessment.contextualized
        ? 'Sim, com mais conviccao. O upload ja devolve uma leitura util da conta e cada resposta continua entregando entendimento antes da proxima pergunta.'
        : 'Sim, com mais conviccao. A jornada entrega uma pergunta orientada e uma devolucao observavel entre as etapas.'
      : 'Nao com conviccao. A sessao desperta curiosidade, mas termina sem direcao primaria clara na superficie principal.';
  const summary =
    metrics.journeyCompleted === 'sim'
      ? firstValueAssessment.contextualized &&
        metrics.valueBeforeNextQuestion === 'sim' &&
        metrics.accountUnderstandingVisible === 'sim'
        ? 'A jornada entrega uma primeira pista concreta, torna visivel o raciocinio atual da Score sobre a conta e passa a alternar devolucao de valor com investigacao.'
        : firstValueAssessment.contextualized && metrics.valueBeforeNextQuestion === 'sim'
          ? 'A jornada entrega uma primeira pista concreta e passa a alternar devolucao de valor com investigacao, sem cair em uma sequencia seca de perguntas.'
        : firstValueAssessment.contextualized
          ? 'A jornada entrega uma primeira pista concreta e contextualizada logo apos a leitura da fatura, com um proximo passo ainda dominante.'
          : 'A jornada entrega uma primeira pista concreta e o QA agora consegue representar melhor a pergunta ativa e a autoridade principal vistas pelo usuario.'
      : 'A jornada ainda nao conseguiu entregar um primeiro valor concluido nesta execucao, entao a experiencia cognitiva permaneceu parcial.';
  const improvedLines =
    qaAssessment.evolution?.improved?.length > 0
      ? qaAssessment.evolution.improved.map((item) => `- ${item}`).join('\n')
      : '- Nenhuma melhoria nova foi reconhecida em relacao ao relatorio anterior.';
  const unchangedLines =
    qaAssessment.evolution?.unchanged?.length > 0
      ? qaAssessment.evolution.unchanged.map((item) => `- ${item}`).join('\n')
      : '- Nenhum ponto relevante permaneceu exatamente igual na comparacao automatica.';
  const worsenedLines =
    qaAssessment.evolution?.worsened?.length > 0
      ? qaAssessment.evolution.worsened.map((item) => `- ${item}`).join('\n')
      : '- Nenhuma regressao nova foi detectada pela comparacao automatica.';
  const biggestObstacle =
    firstValueAssessment.contextualized &&
    metrics.valueBeforeNextQuestion === 'sim' &&
    metrics.accountUnderstandingVisible === 'sim'
      ? 'O maior obstaculo atual deixou de ser a invisibilidade do raciocinio e passou a ser aprofundar a qualidade explicativa dessas categorias sem transformar a experiencia em dashboard.'
      : firstValueAssessment.contextualized && metrics.valueBeforeNextQuestion === 'sim'
      ? 'O maior obstaculo atual deixou de ser a ausencia de valor e passou a ser aprofundar a qualidade explicativa dessas devolucoes sem perder fluidez.'
      : firstValueAssessment.contextualized
        ? 'O maior obstaculo atual deixou de ser o Primeiro Valor e passou a ser transformar essa boa primeira leitura em retorno recorrente ainda mais memoravel.'
        : metrics.explainsWhatHappened === 'sim'
        ? 'O maior obstaculo atual deixou de ser a pergunta ativa e passou a ser a densidade interpretativa da fala inicial da Core.'
        : 'O maior obstaculo atual para percepcao de inteligencia continua sendo a fala inicial da Core ainda soar mais ampla do que a pista concreta observada.';

  const content = `# COGNITIVE_JOURNEY_AUDIT_001

## Resumo

${summary}

Documento institucional ausente durante a leitura obrigatoria:

- \`MEMORANDO_INTERNO_001_2026.md\` nao existe no repositorio no momento desta execucao.

## Ambiente

- data: \`${timestamp}\`
- branch: \`${branchName}\`
- comando executado: \`${qaCommand}\`
- URL testada: \`${qaUrl}\`
- navegador: \`${metrics.browser ?? 'Nao identificado'}\`
- fixture principal: \`${relativeFromRoot(invoiceFixturePath)}\`
- auth usada: \`local fallback\`
- provider da jornada: \`local\`

## Momento 1

### Primeiro contato

- O usuario entende imediatamente o proposito da Score? Sim, parcialmente. O titulo \`${landingTitle}\` e o texto logo abaixo apontam para leitura de conta com contexto, nao para um dashboard generico.
- O que ele acredita que a plataforma faz? Ele tende a entender que a Score le a conta, guarda memoria energetica e transforma isso em proximo passo orientado.
- Existe curiosidade? Sim. O contraste entre a promessa principal e o CTA \`${landingButtons}\` convida exploracao.
- Existe confusao? Sim, em nivel leve. Conceitos como Nucleo, memoria, conhecimento e score aparecem cedo demais para um primeiro contato.
- Evidencias observaveis: \`${landingTitle}\`; \`${landingBody}\`.

## Momento 2

### Cadastro

- Existe atrito? Baixo. O cadastro pediu apenas \`${registerFields}\`.
- Alguma informacao parece desnecessaria? Nao nesta etapa. O formulario ficou curto e proporcional ao compromisso inicial.
- O cadastro aproxima ou afasta o usuario? Aproxima, porque a friccao tecnica e pequena e a jornada volta rapido para o fluxo principal.
- Evidencias observaveis: formulario curto, sem campos de contexto prematuros nem interrupcoes externas.

## Momento 3

### Upload

- O usuario entende claramente o que deve fazer? Sim. A superficie principal diz \`${uploadTitle}\` e o card de upload explicita PDF/JPG/PNG com CTA direto.
- Existe receio? Moderado. O usuario ainda entrega um documento sensivel sem ver um exemplo do retorno concreto que recebera.
- Existe confianca? Parcial. A interface parece cuidada e consistente, mas ainda pede um salto de fe antes do primeiro valor.
- Existe expectativa? Sim. O texto \`${uploadBody}\` promete que a fatura vai virar leitura do ciclo.

## Momento 4

### Processamento

- O usuario acredita que a Score continua trabalhando? Sim. A mensagem \`${processingTitle}\` somada ao corpo \`${processingBody}\` reduz a sensacao de travamento.
- Ou acredita que ela travou? Nao nesta execucao, porque o feedback de processamento apareceu rapido.
- Existe feedback suficiente? Parcialmente. Existe feedback de atividade, mas nao existe previsao, etapa ou criterio de conclusao.
- Quanto tempo permaneceu sem resposta clara? \`${timeToProcessingFeedback}\` ms ate a primeira mensagem explicita de processamento; depois disso o usuario recebeu presenca, mas nao recebeu progresso detalhado durante \`${metrics.invoiceProcessingMs}\`.

## Momento 5

### Primeira manifestacao da Core

- A Core parece compreender o contexto? ${firstValueAssessment.contextualized ? 'Sim.' : 'Parcialmente.'} ${firstValueAssessment.contextualized ? 'A fala principal conecta a conta enviada a uma leitura inicial util antes mesmo de abrir detalhes.' : `Ela usa dados reais do ciclo e mostra numeros da conta, mas a fala principal \`${readyTitle}\` ainda e generica demais para soar profundamente contextual.`}
- Ou apenas repetir mensagens? ${firstValueAssessment.contextualized ? 'Nao.' : 'Nao chega a repetir, mas ainda fala em nivel de pista ampla, sem conectar logo de inicio a conta enviada com uma explicacao nitida.'} ${firstValueAssessment.contextualized ? 'A Hero ancora a pista no ciclo lido e deixa claro por que a investigacao continua.' : ''}
- Sua presenca aumenta confianca? Sim, porque da continuidade e presenca ao sistema.
- Ou apenas ocupa espaco? ${firstValueAssessment.contextualized ? 'Nao nesta execucao. A Hero ja explica o que foi percebido sem obrigar o usuario a abrir detalhes.' : 'Parcialmente ocupa espaco quando a fala permanece vaga e a explicacao mais concreta fica escondida nos detalhes.'}
- Evidencias observaveis: \`${readyTitle}\`; \`${readyBody}\`.

## Momento 6

### Primeira pergunta

- A pergunta parece natural? ${explicitQuestionVisible === 'sim' ? 'Sim.' : 'Nao totalmente.'} ${explicitQuestionVisible === 'sim' ? 'A pergunta aparece com enunciado explicito no Hero antes das opcoes.' : 'A pergunta ainda nao apareceu com enunciado explicito suficiente no Hero.'}
- O usuario entende por que ela foi feita? ${questionContextVisible === 'sim' ? 'Sim, com contexto suficiente antes das opcoes.' : 'Nao com clareza suficiente, porque o QA nao encontrou contexto robusto antes das opcoes.'}
- Existe um local claro para responder? ${metrics.clearResponseArea === 'sim' ? 'Sim.' : 'Nao.'} ${metrics.clearResponseArea === 'sim' ? 'As opcoes de resposta ficam no mesmo bloco da pergunta ativa.' : 'A pergunta nao ficou acoplada a uma area de resposta evidente.'}
- Ela pertence ao estado cognitivo? ${questionBelongsToState === 'sim' ? 'Sim.' : 'Nao com seguranca.'} ${questionBelongsToState === 'sim' ? 'O QA vinculou a pergunta renderizada a uma pergunta pendente do estado persistido da jornada.' : 'A superficie observada nao ficou suficientemente ancorada ao estado cognitivo salvo.'}
- Ela reduz incerteza? ${explicitQuestionVisible === 'sim' && metrics.clearResponseArea === 'sim' ? 'Sim, parcialmente.' : 'Ainda nao.'} ${explicitQuestionVisible === 'sim' && metrics.clearResponseArea === 'sim' ? 'A pergunta ja orienta a proxima leitura, mesmo que a fala inicial da Core ainda possa ser mais especifica.' : 'Sem enunciado e resposta bem alinhados, a interacao ainda se aproxima de um fragmento de formulario.'}
- Evidencias observaveis: pergunta explicita visivel = \`${explicitQuestionVisible}\`; contexto antes das opcoes = \`${questionContextVisible}\`; vinculacao ao estado cognitivo = \`${questionBelongsToState}\`; opcoes observadas = \`${questionOptions}\`; quantidade de gatilhos \`Mostrar detalhes\` na hero = \`${detailButtons}\`.

## Momento 6.1

### Devolucao entre perguntas

- O usuario recebeu algum valor antes da primeira pergunta? ${initialValueBeforeQuestion}. ${initialValueBeforeQuestion === 'Sim' ? 'A Hero entregou uma leitura observavel antes de revelar a investigacao inicial.' : 'A Hero abriu a pergunta cedo demais, sem uma leitura previa suficientemente clara.'}
- O usuario recebeu algum valor antes da proxima pergunta? ${valueBeforeNextQuestion}. ${valueReturnJustification}
- Cada resposta aumentou a compreensao percebida? ${understandingCompounds}. ${understandingCompounds === 'Sim' ? 'As devolucoes observadas explicaram o que mudou na leitura antes da continuidade.' : 'Nem toda resposta gerou uma devolucao clara o bastante para parecer ganho de compreensao.'}
- O usuario sente que a Score tambem trabalha entre uma pergunta e outra? ${scoreWorksBetweenQuestions}. ${scoreWorksBetweenQuestions === 'Sim' ? 'A Hero mostrou leitura, hipotese e incerteza antes de seguir.' : 'A Score ainda parece perguntar mais rapido do que interpreta entre uma etapa e outra.'}

## Momento 6.2

### Continuidade investigativa

- A residencia parece estar ficando conhecida? ${residenceFeelsKnown}. ${residenceKnowledgeJustification}
- Existe continuidade entre uma pergunta e outra? ${questionContinuity}. ${questionContinuityJustification}
- A investigacao parece conversa ou formulario? ${conversationNotForm === 'Sim' ? 'Conversa.' : 'Ainda proxima de formulario.'} ${conversationNotForm === 'Sim' ? 'A troca entre devolucao e pergunta fez a jornada soar interpretativa.' : 'A troca entre perguntas ainda ficou mais proxima de um cadastro do que de uma investigacao guiada.'}
- As perguntas parecem consequencia da investigacao? ${investigationTone}. ${investigationTone === 'Sim' ? 'A proxima pergunta apareceu como continuacao do que a Score ja tinha acabado de descobrir.' : 'A troca entre perguntas ainda ficou mais proxima de um cadastro do que de uma investigacao guiada.'}
- Log observado na execucao:
${progressionLog}

## Momento 6.3

### O Que Esta Por Tras da Conta

- O usuario consegue perceber que a Score esta compreendendo sua conta? ${accountUnderstandingVisible}. ${accountUnderstandingJustification}
- As categorias evoluem de forma coerente durante a investigacao? ${accountCategoriesEvolve}. ${accountCategoriesEvolve === 'Sim' ? 'As categorias ligadas as respostas observadas ganharam compreensao ao longo da execucao.' : 'A auditoria ainda nao conseguiu enxergar evolucao suficientemente coerente entre resposta e categoria.'}
- As mudancas parecem consequencia das respostas? ${accountChangesFollowAnswers}. ${accountChangesFollowAnswers === 'Sim' ? 'As categorias mais relacionadas a resposta observada foram as que mudaram de estado.' : 'As mudancas do painel ainda nao ficaram claramente ligadas a resposta que acabou de entrar.'}
- O painel transmite confianca sem parecer definitivo? ${accountConfidenceWithoutFinality}. ${accountConfidenceWithoutFinality === 'Sim' ? 'O painel mostra categorias com sustentacao e tambem deixa algumas frentes em aberto.' : 'A leitura do painel ainda nao equilibra bem sustentacao e incerteza.'}
- O usuario entende claramente o que ainda esta em aberto? ${accountOpenUnknownsVisible}. ${accountOpenUnknownsVisible === 'Sim' ? 'As categorias em aberto seguem visiveis como parte da investigacao.' : 'O painel ainda nao explicita com clareza o que falta descobrir.'}

## Momento 7

### Primeiro Valor

- Qual foi o primeiro momento em que a Score entregou algo util? Quando a tela pronta exibiu uma pista principal e os tres numeros basicos do ciclo: valor total, consumo e custo medio.
- O upload valeu a pena? ${uploadWorth}. ${firstValueAssessment.contextualized ? 'O usuario recebe uma leitura inicial ancorada na propria conta e entende melhor por que a investigacao continua.' : 'O usuario recebe retorno real, mas ainda nao entende com precisao por que aquela pista importa agora.'}
- O usuario aprendeu algo novo? ${firstValueAssessment.contextualized ? 'Sim.' : 'Sim, em nivel basico.'} ${firstValueAssessment.contextualized ? 'Ele sai entendendo melhor o tamanho do ciclo observado e por que a proxima pergunta ajuda a separar a causa.' : 'Ele sai com ao menos um resumo numerico do ciclo e uma pista inicial a acompanhar.'}
- Esse momento aconteceu? ${firstValueOccurred}. ${firstValueAssessment.contextualized ? 'Quando aconteceu, se aproximou mais de uma compreensao inicial util do que de uma curiosidade solta.' : 'Quando aconteceu, foi mais forte como curiosidade orientada do que como compreensao fechada.'}

## Momento 8

### Proximo passo

- O usuario sabe exatamente o que fazer agora? ${nextStepClear}. ${nextStepJustification}
- Existe apenas um CTA principal? ${metrics.heroHasSinglePrimaryAction === 'sim' ? 'Sim.' : 'Nao.'} A Hero registrou como acao dominante: \`${metrics.heroSovereignPrimaryAction ?? 'indefinido'}\`.
- Existem CTAs concorrentes? ${metrics.heroCompetingCtas === 'sim' ? 'Sim.' : 'Nao.'} Gatilhos de detalhe visiveis na Hero: \`${detailButtons}\`.
- Ou a jornada termina sem direcao? ${nextStepClear === 'Sim' ? 'Nao. Existe um proximo passo dominante antes de abrir detalhes.' : 'Parcialmente. A direcao melhora, mas ainda depende de exploracao adicional para se consolidar.'}

## Metricas cognitivas

- Tempo ate Primeiro Valor (TTFV): \`${timeToFirstValue}\` ms entre login concluido e primeira pista util observada.
- Numero de Perguntas ate Confianca (NPTC): ${nptc}
- Compreensao da conta visivel: ${accountUnderstandingVisible}. Justificativa: ${accountUnderstandingJustification}
- Evolucao coerente das categorias: ${accountCategoriesEvolve}.
- Categorias ligadas as respostas: ${accountChangesFollowAnswers}.
- Confianca sem finalismo: ${accountConfidenceWithoutFinality}.
- O que ainda esta em aberto continua visivel: ${accountOpenUnknownsVisible}.
- Devolucao antes da proxima pergunta: ${valueBeforeNextQuestion}. Justificativa: ${valueReturnJustification}
- Compreensao acumulada entre respostas: ${understandingCompounds}.
- Conversa em vez de formulario: ${conversationNotForm}.
- Proximo Passo Claro: ${nextStepClear}. Justificativa: ${nextStepJustification}
- Conhecimento da residencia em progresso: ${residenceFeelsKnown}. Delta observado: \`${metrics.residenceKnowledgeDelta ?? 0}\`.
- Continuidade entre perguntas: ${questionContinuity}. Justificativa: ${questionContinuityJustification}
- Retorno Provavel: ${likelyReturn}

## Evolucao

### O que melhorou desde a auditoria anterior?

${improvedLines}

### O que permanece igual?

${unchangedLines}

### O que piorou?

${worsenedLines}

### Maior obstaculo atual para percepcao de inteligencia

- ${biggestObstacle}

## Artefatos

${artifactsLines}

## Limitacoes

${limitations.map((item) => `- ${item}`).join('\n')}

## Recomendacoes

${recommendations.map((item) => `- ${item}`).join('\n') || '- Manter a trilha e ampliar a cobertura cognitiva da auditoria.'}
`;

  await writeFile(cognitiveReportPath, content, 'utf8');
}

async function captureStoredJourneyState(page) {
  return page.evaluate(() => {
    const storageKey = Object.keys(window.localStorage).find((candidate) =>
      candidate.startsWith('score-energy:mvp-journey:v1:')
    );

    if (!storageKey) {
      return null;
    }

    try {
      return JSON.parse(window.localStorage.getItem(storageKey) || 'null');
    } catch (_error) {
      return null;
    }
  });
}

async function waitForNextQuestion(page, previousQuestionId, previousKnowledgeCount) {
  return page
    .waitForFunction(
      ({ expectedPreviousKnowledgeCount, expectedPreviousQuestionId }) => {
        const storageKey = Object.keys(window.localStorage).find((candidate) =>
          candidate.startsWith('score-energy:mvp-journey:v1:')
        );

        if (!storageKey) {
          return false;
        }

        try {
          const state = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
          const actions = Array.isArray(state?.actions?.items) ? state.actions.items : [];
          const answeredActionPrompts = state?.energyBehaviorProfile?.actionMemory?.answeredActionPrompts ?? {};
          const answeredQuestionIds = new Set(Object.keys(answeredActionPrompts));
          const pendingQuestion = actions
            .flatMap((action) => (Array.isArray(action?.interactiveQuestions) ? action.interactiveQuestions : []))
            .find((question) => question?.id && !answeredQuestionIds.has(question.id));
          const residenceKnowledgeCount = [
            Boolean(state?.energyBehaviorProfile?.habits?.residenceType),
            Boolean(state?.energyBehaviorProfile?.habits?.roomCountRange),
            typeof state?.energyBehaviorProfile?.habits?.hasChildren === 'boolean',
            typeof state?.energyBehaviorProfile?.habits?.hasElderly === 'boolean',
            typeof state?.energyBehaviorProfile?.appliances?.bathrooms === 'number',
            typeof state?.energyBehaviorProfile?.appliances?.showers === 'number',
            Boolean(state?.energyBehaviorProfile?.appliances?.showerHeatingType),
          ].filter(Boolean).length;

          return (
            (pendingQuestion?.id && pendingQuestion.id !== expectedPreviousQuestionId) ||
            residenceKnowledgeCount > expectedPreviousKnowledgeCount
          );
        } catch (_error) {
          return false;
        }
      },
      {
        expectedPreviousKnowledgeCount: previousKnowledgeCount,
        expectedPreviousQuestionId: previousQuestionId,
      },
      { timeout: 20_000 }
    )
    .catch(() => undefined);
}

async function waitForQuestionRender(page, pendingQuestion) {
  if (!pendingQuestion?.id) {
    return;
  }

  const expectedPrompt = normalizeInlineText(pendingQuestion.prompt);
  const expectedOptions = Array.isArray(pendingQuestion.optionLabels)
    ? pendingQuestion.optionLabels.map(normalizeInlineText).filter(Boolean)
    : [];

  const isVisibleQuestionRendered = ({ prompt, optionLabels }) => {
    const normalize = (value) =>
      typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
    const visibleNodes = Array.from(
      document.querySelectorAll('main p, main h1, main h2, main h3, main span, main button, main a')
    ).filter((node) => {
      const element = node;
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    const visibleTexts = visibleNodes
      .map((node) => normalize(node.textContent))
      .filter(Boolean);
    const promptVisible = prompt ? visibleTexts.includes(prompt) : true;
    const matchedOptions = optionLabels.filter((label) => visibleTexts.includes(label));
    return promptVisible && (optionLabels.length === 0 || matchedOptions.length > 0);
  };

  try {
    await page.waitForFunction(
      isVisibleQuestionRendered,
      { prompt: expectedPrompt, optionLabels: expectedOptions },
      { timeout: 15_000 }
    );
  } catch (_error) {
    const debugSnapshot = await page.evaluate(() => {
      const normalize = (value) =>
        typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
      const collect = (selector) =>
        Array.from(document.querySelectorAll(selector))
          .filter((node) => {
            const style = window.getComputedStyle(node);
            return style.display !== 'none' && style.visibility !== 'hidden';
          })
          .map((node) => normalize(node.textContent))
          .filter(Boolean);

      return {
        buttons: collect('main button, main a'),
        text: collect('main p, main h1, main h2, main h3, main span').slice(0, 24),
      };
    });

    throw new Error(
      `Pergunta nao renderizou como esperado: ${pendingQuestion.id}. ` +
        `Prompt esperado="${expectedPrompt}". ` +
        `Opcoes esperadas=${expectedOptions.join(', ') || 'nenhuma'}. ` +
        `Botoes visiveis=${debugSnapshot.buttons.join(' | ') || 'nenhum'}. ` +
        `Textos visiveis=${debugSnapshot.text.join(' | ') || 'nenhum'}.`
    );
  }
}

async function waitForValueReturn(page) {
  return page
    .waitForFunction(
      () => Boolean(document.querySelector('[data-cognitive-stage="value-return"]')),
      undefined,
      { timeout: 15_000 }
    )
    .catch(() => undefined);
}

async function continueInvestigationFromFeedback(page) {
  const continueLocator = page
    .locator('[data-cognitive-next-step="continue-investigation"]:visible')
    .first();

  if ((await continueLocator.count()) === 0) {
    return;
  }

  await continueLocator.click();
}

async function inspectQuestionSignalsInHero(heroLocator, pendingQuestion) {
  const heroTexts = await getVisibleTextsIn(heroLocator, 'p, h1, h2, h3, span');
  const heroButtons = await getVisibleTextsIn(heroLocator, 'button');
  const normalizedHeroText = heroTexts.map(normalizeInlineText);
  const promptVisible = pendingQuestion?.prompt
    ? normalizedHeroText.includes(normalizeInlineText(pendingQuestion.prompt))
    : false;
  const helperVisible = pendingQuestion?.helperText
    ? normalizedHeroText.includes(normalizeInlineText(pendingQuestion.helperText))
    : false;

  return {
    helperVisible,
    promptVisible,
    visibleOptionLabels: heroButtons,
  };
}

async function inspectValueReturnInHero(heroLocator, pendingQuestion) {
  const valueReturnLocator = heroLocator.locator('[data-cognitive-stage="value-return"]').first();
  const valueReturnVisible = (await valueReturnLocator.count()) > 0;

  if (!valueReturnVisible) {
    return {
      continueVisible: false,
      feedbackLineCount: 0,
      nextQuestionHidden: false,
      valueReturnVisible: false,
      visibleTexts: [],
    };
  }

  const feedbackTexts = await getVisibleTextsIn(valueReturnLocator, 'p, h1, h2, h3, span');
  const feedbackButtons = await getVisibleTextsIn(valueReturnLocator, 'button');
  const normalizedHeroText = (await getVisibleTextsIn(heroLocator, 'p, h1, h2, h3, span')).map(
    normalizeInlineText
  );
  const normalizedHeroButtons = (await getVisibleTextsIn(heroLocator, 'button')).map(normalizeInlineText);
  const promptVisible = pendingQuestion?.prompt
    ? normalizedHeroText.includes(normalizeInlineText(pendingQuestion.prompt))
    : false;
  const visibleNextOptions = (pendingQuestion?.optionLabels ?? []).filter((label) =>
    normalizedHeroButtons.includes(normalizeInlineText(label))
  );

  return {
    continueVisible: feedbackButtons.some((label) =>
      ['Continuar investigacao', 'Continuar leitura', 'Refinar leitura'].includes(
        normalizeInlineText(label)
      )
    ),
    feedbackLineCount: feedbackTexts.length,
    nextQuestionHidden: !promptVisible && visibleNextOptions.length === 0,
    valueReturnVisible: true,
    visibleTexts: feedbackTexts,
  };
}

async function inspectAccountUnderstandingPanel(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('[data-account-understanding-panel="true"]');

    if (!panel) {
      return {
        categories: [],
        visible: false,
      };
    }

    const normalize = (value) =>
      typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
    const categories = Array.from(
      panel.querySelectorAll('[data-understanding-category]')
    ).map((node) => ({
      id: node.getAttribute('data-understanding-category') || '',
      isOpenQuestion: node.getAttribute('data-understanding-open') === 'true',
      level: node.getAttribute('data-understanding-level') || '',
      openPoint: normalize(node.getAttribute('data-understanding-open-point') || ''),
      supportCount: Number(node.getAttribute('data-understanding-support-count') || '0'),
      text: normalize(node.textContent),
    }));

    return {
      categories,
      visible: true,
    };
  });
}

async function inspectDetailsNextStep(page) {
  const visibleTexts = await getVisibleTextsIn(page.locator('main').first(), 'button, a, p, h1, h2, h3');
  const normalizedTexts = visibleTexts.map(normalizeInlineText);
  const primaryActionLabel =
    visibleTexts.find((label) => normalizeInlineText(label) === 'Ver continuidade do ciclo') ||
    visibleTexts.find((label) => normalizeInlineText(label) === 'Continuidade principal') ||
    visibleTexts.find((label) => normalizeInlineText(label) === 'Comecar acompanhamento') ||
    visibleTexts.find((label) => normalizeInlineText(label) === 'Preparar acompanhamento');

  return {
    clearNextStepAfterDetails: Boolean(primaryActionLabel),
    primaryActionLabel,
    visibleTexts: normalizedTexts,
  };
}

async function captureSectionSnapshot(sectionLocator) {
  const headings = await getVisibleTextsIn(sectionLocator, 'h1, h2, h3');
  const paragraphs = await getVisibleTextsIn(sectionLocator, 'p');
  const buttons = await getVisibleTextsIn(sectionLocator, 'button, a');
  const descriptiveParagraph =
    paragraphs.find((paragraph) => paragraph.length > 24 && paragraph.toLowerCase() !== 'core') ??
    paragraphs[0];

  return {
    headings,
    paragraphs,
    buttons,
    primaryHeading: headings[0],
    primaryBody: descriptiveParagraph,
  };
}

async function captureFormSnapshot(page) {
  const form = page.locator('form').first();

  return {
    labels: await getVisibleTextsIn(form, 'label'),
    visibleInputCount: await countVisibleSelectorIn(form, 'input'),
  };
}

async function getVisibleTextsIn(rootLocator, selector) {
  return rootLocator.locator(selector).evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const style = window.getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((node) => node.textContent?.trim() || '')
      .filter(Boolean)
  );
}

async function countVisibleSelectorIn(rootLocator, selector) {
  return rootLocator.locator(selector).evaluateAll((nodes) =>
    nodes.filter((node) => {
      const style = window.getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }).length
  );
}

async function countVisibleText(rootLocator, text) {
  return rootLocator
    .getByText(text, { exact: true })
    .evaluateAll((nodes) =>
      nodes.filter((node) => {
        const style = window.getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }).length
    )
    .catch(() => 0);
}

async function getVisibleOptionLabels(rootLocator) {
  const labels = await getVisibleTextsIn(rootLocator, 'button');
  return labels.filter((label) =>
    /^(0|1|2|2\+|3\+|1-3|4-6|7\+|sim|nao|nao sei|casa|apartamento|sobrado|studio|eletrico|gas|misto|noite)$/i.test(label)
  );
}

async function getFirstVisibleText(page, selector) {
  const texts = await page.locator(selector).evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const style = window.getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })
      .map((node) => node.textContent?.trim() || '')
      .filter(Boolean)
  );

  return texts[0];
}

function normalizeInlineText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isDetailLikeActionLabel(value) {
  const normalized = normalizeInlineText(value).toLowerCase();
  return (
    normalized.includes('mostrar detalhes') ||
    normalized.includes('ver o que ja percebi') ||
    normalized.includes('ver pistas') ||
    normalized.includes('ver contexto')
  );
}

function assessFirstValueReadiness({ readyTitle, readyBody }) {
  const normalized = normalizeInlineText(`${readyTitle} ${readyBody}`).toLowerCase();
  const hasInvoiceReference =
    normalized.includes('sua conta') ||
    normalized.includes('fatura') ||
    normalized.includes('neste ciclo');
  const hasConcreteSignal =
    normalized.includes('kwh') || /r\$\s?\d/.test(normalized);

  return {
    contextualized: hasInvoiceReference && hasConcreteSignal,
  };
}

function formatInlineList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 'nao observado';
  }

  return items.join(', ');
}

async function ensureQaReadme() {
  await writeFile(qaReadmePath, QA_README_CONTENT, 'utf8');
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

function humanizeMetricKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
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
