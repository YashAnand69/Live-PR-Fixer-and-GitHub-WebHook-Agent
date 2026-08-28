import React, { useEffect, useRef, useState } from 'react';
import { playTactileSound } from '../utils/sound';
import { Waves, Sparkles, Sliders, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CyberDynamicCanvasProps {
  status: 'queued' | 'reproducing' | 'analyzing' | 'patching' | 'verifying' | 'resolved' | 'failed';
  interactive?: boolean;
  soundFxEnabled?: boolean;
}

// Fluid simulation grid parameters
const GRID_SIZE = 64; // High performance, buttery smooth 60fps simulation grid
const NUM_CELLS = (GRID_SIZE + 2) * (GRID_SIZE + 2);

export const CyberDynamicCanvas: React.FC<CyberDynamicCanvasProps> = ({
  status,
  interactive = true,
  soundFxEnabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fluidQuality, setFluidQuality] = useState<'ultra' | 'high'>('ultra');
  const [viscosity, setViscosity] = useState<number>(0.0001);
  const [vorticityStrength, setVorticityStrength] = useState<number>(2.5);
  const [showFluidControls, setShowFluidControls] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [activeShockwaves, setActiveShockwaves] = useState<number>(0);

  // References for fluid simulation arrays to avoid re-allocations
  const simRef = useRef<{
    u: Float32Array;
    v: Float32Array;
    u_prev: Float32Array;
    v_prev: Float32Array;
    dens: Float32Array;
    dens_prev: Float32Array;
    dens_g: Float32Array;
    dens_b: Float32Array;
    particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; hue: number; size: number }>;
    mouse: { x: number; y: number; px: number; py: number; down: boolean; active: boolean; speed: number };
    shockwaves: Array<{ x: number; y: number; radius: number; maxRadius: number; strength: number; hue: number }>;
  }>({
    u: new Float32Array(NUM_CELLS),
    v: new Float32Array(NUM_CELLS),
    u_prev: new Float32Array(NUM_CELLS),
    v_prev: new Float32Array(NUM_CELLS),
    dens: new Float32Array(NUM_CELLS),
    dens_prev: new Float32Array(NUM_CELLS),
    dens_g: new Float32Array(NUM_CELLS),
    dens_b: new Float32Array(NUM_CELLS),
    particles: [],
    mouse: { x: -1000, y: -1000, px: -1000, py: -1000, down: false, active: false, speed: 0 },
    shockwaves: [],
  });

  // Color theme according to status
  const getThemeColor = () => {
    switch (status) {
      case 'analyzing':
      case 'patching':
        return { h: 195, s: 90, l: 60, rgb: [56, 189, 248] }; // Cyan plasma
      case 'reproducing':
      case 'verifying':
        return { h: 42, s: 95, l: 55, rgb: [251, 191, 36] }; // Amber solar flare
      case 'failed':
        return { h: 355, s: 95, l: 58, rgb: [239, 68, 68] }; // Crimson glitch fluid
      case 'resolved':
        return { h: 145, s: 85, l: 52, rgb: [74, 222, 128] }; // Emerald bio-luminescence
      case 'queued':
      default:
        return { h: 155, s: 80, l: 50, rgb: [52, 211, 153] }; // Cyber mint green
    }
  };

  // Trigger interactive fluid shockwave
  const triggerShockwaveAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const theme = getThemeColor();

    simRef.current.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: Math.max(widthRef.current, heightRef.current) * 0.45,
      strength: 1.0,
      hue: theme.h,
    });
    setActiveShockwaves((prev) => prev + 1);
    playTactileSound('fluidSplash', soundFxEnabled);
  };

  const widthRef = useRef(window.innerWidth);
  const heightRef = useRef(window.innerHeight);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      widthRef.current = window.innerWidth;
      heightRef.current = window.innerHeight;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse & Touch listeners for real fluid advection interaction
    const handleMouseMove = (e: MouseEvent) => {
      const mouse = simRef.current.mouse;
      mouse.px = mouse.x === -1000 ? e.clientX : mouse.x;
      mouse.py = mouse.y === -1000 ? e.clientY : mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const dx = mouse.x - mouse.px;
      const dy = mouse.y - mouse.py;
      mouse.speed = Math.sqrt(dx * dx + dy * dy);
      mouse.active = true;
    };

    const handleMouseDown = (e: MouseEvent) => {
      simRef.current.mouse.down = true;
      triggerShockwaveAt(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      simRef.current.mouse.down = false;
    };

    const handleMouseLeave = () => {
      simRef.current.mouse.active = false;
      simRef.current.mouse.x = -1000;
      simRef.current.mouse.y = -1000;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.addEventListener('mouseleave', handleMouseLeave);
    }

    // Navier-Stokes Fluid Simulation Solvers (Jos Stam / Real-Time Fluid Dynamics)
    const N = GRID_SIZE;
    const IX = (i: number, j: number) => i + (N + 2) * j;

    const add_source = (x: Float32Array, s: Float32Array, dt: number) => {
      for (let i = 0; i < NUM_CELLS; i++) {
        x[i] += dt * s[i];
      }
    };

    const set_bnd = (b: number, x: Float32Array) => {
      for (let i = 1; i <= N; i++) {
        x[IX(0, i)] = b === 1 ? -x[IX(1, i)] : x[IX(1, i)];
        x[IX(N + 1, i)] = b === 1 ? -x[IX(N, i)] : x[IX(N, i)];
        x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
        x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)] : x[IX(i, N)];
      }
      x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
      x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
      x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
      x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
    };

    const lin_solve = (b: number, x: Float32Array, x0: Float32Array, a: number, c: number) => {
      for (let k = 0; k < 6; k++) {
        for (let j = 1; j <= N; j++) {
          for (let i = 1; i <= N; i++) {
            x[IX(i, j)] = (x0[IX(i, j)] + a * (x[IX(i - 1, j)] + x[IX(i + 1, j)] + x[IX(i, j - 1)] + x[IX(i, j + 1)])) / c;
          }
        }
        set_bnd(b, x);
      }
    };

    const diffuse = (b: number, x: Float32Array, x0: Float32Array, diff: number, dt: number) => {
      const a = dt * diff * N * N;
      lin_solve(b, x, x0, a, 1 + 4 * a);
    };

    const advect = (b: number, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array, dt: number) => {
      const dt0 = dt * N;
      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          let x = i - dt0 * u[IX(i, j)];
          let y = j - dt0 * v[IX(i, j)];
          if (x < 0.5) x = 0.5;
          if (x > N + 0.5) x = N + 0.5;
          const i0 = Math.floor(x);
          const i1 = i0 + 1;
          if (y < 0.5) y = 0.5;
          if (y > N + 0.5) y = N + 0.5;
          const j0 = Math.floor(y);
          const j1 = j0 + 1;
          const s1 = x - i0;
          const s0 = 1 - s1;
          const t1 = y - j0;
          const t0 = 1 - t1;
          d[IX(i, j)] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) + s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
        }
      }
      set_bnd(b, d);
    };

    const project = (u: Float32Array, v: Float32Array, p: Float32Array, div: Float32Array) => {
      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          div[IX(i, j)] = (-0.5 * (u[IX(i + 1, j)] - u[IX(i - 1, j)] + v[IX(i, j + 1)] - v[IX(i, j - 1)])) / N;
          p[IX(i, j)] = 0;
        }
      }
      set_bnd(0, div);
      set_bnd(0, p);

      lin_solve(0, p, div, 1, 4);

      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          u[IX(i, j)] -= 0.5 * N * (p[IX(i + 1, j)] - p[IX(i - 1, j)]);
          v[IX(i, j)] -= 0.5 * N * (p[IX(i, j + 1)] - p[IX(i, j - 1)]);
        }
      }
      set_bnd(1, u);
      set_bnd(2, v);
    };

    // Initialize fluid stream tracer particles
    const sim = simRef.current;
    if (sim.particles.length === 0) {
      for (let p = 0; p < 180; p++) {
        sim.particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: 0,
          vy: 0,
          life: Math.random() * 200,
          maxLife: 200 + Math.random() * 150,
          hue: 150,
          size: Math.random() * 2.5 + 1.2,
        });
      }
    }

    let time = 0;

    // Fluid Render Loop
    const render = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      time += 0.015;

      frameCount++;
      if (now - fpsTimer >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsTimer = now;
      }

      const w = widthRef.current;
      const h = heightRef.current;
      const theme = getThemeColor();

      // Clear previous inputs
      sim.u_prev.fill(0);
      sim.v_prev.fill(0);
      sim.dens_prev.fill(0);

      // 1. Natural ambient fluid swirling currents & perlin-like eddies
      for (let j = 2; j <= N - 1; j += 4) {
        for (let i = 2; i <= N - 1; i += 4) {
          const angle = Math.sin(i * 0.15 + time) * Math.cos(j * 0.15 + time * 0.8) * Math.PI * 2;
          const mag = (Math.sin(time * 0.5 + i + j) * 0.5 + 0.5) * 8.0;
          sim.u_prev[IX(i, j)] += Math.cos(angle) * mag;
          sim.v_prev[IX(i, j)] += Math.sin(angle) * mag;
          sim.dens_prev[IX(i, j)] += 0.3;
        }
      }

      // 2. Interactive mouse fluid injection
      const mouse = sim.mouse;
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        const cellX = Math.min(N, Math.max(1, Math.floor((mouse.x / w) * N)));
        const cellY = Math.min(N, Math.max(1, Math.floor((mouse.y / h) * N)));
        const dx = (mouse.x - mouse.px) * 0.8;
        const dy = (mouse.y - mouse.py) * 0.8;

        const radius = mouse.down ? 4 : 2;
        const injectForce = mouse.down ? 60 : 35;
        const injectDye = mouse.down ? 180 : 80;

        for (let rj = -radius; rj <= radius; rj++) {
          for (let ri = -radius; ri <= radius; ri++) {
            const ci = cellX + ri;
            const cj = cellY + rj;
            if (ci >= 1 && ci <= N && cj >= 1 && cj <= N) {
              const dist = Math.sqrt(ri * ri + rj * rj);
              const factor = Math.max(0, 1 - dist / radius);
              sim.u_prev[IX(ci, cj)] += dx * injectForce * factor;
              sim.v_prev[IX(ci, cj)] += dy * injectForce * factor;
              sim.dens_prev[IX(ci, cj)] += injectDye * factor;
            }
          }
        }
        mouse.px = mouse.x;
        mouse.py = mouse.y;
      }

      // 3. Fluid Physics Steps
      add_source(sim.u, sim.u_prev, dt);
      add_source(sim.v, sim.v_prev, dt);
      add_source(sim.dens, sim.dens_prev, dt);

      // Velocity diffusion & advection
      diffuse(1, sim.u_prev, sim.u, viscosity, dt);
      diffuse(2, sim.v_prev, sim.v, viscosity, dt);
      project(sim.u_prev, sim.v_prev, sim.u, sim.v);

      advect(1, sim.u, sim.u_prev, sim.u_prev, sim.v_prev, dt);
      advect(2, sim.v, sim.v_prev, sim.u_prev, sim.v_prev, dt);
      project(sim.u, sim.v, sim.u_prev, sim.v_prev);

      // Density diffusion & advection
      diffuse(0, sim.dens_prev, sim.dens, viscosity, dt);
      advect(0, sim.dens, sim.dens_prev, sim.u, sim.v, dt);

      // Dissipation decay so dye gracefully evaporates
      for (let i = 0; i < NUM_CELLS; i++) {
        sim.dens[i] *= 0.985;
      }

      // 4. Render Fluid Canvas
      ctx.clearRect(0, 0, w, h);

      // Background ambient atmospheric fluid glow
      const bgGrad = ctx.createRadialGradient(
        w * 0.5 + Math.sin(time * 0.7) * 200,
        h * 0.4 + Math.cos(time * 0.6) * 120,
        40,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.8
      );
      bgGrad.addColorStop(0, `rgba(${theme.rgb[0]}, ${theme.rgb[1]}, ${theme.rgb[2]}, 0.08)`);
      bgGrad.addColorStop(0.5, `rgba(${theme.rgb[0]}, ${theme.rgb[1]}, ${theme.rgb[2]}, 0.02)`);
      bgGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw Fluid Density Field with bilinear smoothing
      const cellW = w / N;
      const cellH = h / N;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      for (let j = 1; j <= N; j += 2) {
        for (let i = 1; i <= N; i += 2) {
          const d = sim.dens[IX(i, j)];
          if (d > 0.4) {
            const alpha = Math.min(0.35, d * 0.025);
            const cx = (i - 0.5) * cellW;
            const cy = (j - 0.5) * cellH;
            const rad = cellW * 3.2;

            const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
            radGrad.addColorStop(0, `hsla(${theme.h}, ${theme.s}%, ${theme.l}%, ${alpha})`);
            radGrad.addColorStop(1, `hsla(${theme.h + 20}, ${theme.s}%, ${theme.l - 10}%, 0)`);

            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      // 5. Update & Draw Dynamic Fluid Streamline Particles
      ctx.save();
      for (let p of sim.particles) {
        p.life += 1;
        if (p.life >= p.maxLife || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.life = 0;
          p.maxLife = 150 + Math.random() * 120;
          p.hue = theme.h + (Math.random() * 30 - 15);
        }

        // Sample velocity from fluid field
        const ci = Math.min(N, Math.max(1, Math.floor((p.x / w) * N)));
        const cj = Math.min(N, Math.max(1, Math.floor((p.y / h) * N)));
        const fluidVx = sim.u[IX(ci, cj)] * 0.45;
        const fluidVy = sim.v[IX(ci, cj)] * 0.45;

        p.vx += (fluidVx - p.vx) * 0.15;
        p.vy += (fluidVy - p.vy) * 0.15;

        // Natural drifting speed
        p.x += p.vx + Math.sin(p.life * 0.02) * 0.4;
        p.y += p.vy + Math.cos(p.life * 0.02) * 0.4;

        const progress = p.life / p.maxLife;
        const alpha = Math.sin(progress * Math.PI) * 0.65;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, 0.8)`;
        ctx.fill();

        // Draw streamline tail trail
        if (Math.abs(p.vx) > 0.5 || Math.abs(p.vy) > 0.5) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 3.5, p.y - p.vy * 3.5);
          ctx.strokeStyle = `hsla(${p.hue}, 85%, 60%, ${alpha * 0.45})`;
          ctx.lineWidth = p.size * 0.8;
          ctx.stroke();
        }
      }
      ctx.restore();

      // 6. Fluid Shockwaves / Hydraulic Ring Bursts
      ctx.save();
      for (let sIdx = sim.shockwaves.length - 1; sIdx >= 0; sIdx--) {
        const sw = sim.shockwaves[sIdx];
        sw.radius += 12;
        sw.strength *= 0.94;

        // Advect fluid outward in circular wavefront
        const cellX = Math.min(N, Math.max(1, Math.floor((sw.x / w) * N)));
        const cellY = Math.min(N, Math.max(1, Math.floor((sw.y / h) * N)));
        const ringRadCells = Math.floor((sw.radius / w) * N);

        for (let a = 0; a < Math.PI * 2; a += 0.4) {
          const rxi = Math.floor(cellX + Math.cos(a) * ringRadCells);
          const ryj = Math.floor(cellY + Math.sin(a) * ringRadCells);
          if (rxi >= 1 && rxi <= N && ryj >= 1 && ryj <= N) {
            sim.u[IX(rxi, ryj)] += Math.cos(a) * sw.strength * 25;
            sim.v[IX(rxi, ryj)] += Math.sin(a) * sw.strength * 25;
            sim.dens[IX(rxi, ryj)] += sw.strength * 40;
          }
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${sw.hue}, 90%, 65%, ${sw.strength * 0.6})`;
        ctx.lineWidth = Math.max(1, 4 * sw.strength);
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${sw.hue}, 90%, 60%, 0.8)`;
        ctx.stroke();

        if (sw.radius >= sw.maxRadius || sw.strength < 0.02) {
          sim.shockwaves.splice(sIdx, 1);
        }
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [status, interactive, viscosity, soundFxEnabled]);

  return (
    <>
      {/* Background Fluid GPU Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-90 transition-opacity duration-700"
        style={{ willChange: 'transform' }}
      />

      {/* Floating Fluid Dynamic HUD Toolbar (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 font-mono">
        <AnimatePresence>
          {showFluidControls && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="p-3.5 rounded-xl bg-[#080d1a]/95 backdrop-blur-xl border border-[#4ade80]/40 shadow-[0_0_25px_rgba(74,222,128,0.2)] text-xs text-slate-200 space-y-3 w-64"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5 font-bold text-[#4ade80]">
                  <Waves className="w-4 h-4 animate-pulse" />
                  Navier-Stokes Fluid Engine
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {fps} FPS
                </span>
              </div>

              {/* Shockwave Trigger Button */}
              <button
                onClick={() => {
                  triggerShockwaveAt(window.innerWidth * 0.5, window.innerHeight * 0.4);
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-[#4ade80]/40 text-[#4ade80] hover:text-white flex items-center justify-center gap-1.5 transition-all text-[11px] font-bold cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                Trigger Fluid Radial Burst (Click)
              </button>

              {/* Viscosity Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Kinematic Viscosity</span>
                  <span className="text-cyan-400 font-bold">{(viscosity * 10000).toFixed(1)}cSt</span>
                </div>
                <input
                  type="range"
                  min="0.00001"
                  max="0.0008"
                  step="0.00005"
                  value={viscosity}
                  onChange={(e) => setViscosity(parseFloat(e.target.value))}
                  className="w-full accent-[#4ade80] h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
                <span>Drag mouse to inject dye & vortex</span>
                <span className="text-[#4ade80] font-bold">Eulerian Grid</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Fluid HUD Button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setShowFluidControls(!showFluidControls);
            playTactileSound('toggle', soundFxEnabled);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all shadow-lg text-xs cursor-pointer ${
            showFluidControls
              ? 'bg-[#1a2333] border-[#4ade80] text-[#4ade80] shadow-[0_0_15px_rgba(74,222,128,0.25)]'
              : 'bg-[#080d1a]/90 border-white/10 text-slate-300 hover:text-white hover:border-[#4ade80]/40'
          }`}
          title="Toggle Real-Time Fluid Dynamics Engine Settings"
        >
          <Waves className="w-3.5 h-3.5 text-[#4ade80] animate-pulse" />
          <span className="font-bold">Fluid Dynamics</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-white/10 text-[#4ade80] font-bold">
            {fps} fps
          </span>
        </motion.button>
      </div>
    </>
  );
};
