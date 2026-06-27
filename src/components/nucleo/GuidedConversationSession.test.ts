import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

const sessionFile = resolve(
  process.cwd(),
  'src/components/nucleo/GuidedConversationSession.tsx'
);

test('GuidedConversationSession consome CoreExperience no hero principal', async () => {
  const source = await readFile(sessionFile, 'utf8');

  assert.match(source, /experience\?: CoreExperience/);
  assert.match(source, /viewModel\.firstReading/);
  assert.match(source, /productRuntime/);
  assert.match(source, /surface\?\.hermes\.line/);
  assert.match(source, /surface\?\.score\.discovery\?\.headline/);
  assert.match(source, /surface\?\.score\.meaning/);
  assert.match(source, /surface\?\.score\.action\?\.label/);
  assert.match(source, /surfaceRuntime\.score\.discovery\?\.headline/);
  assert.match(source, /surfaceRuntime\.score\.support/);
  assert.match(source, /surfaceRuntime\.hermes\.line/);
  assert.match(source, /supportLine:/);
  assert.match(source, /runtime\.cta\.label/);
  assert.match(source, /Conta em foco:/);
  assert.match(source, /data-account-understanding-panel/);
  assert.match(source, /data-understanding-support-count/);
  assert.match(source, /data-understanding-open-point/);
  assert.match(source, /variant="hero"/);
  assert.doesNotMatch(source, /Primeira leitura pronta/);
  assert.doesNotMatch(source, /Fator em foco/);
  assert.doesNotMatch(source, /Lacuna principal/);
  assert.doesNotMatch(source, /Conhecimento Energetico/);
});

test('GuidedConversationSession mantem fallback elegante sem experience', async () => {
  const source = await readFile(sessionFile, 'utf8');

  assert.match(source, /buildInitialInvestigationFeedback/);
  assert.match(source, /buildGuidedAnswerFeedbackSurface/);
  assert.match(source, /renderAccountUnderstandingPanel/);
  assert.match(source, /variant="hero"/);
  assert.match(source, /runtime\?\.cta\?\.target === 'question'/);
  assert.match(source, /surface\?\.score\.action\?\.label/);
  assert.match(source, /surface\?\.score\.discovery\?\.headline/);
  assert.match(source, /surface\?\.hermes\.line/);
  assert.match(source, /viewModel\.productRuntime\.experience/);
  assert.doesNotMatch(source, /runtimeStatusLabel/);
  assert.doesNotMatch(source, /renderMetrics\(\)/);
});

test('CorePresence hero usa continuidade explicita entre leitura e proxima pergunta', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/components/nucleo/CorePresence.tsx'),
    'utf8'
  );

  assert.match(source, /readingRuntime\?\.experience\.hermes\.question/);
  assert.match(source, /surfaceRuntime\?\.hermes\.line/);
  assert.match(source, /surfaceRuntime\?\.score\.discovery\?\.headline/);
  assert.match(source, /surfaceRuntime\?\.score\.meaning/);
  assert.match(source, /activeRuntime\?\.experience\.score\.deepReading\.target/);
  assert.match(source, /productRuntime\.visibleSections\.includes\('bill_value'\)/);
  assert.match(source, /productRuntime\.visibleSections\.includes\('primary_action'\)/);
  assert.match(source, /productRuntime\.visibleSections\.includes\('secondary_signals'\)/);
  assert.match(source, /Outros sinais desta conta/);
  assert.match(source, /O que fazer agora/);
  assert.doesNotMatch(source, /O que mudou na leitura/);
  assert.doesNotMatch(source, /compreensao atualizada/i);
  assert.doesNotMatch(source, /pista\{/i);
});

test('aprofundamento evita linguagem principal de painel e sistema', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/pages/Index.tsx'),
    'utf8'
  );

  assert.match(source, /Ver mais sobre esta conta/);
  assert.match(source, /Detalhes da leitura/);
  assert.doesNotMatch(source, /Leitura expandida/);
  assert.doesNotMatch(source, /Mais sobre esta conta/);
  assert.doesNotMatch(source, /Em aberto:/);
  assert.doesNotMatch(source, /pista\{/i);
});
