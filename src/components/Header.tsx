import React, { useEffect, useState } from 'react';
import {
  Bot,
  GitPullRequest,
  Radio,
  ShieldCheck,
  Cpu,
  Activity,
  Search,
  Volume2,
  VolumeX,
  Zap,
  Gauge,
  Wifi,
} from 'lucide-react';
import { motion } from 'motion/react';
import { playTactileSound, unlockAudio } from '../utils/sound';

interface HeaderProps {
  activeTab: 'simulator' | 'status' | 'webhooks' | 'settings' | 'architecture';
  setActiveTab: (tab: 'simulator' | 'status' | 'webhooks' | 'settings' | 'architecture') => void;
  webhookCount: number;
  onOpenCommandPalette: () => void;
  soundFxEnabled?: boolean;
  onToggleSoundFx?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  webhookCount,
  onOpenCommandPalette,
  soundFxEnabled = true,
  onToggleSoundFx,
}) => {
  const [streamPing, setStreamPing] = useState(86);
  const [microVmLatency, setMicroVmLatency] = useState(14);
  const [fps, setFps] = useState(60);

  // Dynamic telemetry live drift jitter for hyper-realistic fluid cyber telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamPing(Math.floor(82 + Math.random() * 12));
      setMicroVmLatency(Math.floor(12 + Math.random() * 5));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleTabClick = (tab: 'simulator' | 'status' | 'webhooks' | 'settings' | 'architecture') => {
    unlockAudio();
    playTactileSound('tab', soundFxEnabled);
    setActiveTab(tab);
  };

  const handleCommandOpen = () => {
    unlockAudio();
    playTactileSound('modal', soundFxEnabled);
    onOpenCommandPalette();
  };

  const handleSoundToggle = () => {
    unlockAudio();
    if (onToggleSoundFx) {
      onToggleSoundFx();
      if (!soundFxEnabled) {
        setTimeout(() => playTactileSound('openHub', true), 50);
      }
    }
  };

  const navItems = [
    {
      id: 'simulator' as const,
      label: 'Command Tower',
      icon: <GitPullRequest className="w-3.5 h-3.5 text-[#4ade80]" />,
    },
    {
      id: 'status' as const,
      label: 'Status Monitor',
      icon: <Activity className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'webhooks' as const,
      label: 'Webhooks',
      icon: <Radio className="w-3.5 h-3.5 text-cyan-400" />,
      badge: webhookCount,
    },
    {
      id: 'settings' as const,
      label: 'Guardrails',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      id: 'architecture' as const,
      label: 'Architecture',
      icon: <Cpu className="w-3.5 h-3.5 text-purple-400" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#030712]/90 backdrop-blur-xl border-b border-white/10 text-slate-200 shadow-lg">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between min-h-[64px] py-2.5 gap-3">
          {/* Brand & System Status */}
          <div className="flex items-center gap-3 shrink-0">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0b0f19] to-[#1a2333] border border-[#4ade80]/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(74,222,128,0.2)] cursor-pointer"
              onClick={() => handleTabClick('simulator')}
            >
              <Bot className="w-5 h-5 text-[#4ade80] animate-pulse" />
            </motion.div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 flex-nowrap">
                <h1 className="font-bold text-xs sm:text-sm tracking-[0.18em] uppercase text-white whitespace-nowrap">
                  Cyber-Command Agent
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full border border-[#4ade80]/40 text-[#4ade80] bg-[#4ade80]/10 shrink-0 flex items-center gap-1.5 uppercase tracking-wider whitespace-nowrap shadow-[0_0_8px_rgba(74,222,128,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-ping" />
                  Live Sync
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 whitespace-nowrap hidden sm:flex mt-0.5">
                <span className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-cyan-400" />
                  Gemini Stream: <strong className="text-cyan-300">{streamPing}ms</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  MicroVM Latency: <strong className="text-amber-300">{microVmLatency}ms</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Controls & Dynamic Sliding Nav Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
            {/* Search / Cmd+K Pill */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleCommandOpen}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-[#0b0f19]/90 hover:bg-[#1a2333] hover:border-[#4ade80]/40 text-xs font-mono text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer shadow-sm"
              title="Open Command Palette (Cmd + K)"
            >
              <Search className="w-3.5 h-3.5 text-[#4ade80]" />
              <span className="hidden sm:inline">Command Hub</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-white/10 rounded border border-white/10 text-[#4ade80] font-mono font-bold">
                ⌘K
              </span>
            </motion.button>

            {/* Audio Quick-Toggle Button */}
            {onToggleSoundFx && (
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleSoundToggle}
                className={`p-1.5 rounded-lg border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 px-2.5 text-xs font-mono ${
                  soundFxEnabled
                    ? 'bg-[#4ade80]/15 border-[#4ade80]/50 text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.25)]'
                    : 'bg-[#0b0f19] border-white/10 text-slate-500 hover:text-slate-300'
                }`}
                title={
                  soundFxEnabled
                    ? 'Tactile Audio Synthesizer Enabled (Click to Mute)'
                    : 'Tactile Audio Muted (Click to Enable)'
                }
              >
                {soundFxEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#4ade80] animate-pulse" />
                    <span className="hidden md:inline font-bold">Audio ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden md:inline">Muted</span>
                  </>
                )}
              </motion.button>
            )}

            {/* Dynamic Magnetic Sliding Tabs Nav */}
            <nav className="flex items-center gap-1 p-1 rounded-xl bg-[#080d19]/90 border border-white/10 relative">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer z-10 ${
                      isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeHeaderTabGlow"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#19243a] to-[#1c2c48] border border-[#4ade80]/50 shadow-[0_0_14px_rgba(74,222,128,0.22)] z-[-1]"
                        transition={{ type: 'spring', bounce: 0.18, duration: 0.35 }}
                      />
                    )}
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
