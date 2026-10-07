// ── HIGH-FIDELITY WEB AUDIO SOUND DESIGN ENGINE (0ms Latency Synthesis) ──

export function playWebAudioSfx(
    type: "whoosh" | "ding" | "kaching" | "boom" | "pop",
    audioCtx: AudioContext,
    destNode?: AudioNode,
    volume = 0.35
) {
    try {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const gain = audioCtx.createGain();
        gain.gain.value = volume;
        gain.connect(destNode || audioCtx.destination);

        if (type === "whoosh") {
            const duration = 0.22;
            const bufferSize = Math.floor(audioCtx.sampleRate * duration);
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);

            // Generate gentle warm noise (Brown/Pink noise curve to eliminate harsh mic hiss/wind)
            let b0 = 0, b1 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.95 * b0 + white * 0.05;
                b1 = 0.90 * b1 + white * 0.10;
                data[i] = (b0 + b1) * 2.2;
            }

            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;

            // Low-pass filter for smooth cinematic deep swoosh, NO harsh microphone hiss/wind
            const filter = audioCtx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(350, now);
            filter.frequency.exponentialRampToValueAtTime(750, now + duration * 0.45);
            filter.frequency.exponentialRampToValueAtTime(220, now + duration);
            filter.Q.value = 0.8;

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(volume * 0.45, now + duration * 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(gain);
            noise.start(now);
            noise.stop(now + duration);

        } else if (type === "ding") {
            const osc = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            osc.type = "sine";
            osc2.type = "sine";
            osc.frequency.setValueAtTime(1480, now);
            osc2.frequency.setValueAtTime(2960, now);

            gain.gain.setValueAtTime(volume * 0.85, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

            osc.connect(gain);
            osc2.connect(gain);
            osc.start(now);
            osc2.start(now);
            osc.stop(now + 0.65);
            osc2.stop(now + 0.65);

        } else if (type === "kaching") {
            [1760, 2340, 3120].forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                const coinGain = audioCtx.createGain();
                coinGain.gain.setValueAtTime(0, now + idx * 0.07);
                coinGain.gain.linearRampToValueAtTime(volume * 0.75, now + idx * 0.07 + 0.01);
                coinGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.38);
                osc.connect(coinGain);
                coinGain.connect(destNode || audioCtx.destination);
                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.38);
            });

        } else if (type === "boom") {
            const osc = audioCtx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.exponentialRampToValueAtTime(32, now + 0.55);

            gain.gain.setValueAtTime(volume * 1.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

            osc.connect(gain);
            osc.start(now);
            osc.stop(now + 0.7);

        } else if (type === "pop") {
            const osc = audioCtx.createOscillator();
            osc.type = "sine";
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.05);

            gain.gain.setValueAtTime(volume * 0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            osc.start(now);
            osc.stop(now + 0.08);
        }
    } catch (e) {
        console.warn("SFX error:", e);
    }
}
