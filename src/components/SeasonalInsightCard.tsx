import React from 'react';
import { useDiagnosisAnalytics } from '@/hooks/useDiagnosisAnalytics';

export default function SeasonalInsightCard({ userId, userState }: { userId?: string; userState?: string }) {
  const { analytics, loading } = useDiagnosisAnalytics(userId, userState);

  if (loading) return <div>Carregando...</div>;
  if (!analytics?.seasonal) return null;

  const { region, season, insight } = analytics.seasonal;

  return (
    <div className="rounded-lg border p-4 bg-white shadow">
      <h3 className="text-lg font-semibold">Sazonalidade na sua região</h3>
      <p className="text-sm text-gray-700 mb-1"><strong>Região:</strong> {region} | <strong>Estação:</strong> {season}</p>
      <p className="text-sm text-gray-600">{insight}</p>
    </div>
  );
}

