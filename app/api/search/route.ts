import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { checkRateLimit } from '@/lib/rate-limit';
import { getRedis } from '@/lib/redis';
import { runFlyClaw } from '@/lib/flyclaw';
import { AIRPORT_NAME_MAP } from '@/lib/airports';
import { SearchPayload, SearchResponse } from '@/lib/types';

export const runtime = 'nodejs';

function toISO(v?: string) {
  if (!v) return '';
  if (v.includes('T')) return v;
  return `${v}:00+07:00`;
}

function airlineCode(name = '') {
  const t = name.toLowerCase();
  if (t.includes('vietnam')) return 'VN';
  if (t.includes('vietjet')) return 'VJ';
  if (t.includes('bamboo')) return 'QH';
  if (t.includes('vietravel')) return 'VU';
  return (name.match(/\b[A-Z0-9]{2}\b/) || ['XX'])[0];
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

  if (!checkRateLimit(ip, 20)) {
    return NextResponse.json({ error: 'Bạn đã vượt quá giới hạn 20 yêu cầu/giờ. Vui lòng thử lại sau.' }, { status: 429 });
  }

  const body = (await req.json()) as SearchPayload;
  const cacheKey = `search:${JSON.stringify(body)}`;
  const redis = getRedis();

  if (redis) {
    const hit = await redis.get(cacheKey);
    if (hit) {
      const parsed = JSON.parse(hit) as SearchResponse;
      parsed.metadata.cached = true;
      return NextResponse.json(parsed);
    }
  }

  try {
    const raw = await runFlyClaw({
      from: body.from,
      to: body.to,
      date: body.date,
      returnDate: body.tripType === 'roundtrip' ? body.returnDate : undefined,
      adults: body.adults,
      children: body.children,
      infants: body.infants,
      cabin: body.cabin,
    });

    const results = raw.map((f: any) => {
      const fromMeta = AIRPORT_NAME_MAP[f.origin_iata] || { city: f.origin_iata, airportName: f.origin_iata };
      const toMeta = AIRPORT_NAME_MAP[f.destination_iata] || { city: f.destination_iata, airportName: f.destination_iata };
      const amountVND = f.currency === 'USD' ? Math.round(Number(f.price || 0) * 25000) : Math.round(Number(f.price || 0));
      const amountUSD = f.currency === 'USD' ? Number(f.price || 0) : Math.round(Number(f.price || 0) / 25000);

      return {
        id: uuidv4(),
        airline: f.airline || 'N/A',
        airlineCode: airlineCode(f.airline || ''),
        flightNumber: f.flight_number || 'N/A',
        departure: {
          airport: f.origin_iata,
          airportName: fromMeta.airportName,
          city: fromMeta.city,
          time: toISO(f.scheduled_departure || f.actual_departure),
        },
        arrival: {
          airport: f.destination_iata,
          airportName: toMeta.airportName,
          city: toMeta.city,
          time: toISO(f.scheduled_arrival || f.actual_arrival),
        },
        duration: Number(f.duration_minutes || 0),
        stops: Number(f.stops || 0),
        price: {
          amount: amountVND,
          currency: 'VND' as const,
          source: f.source || 'flyclaw',
        },
        priceUSD: amountUSD,
        sources: [f.source || 'flyclaw'],
      };
    });

    const payload: SearchResponse = {
      searchId: uuidv4(),
      results,
      metadata: {
        totalResults: results.length,
        searchTime: Number(((Date.now() - started) / 1000).toFixed(1)),
      },
    };

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(payload), 'EX', 900);
    }

    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json({
      error: 'Lỗi backend FlyClaw',
      details: e?.message || 'Unknown error',
    }, { status: 500 });
  }
}
