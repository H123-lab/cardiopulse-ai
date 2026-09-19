/**
 * Web Audio API synthesizer for the Emergency Hospitalization Pop Alert.
 * Generates an unmistakable, high-urgency pop / chime sound without relying on external MP3 assets.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('[CardioPulse Audio] Web Audio not supported or blocked:', err);
    return null;
  }
}

/**
 * Plays an urgent medical "pop & chime" sound
 */
export function playEmergencyPopSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Initial crisp "Pop" percussion transient
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    // Frequency drops rapidly from 880Hz to 220Hz for a physical "pop" effect
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(220, now + 0.12);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.13);

    // 2. High-urgency alert dual-tone chime immediately following the pop
    setTimeout(() => {
      try {
        const ctx2 = getAudioContext();
        if (!ctx2) return;
        const t = ctx2.currentTime;

        // Tone A (High alert pitch - E6 1318.5 Hz)
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.5, t);
        gain2.gain.setValueAtTime(0.3, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        osc2.start(t);
        osc2.stop(t + 0.26);

        // Tone B (Second emergency pulse - G#6 1661 Hz)
        setTimeout(() => {
          try {
            const ctx3 = getAudioContext();
            if (!ctx3) return;
            const t3 = ctx3.currentTime;
            const osc3 = ctx3.createOscillator();
            const gain3 = ctx3.createGain();
            osc3.type = 'sine';
            osc3.frequency.setValueAtTime(1661.2, t3);
            gain3.gain.setValueAtTime(0.35, t3);
            gain3.gain.exponentialRampToValueAtTime(0.001, t3 + 0.35);
            osc3.connect(gain3);
            gain3.connect(ctx3.destination);
            osc3.start(t3);
            osc3.stop(t3 + 0.36);
          } catch {}
        }, 120);
      } catch {}
    }, 100);
  } catch (error) {
    console.warn('[CardioPulse Audio] Error playing alert sound:', error);
  }
}
