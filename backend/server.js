const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'deskguard_db.json');

// Helper to read database
function readDB() {
  try {
    if (!fs.existsSync(dbPath)) {
      return seedInitialData();
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB, re-seeding:', error);
    return seedInitialData();
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to DB:', error);
  }
}

// Seed initial data
function seedInitialData() {
  const ZONES = ['Quiet Zone', 'Group Study', 'Computer Lab', 'Reading Area'];
  const OCCUPANTS = [
    'Anika Sharma', 'Rohan Mehta', 'Priya Patel', 'Arjun Desai',
    'Kavya Iyer', 'Nikhil Verma', 'Sneha Reddy', 'Vikram Rao',
    'Meera Nair', 'Siddharth Joshi', 'Tanvi Kulkarni'
  ];

  const now = Date.now();
  const occupiedIds = [2, 5, 8, 10, 13, 16, 19, 22];
  const awayIds = [4, 11, 17];
  let occIdx = 0;

  const initialDesks = Array.from({ length: 24 }, (_, i) => {
    const num = i + 1;
    const id = `D${num}`;
    const zone = ZONES[i % ZONES.length];
    let status = 'free';
    let occupantName = null;
    let lastCheckIn = null;
    let awayUntil = null;

    if (occupiedIds.includes(num)) {
      status = 'occupied';
      occupantName = OCCUPANTS[occIdx % OCCUPANTS.length];
      lastCheckIn = now - (15 + occIdx * 18) * 60000;
      occIdx++;
    } else if (awayIds.includes(num)) {
      status = 'away';
      occupantName = OCCUPANTS[(occIdx + 5) % OCCUPANTS.length];
      lastCheckIn = now - (30 + occIdx * 12) * 60000;
      awayUntil = now + (5 + occIdx * 4) * 60000;
      occIdx++;
    }

    return { id, label: id, zone, status, occupantName, lastCheckIn, awayUntil };
  });

  writeDB(initialDesks);
  console.log('Seeded database with initial desks.');
  return initialDesks;
}

// Background sweep job every 10 seconds to auto-expire away timers
setInterval(() => {
  const now = Date.now();
  const desks = readDB();
  let changed = false;

  const updatedDesks = desks.map(d => {
    if (d.status === 'away' && d.awayUntil && now > d.awayUntil) {
      changed = true;
      console.log(`Sweeper auto-freed desk ${d.id} (Away timer expired)`);
      return { ...d, status: 'free', occupantName: null, lastCheckIn: null, awayUntil: null };
    }
    return d;
  });

  if (changed) {
    writeDB(updatedDesks);
  }
}, 10000);

// API Endpoints
app.get('/api/desks', (req, res) => {
  res.json(readDB());
});

app.post('/api/desks/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, occupantName } = req.body;
  const now = Date.now();
  const desks = readDB();

  const deskIndex = desks.findIndex(d => d.id === id);
  if (deskIndex === -1) {
    return res.status(404).json({ error: 'Desk not found' });
  }

  const desk = desks[deskIndex];
  let updatedStatus = status;
  let updatedOccupant = occupantName || desk.occupantName || 'You';
  let updatedLastCheckIn = desk.lastCheckIn || now;
  let updatedAwayUntil = null;

  if (status === 'free') {
    updatedStatus = 'free';
    updatedOccupant = null;
    updatedLastCheckIn = null;
    updatedAwayUntil = null;
  } else if (status === 'away') {
    updatedStatus = 'away';
    updatedAwayUntil = now + 20 * 60000; // 20 minutes
  } else if (status === 'occupied') {
    updatedStatus = 'occupied';
    updatedAwayUntil = null;
  }

  const updatedDesk = {
    ...desk,
    status: updatedStatus,
    occupantName: updatedOccupant,
    lastCheckIn: updatedLastCheckIn,
    awayUntil: updatedAwayUntil
  };

  desks[deskIndex] = updatedDesk;
  writeDB(desks);

  res.json(updatedDesk);
});

app.post('/api/desks/:id/reset', (req, res) => {
  const { id } = req.params;
  const desks = readDB();

  const deskIndex = desks.findIndex(d => d.id === id);
  if (deskIndex === -1) {
    return res.status(404).json({ error: 'Desk not found' });
  }

  const updatedDesk = {
    ...desks[deskIndex],
    status: 'free',
    occupantName: null,
    lastCheckIn: null,
    awayUntil: null
  };

  desks[deskIndex] = updatedDesk;
  writeDB(desks);

  res.json(updatedDesk);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
