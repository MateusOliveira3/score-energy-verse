import React from 'react';
import { Activity, Flag, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EnergyProgressVisualProps {
  invoiceCount: number;
  interactionEvent?: {
    id: number;
    source: 'action_started' | 'action_completed' | 'observation_saved';
  } | null;
}

const milestones = [
  { label: 'Primeira leitura', shortLabel: 'Base', invoiceTarget: 1 },
  { label: 'Ritmo em curso', shortLabel: 'Ritmo', invoiceTarget: 2 },
  { label: 'Sequencia ativa', shortLabel: 'Sequencia', invoiceTarget: 4 },
  { label: 'Base consistente', shortLabel: 'Constancia', invoiceTarget: 5 },
] as const;

const maxInvoicesForVisualProgress = 5;

const EnergyProgressVisual = ({ invoiceCount, interactionEvent }: EnergyProgressVisualProps) => {
  const normalizedInvoiceCount = Math.max(invoiceCount, 0);
  const progressValue = Math.min(
    (normalizedInvoiceCount / maxInvoicesForVisualProgress) * 100,
    100
  );
  const [isFeedbackActive, setIsFeedbackActive] = React.useState(false);

  React.useEffect(() => {
    if (!interactionEvent) {
      return undefined;
    }

    setIsFeedbackActive(true);

    const timeoutId = window.setTimeout(() => {
      setIsFeedbackActive(false);
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [interactionEvent]);

  const mascot =
    progressValue >= 75 ? '\u{1F333}' : progressValue >= 40 ? '\u{1F33F}' : '\u{1F331}';
  const progressTone =
    progressValue >= 75
      ? 'from-emerald-500 via-green-500 to-lime-400'
      : progressValue >= 40
        ? 'from-emerald-400 via-teal-400 to-cyan-400'
        : 'from-emerald-300 via-teal-300 to-sky-300';
  const nextMilestone = milestones.find((milestone) => normalizedInvoiceCount < milestone.invoiceTarget);
  const currentStage = milestones
    .slice()
    .reverse()
    .find((milestone) => normalizedInvoiceCount >= milestone.invoiceTarget);

  return (
    <Card className="relative overflow-hidden border border-emerald-100 bg-white/95 shadow-sm">
      <div className="pointer-events-none absolute -right-12 top-0 h-28 w-28 rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-6 h-24 w-24 rounded-full bg-cyan-100/70 blur-3xl" />

      <CardContent className="relative space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <Activity className="h-3.5 w-3.5" />
              Leitura visual da jornada
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {currentStage
                  ? `Seu painel entrou em ${currentStage.shortLabel.toLowerCase()}.`
                  : 'Sua jornada ja tem um ponto de partida visual.'}
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Leitura visual sem alterar score ou dados
              </p>
            </div>
          </div>

          <div
            className={`relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-100 via-white to-cyan-100 text-5xl shadow-inner transition-all duration-300 ${
              isFeedbackActive ? 'scale-105 shadow-lg shadow-emerald-200' : 'scale-100'
            }`}
          >
            <span className="absolute inset-1 rounded-[24px] bg-white/40" />
            {isFeedbackActive && (
              <>
                <Sparkles className="pointer-events-none absolute -right-1 -top-1 h-4 w-4 animate-pulse text-amber-400" />
                <Sparkles className="pointer-events-none absolute -bottom-1 -left-1 h-3.5 w-3.5 animate-pulse text-cyan-400" />
              </>
            )}
            <span aria-hidden="true" className="relative">
              {mascot}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-white/90 bg-white/85 p-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Ciclos lidos
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {normalizedInvoiceCount}
              <span className="ml-1 text-sm font-medium text-slate-500">
                fatura{normalizedInvoiceCount === 1 ? '' : 's'}
              </span>
            </p>
          </div>

          <div className="rounded-[22px] border border-white/90 bg-white/85 p-3 shadow-sm">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <Flag className="h-3.5 w-3.5 text-emerald-600" />
              Proximo marco
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {nextMilestone ? nextMilestone.label : 'Jornada em constancia'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {nextMilestone
                ? `${nextMilestone.invoiceTarget} fatura${nextMilestone.invoiceTarget === 1 ? '' : 's'} na jornada.`
                : 'Todos os marcos visuais atuais foram atingidos.'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Barra de constancia</span>
            <span>{Math.round(progressValue)}%</span>
          </div>

          <div
            className={`relative h-3 overflow-hidden rounded-full bg-slate-100 transition-all duration-300 ${
              isFeedbackActive ? 'ring-4 ring-emerald-100' : ''
            }`}
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${progressTone} transition-all duration-500 ${
                isFeedbackActive ? 'animate-pulse saturate-125' : ''
              }`}
              style={{ width: `${progressValue}%` }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] opacity-70" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {milestones.map((milestone) => {
            const isReached = normalizedInvoiceCount >= milestone.invoiceTarget;

            return (
              <div
                key={milestone.label}
                className={`rounded-[20px] border px-3 py-3 text-center transition-colors ${
                  isReached
                    ? 'border-emerald-200 bg-emerald-50/90 text-emerald-700'
                    : 'border-slate-200 bg-slate-50/85 text-slate-400'
                }`}
              >
                <div className="flex justify-center">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isReached ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-slate-300'
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                  {milestone.shortLabel}
                </div>
                <div className="mt-1 text-xs font-medium">{milestone.label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnergyProgressVisual;
