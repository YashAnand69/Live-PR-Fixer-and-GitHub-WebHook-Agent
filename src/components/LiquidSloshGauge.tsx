import React, { useEffect, useRef } from 'react';

interface LiquidSloshGaugeProps {
  value: number; // 0 to 100
  label?: string;
  sublabel?: string;
  color?: string;
  accentGlow?: string;
  height?: number;
}

export const LiquidSloshGauge: React.FC<LiquidSloshGaugeProps> = ({
  value,
  label = 'Hydrodynamic Load',
  sublabel = 'Fluid Meniscus Dynamic Balance',
  color = '#4ade80',
  accentGlow = 'rgba(74, 222, 128, 0.3)',
  height = 90,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentLevelRef = useRef(value);
  const bubblesRef = useRef<Array<{ x: number; y: number; r: number; speed: number; opacity: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Initialize bubbles
    if (bubblesRef.current.length === 0) {
      for (let i = 0; i < 16; i++) {
        bubblesRef.current.push({
          x: Math.random() * 260,
          y: Math.random() * height,
          r: Math.random() * 2 + 1,
          speed: Math.random() * 0.8 + 0.3,
          opacity: Math.random() * 0.6 + 0.2,
        });
      }
    }

    const render = () => {
      time += 0.045;
      // Fluid level inertia smoothing
      currentLevelRef.current += (value - currentLevelRef.current) * 0.08;

      const w = canvas.width;
      const h = canvas.height;
      const fillHeight = (currentLevelRef.current / 100) * (h - 10);
      const baseWaterY = h - fillHeight;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw Liquid Primary Sine Wave
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, baseWaterY);

      for (let x = 0; x <= w; x += 4) {
        const wave1 = Math.sin(x * 0.04 + time * 1.8) * 4.5;
        const wave2 = Math.cos(x * 0.02 - time * 1.2) * 2.5;
        const y = baseWaterY + wave1 + wave2;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(w, h);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, baseWaterY, 0, h);
      grad.addColorStop(0, color);
      grad.addColorStop(1, '#052e16');
      ctx.fillStyle = grad;
      ctx.shadowBlur = 12;
      ctx.shadowColor = accentGlow;
      ctx.fill();
      ctx.restore();

      // 2. Draw Secondary Back Wave (Translucent Meniscus)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, baseWaterY);

      for (let x = 0; x <= w; x += 4) {
        const waveBack = Math.sin(x * 0.035 - time * 2.2 + 1.2) * 3.5;
        const y = baseWaterY + waveBack;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.restore();

      // 3. Render Rising Micro-Bubbles
      ctx.save();
      for (const b of bubblesRef.current) {
        b.y -= b.speed;
        b.x += Math.sin(time + b.y * 0.05) * 0.3;

        if (b.y < baseWaterY) {
          b.y = h + Math.random() * 10;
          b.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.7})`;
        ctx.fill();
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [value, color, accentGlow, height]);

  return (
    <div className="p-3.5 rounded-xl bg-[#05070f]/90 border border-white/10 relative overflow-hidden space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="font-bold text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
          {label}
        </span>
        <span className="text-[#4ade80] font-bold text-sm bg-[#4ade80]/15 px-2 py-0.5 rounded border border-[#4ade80]/40 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
          {Math.round(value)}%
        </span>
      </div>

      {/* Canvas Wave Reservoir */}
      <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#0b0f19] h-[55px]">
        <canvas
          ref={canvasRef}
          width={280}
          height={55}
          className="w-full h-full block"
        />
        {/* Surface reflection highlight line */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>{sublabel}</span>
        <span className="text-cyan-400 font-semibold">Surface Tension 0.98</span>
      </div>
    </div>
  );
};
