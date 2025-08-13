import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Last = {
  month: number; year: number;
  consumption_kwh: number;
  total_value_brl: number;
  value_per_kwh: number;
  created_at: string | null;
};

export default function AnalysisPanel({ userId }: { userId?: string }) {
  const [last, setLast] = useState<Last | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/users/${userId}/last-analysis`)
      .then(r => r.json())
      .then(j => setLast(j.ok ? j.data : null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Carregando…</div>;
  if (!last) return (
    <div className="rounded-xl border p-6 text-center">
      <div className="text-lg font-medium">Análise da Última Fatura</div>
      <div className="mt-4 text-muted-foreground">Nenhuma fatura encontrada</div>
    </div>
  );

  const kwh = Math.round((last.consumption_kwh ?? 0) * 1000) / 1000; // preserva 3 casas quando vier 41.700
  const total = Math.round((last.total_value_brl ?? 0) * 100) / 100;

  const vpk = last.value_per_kwh && last.value_per_kwh > 0
    ? last.value_per_kwh
    : (kwh > 0 ? total / kwh : 0);

  return (
    <div className="rounded-xl border p-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-medium">Análise da Última Fatura</div>
        <button onClick={() => navigate('/history')} className="btn-outline">
          Ver Histórico
        </button>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-6">
        <div>
          <div className="text-sm text-muted-foreground">Consumo</div>
          <div className="text-2xl font-semibold">{kwh.toLocaleString('pt-BR')} kWh</div>
        </div>
        <div>
          <div className="text-sm text-sm text-muted-foreground">Valor Total</div>
          <div className="text-2xl font-semibold">
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="text-xs text-muted-foreground">
            ({vpk.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} R$/kWh)
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="text-2xl font-semibold">{/* se quiser, busque score do diagnosis depois */}20</div>
        </div>
      </div>
    </div>
  );
}
