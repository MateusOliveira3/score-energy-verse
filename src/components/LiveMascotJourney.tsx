import React from 'react';
import {
  BarChart3,
  ClipboardList,
  History,
  Lightbulb,
  LucideIcon,
  Sparkles,
  Target,
  UserRound,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
export type JourneyShortcutId = 'score' | 'history' | 'actions' | 'summary' | 'profile';

export interface JourneyShortcut {
  id: JourneyShortcutId;
  hint: string;
  label: string;
}

interface LiveMascotJourneyProps {
  guidance: MascotGuidance;
  nextActions: NextAction[];
  invoiceCount: number;
  profileCompletion: number;
  isProfileComplete: boolean;
  latestAnalysis?: AnalysisSummary;
  customization?: MascotCustomizationData;
  profile: UserProfileData;
  onNavigate: (target: JourneyTarget) => void;
  onMascotInteract?: () => void;
  onCo2Interact?: (payload: { tip: string; objective: string }) => void;
  shortcuts?: JourneyShortcut[];
  activeShortcutId?: JourneyShortcutId | null;
  onShortcutSelect?: (shortcutId: JourneyShortcutId) => void;
  scorePanel?: React.ReactNode;
  contextPanel?: React.ReactNode;
}

const trailSteps = [
  { id: 'profile', label: 'Perfil' },
  { id: 'upload', label: 'Fatura' },
  { id: 'summary', label: 'Leitura' },
  { id: 'actions', label: 'Acao' },
] as const;

const stageLabels = {
  onboarding: 'Comeco',
  'before-upload': 'Preparacao',
  'invoice-uploaded': 'Leitura subindo',
  'analysis-ready': 'Leitura pronta',
  'return-visit': 'Retomada',
} as const;

const shortcutIcons: Record<JourneyShortcutId, LucideIcon> = {
  score: Zap,
  history: History,
  actions: Lightbulb,
  summary: BarChart3,
  profile: UserRound,
};

const visualCo2Tips = [
  'Comparar ciclos parecidos evita conclusoes apressadas sobre eficiencia.',
  'Uma mudanca por vez deixa o consumo mais facil de interpretar.',
  'Equipamentos em espera somam gasto silencioso ao longo da semana.',
  'Luz natural e ventilacao aliviam consumo sem exigir mudanca brusca.',
  'Horario de uso costuma revelar desperdicios que o olho nao pega.',
];

const co2Bubbles = [
  {
    id: 'bubble-1',
    label: 'CO2',
    requiredLevel: 1,
    zone: 'baixo',
    classes: 'left-[12%] bottom-24 sm:left-[16%]',
  },
  {
    id: 'bubble-2',
    label: 'CO2',
    requiredLevel: 1,
    zone: 'baixo',
    classes: 'right-[10%] bottom-28 sm:right-[18%]',
  },
  {
    id: 'bubble-3',
    label: 'CO2',
    requiredLevel: 2,
    zone: 'medio',
    classes: 'left-[22%] bottom-[43%] sm:left-[28%]',
  },
  {
    id: 'bubble-4',
    label: 'CO2',
    requiredLevel: 2,
    zone: 'medio',
    classes: 'right-[18%] bottom-[51%] sm:right-[24%]',
  },
  {
    id: 'bubble-5',
    label: 'CO2',
    requiredLevel: 3,
    zone: 'alto',
    classes: 'left-[38%] bottom-[68%] sm:left-[42%]',
  },
  {
    id: 'bubble-6',
    label: 'CO2',
    requiredLevel: 4,
    zone: 'alto',
    classes: 'right-[28%] bottom-[78%] sm:right-[34%]',
  },
] as const;

const heightGuides = [
  { id: 'high', classes: 'bottom-[76%]' },
  { id: 'mid', classes: 'bottom-[50%]' },
  { id: 'low', classes: 'bottom-[26%]' },
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
  profileCompletion,
  isProfileComplete,
  latestAnalysis,
  customization,
  profile,
  onNavigate,
  onMascotInteract,
  onCo2Interact,
  shortcuts,
  activeShortcutId,
  onShortcutSelect,
  scorePanel,
  contextPanel,
}: LiveMascotJourneyProps) => {
  const initialTip = 'Toque em um CO2 ao alcance.';
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
  const unlockedBubbleCount = co2Bubbles.filter(
    (bubble) => bubble.requiredLevel <= journeyLevel
  ).length;
  const capturedUnlockedCount = capturedBubbleIds.filter((bubbleId) =>
    co2Bubbles.some(
      (bubble) => bubble.id === bubbleId && bubble.requiredLevel <= journeyLevel
    )
  ).length;
  const activeBubbleCount = unlockedBubbleCount - capturedUnlockedCount;
  const journeyState =
    trailTargetId === 'actions'
      ? 'action'
      : trailTargetId === 'summary'
        ? 'understand'
        : trailTargetId === 'upload'
          ? 'observe'
          : 'wake';

  React.useEffect(() => {
    previousJourneyLevelRef.current = journeyLevel;
  }, []);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIsPlantSwaying((currentValue) => !currentValue);
    }, 1600);

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
    }, 2600);

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

    const nextTipIndex = tipIndex % visualCo2Tips.length;
    const nextPayload = {
      tip: visualCo2Tips[nextTipIndex],
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
    <Card className="overflow-hidden border border-emerald-100 bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white shadow-xl">
      <CardContent className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.28),transparent_58%)]" />
        <div className="pointer-events-none absolute -right-16 top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                <Sparkles className="h-3.5 w-3.5" />
                Jornada unificada
              </div>

              <h1 className="text-2xl font-semibold text-white sm:text-3xl">{currentTarget.title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-emerald-50/75">{currentTarget.cue}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="border-none bg-white/10 text-emerald-50 hover:bg-white/10">
                {stageLabels[guidance.stage]}
              </Badge>
              <Badge className="border-none bg-emerald-400/20 text-emerald-50 hover:bg-emerald-400/20">
                {profile.consumerType}
              </Badge>
              <Badge className="border-none bg-cyan-400/20 text-cyan-50 hover:bg-cyan-400/20">
                {invoiceCount} fatura{invoiceCount === 1 ? '' : 's'}
              </Badge>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
            <div className="space-y-4">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/45 px-4 py-6 sm:px-6">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_62%)]" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-950 via-emerald-950/95 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-6 bottom-0 h-20 rounded-t-[90px] bg-gradient-to-b from-emerald-800/35 to-emerald-950" />

                  {heightGuides.map((guide) => (
                    <div
                      key={guide.id}
                      className={cn(
                        'pointer-events-none absolute left-6 right-6',
                        guide.classes
                      )}
                    >
                      <div className="h-px border-t border-dashed border-white/12" />
                    </div>
                  ))}

                  <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs font-medium text-emerald-50/80 backdrop-blur">
                    {activeBubbleCount}
                  </div>

                  <div
                    className={cn(
                      'absolute bottom-14 left-1/2 z-10 -translate-x-1/2 transition-transform duration-700',
                      isGrowthHighlighted && 'scale-[1.03]'
                    )}
                    style={{
                      transform: `translateX(-50%) rotate(${isPlantSwaying ? '-1.5deg' : '1.5deg'})`,
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
                      className="group flex flex-col items-center gap-3 text-center"
                    >
                      <div
                        className={cn(
                          'relative rounded-[34px] border border-white/15 bg-white/10 px-4 py-4 shadow-2xl shadow-emerald-500/15 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.03]',
                          isGrowthHighlighted && 'border-emerald-200/35 shadow-emerald-300/25'
                        )}
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_60%)]" />
                        <EcoMascot
                          score={Math.max(journeyLevel * 200, 200)}
                          level={journeyLevel}
                          consumerType={profile.consumerType}
                          customization={customization}
                          variant="compact"
                          journeyState={journeyState}
                        />
                      </div>
                    </button>
                  </div>

                  {co2Bubbles.map((bubble, index) => {
                    const isCaptured = capturedBubbleIds.includes(bubble.id);
                    const isUnlocked = bubble.requiredLevel <= journeyLevel;

                    return (
                      <button
                        key={bubble.id}
                        type="button"
                        onClick={() => handleCaptureBubble(bubble.id)}
                        aria-label={`Ler CO2 ${bubble.zone} ${index + 1}`}
                        className={cn(
                          'absolute z-10 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.12em] shadow-lg backdrop-blur transition-all duration-300',
                          bubble.classes,
                          isUnlocked
                            ? 'border-emerald-200/40 bg-white/15 text-emerald-50 hover:-translate-y-1 hover:bg-emerald-300/20'
                            : 'border-white/10 bg-white/5 text-white/35',
                          isCaptured && 'pointer-events-none scale-75 opacity-0',
                          isUnlocked && bubble.requiredLevel === journeyLevel && 'animate-pulse'
                        )}
                      >
                        <span>{bubble.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="grid gap-3 sm:grid-cols-4">
                    {trailSteps.map((step, index) => {
                      const isReached = index <= currentStepIndex;
                      const isCurrent = step.id === trailTargetId;

                      return (
                        <div
                          key={step.id}
                          className={cn(
                            'rounded-[22px] border px-3 py-3 transition-all duration-300',
                            isReached
                              ? 'border-emerald-200/30 bg-emerald-300/12'
                              : 'border-white/10 bg-white/5',
                            isCurrent && 'shadow-lg shadow-emerald-900/20'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-white">{step.label}</span>
                            <span
                              className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold',
                                isReached
                                  ? 'bg-emerald-300 text-slate-950'
                                  : 'bg-white/10 text-white/65'
                              )}
                            >
                              {index + 1}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-[24px] border border-emerald-200/20 bg-slate-950/55 p-4 shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/80">
                      Proxima chamada
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{currentTarget.objective}</p>
                    <Button
                      type="button"
                      onClick={() => onNavigate(currentTarget.target)}
                      variant="ghost"
                      className="mt-4 w-full justify-between rounded-[18px] border border-white/10 bg-white/5 text-emerald-50 hover:bg-white/10"
                    >
                      {currentTarget.cta}
                      <Target className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {scorePanel}

              {shortcuts && shortcuts.length > 0 && (
                <div className="rounded-[28px] border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/70">
                        Acessos do hub
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">Troque o foco sem sair da jornada</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs font-medium text-emerald-50/75">
                      1 painel
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {shortcuts.map((shortcut) => {
                      const ShortcutIcon = shortcutIcons[shortcut.id];
                      const isActive = activeShortcutId === shortcut.id;

                      return (
                        <button
                          key={shortcut.id}
                          type="button"
                          onClick={() => onShortcutSelect?.(shortcut.id)}
                          className={cn(
                            'rounded-[22px] border p-3 text-left transition-all duration-200',
                            isActive
                              ? 'border-emerald-200/40 bg-emerald-300/18 shadow-lg shadow-emerald-950/20'
                              : 'border-white/10 bg-white/5 hover:border-emerald-200/20 hover:bg-white/10'
                          )}
                        >
                          <div className="flex items-center gap-2 text-white">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-2xl',
                                isActive ? 'bg-white/20' : 'bg-white/10'
                              )}
                            >
                              <ShortcutIcon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-semibold">{shortcut.label}</span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-emerald-50/70">{shortcut.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {contextPanel}

              <div className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/70">
                  Perfil ativo
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/85">
                  <span className="rounded-full bg-white/10 px-3 py-1.5">{profileCompletion}% completo</span>
                  {profile.location && (
                    <span className="rounded-full bg-white/10 px-3 py-1.5">{profile.location}</span>
                  )}
                  <span className="rounded-full bg-white/10 px-3 py-1.5">{profile.energyPreference}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveMascotJourney;
