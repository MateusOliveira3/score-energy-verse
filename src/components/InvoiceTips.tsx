import React, { useState } from 'react';

export default function InvoiceTips({ tips }: { tips?: string[] }) {
  const [open, setOpen] = useState(false);
  if (!tips || tips.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm underline underline-offset-2"
      >
        {open ? 'Ocultar dicas' : 'Ver dicas'}
      </button>
      {open && (
        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
          {tips.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
