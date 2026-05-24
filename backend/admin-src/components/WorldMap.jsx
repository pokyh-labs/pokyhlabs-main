import React, { useMemo, useState } from 'react';

const W = 900;
const H = 420;

// Equirectangular projection: [lng, lat] → [svgX, svgY]
function project(lng, lat) {
  return [
    ((lng + 180) / 360) * W,
    ((90 - lat) / 180) * H,
  ];
}

function polygonPoints(coords) {
  return coords.map(([lng, lat]) => project(lng, lat).join(',')).join(' ');
}

// Simplified continent outlines [lng, lat]
const LAND = [
  // North America
  { id: 'na', d: [[-168,72],[-140,60],[-130,55],[-124,49],[-95,49],[-75,48],[-67,47],[-68,44],[-70,43],[-74,36],[-78,34],[-81,31],[-85,30],[-88,30],[-90,29],[-94,30],[-97,26],[-105,21],[-118,15],[-92,8],[-79,9],[-80,9],[-82,9],[-84,10],[-88,16],[-89,22],[-87,25],[-88,26],[-90,29],[-94,30],[-97,26],[-105,21],[-118,15],[-121,24],[-120,34],[-124,40],[-130,57],[-138,60],[-145,61],[-153,60],[-160,59],[-165,62],[-168,66],[-168,72]] },
  // Greenland (smaller)
  { id: 'gl', d: [[-75,76],[-58,78],[-42,80],[-23,77],[-18,74],[-22,70],[-30,65],[-45,60],[-60,62],[-68,65],[-70,70],[-75,74],[-75,76]] },
  // South America
  { id: 'sa', d: [[-77,8],[-63,10],[-52,5],[-50,2],[-48,-2],[-35,-4],[-34,-8],[-36,-12],[-38,-16],[-40,-22],[-44,-23],[-48,-27],[-50,-30],[-52,-33],[-54,-34],[-57,-38],[-63,-41],[-65,-44],[-66,-46],[-65,-55],[-69,-56],[-71,-52],[-74,-46],[-74,-40],[-72,-35],[-72,-22],[-73,-18],[-77,-8],[-77,8]] },
  // Europe
  { id: 'eu', d: [[-10,36],[-5,36],[0,36],[5,43],[8,44],[15,44],[17,42],[20,40],[26,38],[28,37],[30,38],[30,47],[28,50],[24,56],[22,57],[18,58],[10,58],[5,58],[0,56],[-3,54],[-5,50],[-5,44],[-10,44],[-10,36]] },
  // Africa
  { id: 'af', d: [[-6,36],[0,36],[25,37],[32,31],[34,28],[38,22],[44,12],[50,12],[44,10],[42,14],[40,16],[36,22],[34,26],[32,30],[34,34],[28,36],[15,37],[0,36],[-7,36],[-8,35],[-14,28],[-17,15],[-15,5],[-10,4],[-5,5],[0,5],[5,4],[10,4],[15,0],[20,-5],[25,-8],[30,-8],[35,-5],[38,-10],[40,-15],[40,-20],[36,-26],[34,-28],[30,-30],[26,-34],[18,-34],[14,-24],[10,-18],[5,-5],[0,4],[-5,5],[-10,4],[-15,5],[-17,10],[-14,28],[-8,35],[-6,36]] },
  // Asia (west+central+south)
  { id: 'as', d: [[30,42],[38,38],[48,38],[55,35],[60,22],[50,12],[43,12],[40,16],[36,22],[34,28],[30,31],[25,37],[28,37],[30,38],[30,47],[38,38],[42,38],[48,40],[55,43],[60,44],[62,40],[65,36],[68,30],[72,24],[76,20],[80,14],[80,8],[88,8],[96,10],[100,2],[105,-4],[110,-8],[115,-6],[120,-2],[122,4],[126,8],[130,12],[135,16],[140,20],[140,35],[135,40],[130,42],[124,50],[120,52],[110,55],[100,52],[96,55],[90,52],[80,52],[70,54],[60,56],[44,42],[30,42]] },
  // Russia
  { id: 'ru', d: [[28,56],[30,70],[42,73],[60,73],[80,75],[100,75],[120,73],[140,72],[160,68],[168,65],[168,60],[150,55],[140,50],[125,52],[110,55],[100,52],[96,55],[80,52],[60,56],[44,42],[38,38],[30,42],[36,52],[28,56]] },
  // Japan (rough)
  { id: 'jp', d: [[130,44],[132,42],[134,38],[136,34],[134,32],[131,31],[130,33],[132,36],[132,40],[130,44]] },
  // Australia
  { id: 'au', d: [[114,-22],[118,-20],[122,-18],[128,-15],[134,-12],[138,-14],[142,-18],[144,-18],[148,-20],[150,-24],[152,-28],[154,-28],[152,-30],[152,-34],[148,-38],[144,-38],[140,-36],[134,-34],[128,-34],[120,-34],[116,-32],[114,-28],[114,-22]] },
  // New Zealand (rough)
  { id: 'nz', d: [[170,-46],[172,-44],[174,-42],[174,-38],[172,-36],[170,-36],[168,-44],[170,-46]] },
  // UK island (rough)
  { id: 'uk', d: [[-5,50],[-4,52],[-3,54],[-2,56],[0,58],[2,57],[1,52],[-1,50],[-3,50],[-5,50]] },
  // Iceland
  { id: 'is', d: [[-24,65],[-18,65],[-13,65],[-13,66],[-18,67],[-24,66],[-24,65]] },
];

// Key reference labels on the map
const LABELS = [
  { name: 'USA', lng: -98, lat: 39 },
  { name: 'Canada', lng: -95, lat: 60 },
  { name: 'Brazil', lng: -55, lat: -12 },
  { name: 'Europe', lng: 14, lat: 52 },
  { name: 'Russia', lng: 95, lat: 61 },
  { name: 'China', lng: 104, lat: 35 },
  { name: 'India', lng: 78, lat: 21 },
  { name: 'Japan', lng: 138, lat: 37 },
  { name: 'Africa', lng: 22, lat: 4 },
  { name: 'Australia', lng: 134, lat: -25 },
];

// Grid lines
const LAT_LINES  = [-60, -30, 0, 30, 60];
const LNG_LINES  = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

export default function WorldMap({ points = [], className = '' }) {
  const [tooltip, setTooltip] = useState(null);

  const clustered = useMemo(() => {
    // Aggregate points that are very close (within ~3°)
    const result = [];
    const used = new Set();
    for (let i = 0; i < points.length; i++) {
      if (used.has(i)) continue;
      let { lat, lng, count = 1, country, city } = points[i];
      for (let j = i + 1; j < points.length; j++) {
        if (used.has(j)) continue;
        const p = points[j];
        if (Math.abs(p.lat - lat) < 3 && Math.abs(p.lng - lng) < 3) {
          count += (p.count || 1);
          used.add(j);
        }
      }
      result.push({ lat, lng, count, country, city });
    }
    return result;
  }, [points]);

  const maxCount = clustered.reduce((m, p) => Math.max(m, p.count), 1);

  return (
    <div className={className} style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mapBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f0f1a" />
            <stop offset="100%" stopColor="#080812" />
          </linearGradient>
          <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="dotGlowLarge" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect width={W} height={H} fill="url(#mapBg)" />

        {/* Latitude grid */}
        {LAT_LINES.map(lat => {
          const [, y] = project(0, lat);
          const isEquator = lat === 0;
          return (
            <line key={`lat${lat}`}
              x1={0} y1={y} x2={W} y2={y}
              stroke={isEquator ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)'}
              strokeWidth={isEquator ? 0.8 : 0.5}
            />
          );
        })}

        {/* Longitude grid */}
        {LNG_LINES.map(lng => {
          const [x] = project(lng, 0);
          const isPrime = lng === 0;
          return (
            <line key={`lng${lng}`}
              x1={x} y1={0} x2={x} y2={H}
              stroke={isPrime ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)'}
              strokeWidth={isPrime ? 0.8 : 0.5}
            />
          );
        })}

        {/* Land masses */}
        {LAND.map(land => (
          <polygon
            key={land.id}
            points={polygonPoints(land.d)}
            fill="rgba(255,255,255,0.055)"
            stroke="rgba(255,255,255,0.13)"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        ))}

        {/* Reference labels */}
        {LABELS.map(({ name, lng, lat }) => {
          const [x, y] = project(lng, lat);
          return (
            <text key={name} x={x} y={y}
              textAnchor="middle"
              fill="rgba(255,255,255,0.10)"
              fontSize="7"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="500"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {name}
            </text>
          );
        })}

        {/* Access point dots */}
        {clustered.map((pt, i) => {
          const [x, y] = project(pt.lng, pt.lat);
          const ratio   = pt.count / maxCount;
          const r       = 3 + ratio * 9;
          const opacity = 0.55 + ratio * 0.45;
          return (
            <g
              key={i}
              onMouseEnter={e => setTooltip({ x, y, ...pt })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer glow ring */}
              <circle cx={x} cy={y} r={r + 5} fill="rgba(89,61,248,0.08)" />
              {/* Pulse ring for large points */}
              {ratio > 0.3 && (
                <circle cx={x} cy={y} r={r + 10} fill="none"
                  stroke="rgba(89,61,248,0.22)" strokeWidth="1.2"
                  className="map-pulse"
                  style={{ animationDelay: `${(i * 0.4) % 2}s` }}
                />
              )}
              {/* Main dot */}
              <circle cx={x} cy={y} r={r}
                fill={ratio > 0.5 ? '#7c5ce8' : '#593df8'}
                opacity={opacity}
                filter={ratio > 0.2 ? 'url(#dotGlow)' : undefined}
              />
              {/* Inner bright core */}
              <circle cx={x} cy={y} r={r * 0.45} fill="rgba(255,255,255,0.55)" />
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const pad    = 8;
          const tw     = 130;
          const th     = 38;
          const tx     = Math.min(W - tw - pad, Math.max(pad, tooltip.x - tw / 2));
          const ty     = tooltip.y - th - 14 < 0 ? tooltip.y + 14 : tooltip.y - th - 14;
          return (
            <g>
              <rect x={tx} y={ty} width={tw} height={th} rx={6}
                fill="rgba(15,15,28,0.92)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"
              />
              <text x={tx + tw / 2} y={ty + 14} textAnchor="middle"
                fill="rgba(255,255,255,0.9)" fontSize="8.5" fontWeight="600"
                fontFamily="Inter, system-ui, sans-serif">
                {tooltip.city ? `${tooltip.city}, ${tooltip.country}` : (tooltip.country || 'Unbekannt')}
              </text>
              <text x={tx + tw / 2} y={ty + 27} textAnchor="middle"
                fill="rgba(89,61,248,0.9)" fontSize="8" fontFamily="Inter, system-ui, sans-serif">
                {tooltip.count.toLocaleString()} {tooltip.count === 1 ? 'Anfrage' : 'Anfragen'}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* CSS pulse animation */}
      <style>{`
        @keyframes mapPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0; transform: scale(1.4); }
        }
        .map-pulse { animation: mapPulse 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      `}</style>
    </div>
  );
}
