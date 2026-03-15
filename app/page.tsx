"use client";
import { useState } from 'react';

type Flight = {
  id: string;
  airline: string;
  flightNumber: string;
  departure: { airport: string; airportName: string; city: string; time: string };
  arrival: { airport: string; airportName: string; city: string; time: string };
  duration: number;
  stops: number;
  price: { amount: number; currency: string; source: string };
  priceUSD: number;
  sources: string[];
};

function airlineClass(name = '') {
  const n = name.toLowerCase();
  if (n.includes('vietnam')) return 'bg-sky-600';
  if (n.includes('vietjet')) return 'bg-red-600';
  if (n.includes('bamboo')) return 'bg-green-600';
  if (n.includes('vietravel')) return 'bg-amber-500';
  if (n.includes('shenzhen')) return 'bg-teal-700';
  return 'bg-slate-500';
}

function fmt(v: number) {
  return Number(v || 0).toLocaleString('vi-VN') + ' ₫';
}

function toYmd(offset = 7) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function HomePage() {
  const [from, setFrom] = useState('HAN');
  const [to, setTo] = useState('SGN');
  const [date, setDate] = useState(toYmd(7));
  const [returnDate, setReturnDate] = useState('');
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabin, setCabin] = useState<'economy' | 'premium' | 'business' | 'first'>('economy');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Flight[]>([]);
  const [detail, setDetail] = useState<Record<string, boolean>>({});
  const [meta, setMeta] = useState<{ totalResults: number; searchTime: number } | null>(null);

  async function search() {
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const body = {
        from,
        to,
        date,
        returnDate: tripType === 'roundtrip' ? returnDate : undefined,
        adults,
        children,
        infants,
        cabin,
        tripType,
      };
      const r = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Lỗi không xác định');
      setResults(j.results || []);
      setMeta(j.metadata || null);
    } catch (e: any) {
      setError(e.message || 'Lỗi tìm kiếm');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f0e6] px-3 py-6 text-[#4b3b2b] md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 rounded-xl bg-gradient-to-r from-[#d6b77a] to-[#f2e4c7] p-4">
          <div className="text-xl font-bold">TAN PHU APG</div>
          <div className="text-xs">AIRLINES AGENT • APG Flight Agent</div>
        </div>

        <div className="rounded-xl bg-[#fffaf1] p-4 shadow">
          <h1 className="mb-3 text-xl font-bold">✈️ APG Flight Agent</h1>

          <div className="mb-3 flex gap-2">
            <button className={`rounded-full px-3 py-1 ${tripType === 'oneway' ? 'bg-[#c8a96b] font-semibold' : 'border bg-white'}`} onClick={() => setTripType('oneway')}>Một chiều</button>
            <button className={`rounded-full px-3 py-1 ${tripType === 'roundtrip' ? 'bg-[#c8a96b] font-semibold' : 'border bg-white'}`} onClick={() => setTripType('roundtrip')}>Khứ hồi</button>
          </div>

          <div className="grid gap-2 md:grid-cols-6">
            <input className="rounded border px-3 py-2" value={from} onChange={e => setFrom(e.target.value.toUpperCase())} placeholder="Điểm đi" />
            <input className="rounded border px-3 py-2" value={to} onChange={e => setTo(e.target.value.toUpperCase())} placeholder="Điểm đến" />
            <input className="rounded border px-3 py-2" type="date" value={date} onChange={e => setDate(e.target.value)} />
            <input className="rounded border px-3 py-2" type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} disabled={tripType === 'oneway'} />
            <select className="rounded border px-3 py-2" value={cabin} onChange={e => setCabin(e.target.value as any)}>
              <option value="economy">Phổ thông</option>
              <option value="premium">Phổ thông đặc biệt</option>
              <option value="business">Thương gia</option>
              <option value="first">Hạng nhất</option>
            </select>
            <button className="rounded bg-[#c8a96b] px-3 py-2 font-semibold" onClick={search}>Tìm chuyến bay</button>
          </div>

          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <label className="text-sm">Người lớn <input className="ml-2 w-16 rounded border px-2 py-1" type="number" min={1} max={9} value={adults} onChange={e => setAdults(Number(e.target.value || 1))} /></label>
            <label className="text-sm">Trẻ em <input className="ml-2 w-16 rounded border px-2 py-1" type="number" min={0} max={9} value={children} onChange={e => setChildren(Number(e.target.value || 0))} /></label>
            <label className="text-sm">Em bé <input className="ml-2 w-16 rounded border px-2 py-1" type="number" min={0} max={4} value={infants} onChange={e => setInfants(Number(e.target.value || 0))} /></label>
          </div>

          <p className="mt-2 text-xs text-slate-500">Mặc định 1 chiều. Chọn ngày về để tìm khứ hồi.</p>
          {loading && <p className="mt-2 text-sm text-slate-600">Đang tìm chuyến bay...</p>}
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          {meta && <p className="mt-2 text-sm text-slate-600">Kết quả: {meta.totalResults} chuyến · {meta.searchTime}s · Nguồn hiển thị: FlyClaw</p>}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-2 text-left">Hãng</th>
                  <th className="border-b p-2 text-left">Chuyến</th>
                  <th className="border-b p-2 text-left">Giờ đi</th>
                  <th className="border-b p-2 text-left">Giờ đến</th>
                  <th className="border-b p-2 text-left">Dừng</th>
                  <th className="border-b p-2 text-left">Giá</th>
                  <th className="border-b p-2 text-left">Nguồn</th>
                  <th className="border-b p-2 text-left">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {results.map((f) => (
                  <>
                    <tr key={f.id}>
                      <td className="border-b p-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold text-white ${airlineClass(f.airline)}`}>{f.airline}</span></td>
                      <td className="border-b p-2">{f.flightNumber}</td>
                      <td className="border-b p-2">{new Date(f.departure.time).toLocaleString('vi-VN')}</td>
                      <td className="border-b p-2">{new Date(f.arrival.time).toLocaleString('vi-VN')}</td>
                      <td className="border-b p-2">{f.stops}</td>
                      <td className="border-b p-2 font-bold">{fmt(f.price.amount)}</td>
                      <td className="border-b p-2">flyclaw</td>
                      <td className="border-b p-2"><button className="rounded border px-2 py-1 text-xs" onClick={() => setDetail((s) => ({ ...s, [f.id]: !s[f.id] }))}>Xem</button></td>
                    </tr>
                    {detail[f.id] && (
                      <tr key={`${f.id}-d`}>
                        <td colSpan={8} className="bg-[#fff8ec] p-2 text-sm">
                          {f.departure.airport} ({f.departure.airportName}) → {f.arrival.airport} ({f.arrival.airportName}) · {Math.floor(f.duration / 60)}h {String(f.duration % 60).padStart(2, '0')}m
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {!loading && results.length === 0 && !error && (
                  <tr><td colSpan={8} className="p-3 text-center text-slate-500">Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-gradient-to-r from-[#d6b77a] to-[#f2e4c7] p-3 text-sm">© 2026 TAN PHU APG</div>
      </div>
    </main>
  );
}
