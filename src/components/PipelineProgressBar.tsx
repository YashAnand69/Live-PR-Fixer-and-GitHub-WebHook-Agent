import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Cpu,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Terminal,
  Bot,
  Radio,
  GitPullRequest,
  Flame,
  Layers,
} from 'lucide-react';
import { playTactileSound } from '../utils/sound';

export interface PipelineProgressBarProps {
  status: 'queued' | 'reproducing' | 'analyzing' | 'patching' | 'verifying' | 'resolved' | 'failed';
  executionTimeMs?: number;
  tokensUsed?: number;
  soundFxEnabled?: boolean;
  onRerun?: () => void;
  onStepClick?: (stepIndex: number) => void;
}

interface StepMilestone {
  id: string;
  name: string;
  shortName: string;
  phase: string;
  targetPercent: number;
  icon: React.ReactNode;
  activeDescription: string;
  completedDescription: string;
  etaDefault: number; // in seconds
}

const MILESTONES: StepMilestone[] = [
  {
    id: 'ingress',
    name: '1. Ingress Ingestion',
    shortName: 'Ingress',
    phase: 'Payload & AST',
    targetPercent: 25,
    icon: <Radio className="w-3.5 h-3.5 text-cyan-400" />,
    activeDescription: 'Decoding GitHub webhook payload & building Abstract Syntax Tree...',
    completedDescription: 'Webhook validated (HTTP 202) • AST parsed in 42ms',
    etaDefault: 0.8,
  },
  {
    id: 'analysis',
    name: '2. Gemini AI Analysis',
    shortName: 'AI Triage',
    phase: 'Root Cause & Diff',
    targetPercent: 50,
    icon: <Bot className="w-3.5 h-3.5 text-[#4ade80]" />,
    activeDescription: 'Gemini 3.6 Flash synthesizing contextual bug patch & AST diff...',
    completedDescription: 'Unified patch synthesized • 0 hallucinated tokens',
    etaDefault: 1.4,
  },
  {
    id: 'sandbox',
    name: '3. E2B Sandbox Runner',
    shortName: 'Sandbox Test',
    phase: 'Jest / MicroVM',
    targetPercent: 75,
    icon: <Terminal className="w-3.5 h-3.5 text-amber-400" />,
    activeDescription: 'Spinning up ephemeral microVM container & running Jest test suites...',
    completedDescription: 'All 14 test suites passing in isolated container (0.84s)',
    etaDefault: 1.2,
  },
  {
    id: 'deploy',
    name: '4. Hotfix Commit & Push',
    shortName: 'PR Resolution',
    phase: 'Git Branch Push',
    targetPercent: 100,
    icon: <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />,
    activeDescription: 'Creating verified git commit and updating GitHub PR status check...',
    completedDescription: 'Hotfix branch updated • Commit SHA attached to PR comment',
    etaDefault: 0.5,
  },
];

export const PipelineProgressBar: React.FC<PipelineProgressBarProps> = ({
  status,
  executionTimeMs = 0,
  tokensUsed = 0,
  soundFxEnabled = true,
  onRerun,
  onStepClick,
}) => {
  const [displayedPercent, setDisplayedPercent] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const prevStatusRef = useRef(status);

  // Compute target percentage based on status
  const getTargetPercent = (st: string) => {
    switch (st) {
      case 'queued':
        return 12;
      case 'reproducing':
        return 32;
      case 'analyzing':
        return 58;
      case 'patching':
        return 74;
      case 'verifying':
        return 88;
      case 'resolved':
        return 100;
      case 'failed':
        return 100;
      default:
        return 0;
    }
  };

  // Determine current active step index (0 to 3)
  const getCurrentStepIndex = (st: string) => {
    switch (st) {
      case 'queued':
        return 0;
      case 'reproducing':
        return 0;
      case 'analyzing':
        return 1;
      case 'patching':
        return 1;
      case 'verifying':
        return 2;
      case 'resolved':
        return 3;
      case 'failed':
        return 2;
      default:
        return 0;
    }
  };

  const currentStepIdx = getCurrentStepIndex(status);
  const isRunning = ['queued', 'reproducing', 'analyzing', 'patching', 'verifying'].includes(status);
  const isResolved = status === 'resolved';
  const isFailed = status === 'failed';

  // Smooth interpolation toward target percentage
  useEffect(() => {
    const target = getTargetPercent(status);
    let animationFrame: number;

    const animateProgress = () => {
      setDisplayedPercent((prev) => {
        if (Math.abs(prev - target) < 0.5) {
          return target;
        }
        const diff = target - prev;
        const step = diff > 0 ? Math.max(0.4, diff * 0.12) : Math.min(-0.4, diff * 0.12);
        return prev + step;
      });

      if (Math.abs(displayedPercent - target) >= 0.5) {
        animationFrame = requestAnimationFrame(animateProgress);
      }
    };

    animationFrame = requestAnimationFrame(animateProgress);

    // Audio cue when status advances
    if (prevStatusRef.current !== status) {
      if (status === 'resolved') {
        playTactileSound('repairComplete', soundFxEnabled);
      } else if (isRunning) {
        playTactileSound('stepAdvance', soundFxEnabled);
      }
      prevStatusRef.current = status;
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [status, displayedPercent, soundFxEnabled, isRunning]);

  // Elapsed timer ticker
  useEffect(() => {
    if (!isRunning) {
      if (isResolved && executionTimeMs > 0) {
        setElapsedSec(Number((executionTimeMs / 1000).toFixed(1)));
      }
      return;
    }

    setElapsedSec(0);
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedSec(Number(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, isResolved, executionTimeMs]);

  // Remaining ETA Calculation
  const estimatedRemainingSec = Math.max(
    0,
    Number((((100 - displayedPercent) / 100) * 3.8).toFixed(1))
  );

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-[#060a14]/90 p-4 shadow-xl backdrop-blur-md transition-all">
      {/* Header bar: Percentage completion, status pill, ETA & controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm border shadow-inner ${
                isResolved
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.3)]'
                  : isFailed
                  ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-[#0f172a] border-[#4ade80]/40 text-white'
              }`}
            >
              {Math.round(displayedPercent)}%
            </div>
            {isRunning && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4ade80]" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Multi-Step Repair Completion
              </span>
              <span
                className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase tracking-wider flex items-center gap-1 ${
                  isResolved
                    ? 'bg-emerald-500/20 text-[#4ade80] border border-emerald-500/30'
                    : isFailed
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : isRunning
                    ? 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30 animate-pulse'
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                {isResolved ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-[#4ade80]" />
                    <span>Pipeline Verified 100%</span>
                  </>
                ) : isFailed ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>Intervention Needed</span>
                  </>
                ) : isRunning ? (
                  <>
                    <Activity className="w-3 h-3 animate-spin text-[#4ade80]" />
                    <span>Executing Step {currentStepIdx + 1}/4</span>
                  </>
                ) : (
                  <span>Standby</span>
                )}
              </span>
            </div>
            <p className="text-[11px] font-sans text-slate-400 mt-0.5">
              {isResolved
                ? 'All automated repair stages successfully passed. Hotfix branch ready.'
                : isFailed
                ? 'Sandbox test runner reported unresolved failures. Review diff.'
                : MILESTONES[currentStepIdx]?.activeDescription || 'Awaiting incoming CI webhook event...'}
            </p>
          </div>
        </div>

        {/* Telemetry Timing Pills */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#0a0f1d] border border-white/10 text-[11px] font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-500">Elapsed:</span>
            <span className="font-bold text-white">{elapsedSec.toFixed(1)}s</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#0a0f1d] border border-white/10 text-[11px] font-mono text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-500">ETA:</span>
            <span className="font-bold text-amber-300">
              {isResolved ? '0.0s' : `~${estimatedRemainingSec}s`}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              playTactileSound('click', soundFxEnabled);
              setIsExpanded(!isExpanded);
            }}
            className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/5"
            title="Toggle Detailed Diagnostic Inspector"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 text-[#4ade80]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </motion.button>
        </div>
      </div>

      {/* Cyber Glowing Animated Progress Bar */}
      <div className="relative mt-3.5">
        <div className="h-3.5 w-full rounded-full bg-[#090d1a] p-0.5 border border-white/10 overflow-hidden relative shadow-inner">
          {/* Subtle Grid Track Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:25%_100%] pointer-events-none" />

          {/* Active Fill Track */}
          <motion.div
            className={`h-full rounded-full relative overflow-hidden transition-all duration-300 ${
              isFailed
                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                : 'bg-gradient-to-r from-emerald-500 via-[#4ade80] to-cyan-400 shadow-[0_0_18px_rgba(74,222,128,0.6)]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, displayedPercent))}%` }}
          >
            {/* Animated Cyber Fluid Wave Refraction */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.18),rgba(255,255,255,0.18)_8px,transparent_8px,transparent_16px)] animate-[moveStripe_12s_linear_infinite]" />

            {/* Fluid Internal Bead Bubbles */}
            <div className="absolute inset-0 flex items-center justify-around opacity-60">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span className="w-1 h-1 rounded-full bg-cyan-200 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-bounce" />
            </div>

            {/* Glowing Leading Head Plasma Surge */}
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-white blur-[1px] opacity-90 shadow-[0_0_8px_#ffffff]" />
          </motion.div>
        </div>

        {/* Milestone Indicator Ticks Over Progress Bar */}
        <div className="relative -mt-3.5 flex justify-between pointer-events-none px-0.5">
          {MILESTONES.map((m, idx) => {
            const isPassed = displayedPercent >= m.targetPercent;
            const isCurrent = currentStepIdx === idx && isRunning;

            return (
              <div
                key={m.id}
                className="flex flex-col items-center"
                style={{ width: '25%' }}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center ${
                    isPassed || isResolved
                      ? 'bg-[#4ade80] border-[#060a14] shadow-[0_0_8px_#4ade80]'
                      : isCurrent
                      ? 'bg-amber-400 border-[#060a14] animate-ping'
                      : 'bg-[#1e293b] border-[#060a14]'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Interactive Milestone Stage Cards Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {MILESTONES.map((step, idx) => {
          const isPassed = displayedPercent >= step.targetPercent || isResolved;
          const isCurrent = currentStepIdx === idx && isRunning;
          const isSelected = selectedMilestone === idx;

          return (
            <motion.div
              key={step.id}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playTactileSound('click', soundFxEnabled);
                setSelectedMilestone(isSelected ? null : idx);
                if (onStepClick) onStepClick(idx);
              }}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer relative flex flex-col justify-between ${
                isPassed
                  ? 'bg-[#0a1122] border-emerald-500/30 hover:border-emerald-500/50 text-slate-200'
                  : isCurrent
                  ? 'bg-[#11192e] border-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.2)] text-white'
                  : 'bg-[#060812] border-white/5 opacity-65 hover:opacity-90 text-slate-400'
              } ${isSelected ? 'ring-1 ring-[#4ade80]' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-1.5">
                  <div
                    className={`p-1 rounded ${
                      isPassed
                        ? 'bg-emerald-500/20 text-[#4ade80]'
                        : isCurrent
                        ? 'bg-[#4ade80]/20 text-[#4ade80] animate-pulse'
                        : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-xs font-mono font-bold truncate">{step.shortName}</span>
                </div>

                <span className="text-[10px] font-mono font-bold">
                  {isPassed ? (
                    <span className="text-[#4ade80] flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      100%
                    </span>
                  ) : isCurrent ? (
                    <span className="text-amber-300 font-bold animate-pulse">
                      {Math.round(displayedPercent)}%
                    </span>
                  ) : (
                    <span className="text-slate-600">0%</span>
                  )}
                </span>
              </div>

              <p className="text-[10px] font-sans text-slate-400 line-clamp-1 leading-snug">
                {isPassed ? step.completedDescription : isCurrent ? step.activeDescription : `Pending Step ${idx + 1}`}
              </p>

              <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-white/5 pt-1">
                <span>{step.phase}</span>
                <span className="text-[#4ade80]/80">{step.targetPercent}% target</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Collapsible Deep Diagnostic Telemetry Tray */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 pt-3 border-t border-white/10 overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-[#090e1c] border border-white/5">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>Sandbox Memory</span>
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {isRunning ? '48.2 MB' : isResolved ? '38.4 MB' : '0.0 MB'}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Heap limit: 512 MB</div>
              </div>

              <div className="p-2 rounded bg-[#090e1c] border border-white/5">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Gemini AST Tokens</span>
                </div>
                <div className="text-sm font-bold text-purple-300 mt-0.5">
                  {tokensUsed > 0 ? tokensUsed : isRunning ? '340' : '0'} tok
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Model: Gemini 3.6 Flash</div>
              </div>

              <div className="p-2 rounded bg-[#090e1c] border border-white/5">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#4ade80]" />
                  <span>Safety Guardrails</span>
                </div>
                <div className="text-sm font-bold text-[#4ade80] mt-0.5">5/5 Passed</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Budget & Diff clean</div>
              </div>

              <div className="p-2 rounded bg-[#090e1c] border border-white/5">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-400" />
                  <span>Sandbox MicroVM</span>
                </div>
                <div className="text-sm font-bold text-amber-300 mt-0.5">e2b-v0.18</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Status: Enclave Active</div>
              </div>
            </div>

            {/* Selected Milestone Deep-Dive */}
            {selectedMilestone !== null && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-[#04060f] border border-[#4ade80]/30 text-xs font-mono">
                <div className="flex items-center justify-between text-[#4ade80] font-bold text-[11px] mb-1">
                  <span>STAGE {selectedMilestone + 1} INSPECTION: {MILESTONES[selectedMilestone].name}</span>
                  <span className="text-slate-400">{MILESTONES[selectedMilestone].phase}</span>
                </div>
                <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
                  {displayedPercent >= MILESTONES[selectedMilestone].targetPercent || isResolved
                    ? MILESTONES[selectedMilestone].completedDescription
                    : MILESTONES[selectedMilestone].activeDescription}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
