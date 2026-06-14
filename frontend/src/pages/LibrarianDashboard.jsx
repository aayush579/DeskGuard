import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Activity,
  Clock,
  UserCheck,
  UserMinus,
  Timer,
  QrCode,
  Printer,
  X,
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────────────── */

const pct = (part, total) =>
  total === 0 ? 0 : Math.round((part / total) * 100);

const timeAgo = (ts) => {
  if (!ts) return '—';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const badgeClass = (status) => {
  if (status === 'free') return 'badge badge-free';
  if (status === 'away') return 'badge badge-away';
  return 'badge badge-occupied';
};

const statusLabel = (status) => {
  if (status === 'free') return 'Available';
  if (status === 'away') return 'Away';
  return 'Occupied';
};

/* ─── mock activity generator ─────────────────────────────────────── */

const ACTIVITY_TEMPLATES = [
  { verb: 'checked into', icon: <UserCheck size={14} />, color: 'var(--status-free, #34d399)' },
  { verb: 'marked away at', icon: <Timer size={14} />, color: 'var(--status-away, #fbbf24)' },
  { verb: 'auto-freed (timeout) —', icon: <AlertTriangle size={14} />, color: 'var(--status-occupied, #f87171)' },
  { verb: 'checked out of', icon: <UserMinus size={14} />, color: 'var(--text-muted, #94a3b8)' },
];

const SAMPLE_NAMES = [
  'Anika Sharma',
  'Rohan Mehta',
  'Priya Patel',
  'Arjun Desai',
  'Kavya Iyer',
  'Nikhil Verma',
  'Sneha Reddy',
  'Vikram Rao',
];

function buildActivityFeed(desks) {
  const entries = [];
  const now = Date.now();

  /* pull real occupied / away desks for realistic entries */
  const occupied = desks.filter((d) => d.status === 'occupied');
  const away = desks.filter((d) => d.status === 'away');
  const free = desks.filter((d) => d.status === 'free');

  occupied.slice(0, 2).forEach((d, i) => {
    entries.push({
      id: `occ-${d.id}`,
      text: `${d.occupantName || SAMPLE_NAMES[i]} checked into ${d.label || d.id}`,
      time: d.lastCheckIn || now - (12 + i * 18) * 60000,
      ...ACTIVITY_TEMPLATES[0],
    });
  });

  away.slice(0, 2).forEach((d, i) => {
    entries.push({
      id: `away-${d.id}`,
      text: `${d.occupantName || SAMPLE_NAMES[2 + i]} marked away at ${d.label || d.id}`,
      time: d.lastCheckIn || now - (25 + i * 14) * 60000,
      ...ACTIVITY_TEMPLATES[1],
    });
  });

  free.slice(0, 2).forEach((d, i) => {
    entries.push({
      id: `free-${d.id}`,
      text: `${d.label || d.id} auto-freed (timeout)`,
      time: now - (38 + i * 22) * 60000,
      ...ACTIVITY_TEMPLATES[2],
    });
  });

  /* fill remaining slots with generic past events */
  const extraNames = SAMPLE_NAMES.slice(4);
  extraNames.slice(0, 2).forEach((name, i) => {
    const deskRef = desks[Math.min(desks.length - 1, 3 + i)];
    entries.push({
      id: `gen-${i}`,
      text: `${name} checked out of ${deskRef?.label || deskRef?.id || `D${i + 7}`}`,
      time: now - (60 + i * 30) * 60000,
      ...ACTIVITY_TEMPLATES[3],
    });
  });

  return entries.sort((a, b) => b.time - a.time).slice(0, 8);
}

/* ─── sub-components ──────────────────────────────────────────────── */

function StatCard({ label, value, total, accentColor }) {
  const percentage = pct(value, total);
  return (
    <div className="stat-card">
      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1, color: accentColor || 'var(--text-main, #e2e8f0)', marginTop: '0.25rem' }}>
        {value}
      </span>
      <div style={{ marginTop: '0.5rem', width: '100%' }}>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              borderRadius: 2,
              background: accentColor || 'var(--text-main, #e2e8f0)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', marginTop: '0.25rem', display: 'inline-block' }}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}

function FilterBar({ active, onChange }) {
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'free', label: 'Available' },
    { key: 'occupied', label: 'Occupied' },
    { key: 'away', label: 'Away' },
  ];

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {filters.map((f) => (
        <button
          key={f.key}
          className={active === f.key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          onClick={() => onChange(f.key)}
          style={{ fontSize: '0.8rem' }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────── */

export default function LibrarianDashboard({ desks, resetDesk }) {
  const [filter, setFilter] = useState('all');
  const [showQRModal, setShowQRModal] = useState(false);

  const counts = useMemo(() => {
    const total = desks.length;
    const free = desks.filter((d) => d.status === 'free').length;
    const occupied = desks.filter((d) => d.status === 'occupied').length;
    const away = desks.filter((d) => d.status === 'away').length;
    return { total, free, occupied, away };
  }, [desks]);

  const filteredDesks = useMemo(
    () => (filter === 'all' ? desks : desks.filter((d) => d.status === filter)),
    [desks, filter],
  );

  const activityFeed = useMemo(() => buildActivityFeed(desks), [desks]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── page header ──────────────────────────────────────────── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Dashboard</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>
            Monitor and manage library desk occupancy
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowQRModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <QrCode size={16} />
          <span>Generate QR Labels</span>
        </button>
      </div>

      {/* ── stats row ────────────────────────────────────────────── */}
      <div className="metric-row">
        <StatCard label="Total Desks" value={counts.total} total={counts.total} accentColor="var(--text-main, #e2e8f0)" />
        <StatCard label="Available" value={counts.free} total={counts.total} accentColor="var(--status-free, #34d399)" />
        <StatCard label="Occupied" value={counts.occupied} total={counts.total} accentColor="var(--status-occupied, #f87171)" />
        <StatCard label="Away" value={counts.away} total={counts.total} accentColor="var(--status-away, #fbbf24)" />
      </div>

      {/* ── activity feed ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 58%', minWidth: 320 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={16} style={{ color: 'var(--text-muted, #94a3b8)' }} />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Recent Activity</h2>
          </div>

          <div className="divider" />

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
            {activityFeed.map((entry) => (
              <li
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span
                  style={{
                    marginTop: 3,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: entry.color,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main, #e2e8f0)' }}>
                    {entry.text}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                    <Clock size={11} style={{ color: 'var(--text-muted, #94a3b8)' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {timeAgo(entry.time)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── quick summary side panel ───────────────────────────── */}
        <div className="card" style={{ flex: '1 1 36%', minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={16} style={{ color: 'var(--status-away, #fbbf24)' }} />
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Alerts</h2>
          </div>

          <div className="divider" />

          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {desks
              .filter((d) => d.status === 'away' && d.awayUntil && d.awayUntil < Date.now())
              .map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 8,
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.15)',
                  }}
                >
                  <Timer size={14} style={{ color: 'var(--status-away, #fbbf24)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-main, #e2e8f0)' }}>
                    <strong>{d.label || d.id}</strong> — away timer expired
                  </span>
                </div>
              ))}

            {desks.filter((d) => d.status === 'away' && d.awayUntil && d.awayUntil < Date.now()).length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
                No alerts right now — all clear.
              </p>
            )}

            {/* occupancy tip */}
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                fontSize: '0.78rem',
                color: 'var(--text-muted, #94a3b8)',
                lineHeight: 1.5,
              }}
            >
              Occupancy is at{' '}
              <strong style={{ color: 'var(--text-main, #e2e8f0)' }}>
                {pct(counts.occupied + counts.away, counts.total)}%
              </strong>
              . {counts.free} desk{counts.free !== 1 ? 's' : ''} available.
            </div>
          </div>
        </div>
      </div>

      {/* ── desk management table ────────────────────────────────── */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>All Desks</h2>
          <FilterBar active={filter} onChange={setFilter} />
        </div>

        <div className="divider" />

        <div className="table-container" style={{ marginTop: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                {['Desk ID', 'Zone', 'Status', 'Occupant', 'Checked In', 'Actions'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '0.75rem 1rem',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted, #94a3b8)',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDesks.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      padding: '2rem 1rem',
                      color: 'var(--text-muted, #94a3b8)',
                      fontSize: '0.85rem',
                    }}
                  >
                    No desks match this filter.
                  </td>
                </tr>
              )}
              {filteredDesks.map((desk) => (
                <tr
                  key={desk.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.85rem' }}>
                    {desk.label || desk.id}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                    {desk.zone || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={badgeClass(desk.status)}>{statusLabel(desk.status)}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                    {desk.occupantName || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                    {desk.lastCheckIn ? timeAgo(desk.lastCheckIn) : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={desk.status === 'free'}
                      onClick={() => resetDesk(desk.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
                    >
                      <RotateCcw size={13} />
                      Force Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── QR CODE LABELS PRINT PREVIEW MODAL ───────────────────── */}
      {showQRModal && (
        <div className="qr-modal-overlay">
          <div className="qr-modal-card">
            <div className="qr-modal-header no-print">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Print Desk QR Labels</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  A4 grid layout formatted for printable adhesive labels.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Printer size={15} /> Print Labels
                </button>
                <button className="btn btn-ghost" onClick={() => setShowQRModal(false)} style={{ padding: '0.5rem' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="qr-labels-print-area">
              <div className="qr-labels-grid">
                {desks.map(desk => {
                  const checkInUrl = `${window.location.origin}/?desk=${desk.id}`;
                  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(checkInUrl)}`;
                  
                  return (
                    <div key={desk.id} className="qr-label-card">
                      <div className="qr-label-header">
                        <div className="qr-label-logo">
                          <ShieldCheck size={16} color="var(--accent)" />
                          <span>DeskGuard</span>
                        </div>
                        <span className="qr-label-id">{desk.id}</span>
                      </div>
                      <div className="qr-label-body">
                        <img src={qrApiUrl} alt={`QR Code for ${desk.id}`} className="qr-label-image" />
                        <div className="qr-label-instructions">
                          <h3>Scan to Check In</h3>
                          <p>1. Scan QR with phone camera</p>
                          <p>2. Set away timers / checkout</p>
                          <span className="qr-label-zone">{desk.zone}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
