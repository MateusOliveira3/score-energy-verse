
  import { buildRuntimeCoreExperience } from "C:/Users/Pichau/score-energy-verse/src/lib/cognitive/buildRuntimeCoreExperience.ts";
  import { DEFAULT_MVP_STATE } from "C:/Users/Pichau/score-energy-verse/src/lib/mvpJourneyState.ts";
  import { parseInvoiceText } from "C:/Users/Pichau/score-energy-verse/src/lib/invoiceParser.ts";

  const currentInvoice = {
    fingerprint: 'invoice-runtime-001',
    fileName: 'runtime.pdf',
    fileType: 'application/pdf',
    fileSize: 2048,
    consumption: 280,
    totalValue: 320,
    month: 'maio de 2026',
    parser: parseInvoiceText(`
      DISTRIBUIDORA: SCORE TESTE
      REFERENCIA: 05/2026
      TOTAL A PAGAR: R$ 320,00
      CONSUMO FATURADO: 280 kWh
    `),
    uploadedAt: '2026-05-10T10:00:00.000Z',
  };

  const state = {
    ...DEFAULT_MVP_STATE,
    profile: {
      ...DEFAULT_MVP_STATE.profile,
      propertySize: 82,
    },
    analysis: {
      ...DEFAULT_MVP_STATE.analysis,
      latestInvoice: currentInvoice,
      invoiceHistory: [currentInvoice],
    },
    energyBehaviorProfile: {
      ...DEFAULT_MVP_STATE.energyBehaviorProfile,
      habits: {
        ...DEFAULT_MVP_STATE.energyBehaviorProfile.habits,
        roomCountRange: '4_6',
      },
      intentions: {
        ...DEFAULT_MVP_STATE.energyBehaviorProfile.intentions,
        thermalComfortInterest: 'sim',
      },
    },
  };

  const experience = buildRuntimeCoreExperience({
    isJourneyHydrated: true,
    userId: 'user-bridge-2',
    journeyState: state,
  });

  console.log(JSON.stringify({
    speechSource: experience?.speech.source,
    opening: experience?.speech.opening,
    clueLine: experience?.speech.clueLine,
    primaryReason: experience?.primaryAction.reason,
    question: experience?.primaryClue.question?.question,
    status: experience?.status,
    clueKind: experience?.primaryClue.kind,
  }, null, 2));
