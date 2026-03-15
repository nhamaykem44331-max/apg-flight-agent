"use client";
import { useEffect, useMemo, useState } from 'react';
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
};

type QuotePayload = {
  outbound: Flight;
  inbound: Flight;
  adults: number;
  children: number;
  infants: number;
  cabin: string;
  search: { from: string; to: string; date: string; returnDate: string };
};

function fmt(v: number) {
  return Number(v || 0).toLocaleString('vi-VN') + ' đ';
}

function hhmm(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function vnWeekday(isoDate: string) {
  const d = new Date(isoDate);
  const map = ['CN', 'T.Hai', 'T.Ba', 'T.Tư', 'T.Năm', 'T.Sáu', 'T.Bảy'];
  return `${map[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function QuotePage() {
  const router = useRouter();
  const [data, setData] = useState<QuotePayload | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('apg_quote_selection');
    if (!raw) return;
    try { setData(JSON.parse(raw)); } catch {}
  }, []);

  const calc = useMemo(() => {
    if (!data) return null;
    const fare = (data.outbound.price.amount + data.inbound.price.amount) * data.adults;
    const tax = Math.round(fare * 0.12);
    const total = fare + tax;
    return { fare, tax, total };
  }, [data]);

  if (!data || !calc) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border bg-white p-6">
          <p className="mb-3">Chưa có dữ liệu báo giá. Vui lòng chọn chuyến đi/về trước.</p>
          <button className="rounded bg-[#c8a96b] px-4 py-2" onClick={() => router.push('/')}>Quay lại tìm chuyến bay</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#e9eaef] p-4 text-[#222]">
      <div className="mx-auto max-w-3xl rounded-xl bg-[#e6e6eb] p-4 shadow">
        <div className="mb-6 grid grid-cols-[1fr_auto] items-start gap-4 border-b pb-4">
          <div>
            <div className="text-4xl">✈️</div>
            <div className="mt-1 text-4xl font-black text-red-600">APG</div>
          </div>
          <div className="text-right text-sm text-slate-600">Tân Phú APG • Báo giá tổng hợp</div>
        </div>

        <div className="mb-6 grid grid-cols-[1fr_auto] gap-4">
          <div>
            <div className="text-2xl font-semibold">{data.search.from} ➜ {data.search.to}</div>
            <div className="mt-3 flex items-center gap-4 text-2xl">
              <span>🛫</span>
              <span>{data.outbound.airline} {data.outbound.flightNumber}</span>
            </div>
            <div className="mt-2 text-xl">Giờ bay: {hhmm(data.outbound.departure.time)} - {hhmm(data.outbound.arrival.time)}</div>
            <div className="mt-2 text-xl">Máy bay: Airbus A320</div>
          </div>
          <div className="text-right text-4xl font-bold">{vnWeekday(data.search.date)}</div>
        </div>

        <div className="mb-6 grid grid-cols-[1fr_auto] gap-4 border-t pt-4">
          <div>
            <div className="text-2xl font-semibold">{data.search.to} ➜ {data.search.from}</div>
            <div className="mt-3 flex items-center gap-4 text-2xl">
              <span>🛬</span>
              <span>{data.inbound.airline} {data.inbound.flightNumber}</span>
            </div>
            <div className="mt-2 text-xl">Giờ bay: {hhmm(data.inbound.departure.time)} - {hhmm(data.inbound.arrival.time)}</div>
            <div className="mt-2 text-xl">Máy bay: Airbus A320</div>
          </div>
          <div className="text-right text-4xl font-bold">{vnWeekday(data.search.returnDate)}</div>
        </div>

        <div className="border-t pt-4 text-3xl">
          <div className="grid grid-cols-[1fr_auto] gap-2 py-1">
            <span>Vé người lớn x {data.adults}</span>
            <span>{fmt(calc.fare)}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2 py-1">
            <span>Thuế + phí</span>
            <span>{fmt(calc.tax)}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2 py-2 font-bold text-red-600">
            <span>Tổng giá vé</span>
            <span>{fmt(calc.total)}</span>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button className="rounded bg-[#c8a96b] px-4 py-2" onClick={() => router.push('/')}>Quay lại đổi chuyến</button>
          <button className="rounded bg-[#1570ef] px-4 py-2 text-white">Liên hệ đặt vé</button>
        </div>
      </div>
    </main>
  );
}
