// Web Audio API tactile sound generator for Cyber-Command Terminal
let audioCtx: AudioContext | null = null;

export function unlockAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

if (typeof window !== 'undefined') {
  const handleUserGesture = () => {
    unlockAudio();
  };
  window.addEventListener('pointerdown', handleUserGesture, { capture: true });
  window.addEventListener('keydown', handleUserGesture, { capture: true });
  window.addEventListener('click', handleUserGesture, { capture: true });
}

export type SoundType = 
  | 'click' 
  | 'tab' 
  | 'primary' 
  | 'toggle' 
  | 'modal' 
  | 'beacon' 
  | 'success' 
  | 'alert' 
  | 'webhook'
  | 'keystroke'
  | 'hover'
  | 'clear'
  | 'openHub'
  | 'closeHub'
  | 'execCommand'
  | 'tunnelConnect'
  | 'tunnelData'
  | 'stepAdvance'
  | 'progressTick'
  | 'repairComplete'
  | 'glitchStatic'
  | 'fluidSplash'
  | 'fluidWave'
  | 'vortexRipple';

export const playTactileSound = (type: SoundType, enabled = true) => {
  if (!enabled) return;
  try {
    const ctx = unlockAudio();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'tunnelConnect') {
      // Sci-fi high-speed tunnel warp establishing sweep with harmonic chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      
      osc1.frequency.setValueAtTime(150, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      
      osc2.frequency.setValueAtTime(300, now);
      osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.22);
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      
      // Filter for warm futuristic resonance
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(3500, now + 0.2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);

    } else if (type === 'tunnelData') {
      // Rapid micro-packet data blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 + Math.random() * 400, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.02);

    } else if (type === 'stepAdvance') {
      // Ascending crisp dual blip when a pipeline repair step completes and advances
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.05); // G5
      osc2.frequency.setValueAtTime(1046.50, now + 0.03); // C6
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now + 0.03);
      osc1.stop(now + 0.08);
      osc2.stop(now + 0.08);

    } else if (type === 'progressTick') {
      // Sub-millisecond mechanical clock pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.012);

    } else if (type === 'repairComplete') {
      // Triumphant cyber arpeggio for full pipeline repair completion
      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      freqs.forEach((f, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, now + idx * 0.045);
        g.gain.setValueAtTime(0.03, now + idx * 0.045);
        g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.2);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.045);
        o.stop(now + idx * 0.045 + 0.2);
      });

    } else if (type === 'fluidSplash') {
      // Fluid droplet & water ripple impact synthesis
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.22);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);

    } else if (type === 'fluidWave') {
      // Hydrodynamic ocean surge / ambient fluid flow
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.15);
      osc.frequency.linearRampToValueAtTime(70, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);

    } else if (type === 'vortexRipple') {
      // Swirling aerodynamic vortex harmonic chime
      const freqs = [320, 480, 640];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.03);
        osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + i * 0.03 + 0.18);
        gain.gain.setValueAtTime(0.02, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.03 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + i * 0.03 + 0.2);
      });

    } else if (type === 'glitchStatic') {
      // Cybernetic glitch burst: frequency-modulated noise & buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.05);
      osc.frequency.setValueAtTime(280, now + 0.08);
      osc.frequency.linearRampToValueAtTime(80, now + 0.16);

      // Lowpass filter for analog crunch
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);

    } else if (type === 'click') {
      // Crisp subtle tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);

    } else if (type === 'keystroke') {
      // Very soft typing key click for command search
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.02);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.02);

    } else if (type === 'hover') {
      // Micro tick when hovering over items in command palette
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.015);

    } else if (type === 'clear') {
      // Descending soft sweep when clearing query in command hub
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

    } else if (type === 'openHub') {
      // Futuristic cyber boot chirp when Command Hub opens
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(400, now);
      osc1.frequency.exponentialRampToValueAtTime(900, now + 0.06);
      osc2.frequency.setValueAtTime(800, now);
      osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.07);
      osc2.stop(now + 0.07);

    } else if (type === 'closeHub') {
      // Futuristic closing slide down tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.05);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

    } else if (type === 'execCommand') {
      // Satisfying double chime when executing a selected command from the Hub
      const freqs = [659.25, 987.77]; // E5, B5
      freqs.forEach((f, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, now + idx * 0.04);
        g.gain.setValueAtTime(0.04, now + idx * 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.12);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.04);
        o.stop(now + idx * 0.04 + 0.12);
      });

    } else if (type === 'tab') {
      // High-tech tab swap blip (dual pitch)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(520, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.04);
      osc2.frequency.setValueAtTime(1040, now);
      osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.04);
      
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.045);
      osc2.stop(now + 0.045);

    } else if (type === 'primary') {
      // Power action button (ascending laser pulse)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);

    } else if (type === 'toggle') {
      // Switch or checkbox flip sound (hi-low pitch hop)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.025);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

    } else if (type === 'modal') {
      // Sci-fi modal aperture open whoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);

    } else if (type === 'beacon') {
      // Pipeline pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);

    } else if (type === 'success') {
      // Warm chord chime
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, now + idx * 0.03);
        g.gain.setValueAtTime(0.03, now + idx * 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 0.2);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.03);
        o.stop(now + idx * 0.03 + 0.2);
      });

    } else if (type === 'alert') {
      // Negative / alert click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(220, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);

    } else if (type === 'webhook') {
      // Telemetry incoming
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (err) {
    // Ignore audio autoplay restrictions
  }
};
