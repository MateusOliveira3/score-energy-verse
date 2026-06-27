export const PRODUCT_RUNTIME_SECTIONS = [
  'conversation_memory',
  'bill_value',
  'consumption',
  'primary_discovery',
  'primary_meaning',
  'primary_action',
  'secondary_signals',
  'deep_reading',
] as const;

export type ProductRuntimeSection = (typeof PRODUCT_RUNTIME_SECTIONS)[number];
export type ProductRuntimeState =
  | 'loading'
  | 'profile'
  | 'upload'
  | 'processing'
  | 'empty'
  | 'ready'
  | 'response';

export interface ProductRuntimeSignal {
  costLabel?: string;
  id: string;
  insight?: string;
  isResidual?: boolean;
  label: string;
  shareLabel?: string;
}

export interface ProductRuntimeDiscovery {
  id?: string;
  headline: string;
  meaning?: string;
}

export interface ProductRuntimeAction {
  label: string;
  target: 'question' | 'deep_reading';
}

export interface ProductRuntimeQuestionOption {
  label: string;
  value: string;
}

export interface ProductRuntimeQuestion {
  detailSection: 'memory' | 'summary';
  heading?: string;
  helperText?: string;
  id: string;
  kind: 'action' | 'context';
  options: ProductRuntimeQuestionOption[];
  prompt: string;
  transitionText?: string;
}

export interface ProductRuntimeHermesExperience {
  line?: string;
  memory?: string;
  message?: string;
  question?: ProductRuntimeQuestion;
}

export interface ProductRuntimeDeepReading {
  available: boolean;
  label: string;
  preview?: string;
  target: 'memory' | 'summary';
}

export interface ProductRuntimeScoreExperience {
  action?: ProductRuntimeAction;
  billValue?: string;
  consumption?: string;
  deepReading: ProductRuntimeDeepReading;
  discovery?: ProductRuntimeDiscovery;
  meaning?: string;
  secondarySignals: ProductRuntimeSignal[];
  support?: string;
  uncertainty?: string;
}

export interface ProductRuntimeExperience {
  hermes: ProductRuntimeHermesExperience;
  score: ProductRuntimeScoreExperience;
}

export interface ProductRuntime {
  conversationMemory?: string;
  cta: ProductRuntimeAction | null;
  deepReadingAvailable: boolean;
  experience: ProductRuntimeExperience;
  hiddenSections: ProductRuntimeSection[];
  primaryAction?: ProductRuntimeAction;
  primaryDiscovery?: ProductRuntimeDiscovery;
  secondarySignals: ProductRuntimeSignal[];
  state: ProductRuntimeState;
  stage: 'initial_reading' | 'memory_reading' | 'refinement_reading';
  visibleSections: ProductRuntimeSection[];
}

export interface BuildProductRuntimeInput {
  billValue?: string;
  consumption?: string;
  conversationMemory?: string;
  ctaLabel?: string;
  ctaTarget?: 'question' | 'deep_reading';
  deepReadingAvailable?: boolean;
  deepReadingPreview?: string;
  deepReadingTarget?: 'memory' | 'summary';
  hermesMessage?: string;
  nextQuestionAvailable?: boolean;
  primaryActionLabel?: string;
  primaryDiscovery?: ProductRuntimeDiscovery;
  question?: ProductRuntimeQuestion;
  scoreSupport?: string;
  secondarySignals?: ProductRuntimeSignal[];
  uncertainty?: string;
}

export interface BuildPreReadyProductRuntimeInput {
  cta?: ProductRuntimeAction | null;
  hermesLine: string;
  scoreHeadline: string;
  scoreSupport?: string;
  state: Exclude<ProductRuntimeState, 'ready' | 'response'>;
}

export interface BuildResponseProductRuntimeInput {
  cta?: ProductRuntimeAction | null;
  deepReadingTarget?: 'memory' | 'summary';
  hermesLine: string;
  scoreActionLabel?: string;
  scoreHeadline: string;
  scoreSupport?: string;
  uncertainty?: string;
}

const uniqueSections = (sections: ProductRuntimeSection[]) =>
  Array.from(new Set(sections));

export const buildProductRuntime = ({
  billValue,
  consumption,
  conversationMemory,
  ctaLabel,
  ctaTarget,
  deepReadingAvailable = false,
  deepReadingPreview,
  deepReadingTarget = 'summary',
  hermesMessage,
  nextQuestionAvailable = false,
  primaryActionLabel,
  primaryDiscovery,
  question,
  scoreSupport,
  secondarySignals = [],
  uncertainty,
}: BuildProductRuntimeInput): ProductRuntime => {
  const primaryAction =
    typeof primaryActionLabel === 'string' && primaryActionLabel.trim().length > 0
      ? {
          label: primaryActionLabel,
          target: nextQuestionAvailable ? 'question' : 'deep_reading',
        }
      : undefined;

  const cta = primaryAction
    ? nextQuestionAvailable
      ? {
          label: ctaLabel || 'Refinar leitura',
          target: ctaTarget || ('question' as const),
        }
      : {
          label: ctaLabel || 'Ver',
          target: ctaTarget || ('deep_reading' as const),
        }
    : null;

  const visibleSections = uniqueSections(
    [
      conversationMemory ? 'conversation_memory' : undefined,
      billValue ? 'bill_value' : undefined,
      consumption ? 'consumption' : undefined,
      primaryDiscovery?.headline ? 'primary_discovery' : undefined,
      primaryDiscovery?.meaning ? 'primary_meaning' : undefined,
      primaryAction ? 'primary_action' : undefined,
      secondarySignals.length > 0 ? 'secondary_signals' : undefined,
      deepReadingAvailable ? 'deep_reading' : undefined,
    ].filter((section): section is ProductRuntimeSection => Boolean(section))
  );

  const hiddenSections = PRODUCT_RUNTIME_SECTIONS.filter(
    (section) => !visibleSections.includes(section)
  );

  const stage = conversationMemory
    ? nextQuestionAvailable
      ? 'memory_reading'
      : 'memory_reading'
    : nextQuestionAvailable
      ? 'refinement_reading'
      : 'initial_reading';

  const experience: ProductRuntimeExperience = {
    hermes: {
      line: conversationMemory || hermesMessage,
      memory: conversationMemory,
      message: hermesMessage,
      question,
    },
    score: {
      action: primaryAction,
      billValue,
      consumption,
      deepReading: {
        available: deepReadingAvailable,
        label: 'Ver mais sobre esta conta',
        preview: deepReadingPreview,
        target: deepReadingTarget,
      },
      discovery: primaryDiscovery,
      meaning: primaryDiscovery?.meaning,
      secondarySignals,
      support: scoreSupport,
      uncertainty,
    },
  };

  return {
    conversationMemory,
    cta,
    deepReadingAvailable,
    experience,
    hiddenSections,
    primaryAction,
    primaryDiscovery,
    secondarySignals,
    state: 'ready',
    stage,
    visibleSections,
  };
};

export const buildPreReadyProductRuntime = ({
  cta = null,
  hermesLine,
  scoreHeadline,
  scoreSupport,
  state,
}: BuildPreReadyProductRuntimeInput): ProductRuntime => {
  const visibleSections = uniqueSections(
    [
      hermesLine ? 'conversation_memory' : undefined,
      scoreHeadline ? 'primary_discovery' : undefined,
      scoreSupport ? 'primary_meaning' : undefined,
      cta ? 'primary_action' : undefined,
    ].filter((section): section is ProductRuntimeSection => Boolean(section))
  );

  return {
    conversationMemory: undefined,
    cta,
    deepReadingAvailable: false,
    experience: {
      hermes: {
        line: hermesLine,
        message: hermesLine,
      },
      score: {
        action: cta ? { label: cta.label, target: cta.target } : undefined,
        deepReading: {
          available: false,
          label: 'Ver mais sobre esta conta',
          target: 'summary',
        },
        discovery: {
          headline: scoreHeadline,
        },
        secondarySignals: [],
        support: scoreSupport,
      },
    },
    hiddenSections: PRODUCT_RUNTIME_SECTIONS.filter(
      (section) => !visibleSections.includes(section)
    ),
    primaryAction: cta ? { label: cta.label, target: cta.target } : undefined,
    primaryDiscovery: {
      headline: scoreHeadline,
    },
    secondarySignals: [],
    state,
    stage: 'initial_reading',
    visibleSections,
  };
};

export const buildResponseProductRuntime = ({
  cta = {
    label: 'Continuar leitura',
    target: 'question',
  },
  deepReadingTarget = 'summary',
  hermesLine,
  scoreActionLabel,
  scoreHeadline,
  scoreSupport,
  uncertainty,
}: BuildResponseProductRuntimeInput): ProductRuntime => {
  const visibleSections = uniqueSections(
    [
      hermesLine ? 'conversation_memory' : undefined,
      scoreHeadline ? 'primary_discovery' : undefined,
      scoreSupport ? 'primary_meaning' : undefined,
      cta || scoreActionLabel ? 'primary_action' : undefined,
    ].filter((section): section is ProductRuntimeSection => Boolean(section))
  );

  return {
    conversationMemory: undefined,
    cta,
    deepReadingAvailable: false,
    experience: {
      hermes: {
        line: hermesLine,
        message: hermesLine,
      },
      score: {
        action:
          scoreActionLabel || cta
            ? {
                label: scoreActionLabel || cta?.label || 'Continuar leitura',
                target: cta?.target || 'question',
              }
            : undefined,
        deepReading: {
          available: false,
          label: 'Ver mais sobre esta conta',
          target: deepReadingTarget,
        },
        discovery: {
          headline: scoreHeadline,
        },
        secondarySignals: [],
        support: scoreSupport,
        uncertainty,
      },
    },
    hiddenSections: PRODUCT_RUNTIME_SECTIONS.filter(
      (section) => !visibleSections.includes(section)
    ),
    primaryAction:
      scoreActionLabel || cta
        ? {
            label: scoreActionLabel || cta?.label || 'Continuar leitura',
            target: cta?.target || 'question',
          }
        : undefined,
    primaryDiscovery: {
      headline: scoreHeadline,
    },
    secondarySignals: [],
    state: 'response',
    stage: 'refinement_reading',
    visibleSections,
  };
};
