import React, { useEffect, useState } from 'react';
import { fetchLastAnalysis } from '@/services/diagnosis';

type LastAnalysis = {
  month: number; year: number; uf?: string; region?: string; season?: string;
  consumption_kwh: number; total_value_brl: number; value_per_kwh: number;
  impostos_perc?: number; pico_perc?: number; bandeira?: string; te?: number; tusd?: number; score_total?: number;
};

export default function AnalysisPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<LastAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchLastAnalysis(userId)
      .then(d => { if (mounted) setData(d); })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [userId]);

  if (loading) {
    return <div className="rounded-xl p-6 bg-slate-50">Carregando análise…</div>;
  }
  if (!data) {
    return (
      <div className="rounded-xl p-6 bg-slate-50 text-center">
        <div className="text-slate-400 text-sm">Nenhuma fatura encontrada</div>
        <div className="text-slate-500 text-xs">Faça upload da sua fatura para começar</div>
      </div>
    );
  }

  const { month, year, region, season, consumption_kwh, total_value_brl, value_per_kwh, score_total } = data;

  return (
    <div className="rounded-xl p-6 bg-white shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Análise da Última Fatura</h3>
        <span className="text-sm text-slate-500">{`Fatura de ${month}/${year}`}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <div className="text-slate-500 text-sm">Consumo</div>
          <div className="text-2xl font-bold">{consumption_kwh.toLocaleString('pt-BR')} kWh</div>
        </div>
        <div>
          <div className="text-slate-500 text-sm">Valor Total</div>
          <div className="text-2xl font-bold">{
            (total_value_brl || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          }</div>
          <div className="text-xs text-slate-500">({value_per_kwh.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} R$/kWh)</div>
        </div>
        <div>
          <div className="text-slate-500 text-sm">Score</div>
          <div className="text-2xl font-bold">{score_total ?? 0}</div>
          <div className="text-xs text-slate-500">{region ? `${region} • ${season}` : '—'}</div>
        </div>
      </div>
    </div>
  );
}
