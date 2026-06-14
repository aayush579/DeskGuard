const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const isPostgres = !!process.env.DATABASE_URL;
let pool = null;

if (isPostgres) {
  console.log('Database Mode: Supabase PostgreSQL');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
  });
} else {
  console.log('Database Mode: Local Filesystem JSON Fallback (No DATABASE_URL found)');
}

const jsonDbPath = path.join(__dirname, 'deskguard_db.json');

// --- Helper for JSON Fallback mode ---
function readJSON() {
  if (!fs.existsSync(jsonDbPath)) {
    return seedJSONData();
  }
  try {
    const data = JSON.parse(fs.readFileSync(jsonDbPath, 'utf8'));
    if (Array.isArray(data)) {
      // Migrate old array format
      const migrated = { users: [], desks: data };
      writeJSON(migrated);
      return migrated;
    }
    if (!data.users || !data.desks) {
      return seedJSONData();
    }
    return data;
  } catch (error) {
    console.error('Failed to parse database JSON, reseeding:', error);
    return seedJSONData();
  }
}

function writeJSON(data) {
  fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2), 'utf8');
}

function seedJSONData() {
  const ZONES = ['Quiet Zone', 'Group Study', 'Computer Lab', 'Reading Area'];
  const initialDesks = Array.from({ length: 24 }, (_, i) => {
    const num = i + 1;
    const id = `D${num}`;
    return {
      id,
      label: id,
      zone: ZONES[i % ZONES.length],
      status: 'free',
      occupant_name: null,
      last_check_in: null,
      away_until: null
    };
  });
  writeJSON({ users: [], desks: initialDesks });
  return { users: [], desks: initialDesks };
}

// --- Initialize Database Schema ---
async function initDB() {
  if (isPostgres) {
    try {
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL
        )
      `);

      // Create desks table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS desks (
          id VARCHAR(50) PRIMARY KEY,
          label VARCHAR(50),
          zone VARCHAR(100),
          status VARCHAR(50) DEFAULT 'free',
          occupant_name VARCHAR(255),
          last_check_in BIGINT,
          away_until BIGINT
        )
      `);

      // Seed desks in Postgres if empty
      const res = await pool.query('SELECT COUNT(*) FROM desks');
      if (parseInt(res.rows[0].count, 10) === 0) {
        const ZONES = ['Quiet Zone', 'Group Study', 'Computer Lab', 'Reading Area'];
        for (let i = 0; i < 24; i++) {
          const num = i + 1;
          const id = `D${num}`;
          await pool.query(
            'INSERT INTO desks (id, label, zone, status) VALUES ($1, $2, $3, $4)',
            [id, id, ZONES[i % ZONES.length], 'free']
          );
        }
        console.log('Seeded Supabase PostgreSQL desks table.');
      }
    } catch (err) {
      console.error('Failed to initialize Postgres Database:', err);
    }
  } else {
    // Check/seed JSON file
    readJSON();
  }
}

// --- API queries abstraction ---
const db = {
  // Users Queries
  getUserByEmail: async (email) => {
    if (isPostgres) {
      const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return res.rows[0] || null;
    } else {
      const store = readJSON();
      return store.users.find(u => u.email === email) || null;
    }
  },

  createUser: async (email, passwordHash, role, name) => {
    if (isPostgres) {
      const res = await pool.query(
        'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, passwordHash, role, name]
      );
      return res.rows[0];
    } else {
      const store = readJSON();
      const newUser = { id: Date.now(), email, password_hash: passwordHash, role, name };
      store.users.push(newUser);
      writeJSON(store);
      return newUser;
    }
  },

  // Desks Queries
  getAllDesks: async () => {
    if (isPostgres) {
      const res = await pool.query('SELECT * FROM desks ORDER BY id');
      // Map database row keys to camelCase if needed, or keep lowercase. We'll map last_check_in and away_until to camelCase for the frontend if needed.
      return res.rows.map(r => ({
        id: r.id,
        label: r.label,
        zone: r.zone,
        status: r.status,
        occupantName: r.occupant_name,
        lastCheckIn: r.last_check_in ? Number(r.last_check_in) : null,
        awayUntil: r.away_until ? Number(r.away_until) : null
      }));
    } else {
      const store = readJSON();
      return store.desks.map(r => ({
        id: r.id,
        label: r.label,
        zone: r.zone,
        status: r.status,
        occupantName: r.occupant_name,
        lastCheckIn: r.last_check_in,
        awayUntil: r.away_until
      }));
    }
  },

  updateDeskStatus: async (id, status, occupantName, lastCheckIn, awayUntil) => {
    if (isPostgres) {
      const res = await pool.query(
        `UPDATE desks 
         SET status = $1, occupant_name = $2, last_check_in = $3, away_until = $4
         WHERE id = $5
         RETURNING *`,
        [status, occupantName, lastCheckIn, awayUntil, id]
      );
      const r = res.rows[0];
      if (!r) return null;
      return {
        id: r.id,
        label: r.label,
        zone: r.zone,
        status: r.status,
        occupantName: r.occupant_name,
        lastCheckIn: r.last_check_in ? Number(r.last_check_in) : null,
        awayUntil: r.away_until ? Number(r.away_until) : null
      };
    } else {
      const store = readJSON();
      const deskIndex = store.desks.findIndex(d => d.id === id);
      if (deskIndex === -1) return null;
      const updated = {
        ...store.desks[deskIndex],
        status,
        occupant_name: occupantName,
        last_check_in: lastCheckIn,
        away_until: awayUntil
      };
      store.desks[deskIndex] = updated;
      writeJSON(store);
      return {
        id: updated.id,
        label: updated.label,
        zone: updated.zone,
        status: updated.status,
        occupantName: updated.occupant_name,
        lastCheckIn: updated.last_check_in,
        awayUntil: updated.away_until
      };
    }
  },

  resetDesk: async (id) => {
    if (isPostgres) {
      const res = await pool.query(
        `UPDATE desks 
         SET status = 'free', occupant_name = NULL, last_check_in = NULL, away_until = NULL
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      const r = res.rows[0];
      if (!r) return null;
      return {
        id: r.id,
        label: r.label,
        zone: r.zone,
        status: r.status,
        occupantName: r.occupant_name,
        lastCheckIn: r.last_check_in ? Number(r.last_check_in) : null,
        awayUntil: r.away_until ? Number(r.away_until) : null
      };
    } else {
      const store = readJSON();
      const deskIndex = store.desks.findIndex(d => d.id === id);
      if (deskIndex === -1) return null;
      const updated = {
        ...store.desks[deskIndex],
        status: 'free',
        occupant_name: null,
        last_check_in: null,
        away_until: null
      };
      store.desks[deskIndex] = updated;
      writeJSON(store);
      return {
        id: updated.id,
        label: updated.label,
        zone: updated.zone,
        status: updated.status,
        occupantName: updated.occupant_name,
        lastCheckIn: updated.last_check_in,
        awayUntil: updated.away_until
      };
    }
  },

  sweepExpiredAwayDesks: async (now) => {
    if (isPostgres) {
      const res = await pool.query(
        `UPDATE desks 
         SET status = 'free', occupant_name = NULL, last_check_in = NULL, away_until = NULL 
         WHERE status = 'away' AND away_until IS NOT NULL AND $1 > away_until
         RETURNING id`,
        [now]
      );
      return res.rows.map(r => r.id);
    } else {
      const store = readJSON();
      const expiredIds = [];
      store.desks = store.desks.map(d => {
        if (d.status === 'away' && d.away_until && now > d.away_until) {
          expiredIds.push(d.id);
          return { ...d, status: 'free', occupant_name: null, last_check_in: null, away_until: null };
        }
        return d;
      });
      if (expiredIds.length > 0) {
        writeJSON(store);
      }
      return expiredIds;
    }
  }
};

module.exports = { db, initDB };
