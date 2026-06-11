import React from 'react';
import { BarChart3, Sparkles, Target, Zap } from 'lucide-react';

const ambientTips = [
  {
    id: 'focus',
    label: 'Foco atual',
    feedback: 'Use a fatura em foco como referencia antes de abrir varias frentes.',
    Icon: Target,
  },
  {
    id: 'action',
    label: 'Teste curto',
    feedback: 'Uma mudanca pequena por vez deixa a leitura de eficiencia mais confiavel.',
    Icon: Zap,
  },
  {
    id: 'compare',
    label: 'Comparar ciclos',
    feedback: 'Comparar meses parecidos ajuda a sentir progresso sem forcar conclusoes.',
    Icon: BarChart3,
  },
] as const;

const ProfileMascotAmbient = () => {
  const [activeTipId, setActiveTipId] = React.useState<(typeof ambientTips)[number]['id'] | null>(
    ambientTips[0].id
  );

  const activeTip = ambientTips.find((tip) => tip.id === activeTipId) || ambientTips[0];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/95 to-cyan-50/85 p-4 shadow-sm sm:p-5">
      <div className="pointer-events-none absolute -right-10 top-0 h-24 w-24 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-8 h-20 w-20 rounded-full bg-cyan-100/70 blur-2xl" />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/90 shadow-sm ring-1 ring-emerald-100">
              <span className="absolute inset-1 rounded-[18px] bg-gradient-to-br from-emerald-100 via-white to-cyan-100" />
              <span className="relative text-3xl" aria-hidden="true">
                {'\u{1F331}'}
              </span>
              <Sparkles className="absolute -right-1 top-1 h-3.5 w-3.5 text-amber-400" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Pulso rapido
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Toque no sinal que quer reforcar.
              </p>
            </div>
          </div>

          <div className="hidden rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
            Sem impacto no score
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ambientTips.map((tip) => {
            const isActive = activeTipId === tip.id;

            return (
              <button
                key={tip.id}
                type="button"
                onClick={() => setActiveTipId(tip.id)}
                className={`group rounded-[22px] border px-4 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-emerald-300 bg-emerald-100/90 shadow-md shadow-emerald-100'
                    : 'border-white/90 bg-white/90 shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <tip.Icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{tip.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="rounded-[22px] border border-emerald-100 bg-white/90 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm"
          aria-live="polite"
        >
          {activeTip.feedback}
        </div>
      </div>
    </div>
  );
};

export default ProfileMascotAmbient;
