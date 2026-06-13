import React, { useState, useEffect, useMemo } from 'react';
import { QrCode, LogOut, Clock, Coffee, MapPin, Monitor, BookOpen, Volume2, Users } from 'lucide-react';

const ZONE_ICONS = {
  'Quiet Zone': <Volume2 size={14} />,
  'Group Study': <Users size={14} />,
  'Computer Lab': <Monitor size={14} />,
  'Reading Area': <BookOpen size={14} />,
};

const ZONE_LIST = ['All', 'Quiet Zone', 'Group Study', 'Computer Lab', 'Reading Area'];

function formatDuration(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export default function StudentView({ desks, updateDeskStatus }) {
  const [activeDeskId, setActiveDeskId] = useState(null);
  const [zoneFilter, setZoneFilter] = useState('All');
  const [, setTick] = useState(0);

  // Re-render every second for live timers
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const currentDesk = desks.find(d => d.id === activeDeskId);
  const now = Date.now();

  const counts = useMemo(() => ({
    total: desks.length,
    free: desks.filter(d => d.status === 'free').length,
    occupied: desks.filter(d => d.status === 'occupied').length,
    away: desks.filter(d => d.status === 'away').length,
  }), [desks]);

  const filteredDesks = useMemo(() =>
    zoneFilter === 'All' ? desks : desks.filter(d => d.zone === zoneFilter),
  [desks, zoneFilter]);

  const handleCheckIn = (id) => {
    const desk = desks.find(d => d.id === id);
    if (!desk || desk.status !== 'free') return;
    updateDeskStatus(id, 'occupied', 'You');
    setActiveDeskId(id);
  };

  const handleAway = () => {
    if (activeDeskId) updateDeskStatus(activeDeskId, 'away');
  };

  const handleReturn = () => {
    if (activeDeskId) updateDeskStatus(activeDeskId, 'occupied');
  };

  const handleCheckOut = () => {
    if (activeDeskId) {
      updateDeskStatus(activeDeskId, 'free');
      setActiveDeskId(null);
    }
  };

  const statusBorderColor = (status) => {
    if (status === 'free') return 'var(--status-free)';
    if (status === 'away') return 'var(--status-away)';
    return 'var(--status-occupied)';
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <h1>Find a Desk</h1>
        <p>Select an available desk to check in</p>
      </div>

      {/* Stats */}
      <div className="metric-row">
        <div className="stat-card">
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Desks</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1, marginTop: '0.25rem' }}>{counts.total}</span>
        </div>
        <div className="stat-card">
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Available</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1, marginTop: '0.25rem', color: 'var(--status-free)' }}>{counts.free}</span>
        </div>
        <div className="stat-card">
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Occupied</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1, marginTop: '0.25rem', color: 'var(--status-occupied)' }}>{counts.occupied}</span>
        </div>
        <div className="stat-card">
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Away</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1, marginTop: '0.25rem', color: 'var(--status-away)' }}>{counts.away}</span>
        </div>
      </div>

      {/* Active Session */}
      {activeDeskId && currentDesk && (
        <div className="session-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <MapPin size={16} color="var(--accent)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-hover)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Active Session</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>
                {currentDesk.id} — {currentDesk.zone}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                <Clock size={14} />
                {currentDesk.status === 'occupied' && currentDesk.lastCheckIn && (
                  <span>Checked in {formatDuration(now - currentDesk.lastCheckIn)} ago</span>
                )}
                {currentDesk.status === 'away' && currentDesk.awayUntil && (
                  <span style={{ color: 'var(--status-away)' }}>
                    Away — {formatDuration(Math.max(0, currentDesk.awayUntil - now))} remaining
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {currentDesk.status === 'occupied' ? (
                <button className="btn btn-secondary" onClick={handleAway}>
                  <Coffee size={15} /> Step Away
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleReturn}>
                  <Clock size={15} /> I'm Back
                </button>
              )}
              <button className="btn btn-danger" onClick={handleCheckOut}>
                <LogOut size={15} /> Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zone Filters */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        {ZONE_LIST.map(z => (
          <button
            key={z}
            className={`btn ${zoneFilter === z ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setZoneFilter(z)}
          >
            {z}
          </button>
        ))}
      </div>

      {/* Desk Grid */}
      <div className="desk-grid">
        {filteredDesks.map(desk => (
          <div
            key={desk.id}
            className={`desk-card status-${desk.status}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{desk.id}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                  {ZONE_ICONS[desk.zone]} {desk.zone}
                </div>
              </div>
              <span className={`badge badge-${desk.status}`}>
                {desk.status === 'free' ? 'Available' : desk.status === 'occupied' ? 'Occupied' : 'Away'}
              </span>
            </div>

            {desk.status !== 'free' && desk.occupantName && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {desk.occupantName}
              </div>
            )}

            {desk.status === 'free' && !activeDeskId && (
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
                onClick={() => handleCheckIn(desk.id)}
              >
                <QrCode size={14} /> Check In
              </button>
            )}

            {desk.status === 'free' && activeDeskId && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '0.25rem 0' }}>
                You already have a desk
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
