"use client";
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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

type SearchResponse = {
  results: Flight[];
  metadata?: { totalResults: number; searchTime: number };
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

function hhmm(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function durationText(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

export default function HomePage() {
  const router = useRouter();
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

  const [outboundResults, setOutboundResults] = useState<Flight[]>([]);
  const [inboundResults, setInboundResults] = useState<Flight[]>([]);
  const [selectedOutbound, setSelectedOutbound] = useState<Flight | null>(null);
  const [selectedInbound, setSelectedInbound] = useState<Flight | null>(null);
  const [sortMode, setSortMode] = useState<'price' | 'time'>('price');

  const totalRoundtrip = useMemo(() => {
    return (selectedOutbound?.price.amount || 0) + (selectedInbound?.price.amount || 0);
  }, [selectedOutbound, selectedInbound]);

  const sortedOutbound = useMemo(() => {
    const arr = [...outboundResults];
    if (sortMode === 'price') arr.sort((a, b) => a.price.amount - b.price.amount);
    else arr.sort((a, b) => +new Date(a.departure.time) - +new Date(b.departure.time));
    return arr;
  }, [outboundResults, sortMode]);

  const sortedInbound = useMemo(() => {
    const arr = [...inboundResults];
    if (sortMode === 'price') arr.sort((a, b) => a.price.amount - b.price.amount);
    else arr.sort((a, b) => +new Date(a.departure.time) - +new Date(b.departure.time));
    return arr;
  }, [inboundResults, sortMode]);

  function goQuote(outbound: Flight, inbound: Flight) {
    const payload = {
      outbound,
      inbound,
      adults,
      children,
      infants,
      cabin,
      search: { from, to, date, returnDate: returnDate || toYmd(10) },
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('apg_quote_selection', JSON.stringify(payload));
    router.push('/quote');
  }

  function onSelectOutbound(f: Flight) {
    setSelectedOutbound(f);
    if (selectedInbound) goQuote(f, selectedInbound);
  }

  function onSelectInbound(f: Flight) {
    setSelectedInbound(f);
    if (selectedOutbound) goQuote(selectedOutbound, f);
  }

  async function callSearch(payload: any): Promise<SearchResponse> {
    const r = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Lỗi không xác định');
    return j as SearchResponse;
  }

  async function search() {
    setLoading(true);
    setError('');
    setResults([]);
    setMeta(null);
    setOutboundResults([]);
    setInboundResults([]);
    setSelectedOutbound(null);
    setSelectedInbound(null);

    try {
      const base = { adults, children, infants, cabin };

      if (tripType === 'roundtrip') {
        const effectiveReturnDate = returnDate || toYmd(10);
        const [go, back] = await Promise.all([
          callSearch({ ...base, from, to, date, tripType: 'oneway' }),
          callSearch({ ...base, from: to, to: from, date: effectiveReturnDate, tripType: 'oneway' }),
        ]);

        setOutboundResults(go.results || []);
        setInboundResults(back.results || []);
        setMeta({
          totalResults: (go.results?.length || 0) + (back.results?.length || 0),
          searchTime: Number((((go.metadata?.searchTime || 0) + (back.metadata?.searchTime || 0))).toFixed(1)),
        });
      } else {
        const one = await callSearch({ ...base, from, to, date, tripType: 'oneway' });
        setResults(one.results || []);
        setMeta(one.metadata || null);
      }
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
          <h1 className="mb-3 text-xl font-bold">✈️ APG Flight Agent (Classic UI v2)</h1>

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

          {tripType === 'roundtrip' ? (
            <>
              <div className="mt-4 rounded-lg border bg-white p-3">
                <div className="flex items-center gap-6 text-sm">
                  <span className="font-semibold">Sắp xếp:</span>
                  <label className="flex items-center gap-2"><input type="radio" checked={sortMode==='price'} onChange={() => setSortMode('price')} /> Giá</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={sortMode==='time'} onChange={() => setSortMode('time')} /> Giờ bay</label>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border bg-white shadow-sm">
                  <div className="border-b bg-[#f7b500] px-3 py-2 font-semibold text-white">Đi: {from} ➜ {to} ({date})</div>
                  <div className="max-h-[420px] overflow-auto">
                    {sortedOutbound.map((f) => (
                      <div key={f.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b px-3 py-2 text-sm hover:bg-slate-50">
                        <div>
                          <div className="font-semibold">{hhmm(f.departure.time)} - {hhmm(f.arrival.time)}</div>
                          <div className="text-xs text-slate-600">{f.airline} {f.flightNumber} · {f.stops === 0 ? 'Bay thẳng' : `${f.stops} điểm dừng`}</div>
                        </div>
                        <div className="font-semibold">{fmt(f.price.amount)}</div>
                        <button className={`rounded px-3 py-1 text-white ${selectedOutbound?.id===f.id?"bg-green-600":"bg-[#f4b21f]"}`} onClick={() => onSelectOutbound(f)}>{selectedOutbound?.id===f.id?"Đã chọn":"Chọn"}</button>
                      </div>
                    ))}
                    {!loading && sortedOutbound.length === 0 && <div className="p-3 text-sm text-slate-500">Không có dữ liệu chiều đi.</div>}
                  </div>
                </div>

                <div className="rounded-xl border bg-white shadow-sm">
                  <div className="border-b bg-[#1570ef] px-3 py-2 font-semibold text-white">Về: {to} ➜ {from} ({returnDate || toYmd(10)})</div>
                  <div className="max-h-[420px] overflow-auto">
                    {sortedInbound.map((f) => (
                      <div key={f.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b px-3 py-2 text-sm hover:bg-slate-50">
                        <div>
                          <div className="font-semibold">{hhmm(f.departure.time)} - {hhmm(f.arrival.time)}</div>
                          <div className="text-xs text-slate-600">{f.airline} {f.flightNumber} · {f.stops === 0 ? 'Bay thẳng' : `${f.stops} điểm dừng`}</div>
                        </div>
                        <div className="font-semibold">{fmt(f.price.amount)}</div>
                        <button className={`rounded px-3 py-1 text-white ${selectedInbound?.id===f.id?"bg-green-600":"bg-[#1967d2]"}`} onClick={() => onSelectInbound(f)}>{selectedInbound?.id===f.id?"Đã chọn":"Chọn"}</button>
                      </div>
                    ))}
                    {!loading && sortedInbound.length === 0 && <div className="p-3 text-sm text-slate-500">Không có dữ liệu chiều về.</div>}
                  </div>
                </div>

                {selectedOutbound && selectedInbound && (
                  <div className="md:col-span-2 rounded-lg border bg-[#f7f7f7] p-4">
                    <div className="mb-3 text-lg font-bold">Chi tiết giờ bay & tổng giá vé khứ hồi</div>
                    <div className="mb-2 grid grid-cols-[1fr_auto] gap-2 border-b pb-2">
                      <div>
                        <div className="font-semibold">{selectedOutbound.departure.city} ➜ {selectedOutbound.arrival.city}</div>
                        <div className="text-sm">{selectedOutbound.airline} {selectedOutbound.flightNumber} · {hhmm(selectedOutbound.departure.time)} - {hhmm(selectedOutbound.arrival.time)}</div>
                      </div>
                      <div className="font-semibold">{fmt(selectedOutbound.price.amount)}</div>
                    </div>

                    <div className="mb-3 grid grid-cols-[1fr_auto] gap-2 border-b pb-2">
                      <div>
                        <div className="font-semibold">{selectedInbound.departure.city} ➜ {selectedInbound.arrival.city}</div>
                        <div className="text-sm">{selectedInbound.airline} {selectedInbound.flightNumber} · {hhmm(selectedInbound.departure.time)} - {hhmm(selectedInbound.arrival.time)}</div>
                      </div>
                      <div className="font-semibold">{fmt(selectedInbound.price.amount)}</div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] gap-2 text-sm">
                      <div>Vé người lớn x {adults}</div>
                      <div>{fmt(totalRoundtrip * adults)}</div>
                      <div>Thuế + phí (tham khảo)</div>
                      <div>{fmt(Math.round(totalRoundtrip * adults * 0.12))}</div>
                      <div className="text-base font-bold">Tổng giá vé</div>
                      <div className="text-xl font-black text-red-600">{fmt(Math.round(totalRoundtrip * adults * 1.12))}</div>
                    </div>

                    <button className="mt-4 rounded bg-[#d12d2d] px-4 py-2 font-semibold text-white" onClick={() => goQuote(selectedOutbound, selectedInbound)}>
                      Sang trang báo giá tổng hợp
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
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
                  ))}
                  {!loading && results.length === 0 && !error && (
                    <tr><td colSpan={8} className="p-3 text-center text-slate-500">Không có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>

              {results.map((f) => (
                detail[f.id] ? (
                  <div key={`${f.id}-d`} className="border-b bg-[#fff8ec] p-2 text-sm">
                    {f.departure.airport} ({f.departure.airportName}) ➜ {f.arrival.airport} ({f.arrival.airportName}) · {durationText(f.duration)}
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 rounded-xl bg-gradient-to-r from-[#d6b77a] to-[#f2e4c7] p-3 text-sm">© 2026 TAN PHU APG</div>
      </div>
    </main>
  );
}
