import type {
  ScoreAssistantChatResponse,
  ScoreAssistantContextSnapshot,
  ScoreAssistantMessage,
} from './types';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const toNaturalList = (values: string[]) => {
  if (values.length === 0) {
    return '';
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} e ${values[1]}`;
  }

  return `${values.slice(0, -1).join(', ')} e ${values[values.length - 1]}`;
};

const buildGenericEducationalAnswer = (context?: ScoreAssistantContextSnapshot) => {
  if (!context?.hasMemoryContext) {
    return 'Eu consigo te ajudar melhor quando existe pelo menos um pouco de contexto da sua jornada. Se voce selecionar uma fatura ou completar mais detalhes do perfil, eu consigo conectar consumo, habitos e memoria energetica com mais precisao.';
  }

  const memorySignal = context.memorySignals[0];
  const nextAction = context.suggestedNextAction;

  return `Na Score, a melhor decisao energetica quase sempre nasce de contexto. ${memorySignal ? `Hoje eu ja consigo considerar ${memorySignal.toLowerCase()}. ` : ''}${nextAction ? `O proximo passo mais util agora e ${nextAction.toLowerCase()}.` : 'Se quiser, me pergunte sobre consumo, cargas, memoria energetica ou proximos passos.'}`;
};

export const buildFallbackAssistantResponse = ({
  context,
  messages,
}: {
  context?: ScoreAssistantContextSnapshot;
  messages: ScoreAssistantMessage[];
}): ScoreAssistantChatResponse => {
  const latestUserMessage = messages
    .filter((message) => message.role === 'user')
    .at(-1)?.content;
  const normalizedMessage = normalize(latestUserMessage ?? '');
  const memorySignalsUsed = (context?.memorySignals ?? []).slice(0, 3);
  const loadSignals = (context?.loadHypotheses ?? []).slice(0, 3);
  const learnedKnowledge = (context?.learnedKnowledge ?? []).slice(0, 3);

  let answer = buildGenericEducationalAnswer(context);

  if (
    normalizedMessage.includes('conta subiu') ||
    normalizedMessage.includes('conta aumentou') ||
    normalizedMessage.includes('fatura subiu') ||
    normalizedMessage.includes('fatura aumentou') ||
    (normalizedMessage.includes('por que') &&
      (normalizedMessage.includes('subiu') || normalizedMessage.includes('aumentou')))
  ) {
    answer = context?.comparisonSummary
      ? `Pelo contexto que a Score tem hoje, ${context.comparisonSummary.toLowerCase()}. Para explicar melhor uma subida, eu conecto primeiro comparacao entre ciclos, cargas de maior impacto e mudancas de rotina. Os fatores mais comuns costumam envolver banho, climatizacao, equipamentos ligados por mais tempo ou concentracao de uso em determinados horarios.${loadSignals.length > 0 ? ` Hoje vale observar especialmente ${toNaturalList(loadSignals).toLowerCase()}.` : ''}`
      : 'Para responder com precisao, eu preciso comparar sua fatura atual com pelo menos uma fatura anterior. Mesmo assim, os principais fatores costumam ser aumento de uso de chuveiro, ar-condicionado, equipamentos ligados por mais tempo ou mudanca de rotina. Se voce enviar ou selecionar uma fatura, eu consigo te ajudar a relacionar consumo e habitos.';
  } else if (
    normalizedMessage.includes('como economizar') ||
    normalizedMessage.includes('economizar') ||
    normalizedMessage.includes('reduzir a conta')
  ) {
    answer = `Antes de pensar em economia, precisamos entender onde o consumo pesa. Na Score, eu olho primeiro para cargas de maior impacto, como chuveiro, climatizacao, geladeira, lavanderia e horarios de uso.${loadSignals.length > 0 ? ` Hoje os sinais mais fortes apontam para ${toNaturalList(loadSignals).toLowerCase()}.` : ''} A economia acontece melhor quando entendemos a causa.`;
  } else if (
    normalizedMessage.includes('memoria energetica') ||
    (normalizedMessage.includes('o que') && normalizedMessage.includes('memoria'))
  ) {
    answer = `Memoria Energetica e a capacidade da Score de lembrar o que ja aprendeu sobre sua casa, suas faturas e seus habitos. Assim, cada nova analise fica mais contextual e evita recomendacoes genericas.${memorySignalsUsed.length > 0 ? ` Hoje essa memoria ja considera ${toNaturalList(memorySignalsUsed).toLowerCase()}.` : ''}`;
  } else if (
    normalizedMessage.includes('pesa mais') ||
    normalizedMessage.includes('maior impacto') ||
    normalizedMessage.includes('gasta mais energia')
  ) {
    answer =
      loadSignals.length > 0
        ? `Pelo contexto atual, os sinais que mais merecem atencao sao ${toNaturalList(loadSignals).toLowerCase()}. Isso nao significa culpa automatica de um equipamento, e sim onde vale investigar primeiro para entender causa, horario e tempo de uso.`
        : 'Para descobrir o que pesa mais, eu preciso cruzar fatura, perfil e habitos. Na maioria das casas, o maior impacto costuma vir de banho, climatizacao, refrigeracao, lavanderia e uso simultaneo de cargas.';
  } else if (
    normalizedMessage.includes('decisoes melhores') ||
    normalizedMessage.includes('este mes') ||
    normalizedMessage.includes('esse mes')
  ) {
    answer = `Neste mes, a melhor decisao e observar um eixo de cada vez: carga principal, horario de uso e comparacao com a proxima conta.${context?.suggestedNextAction ? ` Pela sua jornada atual, o passo mais util agora e ${context.suggestedNextAction.toLowerCase()}.` : ''} Quando voce entende o padrao, a economia deixa de ser tentativa e passa a ser decisao.`;
  } else if (normalizedMessage.includes('conhecimento') || normalizedMessage.includes('aprendi')) {
    answer = learnedKnowledge.length > 0
      ? `Voce ja acumulou conhecimentos energeticos importantes, como ${toNaturalList(learnedKnowledge).toLowerCase()}. O papel da Score aqui e transformar leitura de conta em entendimento pratico, para que cada interacao ensine algo util.`
      : 'Conhecimento Energetico e o que voce aprende com a Score ao longo da jornada. Ele complementa a Memoria Energetica: a memoria guarda o que a Score aprendeu sobre voce, e o conhecimento registra o que voce aprendeu sobre energia.';
  }

  return {
    answer,
    mode: 'fallback',
    memorySignalsUsed,
    suggestedNextAction: context?.suggestedNextAction,
  };
};
