import React from 'react';

export default function InvoiceAnalysisBadge({ score }: { score?: number }) {
  if (typeof score !== 'number') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-gray-600">
        Score consultivo: —
      </span>
    );
  }

  const color =
    score >= 15
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : score >= 0
      ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
      : 'bg-red-50 border-red-200 text-red-700';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${color}`}>
      <span className="font-medium">Score</span> {score}
    </span>
  );
}
