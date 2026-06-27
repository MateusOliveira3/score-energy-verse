import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPreReadyProductRuntime,
  buildProductRuntime,
  buildResponseProductRuntime,
  PRODUCT_RUNTIME_SECTIONS,
} from '@/lib/productRuntime';

test('product runtime materializa uma descoberta protagonista', () => {
  const runtime = buildProductRuntime({
    billValue: 'R$ 320.00',
    consumption: '280 kWh',
    hermesMessage: 'Encontrei algo interessante na sua conta.',
    primaryActionLabel: 'Vale observar se a geladeira esta muito cheia.',
    primaryDiscovery: {
      headline: 'A refrigeracao parece ser o principal peso desta conta.',
      id: 'refrigeration',
      meaning: 'Ela trabalha o dia inteiro.',
    },
    secondarySignals: [{ id: 'lighting', label: 'Iluminacao' }],
  });

  assert.equal(runtime.primaryDiscovery?.headline, 'A refrigeracao parece ser o principal peso desta conta.');
  assert.equal(runtime.secondarySignals.length, 1);
  assert.equal(runtime.experience.hermes.message, 'Encontrei algo interessante na sua conta.');
  assert.equal(runtime.experience.score.discovery?.headline, runtime.primaryDiscovery?.headline);
  assert.equal(runtime.experience.score.meaning, 'Ela trabalha o dia inteiro.');
  assert.ok(runtime.visibleSections.includes('primary_discovery'));
  assert.ok(runtime.visibleSections.includes('primary_meaning'));
});

test('product runtime define um unico cta por leitura', () => {
  const runtime = buildProductRuntime({
    nextQuestionAvailable: true,
    primaryActionLabel: 'Banhos dois minutos menores ja podem aliviar esse peso.',
    primaryDiscovery: {
      headline: 'O banho parece ser o principal peso desta conta.',
    },
  });

  assert.deepEqual(runtime.cta, {
    label: 'Refinar leitura',
    target: 'question',
  });
  assert.equal(runtime.primaryAction?.target, 'question');
  assert.equal(runtime.experience.score.action?.target, 'question');
});

test('product runtime materializa secoes ocultas pela complexidade escondida', () => {
  const runtime = buildProductRuntime({
    primaryDiscovery: {
      headline: 'Ja encontrei os primeiros sinais desta conta.',
    },
  });

  assert.ok(runtime.hiddenSections.includes('conversation_memory'));
  assert.ok(runtime.hiddenSections.includes('secondary_signals'));
  assert.ok(runtime.hiddenSections.includes('deep_reading'));
});

test('product runtime marca aprofundamento quando existe leitura secundaria', () => {
  const runtime = buildProductRuntime({
    deepReadingAvailable: true,
    primaryActionLabel: 'Vale observar quais usos da cozinha se repetem todos os dias.',
    primaryDiscovery: {
      headline: 'A cozinha parece ganhar peso aos poucos.',
    },
  });

  assert.equal(runtime.deepReadingAvailable, true);
  assert.ok(runtime.visibleSections.includes('deep_reading'));
  assert.equal(runtime.experience.score.deepReading.available, true);
  assert.deepEqual(runtime.cta, {
    label: 'Ver',
    target: 'deep_reading',
  });
});

test('product runtime reconhece estado inicial sem memoria', () => {
  const runtime = buildProductRuntime({
    nextQuestionAvailable: true,
    primaryActionLabel: 'Vale observar qual ambiente fica mais tempo em uso.',
    primaryDiscovery: {
      headline: 'Ja encontrei os primeiros sinais desta conta.',
    },
  });

  assert.equal(runtime.stage, 'refinement_reading');
  assert.equal(runtime.conversationMemory, undefined);
});

test('product runtime reconhece estado com memoria', () => {
  const runtime = buildProductRuntime({
    conversationMemory: 'Com o que descobrimos ate aqui, consigo olhar esta conta com mais contexto.',
    primaryActionLabel: 'Vale observar se a geladeira esta muito cheia.',
    primaryDiscovery: {
      headline: 'A refrigeracao parece ser o principal peso desta conta.',
    },
  });

  assert.equal(runtime.stage, 'memory_reading');
  assert.ok(runtime.visibleSections.includes('conversation_memory'));
  assert.equal(
    runtime.experience.hermes.line,
    'Com o que descobrimos ate aqui, consigo olhar esta conta com mais contexto.'
  );
});

test('product runtime preserva estado sem memoria e sem inventar secoes', () => {
  const runtime = buildProductRuntime({
    billValue: 'R$ 320.00',
    primaryDiscovery: {
      headline: 'A iluminacao parece ter pouco peso agora.',
    },
  });

  assert.equal(runtime.conversationMemory, undefined);
  assert.equal(runtime.visibleSections.includes('conversation_memory'), false);
  assert.deepEqual(
    runtime.hiddenSections.sort(),
    PRODUCT_RUNTIME_SECTIONS.filter((section) => !runtime.visibleSections.includes(section)).sort()
  );
});

test('product runtime separa hermes e score sem mover responsabilidades para o react', () => {
  const runtime = buildProductRuntime({
    conversationMemory: 'Agora conheco um pouco melhor sua casa.',
    deepReadingAvailable: true,
    deepReadingPreview: 'Ainda existe uma parte da conta que merece leitura complementar.',
    deepReadingTarget: 'memory',
    hermesMessage: 'Encontrei algo interessante na sua conta.',
    nextQuestionAvailable: true,
    primaryActionLabel: 'Vale observar se a geladeira esta muito cheia.',
    primaryDiscovery: {
      headline: 'A refrigeracao parece ser o principal peso desta conta.',
      id: 'refrigeration',
      meaning: 'Ela trabalha o dia inteiro.',
    },
    question: {
      detailSection: 'memory',
      helperText: 'Isso deixa a leitura menos generica.',
      id: 'bathrooms_count',
      kind: 'context',
      options: [{ label: '2', value: '2' }],
      prompt: 'Quantos banheiros entram na rotina dessa residencia?',
    },
    secondarySignals: [{ id: 'lighting', label: 'Iluminacao', shareLabel: 'aprox. 6%' }],
    uncertainty: 'Ainda existe uma parte da conta que eu preciso confirmar.',
  });

  assert.equal(runtime.experience.hermes.line, 'Agora conheco um pouco melhor sua casa.');
  assert.equal(runtime.experience.hermes.message, 'Encontrei algo interessante na sua conta.');
  assert.equal(runtime.experience.hermes.question?.id, 'bathrooms_count');
  assert.equal(runtime.experience.score.discovery?.id, 'refrigeration');
  assert.equal(runtime.experience.score.action?.label, 'Vale observar se a geladeira esta muito cheia.');
  assert.equal(runtime.experience.score.deepReading.target, 'memory');
  assert.equal(runtime.experience.score.secondarySignals[0]?.shareLabel, 'aprox. 6%');
  assert.equal(
    runtime.experience.score.deepReading.preview,
    'Ainda existe uma parte da conta que merece leitura complementar.'
  );
});

test('product runtime materializa estados pre-ready com no maximo um cta', () => {
  const runtime = buildPreReadyProductRuntime({
    cta: {
      label: 'Enviar conta',
      target: 'question',
    },
    hermesLine: 'Quando a conta entrar, eu sigo com voce.',
    scoreHeadline: 'A primeira leitura comeca quando a fatura vira casa.',
    scoreSupport: 'Primeiro vem a leitura. Depois vem qualquer pergunta.',
    state: 'upload',
  });

  assert.equal(runtime.state, 'upload');
  assert.equal(runtime.experience.hermes.line, 'Quando a conta entrar, eu sigo com voce.');
  assert.equal(runtime.experience.score.discovery?.headline, 'A primeira leitura comeca quando a fatura vira casa.');
  assert.equal(runtime.cta?.label, 'Enviar conta');
  assert.equal(runtime.visibleSections.includes('primary_action'), true);
});

test('product runtime materializa pos-resposta sem depender de filosofia no react', () => {
  const runtime = buildResponseProductRuntime({
    hermesLine: 'Recebi sua resposta e segui com a leitura.',
    scoreActionLabel: 'Continuar leitura',
    scoreHeadline: 'Agora consigo ligar melhor esse habito ao que apareceu na conta.',
    scoreSupport: 'Isso ajuda a deixar a proxima leitura menos generica.',
    uncertainty: 'Ainda existe uma parte da conta que eu quero confirmar antes da proxima conclusao.',
  });

  assert.equal(runtime.state, 'response');
  assert.equal(runtime.experience.hermes.line, 'Recebi sua resposta e segui com a leitura.');
  assert.equal(runtime.experience.score.action?.label, 'Continuar leitura');
  assert.equal(runtime.experience.score.support, 'Isso ajuda a deixar a proxima leitura menos generica.');
});
