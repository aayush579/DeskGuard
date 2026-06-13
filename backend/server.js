const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'deskguard.db');
const db = new Database(dbPath);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS desks (
    id TEXT PRIMARY KEY,
    label TEXT,
    zone TEXT,
    status TEXT,
    occupantName TEXT,
    lastCheckIn INTEGER,
    awayUntil INTEGER
  )
`);

// Seed initial data if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM desks');
const { count } = countStmt.get();

if (count === 0) {
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

  const insert = db.prepare(`
    INSERT INTO desks (id, label, zone, status, occupantName, lastCheckIn, awayUntil)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < 24; i++) {
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

    insert.run(id, id, zone, status, occupantName, lastCheckIn, awayUntil);
  }
  console.log('Seeded database with initial desks.');
}

// Background sweep job every 10 seconds to auto-expire away timers
setInterval(() => {
  const now = Date.now();
  const stmt = db.prepare(`
    UPDATE desks 
    SET status = 'free', occupantName = NULL, lastCheckIn = NULL, awayUntil = NULL 
    WHERE status = 'away' AND awayUntil IS NOT NULL AND ? > awayUntil
  `);
  const info = stmt.run(now);
  if (info.changes > 0) {
    console.log(`Sweeper auto-freed ${info.changes} expired away desks.`);
  }
}, 10000);

// API Endpoints
app.get('/api/desks', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM desks');
    const desks = stmt.all();
    res.json(desks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/desks/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, occupantName } = req.body;
  const now = Date.now();

  try {
    const getDesk = db.prepare('SELECT * FROM desks WHERE id = ?');
    const desk = getDesk.get(id);

    if (!desk) {
      return res.status(404).json({ error: 'Desk not found' });
    }

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

    const update = db.prepare(`
      UPDATE desks 
      SET status = ?, occupantName = ?, lastCheckIn = ?, awayUntil = ?
      WHERE id = ?
    `);
    update.run(updatedStatus, updatedOccupant, updatedLastCheckIn, updatedAwayUntil, id);

    const updatedDesk = getDesk.get(id);
    res.json(updatedDesk);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/desks/:id/reset', (req, res) => {
  const { id } = req.params;
  try {
    const update = db.prepare(`
      UPDATE desks 
      SET status = 'free', occupantName = NULL, lastCheckIn = NULL, awayUntil = NULL
      WHERE id = ?
    `);
    update.run(id);
    const getDesk = db.prepare('SELECT * FROM desks WHERE id = ?');
    const desk = getDesk.get(id);
    res.json(desk);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
