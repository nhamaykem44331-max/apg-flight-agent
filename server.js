require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.static(path.join(__dirname, 'public')));

function toHm(mins) {
  if (typeof mins !== 'number' || Number.isNaN(mins)) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function mapSerpApiFlight(f) {
  const dep = f.flights?.[0] || {};
  const arr = f.flights?.[f.flights.length - 1] || {};

  const segments = (f.flights || []).map((seg, idx) => ({
    index: idx + 1,
    airline: seg.airline || '',
    flight_number: seg.flight_number || '',
    from: seg.departure_airport?.id || '',
    from_city: seg.departure_airport?.name || '',
    departure_time: seg.departure_airport?.time || '',
    to: seg.arrival_airport?.id || '',
    to_city: seg.arrival_airport?.name || '',
    arrival_time: seg.arrival_airport?.time || '',
    duration_min: seg.duration || null,
    duration_text: toHm(seg.duration)
  }));

  const layovers = (f.layovers || []).map((l, idx) => ({
    index: idx + 1,
    airport: l.id || l.name || '',
    airport_name: l.name || '',
    duration_min: l.duration || null,
    duration_text: toHm(l.duration)
  }));

  return {
    airline: dep.airline || 'N/A',
    flight_number: dep.flight_number || 'N/A',
    departure_airport: dep.departure_airport?.id || '',
    arrival_airport: arr.arrival_airport?.id || '',
    departure_time: dep.departure_airport?.time || '',
    arrival_time: arr.arrival_airport?.time || '',
    duration_min: f.total_duration || null,
    duration: f.total_duration ? toHm(f.total_duration) : '',
    stops: layovers.length,
    layovers,
    segments,
    raw_flights: f.flights || [],
    price: f.price || null,
    price_currency: 'VND'
  };
}

app.get('/api/flights/live', async (req, res) => {
  const { from = 'HAN', to = 'SGN', date } = req.query;
  const apiKey = process.env.SERPAPI_KEY;

  if (!date) {
    return res.status(400).json({ error: 'Thiếu tham số date (YYYY-MM-DD).' });
  }

  if (!apiKey) {
    return res.status(500).json({
      error: 'Chưa có SERPAPI_KEY nên chưa lấy được giá live từ Google Flights.',
      hint: 'Thêm SERPAPI_KEY vào file .env rồi chạy lại server.'
    });
  }

  try {
    const { data } = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_flights',
        departure_id: from,
        arrival_id: to,
        outbound_date: date,
        type: 2,
        currency: 'VND',
        hl: 'vi',
        gl: 'vn',
        api_key: apiKey
      },
      timeout: 30000
    });

    const best = (data.best_flights || []).map(mapSerpApiFlight);
    const other = (data.other_flights || []).map(mapSerpApiFlight);
    const flights = [...best, ...other]
      .filter(f => f.price)
      .sort((a, b) => a.price - b.price);

    res.json({
      source: 'google_flights_via_serpapi',
      from,
      to,
      date,
      count: flights.length,
      flights
    });
  } catch (err) {
    res.status(500).json({
      error: 'Lỗi khi gọi dữ liệu live từ Google Flights',
      details: err.response?.data || err.message
    });
  }
});

app.get('/debug-scroll', (req, res) => {
  const lines = Array.from({ length: 300 }, (_, i) => `<p>Dòng kiểm tra cuộn #${i + 1}</p>`).join('');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="vi"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Debug Scroll</title></head><body><h1>Debug Scroll Endpoint</h1><p>Nếu trang này vẫn không cuộn được xuống cuối, lỗi nằm ở môi trường hiển thị (webview/browser), không phải layout app.</p>${lines}</body></html>`);
});

app.listen(PORT, () => {
  console.log(`Flight demo v2 running at http://localhost:${PORT}`);
});
