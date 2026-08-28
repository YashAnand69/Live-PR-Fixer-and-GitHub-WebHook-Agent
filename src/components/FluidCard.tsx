import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface FluidCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  enableTilt?: boolean;
  onClick?: () => void;
}

export const FluidCard: React.FC<FluidCardProps> = ({
  children,
  className = '',
  glowColor = '#4ade80',
  enableTilt = true,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Raw mouse coordinates normalized from -0.5 to 0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for fluid, physics-based responsiveness without jarring snaps
  const springConfig = { damping: 22, stiffness: 260, mass: 0.6 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), springConfig);
  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springConfig);
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !enableTilt) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      style={{
        perspective: 1200,
        transformStyle: 'preserve-3d',
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative rounded-xl border border-white/10 bg-[#080d1a]/85 backdrop-blur-xl transition-shadow duration-300 ${
        isHovered ? 'shadow-[0_0_30px_rgba(74,222,128,0.15)] border-white/20' : 'shadow-md'
      } ${className}`}
    >
      {/* Dynamic Specular Fluid Sheen Layer */}
      {isHovered && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-40 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${glowX.get()}% ${glowY.get()}%, rgba(255,255,255,0.12), transparent 70%)`,
          }}
        />
      )}

      {/* Dynamic Perimeter Glow */}
      {isHovered && (
        <motion.div
          className="pointer-events-none absolute -inset-[1px] rounded-xl opacity-30 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(280px circle at ${glowX.get()}% ${glowY.get()}%, ${glowColor}, transparent 60%)`,
          }}
        />
      )}

      {/* Card Body with 3D Pop */}
      <div className="relative z-10 w-full h-full" style={{ transform: 'translateZ(10px)' }}>
        {children}
      </div>
    </motion.div>
  );
};
