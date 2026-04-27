import React from 'react';
import {
  BarChart3,
  ClipboardList,
  Lightbulb,
  Sparkles,
  Target,
  UserRound,
  Zap,
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
export type JourneyQuickAccessId = 'score' | 'history' | 'actions' | 'summary' | 'profile';

interface LiveMascotJourneyProps {
  guidance: MascotGuidance;
  nextActions: NextAction[];
  invoiceCount: number;
  isProfileComplete: boolean;
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
  { id: 'cloud-1', classes: 'left-[5%] top-[29%]' },
  { id: 'cloud-2', classes: 'left-[16%] top-[25%]' },
  { id: 'cloud-3', classes: 'right-[16%] top-[18%]' },
  { id: 'cloud-4', classes: 'right-[6%] top-[33%]' },
  { id: 'cloud-5', classes: 'right-[24%] top-[27%]' },
] as const;

const co2Bubbles = [
  {
    id: 'bubble-high',
    requiredLevel: 4,
    classes: 'right-[3.5%] top-[16%]',
  },
  {
    id: 'bubble-mid',
    requiredLevel: 2,
    classes: 'right-[3.5%] top-[47%]',
  },
  {
    id: 'bubble-low',
    requiredLevel: 1,
    classes: 'right-[3.5%] top-[79%]',
  },
] as const;

const quickAccessItems = [
  { id: 'score', label: 'Score', icon: Zap },
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
      cta: 'Enviar fatura',
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
  const [isPlantSwaying, setIsPlantSwaying] = React.useState(false);
  const [isGrowthHighlighted, setIsGrowthHighlighted] = React.useState(false);
  const timeoutIdsRef = React.useRef<number[]>([]);
  const feedbackTimeoutRef = React.useRef<number | null>(null);
  const previousJourneyLevelRef = React.useRef(1);
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
  const reachLabel =
    journeyLevel >= 4 ? 'ALCANCE MEDIO' : journeyLevel >= 2 ? 'ALCANCE MEDIO' : 'ALCANCE BAIXO';

  React.useEffect(() => {
    previousJourneyLevelRef.current = journeyLevel;
  }, []);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIsPlantSwaying((currentValue) => !currentValue);
    }, 1700);

    return () => {
      window.clearInterval(intervalId);
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));

      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (journeyLevel <= previousJourneyLevelRef.current) {
      previousJourneyLevelRef.current = journeyLevel;
      return;
    }

    setIsGrowthHighlighted(true);

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setIsGrowthHighlighted(false);
      feedbackTimeoutRef.current = null;
    }, 2200);

    previousJourneyLevelRef.current = journeyLevel;
  }, [journeyLevel]);

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

  return (
    <Card className="overflow-hidden border border-[#29554f] bg-transparent shadow-none">
      <CardContent className="px-0 py-0">
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

              <div className="rounded-[22px] border border-[#29554f] bg-[#0f342f] p-3">
                <div className="relative h-[366px] overflow-hidden rounded-[18px] border border-[#bdd6b5]/80 bg-[linear-gradient(180deg,#dff1d4_0%,#e9f5e3_58%,#f8fbf4_100%)]">
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-[#32573c]" />
                  <div className="pointer-events-none absolute inset-x-[11%] bottom-[6px] h-3 rounded-t-[10px] bg-[#203b2a]/20" />

                  {cloudBlocks.map((cloud) => (
                    <div key={cloud.id} className={cn('pointer-events-none absolute opacity-80', cloud.classes)}>
                      <div className="relative h-7 w-14">
                        <div className="absolute bottom-0 left-2 h-4 w-9 rounded-[6px] bg-white/70" />
                        <div className="absolute left-0 top-2 h-4 w-4 rounded-[4px] bg-white/65" />
                        <div className="absolute left-4 top-0 h-4 w-4 rounded-[4px] bg-white/75" />
                        <div className="absolute right-0 top-2 h-4 w-4 rounded-[4px] bg-white/65" />
                      </div>
                    </div>
                  ))}

                  {heightGuides.map((guide) => (
                    <div key={guide.id} className={cn('pointer-events-none absolute inset-x-24', guide.classes)}>
                      <div className="relative">
                        <div className="border-t border-dashed border-[#7da18d]" />
                        <span className="absolute -left-[72px] -top-3 text-[11px] font-semibold tracking-[0.08em] text-[#1f3d2e]">
                          {guide.label}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="absolute left-1/2 top-[34%] z-10 -translate-x-1/2">
                    <div className="relative rounded-[12px] bg-[#5d9b4d] px-4 py-2 text-center text-sm font-semibold text-white shadow-sm">
                      {reachLabel}
                      <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1 rotate-45 bg-[#5d9b4d]" />
                    </div>
                  </div>

                  <div
                    className="absolute bottom-[18px] left-1/2 z-10 -translate-x-1/2 transition-transform duration-700"
                    style={{
                      transform: `translateX(-50%) rotate(${isPlantSwaying ? '-1deg' : '1deg'}) scale(${isGrowthHighlighted ? 1.03 : 1})`,
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
                      className="rounded-[8px] p-1"
                    >
                      <EcoMascot
                        score={Math.max(journeyLevel * 200, 200)}
                        level={journeyLevel}
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
                      >
                        <div
                          className={cn(
                            'relative rounded-full border px-4 py-2 text-sm font-semibold shadow-sm',
                            isUnlocked
                              ? 'border-[#d5e4cb] bg-white text-[#274036]'
                              : 'border-[#dce5d6] bg-[#f4f5ef] text-slate-300'
                          )}
                        >
                          CO2
                        </div>
                      </button>
                    );
                  })}
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
                              {isLocked ? <span className="text-lg">□</span> : index + 1}
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
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
