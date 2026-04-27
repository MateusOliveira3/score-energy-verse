import React from 'react';
import {
  ArrowRight,
  Eye,
  MousePointerClick,
  Sparkles,
  Target,
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
}

const trailSteps = [
  { id: 'profile', label: 'Perfil', cue: 'Base da jornada' },
  { id: 'upload', label: 'Fatura', cue: 'Sinal inicial' },
  { id: 'summary', label: 'Leitura', cue: 'Entender o momento' },
  { id: 'actions', label: 'Acao', cue: 'Mover a jornada' },
] as const;

const stageLabels = {
  onboarding: 'Comeco',
  'before-upload': 'Preparacao',
  'invoice-uploaded': 'Leitura subindo',
  'analysis-ready': 'Leitura pronta',
  'return-visit': 'Retomada',
} as const;

const visualCo2Tips = [
  'Comparar ciclos parecidos evita conclusoes apressadas sobre eficiencia.',
  'Uma mudanca por vez deixa o consumo mais facil de interpretar.',
  'Equipamentos em espera somam gasto silencioso ao longo da semana.',
  'Luz natural e ventilacao aliviam consumo sem exigir mudanca brusca.',
  'Horario de uso costuma revelar desperdicios que o olho nao pega.',
] as const;

const co2Bubbles = [
  { id: 'bubble-1', label: 'CO2', classes: 'left-[8%] top-16' },
  { id: 'bubble-2', label: 'CO2', classes: 'left-[30%] top-6' },
  { id: 'bubble-3', label: 'CO2', classes: 'left-[55%] top-20' },
  { id: 'bubble-4', label: 'CO2', classes: 'right-[18%] top-8' },
  { id: 'bubble-5', label: 'CO2', classes: 'right-[6%] top-24' },
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
      cue: compactSentence(nextAction.value || nextAction.description || 'Abra a acao destacada e teste um ajuste observavel.'),
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
      cue: compactSentence(latestAnalysis.headline || 'Abra o resumo e confirme o sinal mais forte da fatura em foco.'),
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

const getFlowIndexByTarget = (target: JourneyTarget) => {
  if (target === 'profile' || target === 'upload') {
    return 0;
  }

  if (target === 'summary' || target === 'history') {
    return 1;
  }

  return 2;
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
}: LiveMascotJourneyProps) => {
  const [capturedBubbleIds, setCapturedBubbleIds] = React.useState<string[]>([]);
  const [tipIndex, setTipIndex] = React.useState(0);
  const [activeTip, setActiveTip] = React.useState<{
    tip: string;
    objective: string;
  }>({
    tip: 'Capture um CO2 visual para puxar uma dica rapida.',
    objective: 'Objetivo atual ainda aguardando o proximo movimento do mascote.',
  });
  const [isMascotLifted, setIsMascotLifted] = React.useState(false);
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
  const trailProgress = (currentStepIndex / (trailSteps.length - 1)) * 100;
  const trailFillWidth = currentStepIndex === 0 ? '0%' : `calc(${trailProgress}% - 0.5rem)`;
  const activeBubbleCount = co2Bubbles.length - capturedBubbleIds.length;
  const journeyState =
    trailTargetId === 'actions'
      ? 'action'
      : trailTargetId === 'summary'
        ? 'understand'
        : trailTargetId === 'upload'
          ? 'observe'
          : 'wake';
  const flowIndex = getFlowIndexByTarget(currentTarget.target);
  const flowSteps = [
    {
      label: 'Olhar',
      body:
        trailTargetId === 'profile' || trailTargetId === 'upload'
          ? currentTarget.title
          : invoiceCount > 0
            ? 'Veja onde o mascote acendeu a trilha.'
            : 'Encontre o primeiro marco que falta.',
      Icon: Eye,
    },
    {
      label: 'Entender',
      body:
        trailTargetId === 'summary' || trailTargetId === 'history'
          ? currentTarget.cue
          : compactSentence(guidance.message, 86),
      Icon: Sparkles,
    },
    {
      label: 'Agir',
      body:
        trailTargetId === 'actions'
          ? currentTarget.objective
          : compactSentence(nextAction?.value || currentTarget.objective, 86),
      Icon: MousePointerClick,
    },
  ];

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setIsMascotLifted((currentValue) => !currentValue);
    }, 1200);

    return () => {
      window.clearInterval(intervalId);
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  React.useEffect(() => {
    setActiveTip((currentTip) =>
      currentTip.tip === 'Capture um CO2 visual para puxar uma dica rapida.'
        ? currentTip
        : { ...currentTip, objective: currentTarget.objective }
    );
  }, [currentTarget.objective]);

  const handleCaptureBubble = (bubbleId: string) => {
    if (capturedBubbleIds.includes(bubbleId)) {
      return;
    }

    const nextTipIndex = tipIndex % visualCo2Tips.length;
    setTipIndex((currentIndex) => currentIndex + 1);
    setCapturedBubbleIds((currentIds) => [...currentIds, bubbleId]);
    setActiveTip({
      tip: visualCo2Tips[nextTipIndex],
      objective: currentTarget.objective,
    });

    const timeoutId = window.setTimeout(() => {
      setCapturedBubbleIds((currentIds) => currentIds.filter((id) => id !== bubbleId));
    }, 2200);

    timeoutIdsRef.current.push(timeoutId);
  };

  return (
    <Card className="overflow-hidden border border-emerald-100 bg-gradient-to-br from-slate-950 via-emerald-950 to-cyan-950 text-white shadow-xl">
      <CardContent className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.28),transparent_58%)]" />
        <div className="pointer-events-none absolute -right-16 top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                <Sparkles className="h-3.5 w-3.5" />
                Mascote condutor v2
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                  Siga o mascote: olhar, entender e agir.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-emerald-50/80">
                  {compactSentence(guidance.message, 138)}
                </p>
              </div>
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

          <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/80">
                    Trilha guiada
                  </p>
                  <p className="mt-1 text-sm text-emerald-50/75">
                    O proximo passo nasce do ponto em que o mascote toca.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-50/80">
                  CO2 visual ativo: {activeBubbleCount}
                </div>
              </div>

              <div className="relative mt-6 min-h-[320px] rounded-[26px] border border-white/10 bg-slate-950/35 px-4 py-8 sm:px-6">
                <div className="absolute left-6 right-6 top-[42%] h-2 rounded-full bg-white/10" />
                <div
                  className="absolute left-6 top-[42%] h-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-300 transition-all duration-700"
                  style={{ width: trailFillWidth }}
                />

                {trailSteps.map((step, index) => {
                  const isReached = index <= currentStepIndex;
                  const isCurrent = step.id === trailTargetId;
                  const leftPosition = `${(index / (trailSteps.length - 1)) * 100}%`;

                  return (
                    <div
                      key={step.id}
                      className="absolute top-[42%] w-24 -translate-x-1/2 -translate-y-1/2 text-center"
                      style={{ left: `calc(1.5rem + (${leftPosition} * (100% - 3rem) / 100))` }}
                    >
                      <div
                        className={cn(
                          'mx-auto flex h-11 w-11 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300',
                          isReached
                            ? 'border-emerald-200 bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-400/30'
                            : 'border-white/20 bg-white/10 text-white/70',
                          isCurrent && 'scale-110 ring-4 ring-emerald-300/20'
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-50/80">
                        {step.label}
                      </div>
                      <div className="mt-1 text-[10px] text-emerald-50/60">{step.cue}</div>

                      {isCurrent && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-300 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-950 shadow-sm">
                          Agora
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })}

                <div
                  className="absolute z-10 -translate-x-1/2"
                  style={{
                    left: `calc(1.5rem + (${trailProgress}% * (100% - 3rem) / 100))`,
                    top: isMascotLifted ? '18%' : '20%',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onNavigate(currentTarget.target)}
                    className="group flex flex-col items-center gap-3 text-center"
                  >
                    <div className="rounded-full bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                      Toque no mascote
                    </div>

                    <div className="relative rounded-[34px] border border-white/15 bg-white/10 px-4 py-4 shadow-2xl shadow-emerald-500/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.03]">
                      <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.32),transparent_60%)]" />
                      <EcoMascot
                        score={Math.max((currentStepIndex + 1) * 200, 200)}
                        level={Math.max(currentStepIndex + 1, 1)}
                        consumerType={profile.consumerType}
                        customization={customization}
                        variant="compact"
                        journeyState={journeyState}
                      />
                    </div>

                    <div className="max-w-[220px] rounded-[22px] border border-emerald-200/20 bg-slate-950/70 px-3 py-3 shadow-lg">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/80">
                        Proxima chamada
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">{currentTarget.title}</p>
                      <p className="mt-2 text-xs leading-5 text-emerald-50/75">{currentTarget.cue}</p>
                    </div>
                  </button>
                </div>

                {co2Bubbles.map((bubble, index) => {
                  const isCaptured = capturedBubbleIds.includes(bubble.id);

                  return (
                    <button
                      key={bubble.id}
                      type="button"
                      onClick={() => handleCaptureBubble(bubble.id)}
                      aria-label={`Capturar dica visual ${index + 1}`}
                      className={cn(
                        'absolute rounded-full border border-emerald-200/40 bg-white/15 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-emerald-50 shadow-lg backdrop-blur transition-all duration-300',
                        bubble.classes,
                        isCaptured
                          ? 'pointer-events-none scale-75 opacity-0'
                          : 'animate-pulse hover:-translate-y-1 hover:bg-emerald-300/20'
                      )}
                    >
                      {bubble.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/6 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/80">
                  Sequencia da jornada
                </p>

                <div className="mt-4 space-y-3">
                  {flowSteps.map((step, index) => {
                    const isActive = index === flowIndex;
                    const isDone = index < flowIndex;

                    return (
                      <div
                        key={step.label}
                        className={cn(
                          'rounded-[22px] border px-4 py-3 transition-all duration-200',
                          isActive
                            ? 'border-emerald-300/40 bg-emerald-300/12 shadow-sm'
                            : 'border-white/10 bg-white/5',
                          isDone && 'border-cyan-300/30 bg-cyan-300/10'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl',
                              isActive || isDone ? 'bg-white/15 text-white' : 'bg-white/8 text-white/65'
                            )}
                          >
                            <step.Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{step.label}</p>
                            <p className="mt-1 text-sm leading-5 text-emerald-50/72">{step.body}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/6 p-4 backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/20 text-cyan-100">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/80">
                      Dica capturada
                    </p>
                    <p className="mt-2 text-sm leading-6 text-cyan-50/85" aria-live="polite">
                      {activeTip.tip}
                    </p>
                    <div className="mt-3 rounded-2xl border border-emerald-200/15 bg-slate-950/45 px-3 py-2 text-xs leading-5 text-emerald-50/80">
                      Objetivo atual: {activeTip.objective}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/6 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/70">
                    Perfil
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">{profileCompletion}%</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/6 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/70">
                    Faturas
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">{invoiceCount}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/6 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100/70">
                    Foco
                  </div>
                  <div className="mt-2 text-sm font-semibold leading-5 text-white">
                    {currentTarget.cta}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => onNavigate(currentTarget.target)}
                variant="ghost"
                className="w-full justify-between rounded-[22px] border border-white/10 bg-white/5 text-emerald-50 hover:bg-white/10"
              >
                Apoio rapido: {currentTarget.cta}
                <Target className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveMascotJourney;
