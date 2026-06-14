import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ShieldCheck, LogOut, User, Key, BookOpen, LayoutDashboard, Volume2, Users } from 'lucide-react';
import StudentView from './pages/StudentView';
import LibrarianDashboard from './pages/LibrarianDashboard';

/* ─── Sidebar ─────────────────────────────────────────────────── */
function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const role = user?.role || 'student';
  const name = user?.name || 'User';
  const email = user?.email || '';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <ShieldCheck size={22} color="var(--accent)" />
        <h1>DeskGuard</h1>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navigation</span>

        {role === 'student' && (
          <Link to="/" className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}>
            <BookOpen size={18} />
            <span>Find a Desk</span>
          </Link>
        )}

        {role === 'librarian' && (
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
          {role === 'student' ? 'ST' : 'LB'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email}
          </div>
        </div>
        <button onClick={onLogout} className="btn btn-ghost" style={{ padding: '0.375rem' }} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

/* ─── Login & Register ─────────────────────────────────────────── */
function AuthScreen({ onAuthSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegistering 
      ? { email, password, name, role }
      : { email, password };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-header">
          <ShieldCheck size={40} color="var(--accent)" />
          <h1>DeskGuard</h1>
          <p>Library Seat Management System</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fee2e2',
            padding: '0.75rem',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        {isRegistering && (
          <div className="role-selector" style={{ marginBottom: '1rem' }}>
            <button type="button" className={`role-option ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
              <User size={14} /> Student
            </button>
            <button type="button" className={`role-option ${role === 'librarian' ? 'active' : ''}`} onClick={() => setRole('librarian')}>
              <Key size={14} /> Librarian
            </button>
          </div>
        )}

        {isRegistering && (
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" className="input-field" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}

        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="input-field" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.625rem', marginTop: '0.5rem' }} disabled={loading}>
          {loading ? 'Processing...' : isRegistering ? 'Create Account' : 'Sign In'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {isRegistering ? (
            <>
              Already have an account?{' '}
              <button type="button" className="btn-link" onClick={() => setIsRegistering(false)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                Sign In
              </button>
            </>
          ) : (
            <>
              New to DeskGuard?{' '}
              <button type="button" className="btn-link" onClick={() => setIsRegistering(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                Create Account
              </button>
            </>
          )}
        </div>

        {!isRegistering && (
          <div className="login-footer" style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            <strong>Demo Accounts:</strong><br />
            Librarian: admin@library.edu / AdminPass123!<br />
            Student: student@university.edu / StudentPass123!
          </div>
        )}
      </form>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ─── App ─────────────────────────────────────────────────────── */
function App() {
  const [token, setToken] = useState(() => localStorage.getItem('deskguard_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('deskguard_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [desks, setDesks] = useState([]);
  const [error, setError] = useState(null);

  // Fetch desks helper
  const fetchDesks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/desks`);
      if (!res.ok) throw new Error('Failed to fetch desks');
      const data = await res.json();
      setDesks(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Connection to server lost. Retrying...');
    }
  };

  // Poll for updates from the backend
  useEffect(() => {
    fetchDesks();
    const interval = setInterval(fetchDesks, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('deskguard_token', newToken);
    localStorage.setItem('deskguard_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('deskguard_token');
    localStorage.removeItem('deskguard_user');
  };

  const updateDeskStatus = async (id, newStatus, occupantName) => {
    try {
      const res = await fetch(`${API_BASE}/api/desks/${id}/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, occupantName }),
      });
      
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      
      if (!res.ok) throw new Error('Failed to update desk status');
      const updatedDesk = await res.json();
      setDesks(prev => prev.map(d => d.id === id ? updatedDesk : d));
    } catch (err) {
      console.error(err);
      alert('Error updating desk status. Please check server connection.');
    }
  };

  const resetDesk = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/desks/${id}/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        alert('Authentication failed or access denied.');
        if (res.status === 401) handleLogout();
        return;
      }

      if (!res.ok) throw new Error('Failed to reset desk');
      const updatedDesk = await res.json();
      setDesks(prev => prev.map(d => d.id === id ? updatedDesk : d));
    } catch (err) {
      console.error(err);
      alert('Error resetting desk. Please check server connection.');
    }
  };

  if (!token || !user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const userRole = user.role;

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="main-content">
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fee2e2',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}
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
