import React from 'react';

const STATUS_COLORS = {
  free: '#22c55e',
  occupied: '#ef4444',
  away: '#eab308',
};

const ZONES = [
  { name: 'Quiet Zone', x: 10, y: 10, w: 285, h: 130 },
  { name: 'Reading Area', x: 305, y: 10, w: 285, h: 130 },
  { name: 'Computer Lab', x: 10, y: 155, w: 285, h: 130 },
  { name: 'Group Study', x: 305, y: 155, w: 285, h: 130 },
];

export default function LibraryMap({ desks, onDeskClick }) {
  // Group desks by zone
  const desksByZone = {};
  desks.forEach(d => {
    const zone = d.zone || 'Quiet Zone';
    if (!desksByZone[zone]) desksByZone[zone] = [];
    desksByZone[zone].push(d);
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Floor Plan Overview</h2>
      </div>

      <div className="divider" style={{ marginBottom: '1rem' }} />

      <svg viewBox="0 0 600 330" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Background */}
        <rect width="600" height="300" rx="6" fill="#111113" />

        {/* Zone areas */}
        {ZONES.map(zone => (
          <g key={zone.name}>
            <rect
              x={zone.x} y={zone.y}
              width={zone.w} height={zone.h}
              rx="4" fill="none"
              stroke="#27272a" strokeWidth="1"
              strokeDasharray="4 2"
            />
            <text x={zone.x + 8} y={zone.y + 16} fill="#71717a" fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif">
              {zone.name.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Desks by zone */}
        {ZONES.map(zone => {
          const zoneDesks = desksByZone[zone.name] || [];
          const cols = Math.min(zoneDesks.length, 4);
          return zoneDesks.map((desk, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const dx = zone.x + 18 + col * 65;
            const dy = zone.y + 30 + row * 42;
            const color = STATUS_COLORS[desk.status] || STATUS_COLORS.free;

            return (
              <g
                key={desk.id}
                transform={`translate(${dx}, ${dy})`}
                onClick={() => onDeskClick && onDeskClick(desk.id)}
                style={{ cursor: onDeskClick ? 'pointer' : 'default' }}
              >
                <rect width="48" height="28" rx="4" fill={color} opacity="0.85" />
                <text x="24" y="18" fill="#fff" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="Inter, sans-serif">
                  {desk.id}
                </text>
              </g>
            );
          });
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', justifyContent: 'center' }}>
        {[
          { label: 'Available', color: STATUS_COLORS.free },
          { label: 'Occupied', color: STATUS_COLORS.occupied },
          { label: 'Away', color: STATUS_COLORS.away },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, display: 'inline-block' }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
