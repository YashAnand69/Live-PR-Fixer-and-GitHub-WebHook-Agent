import React, { useEffect, useRef, useState } from 'react';
import { playTactileSound } from '../utils/sound';
import { Waves, Sparkles, Zap, Gauge, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CyberDynamicCanvasProps {
  status: 'queued' | 'reproducing' | 'analyzing' | 'patching' | 'verifying' | 'resolved' | 'failed';
  interactive?: boolean;
  soundFxEnabled?: boolean;
}

// Preset fluid grid configurations for high performance
const QUALITY_CONFIGS = {
  turbo: { N: 36, iterations: 3, particles: 80, label: 'Turbo (120+ FPS)' },
  balanced: { N: 48, iterations: 4, particles: 120, label: 'Balanced (60+ FPS)' },
  ultra: { N: 56, iterations: 4, particles: 150, label: 'High Fidelity' },
};

export const CyberDynamicCanvas: React.FC<CyberDynamicCanvasProps> = ({
  status,
  interactive = true,
  soundFxEnabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [quality, setQuality] = useState<'turbo' | 'balanced' | 'ultra'>('balanced');
  const [viscosity, setViscosity] = useState<number>(0.0001);
  const [showFluidControls, setShowFluidControls] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [frameTimeMs, setFrameTimeMs] = useState<number>(1.2);

  // Status-based color theme
  const getThemeColor = () => {
    switch (status) {
      case 'analyzing':
      case 'patching':
        return { h: 195, s: 90, l: 60, r: 56, g: 189, b: 248 }; // Cyan plasma
      case 'reproducing':
      case 'verifying':
        return { h: 42, s: 95, l: 55, r: 251, g: 191, b: 36 }; // Amber solar flare
      case 'failed':
        return { h: 355, s: 95, l: 58, r: 239, g: 68, b: 68 }; // Crimson glitch fluid
      case 'resolved':
        return { h: 145, s: 85, l: 52, r: 74, g: 222, b: 128 }; // Emerald bio-luminescence
      case 'queued':
      default:
        return { h: 155, s: 80, l: 50, r: 52, g: 211, b: 153 }; // Cyber mint green
    }
  };

  const triggerShockwaveRef = useRef<((x: number, y: number) => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const currentConfig = QUALITY_CONFIGS[quality];
    const N = currentConfig.N;
    const NUM_CELLS = (N + 2) * (N + 2);
    const ITERATIONS = currentConfig.iterations;

    // Fast TypedArray flat allocations
    const u = new Float32Array(NUM_CELLS);
    const v = new Float32Array(NUM_CELLS);
    const u_prev = new Float32Array(NUM_CELLS);
    const v_prev = new Float32Array(NUM_CELLS);
    const dens = new Float32Array(NUM_CELLS);
    const dens_prev = new Float32Array(NUM_CELLS);

    // Offscreen Canvas for instant hardware-accelerated bilinear blit
    const offscreen = document.createElement('canvas');
    offscreen.width = N;
    offscreen.height = N;
    const offCtx = offscreen.getContext('2d');
    const imgData = offCtx ? offCtx.createImageData(N, N) : null;
    const imgDataU32 = imgData ? new Uint32Array(imgData.data.buffer) : null;

    // Particle pool
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }
    const particles: Particle[] = [];
    for (let p = 0; p < currentConfig.particles; p++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: 0,
        vy: 0,
        life: Math.random() * 150,
        maxLife: 150 + Math.random() * 100,
        size: Math.random() * 2 + 1,
      });
    }

    const mouse = {
      x: -1000,
      y: -1000,
      px: -1000,
      py: -1000,
      down: false,
      active: false,
      speed: 0,
    };

    const shockwaves: Array<{ x: number; y: number; radius: number; maxRadius: number; strength: number; hue: number }> = [];

    // Assign trigger shockwave callback
    triggerShockwaveRef.current = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const theme = getThemeColor();
      shockwaves.push({
        x,
        y,
        radius: 6,
        maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.4,
        strength: 1.0,
        hue: theme.h,
      });
      playTactileSound('fluidSplash', soundFxEnabled);
    };

    // Fast 1D index
    const IX = (i: number, j: number) => i + (N + 2) * j;

    const set_bnd = (b: number, x: Float32Array) => {
      const stride = N + 2;
      for (let i = 1; i <= N; i++) {
        x[i * stride] = b === 1 ? -x[1 + i * stride] : x[1 + i * stride];
        x[N + 1 + i * stride] = b === 1 ? -x[N + i * stride] : x[N + i * stride];
        x[i] = b === 2 ? -x[i + stride] : x[i + stride];
        x[i + (N + 1) * stride] = b === 2 ? -x[i + N * stride] : x[i + N * stride];
      }
      x[0] = 0.5 * (x[1] + x[stride]);
      x[(N + 1) * stride] = 0.5 * (x[1 + (N + 1) * stride] + x[N * stride]);
      x[N + 1] = 0.5 * (x[N] + x[N + 1 + stride]);
      x[N + 1 + (N + 1) * stride] = 0.5 * (x[N + (N + 1) * stride] + x[N + 1 + N * stride]);
    };

    const lin_solve = (b: number, x: Float32Array, x0: Float32Array, a: number, c: number) => {
      const invC = 1.0 / c;
      const stride = N + 2;
      for (let k = 0; k < ITERATIONS; k++) {
        for (let j = 1; j <= N; j++) {
          const row = j * stride;
          for (let i = 1; i <= N; i++) {
            const idx = i + row;
            x[idx] = (x0[idx] + a * (x[idx - 1] + x[idx + 1] + x[idx - stride] + x[idx + stride])) * invC;
          }
        }
        set_bnd(b, x);
      }
    };

    const diffuse = (b: number, x: Float32Array, x0: Float32Array, diff: number, dt: number) => {
      const a = dt * diff * N * N;
      lin_solve(b, x, x0, a, 1 + 4 * a);
    };

    const advect = (b: number, d: Float32Array, d0: Float32Array, uVel: Float32Array, vVel: Float32Array, dt: number) => {
      const dt0 = dt * N;
      const stride = N + 2;
      for (let j = 1; j <= N; j++) {
        const row = j * stride;
        for (let i = 1; i <= N; i++) {
          const idx = i + row;
          let x = i - dt0 * uVel[idx];
          let y = j - dt0 * vVel[idx];
          if (x < 0.5) x = 0.5;
          else if (x > N + 0.5) x = N + 0.5;
          const i0 = Math.floor(x);
          const i1 = i0 + 1;

          if (y < 0.5) y = 0.5;
          else if (y > N + 0.5) y = N + 0.5;
          const j0 = Math.floor(y);
          const j1 = j0 + 1;

          const s1 = x - i0;
          const s0 = 1 - s1;
          const t1 = y - j0;
          const t0 = 1 - t1;

          const r0 = j0 * stride;
          const r1 = j1 * stride;

          d[idx] = s0 * (t0 * d0[i0 + r0] + t1 * d0[i0 + r1]) + s1 * (t0 * d0[i1 + r0] + t1 * d0[i1 + r1]);
        }
      }
      set_bnd(b, d);
    };

    const project = (uVel: Float32Array, vVel: Float32Array, p: Float32Array, div: Float32Array) => {
      const stride = N + 2;
      const invN = 1.0 / N;
      for (let j = 1; j <= N; j++) {
        const row = j * stride;
        for (let i = 1; i <= N; i++) {
          const idx = i + row;
          div[idx] = -0.5 * (uVel[idx + 1] - uVel[idx - 1] + vVel[idx + stride] - vVel[idx - stride]) * invN;
          p[idx] = 0;
        }
      }
      set_bnd(0, div);
      set_bnd(0, p);

      lin_solve(0, p, div, 1, 4);

      for (let j = 1; j <= N; j++) {
        const row = j * stride;
        for (let i = 1; i <= N; i++) {
          const idx = i + row;
          uVel[idx] -= 0.5 * N * (p[idx + 1] - p[idx - 1]);
          vVel[idx] -= 0.5 * N * (p[idx + stride] - p[idx - stride]);
        }
      }
      set_bnd(1, uVel);
      set_bnd(2, vVel);
    };

    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();
    let time = 0;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouse.px = mouse.x === -1000 ? e.clientX : mouse.x;
      mouse.py = mouse.y === -1000 ? e.clientY : mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseDown = (e: MouseEvent) => {
      mouse.down = true;
      if (triggerShockwaveRef.current) {
        triggerShockwaveRef.current(e.clientX, e.clientY);
      }
    };

    const handleMouseUp = () => {
      mouse.down = false;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('mousedown', handleMouseDown, { passive: true });
      window.addEventListener('mouseup', handleMouseUp, { passive: true });
      document.body.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }

    // High-performance render loop
    const render = () => {
      const t0 = performance.now();
      const dt = Math.min((t0 - lastTime) / 1000, 0.033);
      lastTime = t0;
      time += 0.02;

      frameCount++;
      if (t0 - fpsTimer >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsTimer = t0;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;
      const theme = getThemeColor();

      // Reset previous forces
      u_prev.fill(0);
      v_prev.fill(0);
      dens_prev.fill(0);

      // 1. Natural ambient currents (Stepped for speed)
      for (let j = 2; j <= N - 1; j += 4) {
        for (let i = 2; i <= N - 1; i += 4) {
          const angle = Math.sin(i * 0.2 + time) * Math.cos(j * 0.2 + time * 0.7) * Math.PI * 2;
          const mag = 6.0;
          const idx = IX(i, j);
          u_prev[idx] += Math.cos(angle) * mag;
          v_prev[idx] += Math.sin(angle) * mag;
          dens_prev[idx] += 0.35;
        }
      }

      // 2. Mouse force injection
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        const cellX = Math.min(N, Math.max(1, Math.floor((mouse.x / w) * N)));
        const cellY = Math.min(N, Math.max(1, Math.floor((mouse.y / h) * N)));
        const dx = (mouse.x - mouse.px) * 0.9;
        const dy = (mouse.y - mouse.py) * 0.9;

        const radius = mouse.down ? 3 : 2;
        const force = mouse.down ? 50 : 30;
        const dye = mouse.down ? 220 : 100;

        for (let rj = -radius; rj <= radius; rj++) {
          const cj = cellY + rj;
          if (cj < 1 || cj > N) continue;
          for (let ri = -radius; ri <= radius; ri++) {
            const ci = cellX + ri;
            if (ci < 1 || ci > N) continue;
            const dist = Math.sqrt(ri * ri + rj * rj);
            if (dist <= radius) {
              const factor = 1 - dist / radius;
              const idx = IX(ci, cj);
              u_prev[idx] += dx * force * factor;
              v_prev[idx] += dy * force * factor;
              dens_prev[idx] += dye * factor;
            }
          }
        }
        mouse.px = mouse.x;
        mouse.py = mouse.y;
      }

      // 3. Fluid Physics Steps
      const dtStep = dt;
      for (let i = 0; i < NUM_CELLS; i++) {
        u[i] += dtStep * u_prev[i];
        v[i] += dtStep * v_prev[i];
        dens[i] += dtStep * dens_prev[i];
      }

      diffuse(1, u_prev, u, viscosity, dtStep);
      diffuse(2, v_prev, v, viscosity, dtStep);
      project(u_prev, v_prev, u, v);

      advect(1, u, u_prev, u_prev, v_prev, dtStep);
      advect(2, v, v_prev, u_prev, v_prev, dtStep);
      project(u, v, u_prev, v_prev);

      diffuse(0, dens_prev, dens, viscosity, dtStep);
      advect(0, dens, dens_prev, u, v, dtStep);

      // Fast decay
      for (let i = 0; i < NUM_CELLS; i++) {
        dens[i] *= 0.985;
      }

      // 4. Ultra-Fast Offscreen Pixel Buffer Rendering
      if (imgDataU32 && offCtx) {
        const { r, g, b } = theme;
        let px = 0;
        for (let j = 1; j <= N; j++) {
          const row = j * (N + 2);
          for (let i = 1; i <= N; i++) {
            const d = dens[i + row];
            if (d > 0.1) {
              const alpha = Math.min(200, Math.floor(d * 14));
              // 32-bit ABGR packed pixel: (A << 24) | (B << 16) | (G << 8) | R
              imgDataU32[px] = (alpha << 24) | (b << 16) | (g << 8) | r;
            } else {
              imgDataU32[px] = 0;
            }
            px++;
          }
        }

        offCtx.putImageData(imgData, 0, 0);

        // Hardware-accelerated blit from offscreen texture with smooth interpolation
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(offscreen, 0, 0, N, N, 0, 0, w, h);
        ctx.restore();
      } else {
        ctx.clearRect(0, 0, w, h);
      }

      // 5. Draw Particles with lightweight alpha passes
      ctx.save();
      const pColor = `hsla(${theme.h}, 90%, 65%, `;
      for (const p of particles) {
        p.life += 1;
        if (p.life >= p.maxLife || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.life = 0;
          p.maxLife = 140 + Math.random() * 80;
        }

        const ci = Math.min(N, Math.max(1, Math.floor((p.x / w) * N)));
        const cj = Math.min(N, Math.max(1, Math.floor((p.y / h) * N)));
        const idx = IX(ci, cj);
        p.vx += (u[idx] * 0.4 - p.vx) * 0.2;
        p.vy += (v[idx] * 0.4 - p.vy) * 0.2;

        p.x += p.vx;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        const alpha = Math.sin(progress * Math.PI) * 0.5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${pColor}${alpha})`;
        ctx.fill();
      }
      ctx.restore();

      // 6. Shockwave wavefronts
      if (shockwaves.length > 0) {
        ctx.save();
        for (let sIdx = shockwaves.length - 1; sIdx >= 0; sIdx--) {
          const sw = shockwaves[sIdx];
          sw.radius += 14;
          sw.strength *= 0.93;

          const cellX = Math.min(N, Math.max(1, Math.floor((sw.x / w) * N)));
          const cellY = Math.min(N, Math.max(1, Math.floor((sw.y / h) * N)));
          const ringRadCells = Math.floor((sw.radius / w) * N);

          for (let a = 0; a < Math.PI * 2; a += 0.6) {
            const rxi = Math.floor(cellX + Math.cos(a) * ringRadCells);
            const ryj = Math.floor(cellY + Math.sin(a) * ringRadCells);
            if (rxi >= 1 && rxi <= N && ryj >= 1 && ryj <= N) {
              const idx = IX(rxi, ryj);
              u[idx] += Math.cos(a) * sw.strength * 22;
              v[idx] += Math.sin(a) * sw.strength * 22;
              dens[idx] += sw.strength * 35;
            }
          }

          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${sw.hue}, 90%, 65%, ${sw.strength * 0.5})`;
          ctx.lineWidth = Math.max(1, 3 * sw.strength);
          ctx.stroke();

          if (sw.radius >= sw.maxRadius || sw.strength < 0.02) {
            shockwaves.splice(sIdx, 1);
          }
        }
        ctx.restore();
      }

      const t1 = performance.now();
      setFrameTimeMs(Number((t1 - t0).toFixed(1)));

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
  }, [status, interactive, quality, viscosity, soundFxEnabled]);

  return (
    <>
      {/* High Performance Fluid GPU Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-85 transition-opacity duration-700"
        style={{ willChange: 'transform' }}
      />

      {/* Floating Fluid Dynamic HUD & FPS Optimizer (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 font-mono">
        <AnimatePresence>
          {showFluidControls && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="p-3.5 rounded-xl bg-[#080d1a]/95 backdrop-blur-xl border border-[#4ade80]/40 shadow-[0_0_25px_rgba(74,222,128,0.2)] text-xs text-slate-200 space-y-3 w-72"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5 font-bold text-[#4ade80]">
                  <Waves className="w-4 h-4 animate-pulse" />
                  GPU Fluid Solver
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    {fps} FPS
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {frameTimeMs}ms
                  </span>
                </div>
              </div>

              {/* Performance Preset Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-cyan-400" />
                    Performance Preset
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#04060d] rounded-lg border border-white/10">
                  {(['turbo', 'balanced', 'ultra'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setQuality(mode);
                        playTactileSound('toggle', soundFxEnabled);
                      }}
                      className={`py-1 rounded text-[10px] font-bold capitalize transition-all cursor-pointer ${
                        quality === mode
                          ? 'bg-[#4ade80] text-black shadow-sm font-black'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {mode === 'turbo' ? '⚡ 120 FPS' : mode === 'balanced' ? '60 FPS' : 'Ultra'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shockwave Trigger Button */}
              <button
                onClick={() => {
                  if (triggerShockwaveRef.current) {
                    triggerShockwaveRef.current(window.innerWidth * 0.5, window.innerHeight * 0.4);
                  }
                }}
                className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-[#4ade80]/40 text-[#4ade80] hover:text-white flex items-center justify-center gap-1.5 transition-all text-[11px] font-bold cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                Trigger Fluid Radial Burst
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
                <span className="flex items-center gap-1 text-emerald-400">
                  <Flame className="w-3 h-3" />
                  Direct Pixel Blit
                </span>
                <span className="text-slate-400 font-bold">{QUALITY_CONFIGS[quality].label}</span>
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
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-[#4ade80] font-bold border border-emerald-500/30">
            {fps} FPS
          </span>
        </motion.button>
      </div>
    </>
  );
};
