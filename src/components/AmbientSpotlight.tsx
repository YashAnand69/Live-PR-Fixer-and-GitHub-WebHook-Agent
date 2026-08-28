import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface AmbientSpotlightProps {
  status: 'queued' | 'reproducing' | 'analyzing' | 'patching' | 'verifying' | 'resolved' | 'failed';
}

export const AmbientSpotlight: React.FC<AmbientSpotlightProps> = ({ status }) => {
  const [mousePosition, setMousePosition] = useState({ x: -500, y: -500 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

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

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-10 w-[500px] h-[500px] rounded-full blur-[100px] transition-colors duration-500"
      animate={{
        x: mousePosition.x - 250,
        y: mousePosition.y - 250,
        backgroundColor: getSpotlightColor(),
      }}
      transition={{
        type: 'spring',
        damping: 35,
        stiffness: 250,
        mass: 0.5,
      }}
      style={{
        mixBlendMode: 'screen',
      }}
    />
  );
};
