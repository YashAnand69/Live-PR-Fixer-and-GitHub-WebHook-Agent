import React, { useEffect, useRef } from 'react';

interface CyberDynamicCanvasProps {
  status: 'queued' | 'reproducing' | 'analyzing' | 'patching' | 'verifying' | 'resolved' | 'failed';
  interactive?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  hue: number;
}

export const CyberDynamicCanvas: React.FC<CyberDynamicCanvasProps> = ({
  status,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean; radius: number }>({
    x: -1000,
    y: -1000,
    active: false,
    radius: 140,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);
    }

    // Determine color schemes and particle density based on status
    const getStatusParams = () => {
      switch (status) {
        case 'analyzing':
        case 'patching':
          return { hue: 190, speedMult: 1.6, linkDist: 120, maxCount: 50 }; // Cyan/Blue energetic
        case 'reproducing':
        case 'verifying':
          return { hue: 45, speedMult: 1.8, linkDist: 130, maxCount: 55 }; // Amber/Gold runner
        case 'failed':
          return { hue: 350, speedMult: 2.2, linkDist: 140, maxCount: 65 }; // Crimson chromatic
        case 'resolved':
          return { hue: 145, speedMult: 0.9, linkDist: 110, maxCount: 45 }; // Emerald calm
        case 'queued':
        default:
          return { hue: 150, speedMult: 0.7, linkDist: 100, maxCount: 40 }; // Subtle ambient green
      }
    };

    let particles: Particle[] = [];

    const initParticles = () => {
      const { hue, maxCount } = getStatusParams();
      particles = [];
      const count = Math.min(maxCount, Math.floor((width * height) / 24000));

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.7,
          vy: (Math.random() - 0.5) * 0.7,
          size: Math.random() * 2.2 + 1,
          baseAlpha: Math.random() * 0.4 + 0.2,
          alpha: Math.random() * 0.4 + 0.2,
          hue: hue + (Math.random() * 20 - 10),
        });
      }
    };

    initParticles();

    let time = 0;

    const render = () => {
      time += 0.02;
      const { hue, speedMult, linkDist } = getStatusParams();

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle ambient fluid wave gradient
      const grad = ctx.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.5) * 150,
        height * 0.35 + Math.cos(time * 0.4) * 80,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );

      if (status === 'failed') {
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.07)');
        grad.addColorStop(0.5, 'rgba(153, 27, 27, 0.03)');
        grad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      } else if (status === 'resolved') {
        grad.addColorStop(0, 'rgba(74, 222, 128, 0.06)');
        grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.02)');
        grad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      } else if (status === 'analyzing' || status === 'patching') {
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
        grad.addColorStop(0.5, 'rgba(14, 165, 233, 0.03)');
        grad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      } else {
        grad.addColorStop(0, 'rgba(74, 222, 128, 0.04)');
        grad.addColorStop(0.6, 'rgba(6, 78, 59, 0.01)');
        grad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Update and draw particles with interactive physics
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Smoothly interpolate hue towards current status hue
        p.hue += (hue - p.hue) * 0.05;

        // Base velocity
        p.x += p.vx * speedMult;
        p.y += p.vy * speedMult;

        // Screen wrap
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Interactive mouse repulsion/attraction
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseRef.current.radius) {
            const force = (1 - dist / mouseRef.current.radius) * 1.5;
            p.x -= (dx / dist) * force * 3;
            p.y -= (dy / dist) * force * 3;
            p.alpha = Math.min(1, p.baseAlpha + force * 0.6);
          } else {
            p.alpha += (p.baseAlpha - p.alpha) * 0.05;
          }
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 55%, 0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw dynamic glowing filament connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < linkDist) {
            const linkAlpha = (1 - dist / linkDist) * 0.25 * (p.alpha + p2.alpha) * 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${p.hue}, 80%, 65%, ${linkAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [status, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80 transition-opacity duration-700"
      style={{ willChange: 'transform' }}
    />
  );
};
