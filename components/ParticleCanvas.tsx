"use client";

import { useEffect, useRef } from "react";

interface Particle {
  sx: number; sy: number;
  x: number; y: number;
  vx: number; vy: number;
  hx: number; hy: number;
  persp: number;
  depth: number;
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawCtx = canvas.getContext("2d");
    if (!rawCtx) return;

    // Capture as definitely-typed so nested closures don't lose narrowing
    const cvs: HTMLCanvasElement = canvas;
    const ctx: CanvasRenderingContext2D = rawCtx;

    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    const mouse = {
      x: -9999, y: -9999,
      prevX: -9999, prevY: -9999,
      vx: 0, vy: 0,
      inside: false,
      strength: 0,
      lastMoveAt: 0,
    };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.inside = true;
      mouse.lastMoveAt = performance.now();
    };
    const onMouseLeave = () => {
      mouse.inside = false;
      mouse.vx = 0; mouse.vy = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]; if (!t) return;
      mouse.x = t.clientX; mouse.y = t.clientY;
      mouse.inside = true;
      mouse.lastMoveAt = performance.now();
    };
    const onTouchEnd = () => {
      mouse.inside = false;
      mouse.vx = 0; mouse.vy = 0;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    let particles: Particle[] = [];
    let N = 0;
    let shapes: Float32Array[] = [];
    let cx = 0, cy = 0, shapeBase = 0;
    let introStart = 0;
    const INTRO_MS = 1400;
    const PERSP = 1100;

    function buildTorus(n: number) {
      // Random uniform sampling on torus surface — random particle order so morphs look chaotic
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const R = base * 0.24, r = base * 0.085;
      for (let i = 0; i < n; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
        arr[i * 3 + 0] = (R + r * cv) * cu;
        arr[i * 3 + 1] = (R + r * cv) * su;
        arr[i * 3 + 2] = r * sv;
      }
      return arr;
    }

    function buildSphere(n: number) {
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const R = base * 0.32;
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / Math.max(1, n - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = i * golden;
        arr[i * 3 + 0] = R * r * Math.cos(theta);
        arr[i * 3 + 1] = R * y;
        arr[i * 3 + 2] = R * r * Math.sin(theta);
      }
      return arr;
    }

    function buildCube(n: number) {
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const S = base * 0.22;
      const perFace = Math.ceil(n / 6);
      const grid = Math.max(2, Math.ceil(Math.sqrt(perFace)));
      let i = 0;
      for (let f = 0; f < 6; f++) {
        for (let a = 0; a < grid; a++) {
          for (let b = 0; b < grid; b++) {
            if (i >= n) break;
            const u = (a / (grid - 1)) * 2 - 1;
            const v = (b / (grid - 1)) * 2 - 1;
            let x = 0, y = 0, z = 0;
            if (f === 0) { x = S; y = u * S; z = v * S; }
            else if (f === 1) { x = -S; y = u * S; z = v * S; }
            else if (f === 2) { x = u * S; y = S; z = v * S; }
            else if (f === 3) { x = u * S; y = -S; z = v * S; }
            else if (f === 4) { x = u * S; y = v * S; z = S; }
            else { x = u * S; y = v * S; z = -S; }
            arr[i * 3 + 0] = x; arr[i * 3 + 1] = y; arr[i * 3 + 2] = z;
            i++;
          }
        }
      }
      while (i < n) { const j = i - 1; arr[i * 3] = arr[j * 3]; arr[i * 3 + 1] = arr[j * 3 + 1]; arr[i * 3 + 2] = arr[j * 3 + 2]; i++; }
      return arr;
    }

    function buildCylinder(n: number) {
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const R = base * 0.20, HH = base * 0.55;
      const circ = 2 * Math.PI * R;
      const ratio = circ / HH;
      const hSteps = Math.max(8, Math.round(Math.sqrt(n / ratio)));
      const aSteps = Math.ceil(n / hSteps);
      let i = 0;
      for (let ai = 0; ai < aSteps; ai++) {
        const theta = (ai / aSteps) * Math.PI * 2;
        const ct = Math.cos(theta), st = Math.sin(theta);
        for (let hi = 0; hi < hSteps; hi++) {
          if (i >= n) break;
          const t = hi / Math.max(1, hSteps - 1);
          const y = t * HH - HH / 2;
          arr[i * 3 + 0] = R * ct; arr[i * 3 + 1] = y; arr[i * 3 + 2] = R * st;
          i++;
        }
      }
      while (i < n) { const j = i - 1; arr[i * 3] = arr[j * 3]; arr[i * 3 + 1] = arr[j * 3 + 1]; arr[i * 3 + 2] = arr[j * 3 + 2]; i++; }
      return arr;
    }

    function buildStar(n: number) {
      // 3D bipyramid star — random face + random barycentric → random particle order
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const R = base * 0.40, r = R * 0.40;
      const H = base * 0.22;
      const points = 5;

      const verts: Array<[number, number, number]> = [];
      for (let p = 0; p < points * 2; p++) {
        const isOuter = p % 2 === 0;
        const rad = isOuter ? R : r;
        const ang = (p / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        verts.push([Math.cos(ang) * rad, Math.sin(ang) * rad, 0]);
      }
      const topApex: [number, number, number] = [0, 0, H];
      const botApex: [number, number, number] = [0, 0, -H];

      const tris: Array<[[number, number, number], [number, number, number], [number, number, number]]> = [];
      for (let i = 0; i < verts.length; i++) {
        const v0 = verts[i];
        const v1 = verts[(i + 1) % verts.length];
        tris.push([v0, v1, topApex]);
        tris.push([v0, v1, botApex]);
      }
      const triCount = tris.length;

      for (let i = 0; i < n; i++) {
        const tri = tris[Math.floor(Math.random() * triCount)];
        const [A, B, C] = tri;
        let u = Math.random(), v = Math.random();
        if (u + v > 1) { u = 1 - u; v = 1 - v; }
        const w = 1 - u - v;
        arr[i * 3 + 0] = u * A[0] + v * B[0] + w * C[0];
        arr[i * 3 + 1] = u * A[1] + v * B[1] + w * C[1];
        arr[i * 3 + 2] = u * A[2] + v * B[2] + w * C[2];
      }
      return arr;
    }

    function buildFlower(n: number) {
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const A = base * 0.38, petals = 6, innerR = A * 0.16;
      for (let i = 0; i < n; i++) {
        const theta = Math.random() * Math.PI * 2;
        const petalR = Math.abs(Math.sin(petals * 0.5 * theta));
        const edge = innerR + (A - innerR) * petalR;
        const rad = Math.sqrt(Math.random()) * edge;
        arr[i * 3 + 0] = Math.cos(theta) * rad;
        arr[i * 3 + 1] = Math.sin(theta) * rad;
        arr[i * 3 + 2] = (Math.random() - 0.5) * base * 0.05;
      }
      return arr;
    }

    function buildHeart(n: number) {
      // Classic parametric heart curve, swept into a thin 3D card.
      // Particles sit on the FRONT and BACK surfaces only — clear silhouette + subtle depth.
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const SCALE = base * 0.022;
      const thickness = base * 0.045;

      // Parametric 2D heart: x = 16 sin³(t), y = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)
      // Sample uniformly inside heart by point-in-polygon over its outline.
      // Build outline once
      const OUT = 360;
      const outX = new Float32Array(OUT);
      const outY = new Float32Array(OUT);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let k = 0; k < OUT; k++) {
        const t = (k / OUT) * Math.PI * 2;
        const s = Math.sin(t);
        const x = 16 * s * s * s;
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        outX[k] = x; outY[k] = y;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      const cxH = (minX + maxX) * 0.5;
      const cyH = (minY + maxY) * 0.5;

      const inPoly = (x: number, y: number) => {
        let inside = false;
        for (let i = 0, j = OUT - 1; i < OUT; j = i++) {
          const xi = outX[i], yi = outY[i], xj = outX[j], yj = outY[j];
          const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      };
      const distToEdge = (x: number, y: number) => {
        let best = Infinity;
        for (let i = 0, j = OUT - 1; i < OUT; j = i++) {
          const ex = outX[j] - outX[i], ey = outY[j] - outY[i];
          const len2 = ex * ex + ey * ey;
          const t = Math.max(0, Math.min(1, ((x - outX[i]) * ex + (y - outY[i]) * ey) / len2));
          const px = outX[i] + ex * t, py = outY[i] + ey * t;
          const d = Math.hypot(x - px, y - py);
          if (d < best) best = d;
        }
        return best;
      };
      // Estimate max inscribed radius for normalization (the heart's "deep" inside)
      const maxEdgeRef = 8.0;

      let i = 0, guard = 0;
      while (i < n && guard < n * 80) {
        guard++;
        const x = minX + Math.random() * (maxX - minX);
        const y = minY + Math.random() * (maxY - minY);
        if (inPoly(x, y)) {
          const d = distToEdge(x, y);
          // Hemispherical bulge — thicker in middle, tapers to 0 at edge
          const tEdge = Math.min(1, d / maxEdgeRef);
          const halfThick = thickness * Math.sqrt(Math.max(0, 1 - (1 - tEdge) * (1 - tEdge)));
          // Pure front/back shell — gives strong 3D silhouette
          const sign = Math.random() < 0.5 ? -1 : 1;
          const z = sign * halfThick * (0.92 + Math.random() * 0.08);
          arr[i * 3 + 0] = (x - cxH) * SCALE;
          arr[i * 3 + 1] = -(y - cyH) * SCALE;
          arr[i * 3 + 2] = z;
          i++;
        }
      }
      while (i < n) { arr[i * 3] = arr[(i - 1) * 3]; arr[i * 3 + 1] = arr[(i - 1) * 3 + 1]; arr[i * 3 + 2] = arr[(i - 1) * 3 + 2]; i++; }
      return arr;
    }

    function buildInfinity(n: number) {
      // 3D lemniscate tube — particles on the tube SURFACE (not interior), like a real torus tube.
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const A = base * 0.48;
      const tubeR = base * 0.07;
      const eps = 0.001;
      for (let i = 0; i < n; i++) {
        const t = Math.random() * Math.PI * 2;
        // Curve C(t)
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const bx = (A * Math.cos(t)) / denom;
        const by = (A * Math.sin(t) * Math.cos(t)) / denom;
        const bz = Math.sin(t * 2) * A * 0.45;
        // Numerical tangent
        const t2 = t + eps;
        const d2 = 1 + Math.sin(t2) * Math.sin(t2);
        const tx = (A * Math.cos(t2)) / d2 - bx;
        const ty = (A * Math.sin(t2) * Math.cos(t2)) / d2 - by;
        const tz = Math.sin(t2 * 2) * A * 0.45 - bz;
        const tl = Math.hypot(tx, ty, tz) || 1;
        const Tx = tx / tl, Ty = ty / tl, Tz = tz / tl;
        // Normal: cross(T, world-up) then normalize
        let Nx = Ty * 0 - Tz * 1; // = -Tz
        let Ny = Tz * 0 - Tx * 0; // = 0
        let Nz = Tx * 1 - Ty * 0; // = Tx
        let nl = Math.hypot(Nx, Ny, Nz);
        if (nl < 1e-4) { Nx = 1; Ny = 0; Nz = 0; nl = 1; }
        Nx /= nl; Ny /= nl; Nz /= nl;
        // Binormal = T x N
        const Bx = Ty * Nz - Tz * Ny;
        const By = Tz * Nx - Tx * Nz;
        const Bz = Tx * Ny - Ty * Nx;

        const phi = Math.random() * Math.PI * 2;
        const cosp = Math.cos(phi), sinp = Math.sin(phi);
        arr[i * 3 + 0] = bx + tubeR * (cosp * Nx + sinp * Bx);
        arr[i * 3 + 1] = by + tubeR * (cosp * Ny + sinp * By);
        arr[i * 3 + 2] = bz + tubeR * (cosp * Nz + sinp * Bz);
      }
      return arr;
    }

    function buildAll() {
      N = Math.min(9000, Math.max(4500, Math.floor(W * H / 340)));
      shapes = [buildTorus(N), buildStar(N), buildHeart(N), buildFlower(N), buildInfinity(N)];
      if (particles.length !== N) {
        particles = new Array(N);
        const initial = shapes[0];
        for (let i = 0; i < N; i++) {
          const ix = i * 3;
          const ang = Math.random() * Math.PI * 2;
          const dist = Math.min(W, H) * (0.55 + Math.random() * 0.45);
          particles[i] = {
            sx: cx + Math.cos(ang) * dist,
            sy: cy + Math.sin(ang) * dist,
            x: cx + Math.cos(ang) * dist,
            y: cy + Math.sin(ang) * dist,
            vx: 0, vy: 0,
            hx: cx + initial[ix],
            hy: cy + initial[ix + 1],
            persp: 1,
            depth: initial[ix + 2],
          };
        }
        introStart = performance.now();
      }
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cvs.width = Math.floor(W * DPR);
      cvs.height = Math.floor(H * DPR);
      cvs.style.width = W + "px";
      cvs.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W / 2;
      cy = H / 2;
      shapeBase = Math.min(W, H) * 0.9;
      buildAll();
    }

    const REPEL_RADIUS = 130;
    const REPEL_RADIUS_SQ = REPEL_RADIUS * REPEL_RADIUS;
    const REPEL_FORCE = 220;          // impulse per frame at unit falloff & strength
    const REPEL_POW = 2.0;            // strength = (speed / REF) ^ POW — super-linear
    const REPEL_MAX_STRENGTH = 8;
    const SWIRL_RATIO = 0.18;
    const SMOOTH_TIME = 0.28;         // critical-damped — no schwabbel
    const MOUSE_REF_SPEED = 500;

    window.addEventListener("resize", resize);
    resize();

    const baseR = 0x59, baseG = 0x3d, baseB = 0xf8;
    function shadeRGBA(t: number, alpha: number) {
      const r = Math.round(baseR * t + 228 * (1 - t) * 0.4);
      const g = Math.round(baseG * t + 226 * (1 - t) * 0.4);
      const b = Math.round(baseB * t + 220 * (1 - t) * 0.4);
      return `rgba(${r},${g},${b},${alpha})`;
    }

    function smoothstep(t: number) { return t * t * (3 - 2 * t); }

    const HOLD = 6.0, TRANS = 2.0, CYCLE = HOLD + TRANS;

    // Per-shape camera presets — order matches shapes[] (Torus, Star, Heart, Flower, Infinity)
    // Each shape has its own base tilt; the camera then orbits with multi-axis lissajous motion.
    interface Cam { tx: number; pitchAmp: number; yawAmp: number; rollAmp: number; }
    // Cinematic orbit — visible 3D parallax, smooth blending, organic non-repeating motion
    const camPresets: Cam[] = [
      { tx: -0.28, pitchAmp: 0.18, yawAmp: 0.72, rollAmp: 0.06 }, // Torus
      { tx: -0.20, pitchAmp: 0.20, yawAmp: 0.82, rollAmp: 0.07 }, // Star (3D bipyramid)
      { tx: -0.15, pitchAmp: 0.16, yawAmp: 0.55, rollAmp: 0.05 }, // Heart (narrower so silhouette stays readable)
      { tx: -0.38, pitchAmp: 0.14, yawAmp: 0.62, rollAmp: 0.05 }, // Flower (bowl view)
      { tx: -0.22, pitchAmp: 0.20, yawAmp: 0.80, rollAmp: 0.07 }, // Infinity
    ];
    const t0 = performance.now();
    let rafId = 0;
    let lastNow = t0;

    function tick(now: number) {
      const time = (now - t0) / 1000;
      // Frame-rate independent timestep, capped to avoid teleporting after tab-switch
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - lastNow) / 1000));
      lastNow = now;
      const dtScale = dt * 60; // 1.0 at 60fps — used to scale per-frame-tuned constants

      ctx.clearRect(0, 0, W, H);

      // --- Mouse velocity tracking (smoothed) ---
      if (mouse.prevX === -9999) { mouse.prevX = mouse.x; mouse.prevY = mouse.y; }
      const rawVx = (mouse.x - mouse.prevX) / dt;
      const rawVy = (mouse.y - mouse.prevY) / dt;
      const velSmooth = 1 - Math.exp(-dt * 18);
      mouse.vx += (rawVx - mouse.vx) * velSmooth;
      mouse.vy += (rawVy - mouse.vy) * velSmooth;
      mouse.prevX = mouse.x; mouse.prevY = mouse.y;

      // Strength = how "active" the cursor is, fades smoothly in/out
      const speed = Math.hypot(mouse.vx, mouse.vy);
      const sinceMove = now - mouse.lastMoveAt;
      const movingNow = mouse.inside && sinceMove < 90;
      const sRatio = speed / MOUSE_REF_SPEED;
      const targetStrength = movingNow ? Math.min(REPEL_MAX_STRENGTH, Math.pow(sRatio, REPEL_POW)) : 0;
      const strengthSmooth = 1 - Math.exp(-dt * (targetStrength > mouse.strength ? 22 : 9));
      mouse.strength += (targetStrength - mouse.strength) * strengthSmooth;

      if (!shapes.length) { rafId = requestAnimationFrame(tick); return; }

      const totalCycles = time / CYCLE;
      const idx = Math.floor(totalCycles) % shapes.length;
      const within = (totalCycles - Math.floor(totalCycles)) * CYCLE;
      let blend = within > HOLD ? (within - HOLD) / TRANS : 0;
      blend = smoothstep(Math.min(1, Math.max(0, blend)));

      // Highlight-wave that travels around the shape while it sits still.
      // Fades in during HOLD, fades back out during TRANS so it never collides with morph motion.
      const WAVE_SPEED = 0.65;             // rad/s — one revolution ~10s
      const WAVE_DEPTH_PHASE = 0.0014;     // 3D feel: depth shifts wave angle
      let waveActivity;
      if (within < HOLD) {
        waveActivity = Math.min(1, within / 0.9);
      } else {
        waveActivity = 1 - blend;
      }
      waveActivity = smoothstep(waveActivity);
      const waveAngle = time * WAVE_SPEED;
      const waveAngle2 = -time * WAVE_SPEED * 0.43 + 1.7; // gentle counter-wave
      const waveActive = waveActivity > 0.01;

      // Smoothly blend per-shape base tilt between current and next shape (defensive lookup).
      // Camera oscillation is intentionally disabled — only the static per-shape tilt remains.
      const cLen = camPresets.length || 1;
      const ciA = ((idx % cLen) + cLen) % cLen;
      const ciB = (ciA + 1) % cLen;
      const fallbackCam: Cam = { tx: -0.22, pitchAmp: 0.03, yawAmp: 0.15, rollAmp: 0.02 };
      const camA: Cam = camPresets[ciA] ?? fallbackCam;
      const camB: Cam = camPresets[ciB] ?? fallbackCam;
      const camTx = camA.tx + (camB.tx - camA.tx) * blend;

      const tiltX = camTx;
      const tiltY = 0;
      const tiltZ = 0;
      const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      const cosY = Math.cos(tiltY), sinY = Math.sin(tiltY);
      const cosZ = Math.cos(tiltZ), sinZ = Math.sin(tiltZ);

      const A = shapes[idx];
      const B = shapes[(idx + 1) % shapes.length];
      if (!A || !B) { rafId = requestAnimationFrame(tick); return; }

      const mx = mouse.x, my = mouse.y;
      const mStrength = mouse.strength;
      const mActive = mStrength > 0.004;

      const omega = 2 / SMOOTH_TIME;
      const xArg = omega * dt;
      const dampExp = 1 / (1 + xArg + 0.48 * xArg * xArg + 0.235 * xArg * xArg * xArg);

      const BIN_COUNT = 24;
      const bins: Particle[][] = Array.from({ length: BIN_COUNT }, () => []);
      const ZR = Math.min(W, H) * 0.45;

      for (let i = 0; i < N; i++) {
        const p = particles[i];
        const ix = i * 3;
        const ax = A[ix], ay = A[ix + 1], az = A[ix + 2];
        const bx = B[ix], by = B[ix + 1], bz = B[ix + 2];
        // Git-style linear morph blend
        let x = ax + (bx - ax) * blend;
        let y = ay + (by - ay) * blend;
        let z = az + (bz - az) * blend;

        const xz = x * cosZ - y * sinZ;
        const yz = x * sinZ + y * cosZ;
        x = xz; y = yz;
        const y1 = y * cosX - z * sinX;
        const z1 = y * sinX + z * cosX;
        const x2 = x * cosY + z1 * sinY;
        const z2 = -x * sinY + z1 * cosY;

        const persp = PERSP / (PERSP + z2);
        const hx = cx + x2 * persp;
        const hy = cy + y1 * persp;

        p.hx = hx; p.hy = hy; p.depth = z2; p.persp = persp;

        const introT = Math.min(1, (now - introStart) / INTRO_MS);
        if (introT < 1) {
          const e = 1 - Math.pow(1 - introT, 3);
          p.x = p.sx + (hx - p.sx) * e;
          p.y = p.sy + (hy - p.sy) * e;
          p.vx = (hx - p.sx) * 0.005;
          p.vy = (hy - p.sy) * 0.005;
        } else {
          // Mouse repel as direct velocity impulse
          if (mActive) {
            const dx = p.x - mx, dy = p.y - my;
            const d2 = dx * dx + dy * dy;
            if (d2 < REPEL_RADIUS_SQ && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const norm = 1 - d / REPEL_RADIUS;
              const falloff = norm * norm * (3 - 2 * norm);
              const invD = 1 / d;
              const impulse = REPEL_FORCE * falloff * mStrength * dtScale;
              p.vx += dx * invD * impulse;
              p.vy += dy * invD * impulse;
              const sw = impulse * SWIRL_RATIO;
              p.vx += -dy * invD * sw;
              p.vy += dx * invD * sw;
            }
          }
          // Critical-damped smoothDamp — no overshoot, no schwabbel
          const dxh = p.x - hx;
          const dyh = p.y - hy;
          const tempX = (p.vx + omega * dxh) * dt;
          const tempY = (p.vy + omega * dyh) * dt;
          p.vx = (p.vx - omega * tempX) * dampExp;
          p.vy = (p.vy - omega * tempY) * dampExp;
          p.x = hx + (dxh + tempX) * dampExp;
          p.y = hy + (dyh + tempY) * dampExp;
        }

        const t = (z2 + ZR) / (2 * ZR);
        let bi = Math.floor(t * BIN_COUNT);
        if (bi < 0) bi = 0; else if (bi >= BIN_COUNT) bi = BIN_COUNT - 1;
        bins[bi].push(p);
      }

      for (let bi = BIN_COUNT - 1; bi >= 0; bi--) {
        for (const p of bins[bi]) {
          const sp2 = p.vx * p.vx + p.vy * p.vy;
          const boost = Math.min(0.25, sp2 * 0.0015);
          const tBright = Math.min(1, Math.max(0.15, p.persp * 0.95 + boost));
          const alpha = (0.18 + 0.78 * tBright) * (0.3 + boost * 0.6);
          const size = 0.6 + 2.2 * tBright;
          ctx.fillStyle = shadeRGBA(tBright, alpha);
          if (size > 1.6) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * 0.55, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="stage"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "block",
        zIndex: 1,
      }}
    />
  );
}
