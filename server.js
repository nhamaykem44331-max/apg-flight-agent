require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3030;
app.use(express.static(path.join(__dirname, 'public')));

function toHm(mins){
  if (typeof mins !== 'number' || Number.isNaN(mins)) return '';
  const h = Math.floor(mins/60), m = mins%60;
  return `${h}h ${String(m).padStart(2,'0')}m`;
}

function mapSerpApiFlight(f){
  const dep = f.flights?.[0] || {};
  const arr = f.flights?.[f.flights.length-1] || {};
  const segments = (f.flights || []).map((seg, idx)=>( {
    index: idx+1,
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
  const layovers = (f.layovers || []).map((l, idx)=>( {
    index: idx+1,
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

app.get('/api/flights/live', async (req,res)=>{
  const { from='HAN', to='SGN', date, returnDate='' } = req.query;
  const apiKey = process.env.SERPAPI_KEY;
  if(!date) return res.status(400).json({ error:'Thiếu tham số date (YYYY-MM-DD).' });
  if(!apiKey) return res.status(500).json({ error:'Thiếu SERPAPI_KEY trong .env' });

  const isRoundTrip = !!String(returnDate).trim();

  try{
    const params = {
      engine:'google_flights',
      departure_id: from,
      arrival_id: to,
      outbound_date: date,
      type: isRoundTrip ? 1 : 2,
      currency:'VND',
      hl:'vi',
      gl:'vn',
      api_key: apiKey
    };
    if(isRoundTrip) params.return_date = returnDate;

    const { data } = await axios.get('https://serpapi.com/search.json',{ params, timeout:30000 });
    const best = (data.best_flights || []).map(mapSerpApiFlight);
    const other = (data.other_flights || []).map(mapSerpApiFlight);
    const flights = [...best, ...other].filter(f=>f.price).sort((a,b)=>a.price-b.price);

    res.json({
      source:'google_flights_via_serpapi',
      from,to,date,returnDate: isRoundTrip ? returnDate : null,
      tripType: isRoundTrip ? 'roundtrip' : 'oneway',
      count: flights.length,
      flights
    });
  }catch(err){
    res.status(500).json({ error:'Lỗi khi gọi dữ liệu live', details: err.response?.data || err.message });
  }
});

app.listen(PORT, ()=> console.log(`APG Flight Agent running at http://localhost:${PORT}`));
