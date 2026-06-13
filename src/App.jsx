import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ShieldCheck, LogOut, User, Key, BookOpen, LayoutDashboard, Table2, Mail, Lock } from 'lucide-react';
import StudentView from './pages/StudentView';
import LibrarianDashboard from './pages/LibrarianDashboard';

/* ─── Deterministic mock data ─────────────────────────────────── */
const ZONES = ['Quiet Zone', 'Group Study', 'Computer Lab', 'Reading Area'];
const OCCUPANTS = [
  'Anika Sharma', 'Rohan Mehta', 'Priya Patel', 'Arjun Desai',
  'Kavya Iyer', 'Nikhil Verma', 'Sneha Reddy', 'Vikram Rao',
  'Meera Nair', 'Siddharth Joshi', 'Tanvi Kulkarni',
];

const buildInitialDesks = () => {
  const now = Date.now();
  const occupiedIds = [2, 5, 8, 10, 13, 16, 19, 22];
  const awayIds = [4, 11, 17];
  let occIdx = 0;

  return Array.from({ length: 24 }, (_, i) => {
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
};

/* ─── Sidebar ─────────────────────────────────────────────────── */
function Sidebar({ userRole, onLogout }) {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <ShieldCheck size={22} color="var(--accent)" />
        <h1>DeskGuard</h1>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>

        {userRole === 'student' && (
          <Link to="/" className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}>
            <BookOpen size={18} />
            <span>Find a Desk</span>
          </Link>
        )}

        {userRole === 'librarian' && (
          <>
            <Link to="/admin" className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="avatar">
          {userRole === 'student' ? 'ST' : 'LB'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userRole === 'student' ? 'Student User' : 'Librarian'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
            {userRole === 'student' ? 'student@university.edu' : 'admin@library.edu'}
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-ghost" style={{ padding: '0.375rem' }} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

/* ─── Login ───────────────────────────────────────────────────── */
function Login({ onLogin }) {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(role);
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-header">
          <ShieldCheck size={40} color="var(--accent)" />
          <h1>DeskGuard</h1>
          <p>Library Seat Management System</p>
        </div>

        <div className="role-selector">
          <button type="button" className={`role-option ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
            <User size={14} /> Student
          </button>
          <button type="button" className={`role-option ${role === 'librarian' ? 'active' : ''}`} onClick={() => setRole('librarian')}>
            <Key size={14} /> Librarian
          </button>
        </div>

        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="input-field" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" className="input-field" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.625rem', marginTop: '0.5rem' }}>
          Sign In
        </button>

        <div className="login-footer">
          Demo Mode — Any credentials will work
        </div>
      </form>
    </div>
  );
}

/* ─── App ─────────────────────────────────────────────────────── */
function App() {
  const [userRole, setUserRole] = useState(() => localStorage.getItem('deskguard_role') || null);
  const [desks, setDesks] = useState(() => {
    const saved = localStorage.getItem('deskguard_desks_v2');
    return saved ? JSON.parse(saved) : buildInitialDesks();
  });

  useEffect(() => {
    localStorage.setItem('deskguard_desks_v2', JSON.stringify(desks));
  }, [desks]);

  useEffect(() => {
    if (userRole) localStorage.setItem('deskguard_role', userRole);
    else localStorage.removeItem('deskguard_role');
  }, [userRole]);

  /* Server-side sweeper simulation: auto-free expired away desks every 10s */
  useEffect(() => {
    const interval = setInterval(() => {
      setDesks(cur => {
        const now = Date.now();
        let changed = false;
        const updated = cur.map(d => {
          if (d.status === 'away' && d.awayUntil && now > d.awayUntil) {
            changed = true;
            return { ...d, status: 'free', occupantName: null, lastCheckIn: null, awayUntil: null };
          }
          return d;
        });
        return changed ? updated : cur;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateDeskStatus = (id, newStatus, occupantName) => {
    setDesks(desks.map(d => {
      if (d.id !== id) return d;
      const now = Date.now();
      if (newStatus === 'free') return { ...d, status: 'free', occupantName: null, lastCheckIn: null, awayUntil: null };
      if (newStatus === 'away') return { ...d, status: 'away', awayUntil: now + 20 * 60000 };
      return { ...d, status: 'occupied', occupantName: occupantName || d.occupantName || 'You', lastCheckIn: d.lastCheckIn || now, awayUntil: null };
    }));
  };

  const resetDesk = (id) => {
    setDesks(desks.map(d => d.id === id ? { ...d, status: 'free', occupantName: null, lastCheckIn: null, awayUntil: null } : d));
  };

  if (!userRole) {
    return (
      <BrowserRouter>
        <Login onLogin={setUserRole} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar userRole={userRole} onLogout={() => setUserRole(null)} />
        <main className="main-content">
          <Routes>
            {userRole === 'student' && (
              <>
                <Route path="/" element={<StudentView desks={desks} updateDeskStatus={updateDeskStatus} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
            {userRole === 'librarian' && (
              <>
                <Route path="/admin" element={<LibrarianDashboard desks={desks} resetDesk={resetDesk} />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
