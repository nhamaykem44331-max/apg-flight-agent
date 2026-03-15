require('dotenv').config();
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3030;
const FLYCLAW_DIR = path.join(__dirname, 'flyclaw');

app.use(express.static(path.join(__dirname, 'public')));

function toHm(mins) {
  if (typeof mins !== 'number' || Number.isNaN(mins)) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function fmtTime(iso) {
  if (!iso) return '';
  return String(iso).replace('T', ' ').slice(0, 16);
}

function normalizeAirline(name = '') {
  const n = name.toLowerCase();
  if (n.includes('air bamboo')) return 'Bamboo Airways';
  return name;
}

const CITY_VI = {
  HAN: 'Hà Nội',
  SGN: 'TP.HCM',
  DAD: 'Đà Nẵng',
  CXR: 'Nha Trang',
  PQC: 'Phú Quốc',
  VCA: 'Cần Thơ',
  CAN: 'Quảng Châu',
  SZX: 'Thâm Quyến',
  HKG: 'Hong Kong',
  NRT: 'Tokyo',
  ICN: 'Seoul'
};
function cityVi(iata, fallback='') {
  return CITY_VI[iata] || (fallback || iata || '');
}

function mapFlyClaw(item) {
  const dep = fmtTime(item.scheduled_departure || item.actual_departure);
  const arr = fmtTime(item.scheduled_arrival || item.actual_arrival);
  const from = item.origin_iata || '';
  const to = item.destination_iata || '';

  return {
    airline: normalizeAirline(item.airline || 'N/A'),
    flight_number: item.flight_number || 'N/A',
    departure_airport: from,
    arrival_airport: to,
    departure_time: dep,
    arrival_time: arr,
    duration_min: item.duration_minutes || null,
    duration: item.duration_minutes ? toHm(item.duration_minutes) : '',
    stops: Number.isFinite(item.stops) ? item.stops : 0,
    layovers: [],
    segments: [
      {
        index: 1,
        airline: normalizeAirline(item.airline || ''),
        flight_number: item.flight_number || '',
        from,
        from_city: cityVi(from, item.origin_city),
        departure_time: dep,
        to,
        to_city: cityVi(to, item.destination_city),
        arrival_time: arr,
        duration_min: item.duration_minutes || null,
        duration_text: item.duration_minutes ? toHm(item.duration_minutes) : ''
      }
    ],
    raw_flights: [],
    price: Number(item.price) || null,
    price_currency: item.currency || 'VND',
    source: item.source || 'flyclaw'
  };
}

function extractJsonArray(mixedText) {
  const start = mixedText.indexOf('[');
  const end = mixedText.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return [];
  const jsonPart = mixedText.slice(start, end + 1);
  return JSON.parse(jsonPart);
}

function runFlyClaw({ from, to, date, returnDate }) {
  return new Promise((resolve, reject) => {
    const pyCmd = process.platform === 'win32' ? 'py' : 'python3';
    const args = [
      'flyclaw.py',
      'search',
      '--from', from,
      '--to', to,
      '--date', date,
      '-o', 'json'
    ];

    if (returnDate) {
      args.push('--return', returnDate);
    }

    const child = spawn(pyCmd, args, {
      cwd: FLYCLAW_DIR,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8'
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', d => (stdout += d.toString()));
    child.stderr.on('data', d => (stderr += d.toString()));

    child.on('error', err => reject(err));

    child.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`FlyClaw exited with code ${code}: ${stderr || stdout}`));
      }
      try {
        const parsed = extractJsonArray(stdout);
        resolve(parsed);
      } catch (e) {
        reject(new Error(`Không parse được output FlyClaw: ${e.message}`));
      }
    });
  });
}

app.get('/api/flights/live', async (req, res) => {
  const { from = 'HAN', to = 'SGN', date, returnDate = '' } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Thiếu tham số date (YYYY-MM-DD).' });
  }

  try {
    const raw = await runFlyClaw({ from, to, date, returnDate: String(returnDate).trim() });
    const flights = raw.map(mapFlyClaw).filter(f => f.price).sort((a, b) => a.price - b.price);

    res.json({
      source: 'flyclaw',
      from,
      to,
      date,
      returnDate: returnDate || null,
      tripType: returnDate ? 'roundtrip' : 'oneway',
      count: flights.length,
      flights
    });
  } catch (err) {
    res.status(500).json({
      error: 'Lỗi backend FlyClaw',
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`APG Flight Agent (FlyClaw backend) running at http://localhost:${PORT}`);
});

