import React, { useEffect, useRef } from 'react';

interface AmbientSpotlightProps {
  status: 'queued' | 'reproducing' | 'analyzing' | 'patching' | 'verifying' | 'resolved' | 'failed';
}

export const AmbientSpotlight: React.FC<AmbientSpotlightProps> = ({ status }) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animId: number;
    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;
    let isVisible = false;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible && spotlightRef.current) {
        isVisible = true;
        spotlightRef.current.style.opacity = '1';
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
      if (spotlightRef.current) {
        spotlightRef.current.style.opacity = '0';
      }
    };

    // Smooth 60-120fps direct transform lerp without triggering React re-renders
    const loop = () => {
      if (isVisible && spotlightRef.current) {
        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;
        spotlightRef.current.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
      }
      animId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.body.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const getSpotlightColor = () => {
    switch (status) {
      case 'failed':
        return 'rgba(239, 68, 68, 0.08)';
      case 'resolved':
        return 'rgba(74, 222, 128, 0.07)';
      case 'analyzing':
      case 'patching':
        return 'rgba(56, 189, 248, 0.08)';
      case 'reproducing':
      case 'verifying':
        return 'rgba(251, 191, 36, 0.08)';
      default:
        return 'rgba(74, 222, 128, 0.05)';
    }
  };

  return (
    <div
      ref={spotlightRef}
      className="fixed pointer-events-none z-10 w-[500px] h-[500px] rounded-full blur-[100px] transition-colors duration-500 will-change-transform opacity-0"
      style={{
        backgroundColor: getSpotlightColor(),
        mixBlendMode: 'screen',
      }}
    />
  );
};
