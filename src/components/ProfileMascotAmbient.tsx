import React from 'react';

const ambientTips = [
  {
    id: 'focus',
    label: 'Veja sua fatura em foco',
    feedback: 'Boa leitura. Use este ciclo como referência visual da sua jornada.',
  },
  {
    id: 'action',
    label: 'Teste uma ação nesta semana',
    feedback: 'Bom passo. Um teste leve já ajuda a sentir avanço real.',
  },
  {
    id: 'compare',
    label: 'Compare o próximo ciclo',
    feedback: 'Boa estratégia. Comparar ciclos deixa a evolução mais clara.',
  },
] as const;

const ProfileMascotAmbient = () => {
  const [activeTipId, setActiveTipId] = React.useState<(typeof ambientTips)[number]['id'] | null>(null);
  const feedbackTimeoutRef = React.useRef<number | null>(null);

  const handleTipClick = (tipId: (typeof ambientTips)[number]['id']) => {
    setActiveTipId(tipId);

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setActiveTipId((currentTipId) => (currentTipId === tipId ? null : currentTipId));
      feedbackTimeoutRef.current = null;
    }, 1400);
  };

  React.useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const activeTip = ambientTips.find((tip) => tip.id === activeTipId);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/80 to-cyan-50/70 p-4 shadow-sm sm:p-5">
      <div className="pointer-events-none absolute -right-8 top-2 h-20 w-20 rounded-full bg-emerald-100/70 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-4 h-16 w-16 rounded-full bg-cyan-100/60 blur-xl" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3 sm:min-w-[108px] sm:flex-col sm:items-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-white/90 text-4xl shadow-sm ring-1 ring-emerald-100">
            <span className="absolute inset-0 rounded-3xl bg-emerald-100/50 animate-pulse" aria-hidden="true" />
            <span className="relative animate-pulse" aria-hidden="true">
              {'\u{1F331}'}
            </span>
            <span className="absolute -right-1 top-1 text-xs text-emerald-400 opacity-80 animate-pulse" aria-hidden="true">
              {'\u2726'}
            </span>
            <span className="absolute -left-1 bottom-1 text-xs text-cyan-400 opacity-80 animate-pulse" aria-hidden="true">
              {'\u2726'}
            </span>
          </div>

          <div className="space-y-1 sm:text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Mascote da jornada
            </p>
            <p className="text-xs text-slate-500">Dicas rápidas para manter o ritmo.</p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-sm text-slate-600">
            Toque em uma dica para receber um reforço visual leve, sem mudar seu progresso real.
          </p>

          <div className="flex flex-wrap gap-2">
            {ambientTips.map((tip) => {
              const isActive = activeTipId === tip.id;

              return (
                <button
                  key={tip.id}
                  type="button"
                  onClick={() => handleTipClick(tip.id)}
                  className={`rounded-full border px-3 py-2 text-left text-sm transition-all duration-200 ${
                    isActive
                      ? 'border-emerald-300 bg-emerald-100 text-emerald-800 shadow-sm'
                      : 'border-white/80 bg-white/85 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {tip.label}
                </button>
              );
            })}
          </div>

          <div
            className={`min-h-[24px] rounded-2xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
              activeTip
                ? 'bg-white/85 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
                : 'bg-transparent text-transparent'
            }`}
            aria-live="polite"
          >
            {activeTip ? activeTip.feedback : 'Reforço visual'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileMascotAmbient;
