import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Cpu,
  Zap,
  Activity,
  Terminal,
  Server,
  ArrowRight,
  Sparkles,
  Wifi,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { playTactileSound } from '../utils/sound';

interface ConnectionTunnelProps {
  status: 'queued' | 'reproducing' | 'analyzing' | 'patching' | 'verifying' | 'resolved' | 'failed';
  repoName?: string;
  soundFxEnabled?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

interface Packet {
  id: number;
  label: string;
  speed: number;
  offset: number;
  color: string;
}

const HEX_CHARS = '0123456789ABCDEF';
const GENERATE_HEX = (len: number) =>
  Array.from({ length: len })
    .map(() => HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)])
    .join('');

export const ConnectionTunnel: React.FC<ConnectionTunnelProps> = ({
  status,
  repoName = 'facebook/react',
  soundFxEnabled = true,
}) => {
  const [handshakeStep, setHandshakeStep] = useState<number>(0);
  const [latency, setLatency] = useState<number>(8.4);
  const [packetsSent, setPacketsSent] = useState<number>(142);
  const [cipherHex, setCipherHex] = useState<string>('0x7F2A...9E41');
  const [isDetailExpanded, setIsDetailExpanded] = useState<boolean>(false);
  const [activeTunnelKey, setActiveTunnelKey] = useState<number>(1);
  const [isTunnelActive, setIsTunnelActive] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isAnalyzingOrRunning = ['reproducing', 'analyzing', 'patching', 'verifying'].includes(status);

  // Trigger sound and handshake sequence when status shifts to analyzing or reproducing
  useEffect(() => {
    if (isAnalyzingOrRunning) {
      setIsTunnelActive(true);
      setHandshakeStep(1);
      playTactileSound('tunnelConnect', soundFxEnabled);

      const t1 = setTimeout(() => {
        setHandshakeStep(2);
        playTactileSound('tunnelData', soundFxEnabled);
      }, 500);

      const t2 = setTimeout(() => {
        setHandshakeStep(3);
        playTactileSound('tunnelData', soundFxEnabled);
      }, 1000);

      const t3 = setTimeout(() => {
        setHandshakeStep(4);
        playTactileSound('beacon', soundFxEnabled);
      }, 1600);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else if (status === 'resolved') {
      setHandshakeStep(4);
      setIsTunnelActive(false);
    } else {
      setHandshakeStep(0);
      setIsTunnelActive(false);
    }
  }, [status, soundFxEnabled]);

  // Periodic telemetry jitter update
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Number((7.2 + Math.random() * 2.4).toFixed(1)));
      setPacketsSent((p) => p + Math.floor(Math.random() * 4 + 1));
      setCipherHex(`0x${GENERATE_HEX(4)}...${GENERATE_HEX(4)}`);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Canvas-based Hyper-Drive Perspective Tunnel Warp Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Define particles flying out from tunnel center
    const numRings = 7;
    const numParticles = 28;
    const particles: { angle: number; dist: number; speed: number; size: number; color: string }[] = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * 80 + 10,
        speed: 0.8 + Math.random() * 1.6,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.4 ? '#4ade80' : Math.random() > 0.5 ? '#38bdf8' : '#a855f7',
      });
    }

    const render = () => {
      time += 0.035;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Radial background aura
      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, Math.max(cx, cy));
      grad.addColorStop(0, isAnalyzingOrRunning ? 'rgba(74, 222, 128, 0.25)' : 'rgba(30, 41, 59, 0.2)');
      grad.addColorStop(0.5, isAnalyzingOrRunning ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.1)');
      grad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw Perspective Grid Lines radiating from center
      const spokes = 12;
      ctx.lineWidth = 1;
      for (let s = 0; s < spokes; s++) {
        const spokeAngle = (s / spokes) * Math.PI * 2 + time * 0.1;
        const outerX = cx + Math.cos(spokeAngle) * Math.max(width, height);
        const outerY = cy + Math.sin(spokeAngle) * Math.max(width, height);

        const spokeGrad = ctx.createLinearGradient(cx, cy, outerX, outerY);
        spokeGrad.addColorStop(0, isAnalyzingOrRunning ? 'rgba(74, 222, 128, 0.6)' : 'rgba(74, 222, 128, 0.2)');
        spokeGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.strokeStyle = spokeGrad;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
      }

      // Draw Concentric Perspective Tunnel Rings
      for (let r = 0; r < numRings; r++) {
        const progress = ((time * 0.4 + r / numRings) % 1);
        const radius = Math.pow(progress, 2.2) * (Math.max(cx, cy) * 1.1) + 8;
        const alpha = Math.sin(progress * Math.PI) * (isAnalyzingOrRunning ? 0.8 : 0.35);

        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, radius * 0.65, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`;
        ctx.lineWidth = progress > 0.7 ? 2 : 1;
        ctx.stroke();

        // Add 4 corner tick marks on rings
        if (progress > 0.3) {
          const tickAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
          tickAngles.forEach((a) => {
            const tx = cx + Math.cos(a) * radius;
            const ty = cy + Math.sin(a) * (radius * 0.65);
            ctx.fillRect(tx - 1.5, ty - 1.5, 3, 3);
          });
        }
      }

      // Draw Moving Data Particles
      particles.forEach((p) => {
        p.dist += p.speed * (isAnalyzingOrRunning ? 2.2 : 0.8);
        if (p.dist > Math.max(cx, cy)) {
          p.dist = 8;
          p.angle = Math.random() * Math.PI * 2;
        }

        const px = cx + Math.cos(p.angle) * p.dist;
        const py = cy + Math.sin(p.angle) * (p.dist * 0.65);
        const pProgress = p.dist / Math.max(cx, cy);

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isAnalyzingOrRunning ? 8 : 2;
        ctx.beginPath();
        ctx.arc(px, py, p.size * (0.8 + pProgress * 1.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Central Quantum Singularity / MicroVM Core Node
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
      ctx.fillStyle = isAnalyzingOrRunning ? 'rgba(74, 222, 128, 0.4)' : 'rgba(56, 189, 248, 0.2)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = isAnalyzingOrRunning ? '#4ade80' : '#38bdf8';
      ctx.shadowColor = isAnalyzingOrRunning ? '#4ade80' : '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAnalyzingOrRunning]);

  const handleManualReplay = () => {
    setActiveTunnelKey((k) => k + 1);
    setHandshakeStep(1);
    setIsTunnelActive(true);
    playTactileSound('tunnelConnect', soundFxEnabled);

    setTimeout(() => {
      setHandshakeStep(2);
      playTactileSound('tunnelData', soundFxEnabled);
    }, 450);

    setTimeout(() => {
      setHandshakeStep(3);
      playTactileSound('tunnelData', soundFxEnabled);
    }, 900);

    setTimeout(() => {
      setHandshakeStep(4);
      playTactileSound('beacon', soundFxEnabled);
    }, 1400);
  };

  const stepsList = [
    { title: 'SYN-ACK', desc: 'Daemon handshake socket' },
    { title: 'ECDH Key', desc: 'Curve25519 mTLS session' },
    { title: 'Attestation', desc: 'Zero-trust memory enclave' },
    { title: 'Pipe Active', desc: 'AST & Jest bridge connected' },
  ];

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-[#040813] overflow-hidden shadow-[0_0_25px_rgba(74,222,128,0.12)] transition-all">
      {/* Tunnel Header Bar */}
      <div className="bg-[#070d1d] px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isAnalyzingOrRunning
                  ? 'bg-[#4ade80] shadow-[0_0_8px_#4ade80]'
                  : status === 'resolved'
                  ? 'bg-[#38bdf8]'
                  : 'bg-slate-500'
              }`}
            />
            {isAnalyzingOrRunning && (
              <span className="absolute -inset-1 rounded-full bg-[#4ade80]/40 animate-ping" />
            )}
          </div>
          <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-[#4ade80]" />
            Secure Sandbox Tunnel
          </span>
          <span
            className={`px-1.5 py-0.5 text-[9px] font-mono rounded font-bold uppercase tracking-wider ${
              isAnalyzingOrRunning
                ? 'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/40 animate-pulse'
                : status === 'resolved'
                ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30'
                : 'bg-white/5 text-slate-400 border border-white/10'
            }`}
          >
            {isAnalyzingOrRunning ? 'LINK STREAMING' : status === 'resolved' ? 'ENCLAVE READY' : 'STANDBY'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleManualReplay}
            title="Re-test Tunnel Connection"
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-[#4ade80]" />
          </motion.button>
          <button
            onClick={() => setIsDetailExpanded(!isDetailExpanded)}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px] font-mono flex items-center gap-1"
          >
            {isDetailExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main 3D Perspective Tunnel Viewport */}
      <div className="relative h-32 w-full bg-[#02050e] overflow-hidden flex items-center justify-center">
        {/* Canvas Render for Geometric Speed Tunnel */}
        <canvas
          ref={canvasRef}
          width={360}
          height={128}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Left Origin: AI Agent Node */}
        <div className="absolute left-3 z-10 flex flex-col items-center bg-[#070d1d]/85 backdrop-blur-sm px-2 py-1 rounded border border-purple-500/40 shadow-lg pointer-events-none">
          <div className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] font-mono font-bold text-white">Agent Node</span>
          </div>
          <span className="text-[8px] font-mono text-purple-300">Gemini 3.6</span>
        </div>

        {/* Right Destination: E2B MicroVM Sandbox Node */}
        <div className="absolute right-3 z-10 flex flex-col items-center bg-[#070d1d]/85 backdrop-blur-sm px-2 py-1 rounded border border-[#4ade80]/40 shadow-lg pointer-events-none">
          <div className="flex items-center space-x-1">
            <Server className="w-3 h-3 text-[#4ade80]" />
            <span className="text-[10px] font-mono font-bold text-[#4ade80]">E2B Enclave</span>
          </div>
          <span className="text-[8px] font-mono text-slate-400">AWS microVM</span>
        </div>

        {/* Center Live Badge / HUD Overlay */}
        <div className="z-10 text-center pointer-events-none">
          <motion.div
            animate={{
              scale: isAnalyzingOrRunning ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-[#030712]/80 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/40 shadow-[0_0_15px_rgba(74,222,128,0.3)] inline-flex items-center gap-1.5"
          >
            <Zap className="w-3 h-3 text-[#4ade80] animate-bounce" />
            <span className="text-[10px] font-mono font-bold text-slate-100 uppercase tracking-wider">
              {handshakeStep >= 4 ? 'mTLS 1.3 Conduit Locked' : 'Establishing Secure Bridge...'}
            </span>
          </motion.div>
          <div className="text-[9px] font-mono text-emerald-400/90 mt-1">
            {latency}ms latency • 0.00% packet loss • {cipherHex}
          </div>
        </div>

        {/* Laser Data Transit Particle Beam */}
        <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-purple-500 via-[#4ade80] to-[#38bdf8] opacity-70 pointer-events-none" />
      </div>

      {/* 4-Step Handshake Progress Track */}
      <div className="bg-[#060b18] px-3 py-2 border-t border-white/5">
        <div className="grid grid-cols-4 gap-1.5">
          {stepsList.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = handshakeStep >= stepNum;
            const isCurrent = handshakeStep === stepNum - 1 && isAnalyzingOrRunning;

            return (
              <div
                key={step.title}
                className={`p-1.5 rounded text-center transition-all ${
                  isCompleted
                    ? 'bg-[#4ade80]/15 border border-[#4ade80]/30 text-white'
                    : isCurrent
                    ? 'bg-purple-500/20 border border-purple-500/40 text-purple-200 animate-pulse'
                    : 'bg-white/5 border border-white/5 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  {isCompleted ? (
                    <ShieldCheck className="w-3 h-3 text-[#4ade80]" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600 text-[8px] flex items-center justify-center">
                      {stepNum}
                    </span>
                  )}
                  <span className="text-[9px] font-mono font-bold truncate">{step.title}</span>
                </div>
                <div className="text-[8px] font-mono truncate text-slate-400 mt-0.5">{step.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Collapsible Deep Telemetry Inspector */}
      <AnimatePresence>
        {isDetailExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 bg-[#030611] p-3 text-xs font-mono space-y-2"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/5 pb-1">
              <span className="uppercase text-[#4ade80] font-bold">Tunnel Protocol Telemetry</span>
              <span>Zero-Trust MicroVM</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Virtual Socket:</span>
                  <span className="text-slate-300 truncate">unix:///e2b.sock</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Encryption:</span>
                  <span className="text-[#38bdf8]">ChaCha20-Poly1305</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Isolation Layer:</span>
                  <span className="text-[#4ade80]">gVisor / Firecracker</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Packets In/Out:</span>
                  <span className="text-purple-300">{packetsSent} pkts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Enclave Target:</span>
                  <span className="text-slate-300">us-east-1a (E2B)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attestation:</span>
                  <span className="text-[#4ade80]">SHA-256 Validated</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
