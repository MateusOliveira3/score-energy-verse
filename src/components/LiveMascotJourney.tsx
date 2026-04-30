import React from 'react';
import {
  BarChart3,
  ClipboardList,
  Lightbulb,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  AnalysisSummary,
  MascotCustomizationData,
  MascotGuidance,
  NextAction,
  UserProfileData,
} from '@/types/mvp';
import EcoMascot from './EcoMascot';

export type JourneyTarget = 'profile' | 'upload' | 'summary' | 'actions' | 'history';
export type JourneyQuickAccessId = 'history' | 'actions' | 'summary' | 'profile';

interface LiveMascotJourneyProps {
  guidance: MascotGuidance;
  nextActions: NextAction[];
  invoiceCount: number;
  isProfileComplete: boolean;
  currentScore: number;
  latestAnalysis?: AnalysisSummary;
  customization?: MascotCustomizationData;
  profile: UserProfileData;
  onNavigate: (target: JourneyTarget) => void;
  onMascotInteract?: () => void;
  onCo2Interact?: (payload: { tip: string; objective: string }) => void;
  activeQuickAccessId?: JourneyQuickAccessId;
  onQuickAccessChange?: (shortcutId: JourneyQuickAccessId) => void;
  scorePanel?: React.ReactNode;
  contextPanel?: React.ReactNode;
}

const trailSteps = [
  { id: 'profile', label: 'Perfil' },
  { id: 'upload', label: 'Fatura' },
  { id: 'summary', label: 'Leitura' },
  { id: 'actions', label: 'Acao' },
  { id: 'next', label: 'Proximo' },
] as const;

const stageLabels = {
  onboarding: 'Comeco',
  'before-upload': 'Preparacao',
  'invoice-uploaded': 'Leitura subindo',
  'analysis-ready': 'Leitura pronta',
  'return-visit': 'Retomada',
} as const;

const heightGuides = [
  { id: 'high', label: 'ALTO', classes: 'top-[18%]' },
  { id: 'mid', label: 'MEDIO', classes: 'top-[48%]' },
  { id: 'low', label: 'BAIXO', classes: 'top-[77%]' },
] as const;

const cloudBlocks = [
  { id: 'cloud-1', classes: 'left-[7%] top-[15%]', width: 74, height: 24, opacity: 0.36, duration: 48 },
  { id: 'cloud-2', classes: 'left-[24%] top-[27%]', width: 60, height: 18, opacity: 0.28, duration: 54 },
  { id: 'cloud-3', classes: 'right-[16%] top-[13%]', width: 78, height: 25, opacity: 0.33, duration: 52 },
  { id: 'cloud-4', classes: 'right-[5%] top-[29%]', width: 54, height: 18, opacity: 0.26, duration: 58 },
] as const;

const co2Bubbles = [
  {
    id: 'bubble-high',
    requiredLevel: 4,
    classes: 'right-[12%] top-[16.5%]',
    size: 28,
    duration: 19,
  },
  {
    id: 'bubble-mid',
    requiredLevel: 2,
    classes: 'right-[8.5%] top-[47%]',
    size: 31,
    duration: 20,
  },
  {
    id: 'bubble-low',
    requiredLevel: 1,
    classes: 'right-[15%] top-[73.5%]',
    size: 26,
    duration: 18,
  },
] as const;

const quickAccessItems = [
  { id: 'history', label: 'Historico', icon: BarChart3 },
  { id: 'actions', label: 'Acoes', icon: Lightbulb },
  { id: 'summary', label: 'Leitura', icon: ClipboardList },
  { id: 'profile', label: 'Perfil', icon: UserRound },
] as const satisfies ReadonlyArray<{
  id: JourneyQuickAccessId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}>;

const visualCo2Tips = [
  'Comparar meses parecidos ajuda a ler o consumo com calma.',
  'Uma mudanca pequena por vez deixa o resultado mais claro.',
  'Equipamentos em espera somam gasto silencioso no fim do ciclo.',
  'Olhar o horario de uso revela padroes que passam despercebidos.',
  'Pequenos habitos consistentes costumam aparecer na proxima leitura.',
  'Uma acao observada vale mais quando volta na proxima fatura.',
] as const;

const compactSentence = (value: string, maxLength = 108) => {
  const normalizedValue = value.trim();

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  const sentenceBreakIndex = normalizedValue.lastIndexOf('.', maxLength);

  if (sentenceBreakIndex >= 70) {
    return normalizedValue.slice(0, sentenceBreakIndex + 1);
  }

  return `${normalizedValue.slice(0, maxLength).trimEnd()}...`;
};

const getReachTier = (score?: number) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return 'low' as const;
  }

  if (score > 2000) {
    return 'high' as const;
  }

  if (score > 1000) {
    return 'medium' as const;
  }

  return 'low' as const;
};

const reachVisualByTier = {
  low: {
    beamHeight: 98,
    label: 'ALCANCE BAIXO',
    mascotLift: 0,
    plantScale: 1.1,
    top: 'top-[74%]',
    visualLevel: 2,
  },
  medium: {
    beamHeight: 188,
    label: 'ALCANCE MEDIO',
    mascotLift: -10,
    plantScale: 1.14,
    top: 'top-[46%]',
    visualLevel: 4,
  },
  high: {
    beamHeight: 276,
    label: 'ALCANCE ALTO',
    mascotLift: -24,
    plantScale: 1.18,
    top: 'top-[16%]',
    visualLevel: 7,
  },
} as const;

const getJourneyTarget = ({
  invoiceCount,
  isProfileComplete,
  latestAnalysis,
  nextAction,
}: {
  invoiceCount: number;
  isProfileComplete: boolean;
  latestAnalysis?: AnalysisSummary;
  nextAction?: NextAction;
}) => {
  if (!isProfileComplete) {
    return {
      target: 'profile' as const,
      title: 'Complete o perfil',
      cue: 'Ative a base para o mascote calibrar a jornada.',
      objective: 'Fechar o contexto inicial da jornada.',
      cta: 'Abrir perfil',
    };
  }

  if (invoiceCount === 0) {
    return {
      target: 'upload' as const,
      title: 'Envie a primeira fatura',
      cue: 'Acenda a trilha para transformar leitura em orientacao.',
      objective: 'Trazer o primeiro ciclo para a jornada.',
      cta: 'Adicionar fatura',
    };
  }

  if (nextAction) {
    return {
      target: 'actions' as const,
      title: nextAction.title,
      cue: compactSentence(
        nextAction.value || nextAction.description || 'Abra a acao destacada e teste um ajuste observavel.'
      ),
      objective: compactSentence(
        nextAction.value || nextAction.description || 'Levar a leitura para uma acao observavel.'
      ),
      cta: 'Seguir para a acao',
    };
  }

  if (latestAnalysis) {
    return {
      target: 'summary' as const,
      title: latestAnalysis.whatMattersNext || 'Revisar a leitura',
      cue: compactSentence(
        latestAnalysis.headline || 'Abra o resumo e confirme o sinal mais forte da fatura em foco.'
      ),
      objective: compactSentence(
        latestAnalysis.whatMattersNext || 'Entender o que esta puxando a jornada neste ciclo.'
      ),
      cta: 'Abrir leitura',
    };
  }

  return {
    target: 'history' as const,
    title: 'Revisar o historico',
    cue: 'A sequencia dos ciclos ajuda a sentir progresso sem procurar demais.',
    objective: 'Reencontrar o ultimo marco ja vivido.',
    cta: 'Abrir historico',
  };
};

const LiveMascotJourney = ({
  guidance,
  nextActions,
  invoiceCount,
  isProfileComplete,
  currentScore,
  latestAnalysis,
  customization,
  profile,
  onNavigate,
  onMascotInteract,
  onCo2Interact,
  activeQuickAccessId,
  onQuickAccessChange,
  scorePanel,
  contextPanel,
}: LiveMascotJourneyProps) => {
  const [capturedBubbleIds, setCapturedBubbleIds] = React.useState<string[]>([]);
  const [tipIndex, setTipIndex] = React.useState(0);
  const timeoutIdsRef = React.useRef<number[]>([]);
  const nextAction = nextActions.find((action) => action.status !== 'completed') || nextActions[0];
  const currentTarget = getJourneyTarget({
    invoiceCount,
    isProfileComplete,
    latestAnalysis,
    nextAction,
  });
  const trailTargetId = currentTarget.target === 'history' ? 'summary' : currentTarget.target;
  const currentStepIndex = Math.max(
    trailSteps.findIndex((step) => step.id === trailTargetId),
    0
  );
  const journeyLevel = Math.max(currentStepIndex + 1, 1);
  const journeyState =
    trailTargetId === 'actions'
      ? 'action'
      : trailTargetId === 'summary'
        ? 'understand'
      : trailTargetId === 'upload'
          ? 'observe'
          : 'wake';
  const reachTier = getReachTier(currentScore);
  const reachVisual = reachVisualByTier[reachTier];
  const sceneMascotLevel = Math.max(journeyLevel, reachVisual.visualLevel);

  React.useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  const handleCaptureBubble = (bubbleId: string) => {
    const bubble = co2Bubbles.find((currentBubble) => currentBubble.id === bubbleId);

    if (!bubble) {
      return;
    }

    if (bubble.requiredLevel > journeyLevel) {
      onCo2Interact?.({
        tip: 'Ainda fora do alcance da planta.',
        objective: currentTarget.cta,
      });
      return;
    }

    if (capturedBubbleIds.includes(bubbleId)) {
      return;
    }

    const nextPayload = {
      tip: visualCo2Tips[tipIndex % visualCo2Tips.length],
      objective: currentTarget.cta,
    };

    setTipIndex((currentIndex) => currentIndex + 1);
    setCapturedBubbleIds((currentIds) => [...currentIds, bubbleId]);
    onCo2Interact?.(nextPayload);

    const timeoutId = window.setTimeout(() => {
      setCapturedBubbleIds((currentIds) => currentIds.filter((id) => id !== bubbleId));
    }, 2200);

    timeoutIdsRef.current.push(timeoutId);
  };
  const mascotBottom =
    reachTier === 'high' ? 'bottom-[39px]' : reachTier === 'medium' ? 'bottom-[37px]' : 'bottom-[35px]';

  return (
    <Card className="overflow-hidden border border-[#29554f] bg-transparent shadow-none">
      <CardContent className="px-0 py-0">
        <style>
          {`
            @keyframes journey-cloud-drift {
              0% { transform: translate3d(0, 0, 0); }
              50% { transform: translate3d(12px, -1px, 0); }
              100% { transform: translate3d(24px, 0, 0); }
            }

            @keyframes journey-co2-drift {
              0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
              50% { transform: translate3d(4px, -8px, 0) scale(1.04); }
            }

            @keyframes journey-air-pulse {
              0%, 100% { opacity: 0.18; transform: translate3d(0, 0, 0); }
              50% { opacity: 0.28; transform: translate3d(0, -4px, 0); }
            }
          `}
        </style>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.66fr)_minmax(0,0.82fr)]">
          <div className="rounded-[28px] border border-[#29554f] bg-[#103a35] p-5 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:p-7">
            <div className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#365f58] bg-[#123f39] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#b8d9bd]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Jornada
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold leading-tight text-[#f5f8f3]">
                      {currentTarget.title}
                    </h1>
                    <p className="max-w-2xl text-base text-[#c5d8c8]">{currentTarget.cue}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="rounded-full border border-[#365f58] bg-[#194641] px-3 py-1.5 text-sm text-[#f0f7ef]">
                    {profile.consumerType}
                  </div>
                  <div className="rounded-full border border-[#365f58] bg-[#194641] px-3 py-1.5 text-sm text-[#f0f7ef]">
                    {invoiceCount} fatura{invoiceCount === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#29554f] bg-[#0f342f] p-4">
                <div className="relative h-[366px] overflow-hidden rounded-[20px] border border-[#c8d9d4]/80 bg-[linear-gradient(180deg,#EEF7FF_0%,#F1F8F7_44%,#EAF4EE_100%)]">
                  <div className="pointer-events-none absolute inset-[10px] rounded-[16px] border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[52%] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02)_58%,rgba(255,255,255,0))]" />
                  <div className="pointer-events-none absolute left-[9.8%] top-[9.8%] h-[58px] w-[58px] rounded-full bg-[#fff6d7]/32 blur-[10px]" />
                  <div className="pointer-events-none absolute left-[10.8%] top-[10.8%] h-[50px] w-[50px] rounded-full bg-[#fff3c9]/82">
                    <div className="absolute inset-[10px] rounded-full bg-white/48 blur-[3px]" />
                  </div>

                  <div className="pointer-events-none absolute left-[-10%] bottom-[54px] h-[98px] w-[58%] rounded-[100%] bg-[linear-gradient(180deg,rgba(212,227,217,0.92),rgba(212,227,217,0.78)_64%,rgba(212,227,217,0.08)_100%)] blur-[8px]" />
                  <div className="pointer-events-none absolute left-[23%] bottom-[58px] h-[68px] w-[32%] rounded-[100%] bg-[linear-gradient(180deg,rgba(214,229,220,0.74),rgba(214,229,220,0.18)_100%)] blur-[10px]" />
                  <div className="pointer-events-none absolute right-[-11%] bottom-[52px] h-[88px] w-[55%] rounded-[100%] bg-[linear-gradient(180deg,rgba(208,223,214,0.9),rgba(208,223,214,0.74)_66%,rgba(208,223,214,0.08)_100%)] blur-[9px]" />

                  <div
                    className="pointer-events-none absolute left-[18%] top-[44%] h-2.5 w-2.5 rounded-full bg-white/20"
                    style={{ animation: 'journey-air-pulse 9s ease-in-out infinite' }}
                  />
                  <div
                    className="pointer-events-none absolute right-[21%] top-[51%] h-2 w-2 rounded-full bg-[#edf7f0]/24"
                    style={{ animation: 'journey-air-pulse 11s ease-in-out infinite 1.5s' }}
                  />
                  <div
                    className="pointer-events-none absolute left-[33%] top-[58%] h-1.5 w-1.5 rounded-full bg-white/18"
                    style={{ animation: 'journey-air-pulse 10s ease-in-out infinite 0.9s' }}
                  />

                  {cloudBlocks.map((cloud) => (
                    <div
                      key={cloud.id}
                      className={cn('pointer-events-none absolute', cloud.classes)}
                      style={{
                        width: `${cloud.width}px`,
                        height: `${cloud.height}px`,
                        opacity: cloud.opacity,
                        animation: `journey-cloud-drift ${cloud.duration}s linear infinite`,
                      }}
                    >
                      <div className="relative h-full w-full">
                        <div className="absolute bottom-0 left-[14%] h-[45%] w-[56%] rounded-[6px] bg-white/90" />
                        <div className="absolute left-0 top-[34%] h-[40%] w-[24%] rounded-[5px] bg-white/82" />
                        <div className="absolute left-[28%] top-0 h-[52%] w-[26%] rounded-[6px] bg-white/88" />
                        <div className="absolute right-0 top-[30%] h-[38%] w-[22%] rounded-[5px] bg-white/80" />
                      </div>
                    </div>
                  ))}

                  {heightGuides.map((guide) => (
                    <div key={guide.id} className={cn('pointer-events-none absolute inset-x-[17%]', guide.classes)}>
                      <div className="relative">
                        <div className="border-t border-dashed border-[#8ea799]/28" />
                        <span className="absolute -left-[68px] -top-3 text-[10px] font-semibold tracking-[0.08em] text-[#536c61]/55">
                          {guide.label}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58px] bg-[#937158]" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[24px] bg-[#84614b]/84" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-[47px] h-[18px] bg-[#91b780]" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-[60px] h-[8px] bg-[#c0dca7]" />
                  <div className="pointer-events-none absolute left-[8%] right-[8%] bottom-[54px] h-[18px] rounded-[100%] bg-[#88b075]/34 blur-[2px]" />
                  <div className="pointer-events-none absolute left-[36%] bottom-[46px] h-[16px] w-[28%] rounded-[100%] bg-[#684c3b]/14 blur-[7px]" />

                  <div className="pointer-events-none absolute bottom-[58px] left-1/2 z-[1] -translate-x-1/2">
                    <div
                      className="w-[14px] rounded-full bg-[linear-gradient(180deg,rgba(158,203,161,0.02),rgba(121,177,125,0.18)_56%,rgba(94,149,97,0.04)_100%)]"
                      style={{ height: `${reachVisual.beamHeight}px` }}
                    />
                  </div>

                  <div className={cn('absolute left-1/2 z-10 -translate-x-1/2', reachVisual.top)}>
                    <div className="relative rounded-full bg-white/58 px-3 py-1.5 text-center text-[10px] font-semibold tracking-[0.08em] text-[#5f7565] shadow-[0_3px_8px_rgba(96,128,106,0.08)] backdrop-blur-[2px]">
                      {reachVisual.label}
                      <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1 rotate-45 bg-white/58" />
                    </div>
                  </div>

                  <div
                    className={cn('absolute left-1/2 z-10 -translate-x-1/2', mascotBottom)}
                    style={{
                      transform: `translateX(-50%) translateY(${reachVisual.mascotLift}px) scale(${reachVisual.plantScale})`,
                      transformOrigin: 'center bottom',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (onMascotInteract) {
                          onMascotInteract();
                          return;
                        }

                        onNavigate(currentTarget.target);
                      }}
                      className="rounded-[8px] px-1 py-0"
                    >
                      <EcoMascot
                        score={currentScore}
                        level={sceneMascotLevel}
                        consumerType={profile.consumerType}
                        customization={customization}
                        variant="scene"
                        journeyState={journeyState}
                      />
                    </button>
                  </div>

                  {co2Bubbles.map((bubble) => {
                    const isCaptured = capturedBubbleIds.includes(bubble.id);
                    const isUnlocked = bubble.requiredLevel <= journeyLevel;

                    return (
                      <button
                        key={bubble.id}
                        type="button"
                        onClick={() => handleCaptureBubble(bubble.id)}
                        aria-label={`Ler ${bubble.id}`}
                        className={cn(
                          'absolute z-10 transition-all duration-300',
                          bubble.classes,
                          isCaptured && 'pointer-events-none scale-75 opacity-0'
                        )}
                        style={{
                          animation: `journey-co2-drift ${bubble.duration}s ease-in-out infinite`,
                        }}
                      >
                        <div
                          className={cn(
                            'relative',
                            isUnlocked
                              ? 'text-[#60786d]/52'
                              : 'text-slate-400/48'
                          )}
                        >
                          <div
                            className={cn(
                              'relative rounded-full bg-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-[2px]',
                              isUnlocked ? 'opacity-85' : 'opacity-58'
                            )}
                            style={{ height: `${bubble.size}px`, width: `${bubble.size}px` }}
                          >
                            <div className="absolute left-[22%] top-[18%] h-[28%] w-[28%] rounded-full bg-white/20 blur-[2px]" />
                            <div className="absolute -left-[2px] bottom-[7px] h-2.5 w-2.5 rounded-full bg-white/8" />
                            <div className="absolute -right-[3px] top-[9px] h-2 w-2 rounded-full bg-white/8" />
                            <div className="absolute inset-0 flex items-center justify-center text-[7px] font-medium uppercase tracking-[0.08em]">
                              CO2
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <div className="pointer-events-none absolute left-1/2 bottom-[49px] z-[11] h-[10px] w-[42px] -translate-x-1/2 rounded-[100%] bg-[#8eb57c]/76 blur-[1px]" />
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-[22px] border border-[#29554f] bg-[#123f39] px-4 py-5">
                  <div className="flex items-start justify-between gap-3">
                    {trailSteps.map((step, index) => {
                      const isReached = index <= currentStepIndex;
                      const isCurrent = step.id === trailTargetId;
                      const isLocked = step.id === 'next';

                      return (
                        <React.Fragment key={step.id}>
                          <div className="flex flex-col items-center gap-3 text-center">
                            <div
                              className={cn(
                                'flex h-12 w-12 items-center justify-center rounded-full border text-base font-semibold',
                                isReached
                                  ? 'border-[#8fd08e] bg-[#174f48] text-[#aaf08c]'
                                  : 'border-[#3a625b] bg-[#0f342f] text-[#7da18d]',
                                isCurrent && 'ring-2 ring-[#83c78a]/35',
                                isLocked && !isReached && 'text-[#9bb7a0]'
                              )}
                            >
                              {isLocked ? <span className="text-base">[]</span> : index + 1}
                            </div>
                            <span
                              className={cn(
                                'text-sm',
                                isReached ? 'text-[#f0f6ef]' : 'text-[#a8beb0]',
                                isCurrent && 'font-semibold text-[#9be88d]'
                              )}
                            >
                              {step.label}
                            </span>
                          </div>
                          {index < trailSteps.length - 1 && (
                            <div className="mt-6 h-px flex-1 bg-[#365f58]" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#29554f] bg-[#123f39] p-4">
                  <div className="space-y-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9dbfa6]">
                      Proxima chamada
                    </p>
                    <p className="text-2xl font-semibold leading-tight text-[#f5f8f3]">
                      {currentTarget.title}
                    </p>
                    <p className="text-sm leading-5 text-[#c5d8c8]">{currentTarget.objective}</p>
                    <Button
                      type="button"
                      onClick={() => onNavigate(currentTarget.target)}
                      className="w-full justify-between rounded-[14px] border border-[#365f58] bg-[#113731] text-[#f5f8f3] hover:bg-[#18453f]"
                    >
                      {currentTarget.cta}
                      <Target className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-[#29554f] bg-[#123f39] p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {quickAccessItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeQuickAccessId === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onQuickAccessChange?.(item.id)}
                        className={cn(
                          'flex items-center gap-3 rounded-[16px] border px-4 py-4 text-left transition-colors',
                          isActive
                            ? 'border-[#7eb77b] bg-[#1a4e47] text-[#f5f8f3]'
                            : 'border-[#2e5b54] bg-[#143d37] text-[#d0dfd2] hover:bg-[#18453f]'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-[12px]',
                            isActive ? 'bg-[#245a4b]' : 'bg-[#103530]'
                          )}
                        >
                          <ItemIcon className="h-5 w-5" />
                        </div>
                        <span className="text-base font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-rows-[minmax(430px,auto)_minmax(425px,1fr)]">
            {scorePanel}
            {contextPanel}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveMascotJourney;
