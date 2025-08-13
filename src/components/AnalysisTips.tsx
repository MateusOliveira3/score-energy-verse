import React, { useState } from 'react';

export default function AnalysisTips({ tips = [] as string[] }) {
  const [open, setOpen] = useState(true);
  if (!tips || tips.length === 0) return null;

  const top = tips.slice(0, 3);

  return (
    <div className="mt-3">
      <button type="button" className="text-sm underline underline-offset-2" onClick={() => setOpen(o => !o)}>
        {open ? 'Ocultar dicas' : 'Ver dicas'}
      </button>
      {open && (
        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
          {top.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      )}
    </div>
  );
}
