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

    const mouse = { x: -9999, y: -9999, active: false };
    const onMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; };
    const onMouseLeave = () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]; if (!t) return;
      mouse.x = t.clientX; mouse.y = t.clientY; mouse.active = true;
    };
    const onTouchEnd = () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; };

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
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const R = base * 0.22, r = base * 0.075;
      const ratio = R / r;
      const vSteps = Math.max(20, Math.round(Math.sqrt(n / ratio)));
      const uSteps = Math.ceil(n / vSteps);
      let i = 0;
      outer: for (let ui = 0; ui < uSteps; ui++) {
        const u = (ui / uSteps) * Math.PI * 2;
        for (let vi = 0; vi < vSteps; vi++) {
          if (i >= n) break outer;
          const v = ((vi + (ui % 2) * 0.5) / vSteps) * Math.PI * 2;
          const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
          arr[i * 3 + 0] = (R + r * cv) * cu;
          arr[i * 3 + 1] = (R + r * cv) * su;
          arr[i * 3 + 2] = r * sv;
          i++;
        }
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
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const R = base * 0.38, r = R * 0.42, points = 5;
      for (let i = 0; i < n; i++) {
        const theta = Math.random() * Math.PI * 2;
        const seg = (theta / (Math.PI * 2)) * (points * 2);
        const segF = seg - Math.floor(seg);
        const isOuter = Math.floor(seg) % 2 === 0;
        const starR = isOuter ? R - (R - r) * segF : r + (R - r) * segF;
        const rad = Math.sqrt(Math.random()) * starR;
        arr[i * 3 + 0] = Math.cos(theta - Math.PI / 2) * rad;
        arr[i * 3 + 1] = Math.sin(theta - Math.PI / 2) * rad;
        arr[i * 3 + 2] = (Math.random() - 0.5) * base * 0.05;
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
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const SCALE = base * 0.30;
      const LX = 0.5, LY = 0.45, LR = 0.55;
      const TY_TOP = 0.45, TY_BOT = -1.2, TY_RANGE = TY_TOP - TY_BOT;
      const inHeart = (x: number, y: number) => {
        if ((x + LX) ** 2 + (y - LY) ** 2 <= LR * LR) return true;
        if ((x - LX) ** 2 + (y - LY) ** 2 <= LR * LR) return true;
        if (y >= TY_BOT && y <= TY_TOP && Math.abs(x) <= (y - TY_BOT) / TY_RANGE) return true;
        return false;
      };
      let i = 0, guard = 0;
      while (i < n && guard < n * 80) {
        guard++;
        const x = (Math.random() * 2 - 1) * 1.15;
        const y = Math.random() * 2.30 - 1.30;
        if (inHeart(x, y)) {
          arr[i * 3 + 0] = x * SCALE;
          arr[i * 3 + 1] = -(y - 0.15) * SCALE;
          arr[i * 3 + 2] = (Math.random() - 0.5) * base * 0.04;
          i++;
        }
      }
      while (i < n) { arr[i * 3] = arr[(i - 1) * 3]; arr[i * 3 + 1] = arr[(i - 1) * 3 + 1]; arr[i * 3 + 2] = arr[(i - 1) * 3 + 2]; i++; }
      return arr;
    }

    function buildInfinity(n: number) {
      const arr = new Float32Array(n * 3);
      const base = shapeBase;
      const A = base * 0.45; // Streckung nach links und rechts
      for (let i = 0; i < n; i++) {
        const t = Math.random() * Math.PI * 2;
        // Lemniskate von Bernoulli (Unendlichkeitszeichen)
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const bx = (A * Math.cos(t)) / denom;
        const by = (A * Math.sin(t) * Math.cos(t)) / denom;
        
        // Sanfter 3D-Bogen auf der Z-Achse, damit es im Raum Tiefe hat
        const bz = Math.sin(t * 2) * A * 0.3;

        // Volumen/Dicke der Linie
        const rad = Math.sqrt(Math.random()) * base * 0.08;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        arr[i * 3 + 0] = bx + rad * Math.cos(theta) * Math.sin(phi);
        arr[i * 3 + 1] = by + rad * Math.sin(theta) * Math.sin(phi);
        arr[i * 3 + 2] = bz + rad * Math.cos(phi);
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

    const REPEL_RADIUS = 240;
    const REPEL_RADIUS_SQ = REPEL_RADIUS * REPEL_RADIUS;
    const REPEL_FORCE = 4200;
    const SPRING = 0.014;
    const FRICTION = 0.92;

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

    const HOLD = 3.0, TRANS = 2.0, CYCLE = HOLD + TRANS;
    const t0 = performance.now();
    let rafId = 0;

    function tick(now: number) {
      const time = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      const tiltX = -0.55 + Math.sin(time * 0.20) * 0.06;
      const tiltY = Math.sin(time * 0.18) * 0.70;
      const tiltZ = Math.sin(time * 0.15) * 0.05;
      const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      const cosY = Math.cos(tiltY), sinY = Math.sin(tiltY);
      const cosZ = Math.cos(tiltZ), sinZ = Math.sin(tiltZ);
      const breathe = 1 + Math.sin(time * 0.6) * 0.015;

      const totalCycles = time / CYCLE;
      const idx = Math.floor(totalCycles) % shapes.length;
      const within = (totalCycles - Math.floor(totalCycles)) * CYCLE;
      let blend = within > HOLD ? (within - HOLD) / TRANS : 0;
      blend = smoothstep(Math.min(1, Math.max(0, blend)));

      const A = shapes[idx];
      const B = shapes[(idx + 1) % shapes.length];
      if (!A || !B) { rafId = requestAnimationFrame(tick); return; }

      const mx = mouse.x, my = mouse.y, active = mouse.active;

      const BIN_COUNT = 24;
      const bins: Particle[][] = Array.from({ length: BIN_COUNT }, () => []);
      const ZR = Math.min(W, H) * 0.45;

      for (let i = 0; i < N; i++) {
        const p = particles[i];
        const ix = i * 3;
        const ax = A[ix], ay = A[ix + 1], az = A[ix + 2];
        const bx = B[ix], by = B[ix + 1], bz = B[ix + 2];
        let x = (ax + (bx - ax) * blend) * breathe;
        let y = (ay + (by - ay) * blend) * breathe;
        let z = (az + (bz - az) * blend) * breathe;

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
          let ax2 = (hx - p.x) * SPRING;
          let ay2 = (hy - p.y) * SPRING;
          if (active) {
            const dx = p.x - mx, dy = p.y - my;
            const d2 = dx * dx + dy * dy;
            if (d2 < REPEL_RADIUS_SQ && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const falloff = 1 - d / REPEL_RADIUS;
              const f = (REPEL_FORCE * falloff * falloff) / d;
              ax2 += dx * f / 60;
              ay2 += dy * f / 60;
            }
          }
          p.vx = (p.vx + ax2) * FRICTION;
          p.vy = (p.vy + ay2) * FRICTION;
          p.x += p.vx;
          p.y += p.vy;
        }

        const t = (z2 + ZR) / (2 * ZR);
        let bi = Math.floor(t * BIN_COUNT);
        if (bi < 0) bi = 0; else if (bi >= BIN_COUNT) bi = BIN_COUNT - 1;
        bins[bi].push(p);
      }

      for (let bi = BIN_COUNT - 1; bi >= 0; bi--) {
        for (const p of bins[bi]) {
          const tBright = Math.min(1, Math.max(0.15, p.persp * 0.95));
          const alpha = (0.18 + 0.78 * tBright) * 0.3; // made particles more transparent
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
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        zIndex: 1,
      }}
    />
  );
}
