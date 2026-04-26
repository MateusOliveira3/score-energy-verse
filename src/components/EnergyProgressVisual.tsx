import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface EnergyProgressVisualProps {
  invoiceCount: number;
  interactionEvent?: {
    id: number;
    source: 'action_started' | 'action_completed' | 'observation_saved';
  } | null;
}

const milestoneLabels = ['Inicio', 'Ritmo', 'Consistencia', 'Evolucao'];
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

  return (
    <Card className="overflow-hidden border border-emerald-100 bg-white/95 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Camada visual de progresso
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                Você está evoluindo seu padrão de consumo
              </p>
              <p className="text-sm text-slate-600">
                Continue para fortalecer sua eficiência
              </p>
            </div>
          </div>

          <div
            className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 via-white to-cyan-100 text-4xl shadow-inner transition-all duration-300 ${
              isFeedbackActive ? 'scale-110 shadow-lg shadow-emerald-200' : 'scale-100'
            }`}
          >
            {isFeedbackActive && (
              <>
                <span className="pointer-events-none absolute -right-1 -top-2 text-sm animate-ping text-amber-400">
                  {'\u2728'}
                </span>
                <span className="pointer-events-none absolute -bottom-1 -left-1 text-xs text-cyan-400">
                  {'\u2728'}
                </span>
              </>
            )}
            <span aria-hidden="true">{mascot}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>{normalizedInvoiceCount} fatura{normalizedInvoiceCount === 1 ? '' : 's'} na jornada</span>
            <span>{Math.round(progressValue)} pontos visuais</span>
          </div>

          <div
            className={`h-3 overflow-hidden rounded-full bg-slate-100 transition-all duration-300 ${
              isFeedbackActive ? 'ring-4 ring-emerald-100' : ''
            }`}
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressTone} transition-all duration-500 ${
                isFeedbackActive ? 'animate-pulse saturate-125' : ''
              }`}
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {milestoneLabels.map((label, index) => {
            const threshold = (index / (milestoneLabels.length - 1)) * 100;
            const isReached = progressValue >= threshold;

            return (
              <div
                key={label}
                className={`rounded-xl border px-3 py-2 text-center transition-colors ${
                  isReached
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="flex justify-center">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isReached ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-1 text-[11px] font-medium">{label}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnergyProgressVisual;
