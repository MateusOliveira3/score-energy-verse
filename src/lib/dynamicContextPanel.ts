import {
  AnalysisSummary,
  ActionInteractiveQuestion,
  EnergyKnowledgeId,
  InvoiceData,
  NextAction,
} from '@/types/mvp';

export const priorityLabels = {
  high: 'Alta',
  medium: 'Media',
  low: 'Leve',
} as const;

export interface ActionInteractionConfig {
  title: string;
  prompt: string;
  questions: ActionInteractiveQuestion[];
  buildFeedback: (answers: Record<string, string>) => string;
  buildNextStep: (answers: Record<string, string>) => string;
}

export interface AdaptiveActionFeedbackState {
  answer: string;
  insight: string;
  microFeedback: string;
  questionId: string;
  summary: string;
  answeredQuestions?: Array<{
    answer: string;
    questionId: string;
    summary: string;
  }>;
}

export interface InlineMemoryFeedbackState {
  ctaLabel?: string;
  message: string;
  questionId: string;
  title: string;
}

export interface InlineKnowledgeFeedbackState {
  id: EnergyKnowledgeId;
  message: string;
  title: string;
}

const countOptions: ActionInteractiveQuestion['options'] = [
  { label: '0', value: '0' },
  { label: '1', value: '1' },
  { label: '2+', value: '2+' },
];

const booleanOptions: ActionInteractiveQuestion['options'] = [
  { label: 'Sim', value: 'yes' },
  { label: 'Nao', value: 'no' },
];

export const compactText = (value: string, maxLength = 110) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength).trimEnd()}...`;

export const mergeUniqueStrings = (...groups: string[][]) =>
  Array.from(new Set(groups.flat().filter((value) => value.trim().length > 0)));

export const buildAnsweredSummaryLine = (summaries: string[]) =>
  summaries.length > 0 ? `Voce ja informou: ${summaries.slice(0, 2).join(', ')}.` : undefined;

export const normalizeForMatch = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const getActionInteractionConfig = (action: NextAction): ActionInteractionConfig | null => {
  const searchableText = normalizeForMatch(
    [action.title, action.description, action.value, action.context, action.suggestion]
      .filter(Boolean)
      .join(' ')
  );

  if (/(horario de pico|pico|revisar rotina|rotina de consumo|uso noturno|periodo)/.test(searchableText)) {
    return {
      title: 'Interacao rapida',
      prompt: 'Responda em 2 toques para descobrir onde observar primeiro.',
      questions: [
        {
          id: 'night_peak',
          prompt: 'Seu uso mais pesado costuma acontecer a noite?',
          options: booleanOptions,
        },
        {
          id: 'heat_routine',
          prompt: 'Chuveiro, forno ou ar entram quase todo dia nesse horario?',
          options: booleanOptions,
        },
      ],
      buildFeedback: (answers) => {
        if (answers.night_peak === 'yes' && answers.heat_routine === 'yes') {
          return 'Isso indica que seu consumo pode estar concentrado no pico da noite, com banho, cozinha ou climatizacao puxando junto.';
        }

        if (answers.night_peak === 'yes') {
          return 'Isso indica um pico noturno mais distribuido; vale observar maquinas, iluminacao e climatizacao.';
        }

        if (answers.heat_routine === 'yes') {
          return 'Isso indica um habito recorrente fora da noite que ainda pode concentrar boa parte do consumo.';
        }

        return 'Isso sugere uma rotina mais espalhada; comece observando o horario com mais aparelhos ligados ao mesmo tempo.';
      },
      buildNextStep: (answers) =>
        answers.night_peak === 'yes'
          ? 'Hoje, tente evitar ligar dois usos intensos no mesmo periodo da noite.'
          : 'Hoje, identifique um unico horario critico para testar uma mudanca simples.',
    };
  }

  if (/(mapear cargas fixas|cargas fixas|consumo total|consumo alto|usos simultaneos)/.test(searchableText)) {
    return {
      title: 'Mapa rapido',
      prompt: 'Responda em 2 toques para apontar a carga que merece atencao primeiro.',
      questions: [
        {
          id: 'shower_count',
          prompt: 'Quantos chuveiros eletricos entram na rotina?',
          options: countOptions,
        },
        {
          id: 'cooling_load',
          prompt: 'Tem ar-condicionado ou segunda geladeira ligada quase todo dia?',
          options: booleanOptions,
        },
      ],
      buildFeedback: (answers) => {
        if (answers.shower_count === '2+' && answers.cooling_load === 'yes') {
          return 'Isso indica que seu consumo pode estar concentrado em banho eletrico somado a climatizacao ou refrigeracao continua.';
        }

        if (answers.shower_count === '2+') {
          return 'Isso indica que seu consumo pode estar concentrado em banho eletrico repetido ao longo do dia.';
        }

        if (answers.shower_count === '1' && answers.cooling_load === 'yes') {
          return 'Isso indica que seu consumo pode estar dividido entre banho eletrico e uma carga continua, como ar ou geladeira extra.';
        }

        if (answers.cooling_load === 'yes') {
          return 'Isso indica que uma carga continua pode estar puxando o consumo base da casa.';
        }

        return 'Isso sugere olhar primeiro os equipamentos que ficam ligados o tempo todo, como geladeira principal e standby.';
      },
      buildNextStep: () => 'Hoje, observe quais cargas ficam ligadas ao mesmo tempo por mais horas.',
    };
  }

  if (/(equipamento mais usado|geladeira|freezer|ar condicionado|ar-condicionado|equipamento|aparelho)/.test(searchableText)) {
    return {
      title: 'Checklist rapido',
      prompt: 'Responda em 2 toques para descobrir qual equipamento merece ajuste primeiro.',
      questions: [
        {
          id: 'cold_equipment_count',
          prompt: 'Quantas geladeiras ou freezers ficam ligados o tempo todo?',
          options: countOptions,
        },
        {
          id: 'daily_ac',
          prompt: 'Tem ar-condicionado ligado quase todo dia?',
          options: booleanOptions,
        },
      ],
      buildFeedback: (answers) => {
        if (answers.cold_equipment_count === '2+' && answers.daily_ac === 'yes') {
          return 'Isso indica que seu consumo pode estar concentrado em refrigeracao continua e climatizacao.';
        }

        if (answers.cold_equipment_count === '2+') {
          return 'Isso indica que a refrigeracao continua pode estar concentrando boa parte do consumo.';
        }

        if (answers.daily_ac === 'yes') {
          return 'Isso indica que a climatizacao diaria merece observacao antes de qualquer troca.';
        }

        return 'Isso sugere olhar primeiro o equipamento que passa mais horas ligado, nao apenas o mais potente.';
      },
      buildNextStep: () => 'Comece pelo aparelho com mais horas de uso antes de pensar em substituicao.',
    };
  }

  if (/(proxima fatura|proximo ciclo|comparar|7 dias|testar economia)/.test(searchableText)) {
    return {
      title: 'Teste rapido',
      prompt: 'Responda em 2 toques para deixar a comparacao da proxima conta mais clara.',
      questions: [
        {
          id: 'recent_change',
          prompt: 'Voce ja mudou algum habito nesta semana?',
          options: booleanOptions,
        },
        {
          id: 'many_changes',
          prompt: 'Tem mais de uma mudanca acontecendo ao mesmo tempo?',
          options: booleanOptions,
        },
      ],
      buildFeedback: (answers) => {
        if (answers.recent_change === 'yes' && answers.many_changes === 'yes') {
          return 'Isso indica que a proxima conta pode misturar sinais; compare uma mudanca por vez.';
        }

        if (answers.recent_change === 'yes') {
          return 'Isso indica que a proxima conta ja pode mostrar um sinal mais limpo dessa mudanca.';
        }

        if (answers.many_changes === 'yes') {
          return 'Isso indica que ainda nao ha uma base clara; escolha uma unica mudanca antes de comparar.';
        }

        return 'Isso indica que falta uma mudanca observavel; escolha um ajuste simples para medir no proximo ciclo.';
      },
      buildNextStep: () => 'Use a proxima conta para comparar custo e consumo sem adicionar novas variaveis.',
    };
  }

  return null;
};

export const getInvoiceReferenceLabel = (invoice: InvoiceData) => {
  const month = invoice.month?.trim();

  if (month) {
    return month;
  }

  const referenceMonth = invoice.parser.fields.referenceMonth.value?.trim();

  if (referenceMonth) {
    return referenceMonth;
  }

  return 'Sem referencia';
};

export const getInvoiceSortTime = (invoice: InvoiceData) => {
  const referenceMonth = getInvoiceReferenceLabel(invoice);
  const numericMatch = referenceMonth.match(/\b(0[1-9]|1[0-2])\/(\d{4})\b/);

  if (numericMatch) {
    return Date.UTC(Number(numericMatch[2]), Number(numericMatch[1]) - 1, 1);
  }

  if (invoice.uploadedAt) {
    const uploadedAt = new Date(invoice.uploadedAt).getTime();

    if (!Number.isNaN(uploadedAt)) {
      return uploadedAt;
    }
  }

  return 0;
};

export const formatCurrency = (value?: number) =>
  typeof value === 'number' ? `R$ ${value.toFixed(2)}` : 'Valor indisponivel';

export const formatConsumption = (value?: number) =>
  typeof value === 'number' ? `${value} kWh` : 'Consumo indisponivel';

export const getInsightContextLines = (consultiveInsight?: AnalysisSummary['consultiveInsight']) => {
  const contextLines: string[] = [];
  const season = consultiveInsight?.environmentContext?.season;
  const profileContext = consultiveInsight?.profileContext;

  if (profileContext?.warnings[0]) {
    contextLines.push(profileContext.warnings[0]);
  } else if (profileContext?.hasSolar) {
    contextLines.push('Perfil com energia solar indicada');
  } else if (profileContext?.profileType === 'Residencial' && profileContext.householdSize) {
    contextLines.push(`Perfil: residencia com ${profileContext.householdSize} ${profileContext.householdSize === 1 ? 'pessoa' : 'pessoas'}`);
  } else if (profileContext?.profileType) {
    contextLines.push(`Perfil: ${profileContext.profileType.toLowerCase()}`);
  }

  if (profileContext?.locationLabel) {
    contextLines.push(`Contexto local informado: ${profileContext.locationLabel}.`);
  } else if (season === 'inverno') {
    contextLines.push('Contexto: inverno na sua regiao');
  } else if (season === 'verao') {
    contextLines.push('Contexto: verao na sua regiao');
  } else if (season === 'meia_estacao') {
    contextLines.push('Contexto: meia estacao na sua regiao');
  }

  return contextLines.slice(0, 2);
};

export const normalizeActionTitle = (action: NextAction, index: number) => {
  const rawTitle = action.title.trim();
  const searchableText = [action.title, action.description, action.value, action.context]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    /^(deslocar uso fora do pico|testar economia por 7 dias|mapear chuveiro e climatizacao|revisar cargas fixas|comparar proxima fatura|completar diagnostico rapido)$/i.test(
      rawTitle
    )
  ) {
    return rawTitle;
  }

  if (/(pico|horario|noite|tarde)/.test(searchableText)) {
    return 'Deslocar uso fora do pico';
  }

  if (/(compar|acompanh|proxima fatura|proximo ciclo)/.test(searchableText)) {
    return 'Comparar proxima fatura';
  }

  if (/(7 dias|semana|test)/.test(searchableText)) {
    return 'Testar economia por 7 dias';
  }

  if (/(chuveiro|equipamento|geladeira|ar condicionado|lampada|motor|aparelho)/.test(searchableText)) {
    return 'Mapear chuveiro e climatizacao';
  }

  if (rawTitle.length <= 40) {
    return rawTitle;
  }

  if (index === 0) {
    return 'Comecar pelo ajuste principal';
  }

  return 'Separar um teste simples';
};

export const buildActionReason = ({
  action,
  latestAnalysis,
  focusedInvoice,
}: {
  action: NextAction;
  latestAnalysis?: AnalysisSummary;
  focusedInvoice?: InvoiceData;
}) => {
  const referenceLabel = focusedInvoice ? getInvoiceReferenceLabel(focusedInvoice) : 'o resumo atual';
  const explicitReason =
    action.context && action.context.trim().toLowerCase().startsWith('escolhida porque')
      ? action.context.trim()
      : undefined;
  const evidenceLead = explicitReason || action.description || action.context;

  if (evidenceLead) {
    return compactText(evidenceLead, 110);
  }

  if (latestAnalysis?.costSignal && latestAnalysis.costSignal !== 'controlado') {
    return `O resumo de ${referenceLabel} mostra pressao de custo neste ciclo.`;
  }

  if (latestAnalysis?.consumptionLevel === 'alto') {
    return `A fatura de ${referenceLabel} indica consumo acima do esperado neste momento.`;
  }

  return compactText(
    action.value ||
      action.context ||
      action.description ||
      'A proxima comparacao deve confirmar o efeito desta acao.',
    88
  );
};

export const buildHistoryTrendLine = (
  history: InvoiceData[],
  focusedInvoice?: InvoiceData
) => {
  if (!focusedInvoice || history.length < 2 || typeof focusedInvoice.consumption !== 'number') {
    return undefined;
  }

  const comparableConsumptions = history
    .map((invoice) => invoice.consumption)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (comparableConsumptions.length < 2) {
    return undefined;
  }

  const averageConsumption =
    comparableConsumptions.reduce((sum, value) => sum + value, 0) / comparableConsumptions.length;

  if (!Number.isFinite(averageConsumption) || averageConsumption <= 0) {
    return undefined;
  }

  const variation = (focusedInvoice.consumption - averageConsumption) / averageConsumption;

  if (Math.abs(variation) <= 0.05) {
    return 'Este ciclo ficou proximo da media do historico.';
  }

  return variation > 0
    ? 'Este ciclo ficou acima da media do historico.'
    : 'Este ciclo ficou abaixo da media do historico.';
};

export const supportsAdaptiveDiagnosis = (title: string) =>
  /^(deslocar uso fora do pico|testar economia por 7 dias|mapear chuveiro e climatizacao|revisar cargas fixas|comparar proxima fatura|completar diagnostico rapido)$/i.test(
    title.trim()
  );
