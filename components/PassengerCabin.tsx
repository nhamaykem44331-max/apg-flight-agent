"use client";
import { useMemo, useState } from 'react';

export default function PassengerCabin({
  adults, children, infants, cabin,
  onChange,
}: {
  adults: number; children: number; infants: number; cabin: string;
  onChange: (v: { adults: number; children: number; infants: number; cabin: 'economy'|'premium'|'business'|'first' }) => void;
}) {
  const [open, setOpen] = useState(false);
  const txt = useMemo(() => `${adults} NL, ${children} TE, ${infants} EB`, [adults, children, infants]);

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <div className="relative">
        <button type="button" className="w-full rounded-xl border bg-white px-3 py-2 text-left" onClick={() => setOpen(!open)}>
          Hành khách: {txt}
        </button>
        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border bg-white p-3 shadow">
            {([
              ['Người lớn', adults, 1, 9, (v:number) => onChange({ adults: v, children, infants, cabin: cabin as any })],
              ['Trẻ em', children, 0, 9, (v:number) => onChange({ adults, children: v, infants, cabin: cabin as any })],
              ['Em bé', infants, 0, 4, (v:number) => onChange({ adults, children, infants: v, cabin: cabin as any })],
            ] as const).map(([label,v,min,max,set]) => (
              <div key={label} className="mb-2 flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded border px-2" onClick={() => set(Math.max(min, v-1))}>-</button>
                  <span>{v}</span>
                  <button type="button" className="rounded border px-2" onClick={() => set(Math.min(max, v+1))}>+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <select
        value={cabin}
        onChange={(e) => onChange({ adults, children, infants, cabin: e.target.value as any })}
        className="rounded-xl border bg-white px-3 py-2"
      >
        <option value="economy">Phổ thông</option>
        <option value="premium">Phổ thông đặc biệt</option>
        <option value="business">Thương gia</option>
        <option value="first">Hạng nhất</option>
      </select>
    </div>
  );
}
