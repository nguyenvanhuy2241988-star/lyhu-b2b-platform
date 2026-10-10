/**
 * Subtle, elegant notification sound using Web Audio API
 * Styled according to LYHU brand guidelines: professional, non-intrusive, crystal clear.
 */

const SCRIPT_LOAD_TIME = typeof window !== 'undefined' ? Date.now() : 0;
let lastSoundPlayTime = 0;

export const playNotificationSound = () => {
    try {
        if (typeof window === 'undefined') return;
        const nowMs = Date.now();
        // Silence any audio chime in the initial 5-second window after page load/refresh
        if (nowMs - SCRIPT_LOAD_TIME < 5000) {
            return;
        }
        if (nowMs - lastSoundPlayTime < 3000) {
            return; // Cooldown to avoid duplicate beeps
        }
        lastSoundPlayTime = nowMs;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;

        // Note 1: Soft D5 tone (587.33Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.15, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.22);

        // Note 2: Harmonious A5 chime (880Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.1);
        gain2.gain.setValueAtTime(0, now + 0.1);
        gain2.gain.linearRampToValueAtTime(0.18, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.42);

        // Auto-close context after sound ends
        setTimeout(() => {
            try {
                ctx.close();
            } catch (e) { }
        }, 500);
    } catch (e) {
        console.warn('[playNotificationSound] Audio playback failed or blocked by browser policy:', e);
    }
};
