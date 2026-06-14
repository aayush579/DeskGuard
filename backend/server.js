require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, initDB } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'deskguard-super-secret-key-12345';

// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
  };
}

// --- Auth Endpoints ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields (email, password, name, role) are required' });
  }

  if (role !== 'student' && role !== 'librarian') {
    return res.status(400).json({ error: 'Invalid role. Must be student or librarian' });
  }

  try {
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.createUser(email, passwordHash, role, name);
    
    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: { email: newUser.email, role: newUser.role, name: newUser.name }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { email: user.email, role: user.role, name: user.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// --- SSE Active Client Pool ---
let clients = [];

async function broadcastDeskUpdates() {
  try {
    const desks = await db.getAllDesks();
    const data = JSON.stringify(desks);
    clients.forEach(client => {
      client.res.write(`data: ${data}\n\n`);
    });
  } catch (err) {
    console.error('SSE broadcast error:', err);
  }
}

// --- Desks Endpoints ---
app.get('/api/desks/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Push initial state
  db.getAllDesks().then(desks => {
    res.write(`data: ${JSON.stringify(desks)}\n\n`);
  }).catch(console.error);

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

app.get('/api/desks', async (req, res) => {
  try {
    const desks = await db.getAllDesks();
    res.json(desks);
  } catch (err) {
    console.error('Fetch desks error:', err);
    res.status(500).json({ error: 'Failed to retrieve desks' });
  }
});

app.post('/api/desks/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, occupantName } = req.body;
  const now = Date.now();

  try {
    const desks = await db.getAllDesks();
    const desk = desks.find(d => d.id === id);

    if (!desk) {
      return res.status(404).json({ error: 'Desk not found' });
    }

    let updatedStatus = status;
    let updatedOccupant = occupantName || req.user.name || 'You';
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

    const updated = await db.updateDeskStatus(
      id,
      updatedStatus,
      updatedOccupant,
      updatedLastCheckIn,
      updatedAwayUntil
    );

    // Broadcast change
    broadcastDeskUpdates();

    res.json(updated);
  } catch (err) {
    console.error('Update desk status error:', err);
    res.status(500).json({ error: 'Failed to update desk status' });
  }
});

app.post('/api/desks/:id/reset', authenticateToken, requireRole('librarian'), async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db.resetDesk(id);
    if (!updated) {
      return res.status(404).json({ error: 'Desk not found' });
    }

    // Broadcast change
    broadcastDeskUpdates();

    res.json(updated);
  } catch (err) {
    console.error('Reset desk error:', err);
    res.status(500).json({ error: 'Failed to reset desk' });
  }
});

// --- Seeding Test Credentials on Startup ---
async function seedDefaultUsers() {
  try {
    // Seed default librarian
    const librarianEmail = 'admin@library.edu';
    const existingLibrarian = await db.getUserByEmail(librarianEmail);
    if (!existingLibrarian) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('AdminPass123!', salt);
      await db.createUser(librarianEmail, hash, 'librarian', 'Chief Librarian');
      console.log('Seeded default Librarian account.');
    }

    // Seed default student
    const studentEmail = 'student@university.edu';
    const existingStudent = await db.getUserByEmail(studentEmail);
    if (!existingStudent) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('StudentPass123!', salt);
      await db.createUser(studentEmail, hash, 'student', 'Test Student');
      console.log('Seeded default Student account.');
    }
  } catch (err) {
    console.error('Error seeding test accounts:', err);
  }
}

// --- Start Server & Init DB ---
const PORT = process.env.PORT || 5000;
initDB().then(async () => {
  await seedDefaultUsers();
  
  // Background sweeper auto-expiring away desks every 10s
  setInterval(async () => {
    const now = Date.now();
    try {
      const expiredIds = await db.sweepExpiredAwayDesks(now);
      if (expiredIds.length > 0) {
        console.log(`Sweeper auto-freed expired desks: ${expiredIds.join(', ')}`);
        broadcastDeskUpdates(); // Broadcast updates dynamically
      }
    } catch (err) {
      console.error('Sweeper error:', err);
    }
  }, 10000);

  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
});
