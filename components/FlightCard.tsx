"use client";
import { FlightResult } from '@/lib/types';

export default function FlightCard({ f, onContact }: { f: FlightResult; onContact: () => void }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
        <div className="font-semibold text-slate-700">{f.airline} {f.flightNumber}</div>
        <div>Nguồn: {f.price.source}</div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <div className="text-lg font-bold">{new Date(f.departure.time).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</div>
          <div className="text-xs text-slate-500">{f.departure.airport} ({f.departure.airportName})</div>
        </div>
        <div className="text-center text-xs text-slate-500">{Math.floor(f.duration/60)}h{String(f.duration%60).padStart(2,'0')}m · {f.stops===0?'Bay thẳng':`${f.stops} điểm dừng`}</div>
        <div className="text-right">
          <div className="text-lg font-bold">{new Date(f.arrival.time).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</div>
          <div className="text-xs text-slate-500">{f.arrival.airport} ({f.arrival.airportName})</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-2xl font-black text-brand">{f.price.amount.toLocaleString('vi-VN')} VND</div>
          <div className="text-xs text-slate-500">(≈ ${f.priceUSD})</div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-xl border px-3 py-2 text-sm" onClick={onContact}>Liên hệ đặt vé</button>
          <button className="rounded-xl bg-brand px-3 py-2 text-sm text-white">🔔 Theo dõi giá</button>
        </div>
      </div>
    </div>
  );
}
