import { useHistory } from '@/hooks/useHistory';
import { useAuth } from '@/contexts/AuthContext';

export default function HistoryPage() {
  const { user } = useAuth();
  const { data, loading, error } = useHistory(user?.id);

  if (!user) return <div className="p-6">Faça login para ver o histórico.</div>;
  if (loading) return <div className="p-6">Carregando…</div>;
  if (error) return <div className="p-6 text-red-500">Erro: {error}</div>;
  if (!data) return null;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Histórico de Faturas</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.invoices.map(inv => {
          const kwh = inv.consumption_kwh ?? 0;
          const total = inv.total_value_brl ?? 0;
          const vpk = inv.value_per_kwh ?? (kwh > 0 ? total / kwh : 0);
          const label = `${inv.month}/${inv.year}`;

          return (
            <div key={inv.id} className="rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">{label}</div>
              <div className="mt-2 space-y-1">
                <div><span className="text-xs text-muted-foreground">Consumo:</span> {kwh.toLocaleString('pt-BR')} kWh</div>
                <div><span className="text-xs text-muted-foreground">Valor:</span> {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div className="text-xs text-muted-foreground">
                  {vpk.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} R$/kWh
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(!data.invoices || data.invoices.length === 0) && (
        <div className="mt-10 text-center text-muted-foreground">
          Nenhuma fatura encontrada.
        </div>
      )}
    </div>
  );
}
