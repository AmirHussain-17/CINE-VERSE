

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const crypto  = require('crypto');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


const VIP_MEMBERS = [
  { vipId: 'VIP001', name: 'Arjun Sharma',   discount: 15 },
  { vipId: 'VIP002', name: 'Priya Gogoi',    discount: 15 },
  { vipId: 'VIP003', name: 'Rahul Das',      discount: 15 },
  { vipId: 'VIP004', name: 'Sneha Baruah',   discount: 15 },
  { vipId: 'VIP005', name: 'Amit Kalita',    discount: 15 },
  { vipId: 'VIP006', name: 'Deepika Borah',  discount: 15 },
  { vipId: 'VIP007', name: 'Rajesh Nath',    discount: 15 },
  { vipId: 'VIP008', name: 'Mousumi Deka',   discount: 15 },
];


const THEATERS = [
  {
    id: 1, name: 'PVR Cinemas — City Centre',
    location: 'MG Road, Guwahati', icon: '🏛️', screens: 5,
    movies: [
      { id: 101, title: 'Interstellar Returns', time: '10:30 AM', genre: 'Sci-Fi',   price: 220, rows: ['A','B','C','D','E','F'],      seatsPerRow: 12 },
      { id: 102, title: 'Dark Whispers',        time: '01:15 PM', genre: 'Thriller', price: 180, rows: ['A','B','C','D','E'],           seatsPerRow: 10 },
      { id: 103, title: 'The Last Horizon',     time: '06:45 PM', genre: 'Action',   price: 260, rows: ['A','B','C','D','E','F','G'],   seatsPerRow: 14 },
    ]
  },
  {
    id: 2, name: 'INOX — Fun Mall',
    location: 'GS Road, Guwahati', icon: '🎪', screens: 3,
    movies: [
      { id: 201, title: 'Cosmic Drift', time: '11:00 AM', genre: 'Adventure', price: 200, rows: ['A','B','C','D','E'],    seatsPerRow: 11 },
      { id: 202, title: 'Neon Phantom', time: '03:30 PM', genre: 'Action',    price: 240, rows: ['A','B','C','D','E','F'], seatsPerRow: 12 },
    ]
  },
  {
    id: 3, name: 'Carnival Cinemas — Bhangagarh',
    location: 'Bhangagarh, Guwahati', icon: '🎠', screens: 2,
    movies: [
      { id: 301, title: 'Midnight Garden', time: '09:45 AM', genre: 'Romance', price: 150, rows: ['A','B','C','D'],    seatsPerRow: 10 },
      { id: 302, title: 'Iron Sky 3',      time: '04:00 PM', genre: 'Sci-Fi',  price: 210, rows: ['A','B','C','D','E'], seatsPerRow: 12 },
    ]
  }
];




const seatStates = {};


const bookings = [];

const UPI_ID = 'cineverse@axisbank';


function initMovieSeats(movieId, rows, seatsPerRow) {
  if (!seatStates[movieId]) {
    seatStates[movieId] = {};
    rows.forEach(row => {
      for (let col = 1; col <= seatsPerRow; col++) {
        seatStates[movieId][row + col] = { status: 'available', sessionId: null, heldAt: null };
      }
    });
  }
}
THEATERS.forEach(t => t.movies.forEach(m => initMovieSeats(m.id, m.rows, m.seatsPerRow)));


setInterval(() => {
  const now = Date.now();
  Object.keys(seatStates).forEach(movieId => {
    Object.keys(seatStates[movieId]).forEach(seatId => {
      const s = seatStates[movieId][seatId];
      if (s.status === 'held' && s.heldAt && (now - s.heldAt) > 5 * 60 * 1000)
        seatStates[movieId][seatId] = { status: 'available', sessionId: null, heldAt: null };
    });
  });
}, 10000);

function getAvailableCount(movie) {
  const states = seatStates[movie.id];
  if (!states) return movie.rows.length * movie.seatsPerRow;
  return Object.values(states).filter(s => s.status === 'available').length;
}

function findMovie(movieId) {
  for (const t of THEATERS) {
    const m = t.movies.find(m => m.id === Number(movieId));
    if (m) return { movie: m, theater: t };
  }
  return null;
}

function makeId(prefix) {
  return prefix + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function calcPricing(basePrice, seatCount, isVip, discountPct) {
  const baseTotal      = basePrice * seatCount;
  const discountAmount = isVip ? Math.round(baseTotal * (discountPct / 100)) : 0;
  const finalTotal     = baseTotal - discountAmount;
  return { baseTotal, discountAmount, finalTotal };
}



// GET /api/theaters
app.get('/api/theaters', (req, res) => {
  res.json(THEATERS.map(t => ({
    ...t,
    movies: t.movies.map(m => ({
      ...m,
      availableSeats: getAvailableCount(m),
      totalSeats: m.rows.length * m.seatsPerRow
    }))
  })));
});

// POST /api/vip/verify  ─ validate VIP ID, return member info
app.post('/api/vip/verify', (req, res) => {
  const { vipId } = req.body;
  if (!vipId) return res.json({ valid: false, message: 'No VIP ID entered' });

  const member = VIP_MEMBERS.find(v => v.vipId === vipId.trim().toUpperCase());
  if (!member) return res.json({ valid: false, message: 'Invalid VIP ID. Please check and try again.' });

  res.json({ valid: true, member: { vipId: member.vipId, name: member.name, discount: member.discount } });
});

// GET /api/seats/:movieId
app.get('/api/seats/:movieId', (req, res) => {
  const { movieId } = req.params;
  const { sessionId } = req.query;
  const found = findMovie(movieId);
  if (!found) return res.status(404).json({ error: 'Movie not found' });

  const states = seatStates[found.movie.id];
  const seatMap = {};
  Object.keys(states).forEach(seatId => {
    let status = states[seatId].status;
    if (status === 'held' && states[seatId].sessionId === sessionId) status = 'selected';
    seatMap[seatId] = status;
  });

  res.json({
    movieId: found.movie.id, title: found.movie.title,
    rows: found.movie.rows, seatsPerRow: found.movie.seatsPerRow,
    price: found.movie.price, seatMap
  });
});

// POST /api/seats/hold
app.post('/api/seats/hold', (req, res) => {
  const { movieId, seatIds, sessionId } = req.body;
  if (!movieId || !seatIds || !sessionId)
    return res.status(400).json({ success: false, message: 'Missing fields' });

  const states = seatStates[movieId];
  if (!states) return res.status(404).json({ success: false, message: 'Movie not found' });

  const blocked = seatIds.filter(id => {
    const s = states[id];
    return !s || s.status === 'sold' || (s.status === 'held' && s.sessionId !== sessionId);
  });
  if (blocked.length)
    return res.json({ success: false, message: `Seats ${blocked.join(', ')} unavailable`, blocked });

  Object.keys(states).forEach(id => {
    if (states[id].status === 'held' && states[id].sessionId === sessionId)
      states[id] = { status: 'available', sessionId: null, heldAt: null };
  });
  seatIds.forEach(id => { states[id] = { status: 'held', sessionId, heldAt: Date.now() }; });

  res.json({ success: true, seatIds });
});

// POST /api/seats/release
app.post('/api/seats/release', (req, res) => {
  const { movieId, sessionId } = req.body;
  if (!movieId || !sessionId) return res.status(400).json({ success: false });
  const states = seatStates[movieId];
  if (!states) return res.status(404).json({ success: false });
  Object.keys(states).forEach(id => {
    if (states[id].status === 'held' && states[id].sessionId === sessionId)
      states[id] = { status: 'available', sessionId: null, heldAt: null };
  });
  res.json({ success: true });
});


app.post('/api/booking/confirm', (req, res) => {
  const { movieId, sessionId, seatIds, name, contact, contactType,
          isVip, vipId, vipMemberName, discount, payMethod, utrId } = req.body;

  if (!movieId || !sessionId || !seatIds || !name || !contact)
    return res.status(400).json({ success: false, message: 'Missing required fields' });

  const states = seatStates[movieId];
  if (!states) return res.status(404).json({ success: false, message: 'Movie not found' });

  const found = findMovie(movieId);
  if (!found) return res.status(404).json({ success: false, message: 'Movie not found' });

  const notHeld = seatIds.filter(id => {
    const s = states[id];
    return !s || s.status !== 'held' || s.sessionId !== sessionId;
  });
  if (notHeld.length)
    return res.json({ success: false, message: `Seats ${notHeld.join(', ')} expired. Re-select.` });

  seatIds.forEach(id => { states[id] = { status: 'sold', sessionId: null, heldAt: null }; });

  const { baseTotal, discountAmount, finalTotal } = calcPricing(
    found.movie.price, seatIds.length, !!isVip, discount || 0
  );

  const booking = {
    id: makeId('CV'),
    movieId: Number(movieId),
    movie: found.movie.title,
    theater: found.theater.name,
    time: found.movie.time,
    seats: seatIds,
    name, contact,
    contactType: contactType || 'email',
    isVip: !!isVip,
    vipId: vipId || null,
    vipMemberName: vipMemberName || null,
    discount: discount || 0,
    baseTotal, discountAmount, finalTotal,
    payMethod: payMethod || 'upi',
    utrId: utrId || null,
    date: new Date().toLocaleString('en-IN'),
    createdAt: Date.now(),
    status: 'confirmed',
    refund: null
  };

  bookings.unshift(booking);
  res.json({ success: true, booking });
});


app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

// POST /api/booking/cancel  ─ cancel booking, release seats, create refund record
app.post('/api/booking/cancel', (req, res) => {
  const { bookingId, reason } = req.body;
  if (!bookingId) return res.status(400).json({ success: false, message: 'Booking ID required' });

  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  if (booking.status !== 'confirmed')
    return res.json({ success: false, message: `Booking is already ${booking.status}` });

  // ── Release seats back to available ──
  const states = seatStates[booking.movieId];
  if (states) {
    booking.seats.forEach(seatId => {
      if (states[seatId] && states[seatId].status === 'sold')
        states[seatId] = { status: 'available', sessionId: null, heldAt: null };
    });
  }

  // ── Create refund record ──
  // Refund policy: full refund of amount paid
  booking.status = 'cancelled';
  booking.refund = {
    requestedAt: new Date().toLocaleString('en-IN'),
    reason: reason || 'Customer requested cancellation',
    refundAmount: booking.finalTotal,
    refundId: makeId('RFD'),
    refundStatus: 'pending'
  };

  // Simulate refund processing after 2 seconds (in production: call payment gateway API)
  setTimeout(() => {
    if (booking.refund && booking.refund.refundStatus === 'pending') {
      booking.refund.refundStatus = 'processed';
      booking.status = 'refunded';
      booking.refund.processedAt = new Date().toLocaleString('en-IN');
    }
  }, 2000);

  res.json({ success: true, booking });
});

// GET /api/upi
app.get('/api/upi', (req, res) => {
  res.json({ upiId: UPI_ID, name: 'CineVerse Cinemas' });
});

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ═══════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('\n  🎬  CineVerse Server Running');
  console.log(`  ➜   http://localhost:${PORT}\n`);
  console.log('  Demo VIP IDs (15% discount each):');
  VIP_MEMBERS.forEach(v => console.log(`    ${v.vipId}  →  ${v.name}`));
  console.log('');
});