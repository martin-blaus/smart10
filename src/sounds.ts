// Synthesized sound effects + haptics via the Web Audio API — no asset files.
// One mute toggle (persisted in localStorage) governs both sound and vibration.

let ctx: AudioContext | null = null;
let muted = false;

// Load muted state on module load
if (typeof window !== "undefined") {
  muted = localStorage.getItem("smart10:muted") === "true";
}

// Create/resume the AudioContext. Must first run inside a user gesture.
function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

function tone(
  freq: number,
  durMs: number,
  type: OscillatorType = "sine",
  delayMs = 0,
  vol = 0.15,
): void {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const start = c.currentTime + delayMs / 1000;
  const dur = durMs / 1000;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  // Exponential attack/decay avoids clicking.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function vibrate(pattern: number | number[]): void {
  if (muted) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration block failures
    }
  }
}

export const sounds = {
  init(): void {
    ensureCtx();
  },
  isMuted(): boolean {
    return muted;
  },
  toggleMuted(): boolean {
    muted = !muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("smart10:muted", String(muted));
    }
    if (!muted) {
      ensureCtx();
    }
    return muted;
  },
  // Peg tap/flip (short woody click)
  tap(): void {
    tone(180, 45, "sine", 0, 0.12);
  },
  // Correct answer (warm two-note ding, vibrate 30ms)
  correct(): void {
    tone(880, 80, "sine", 0, 0.14);
    tone(1320, 100, "sine", 60, 0.12);
    vibrate(30);
  },
  // Wrong answer (low thud, vibrate 60ms, 40ms pause, 60ms vibrate)
  wrong(): void {
    tone(200, 150, "square", 0, 0.12);
    tone(130, 200, "square", 80, 0.12);
    vibrate([60, 40, 60]);
  },
  // Bank / Pass (token clack, vibrate 20ms, 20ms pause, 20ms vibrate)
  bank(): void {
    tone(600, 30, "triangle", 0, 0.15);
    tone(450, 40, "triangle", 15, 0.12);
    vibrate([20, 20]);
  },
  // Round end (soft card-shuffle swish)
  roundEnd(): void {
    tone(1500, 40, "sine", 0, 0.05);
    tone(1200, 40, "sine", 20, 0.05);
    tone(900, 50, "sine", 40, 0.05);
  },
  // Win / Game over (brief fanfare, vibrate 40,60,40,60,120)
  win(): void {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) =>
      tone(f, 250, "triangle", i * 100, 0.15),
    );
    vibrate([40, 60, 40, 60, 120]);
  },
};
