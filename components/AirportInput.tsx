"use client";
import { Airport, searchAirport } from '@/lib/airports';
import { useMemo, useState } from 'react';

export default function AirportInput({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  const [q, setQ] = useState(value);
  const list = useMemo(() => searchAirport(q), [q]);

  const pick = (a: Airport) => {
    setQ(a.code);
    onChange(a.code);
  };

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value.toUpperCase()); onChange(e.target.value.toUpperCase()); }}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-brand/40 focus:ring"
        placeholder="VD: HAN hoặc Hà Nội"
      />
      {q && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-white shadow">
          {list.map((a) => (
            <button key={a.code} type="button" className="block w-full px-3 py-2 text-left hover:bg-slate-50" onClick={() => pick(a)}>
              <span className="font-semibold">{a.code}</span> — {a.city} ({a.name})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
