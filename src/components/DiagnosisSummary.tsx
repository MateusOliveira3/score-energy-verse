import React from 'react';
import { useDiagnosisAnalytics } from '@/hooks/useDiagnosisAnalytics';

function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'up'|'down'|'neutral' }) {
  const map = {
    up:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    down:  'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-gray-50 text-gray-700 border-gray-200'
  } as const;
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${map[tone]}`}>
      {children}
    </span>
  );
}

export default function DiagnosisSummary({ userId }: { userId?: string }) {
  const { analytics, loading } = useDiagnosisAnalytics(userId);

  if (loading) return <div className="text-sm text-gray-500">Carregando resumo…</div>;
  if (!analytics) return null;

  const a = analytics;
  const arrow = (v: number) => v < 0 ? '↓' : v > 0 ? '↑' : '→';
  const tone  = (v: number) => v < 0 ? 'up' : v > 0 ? 'down' : 'neutral';
  
  const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white/60 p-4">
      <div className="mb-2 text-base font-semibold">Seu desempenho (comparativos)</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <div>
            <span className="text-gray-600">Desde o início — Consumo:</span>{' '}
            <Pill tone={tone(a.totalChangeKwh)}>
              {arrow(a.totalChangeKwh)} {a.totalChangeKwh.toFixed(0)} kWh
            </Pill>
          </div>
          <div>
            <span className="text-gray-600">Desde o início — R$/kWh:</span>{' '}
            <Pill tone={tone(a.totalChangeRpk)}>
              {arrow(a.totalChangeRpk)} {a.totalChangeRpk.toFixed(3)}
            </Pill>
          </div>
          {a.bestImprovementMonth && (
            <div className="text-gray-700">
              Melhor mês: <strong>{a.bestImprovementMonth.month}/{a.bestImprovementMonth.year}</strong>{' '}
              (−{Math.abs(a.bestImprovementMonth.kwhDrop).toFixed(0)} kWh)
            </div>
          )}
          {a.currentDownStreak > 0 && (
            <div className="text-gray-700">
              Streak de queda: <strong>{a.currentDownStreak}</strong> {a.currentDownStreak === 1 ? 'mês' : 'meses'}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-gray-600">Médias dos últimos 3 meses</div>
          <div className="flex flex-wrap gap-2">
            <Pill>{a.avgKwhLast3.toFixed(0)} kWh</Pill>
            <Pill>{a.avgRpkLast3.toFixed(3)} R$/kWh</Pill>
          </div>
          <div className="text-gray-600 mt-2">Tendência (últimos 3 vs 3 anteriores)</div>
          <div className="flex flex-wrap gap-2">
            <Pill tone={tone(a.trend3vs3.kwh)}>{arrow(a.trend3vs3.kwh)} {a.trend3vs3.kwh.toFixed(0)} kWh</Pill>
            <Pill tone={tone(a.trend3vs3.rpk)}>{arrow(a.trend3vs3.rpk)} {a.trend3vs3.rpk.toFixed(3)} R$/kWh</Pill>
            <Pill tone={tone(a.trend3vs3.score)}>{arrow(a.trend3vs3.score)} {a.trend3vs3.score.toFixed(0)} score</Pill>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Sinais: {a.flags.monthsWithZeroKwh} mês(es) com 0 kWh • {a.flags.monthsWithHighRpk} mês(es) com R$/kWh alto
          </div>
        </div>
      </div>
    </div>
  );
}
