export class SpatialAudio {
    private static ctx: AudioContext | null = null;
    private static droneNodes: { oscA: OscillatorNode; oscB: OscillatorNode; gain: GainNode } | null = null;

    public static initialize() {
        if (typeof window === 'undefined') return;

        if (!this.ctx) {
            const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioContextCtor) {
                this.ctx = new AudioContextCtor();
            }
        }
    }

    /**
     * A soft, sustained tanpura-like drone on the tonic (Sa) — two gently
     * detuned voices through a warm low-pass filter, the way a background
     * drone sits under kirtan, rather than a stereo "brainwave" effect.
     */
    public static startAmbience() {
        this.initialize();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        if (this.droneNodes) return; // Already playing

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.09, this.ctx.currentTime + 4); // Slow fade in

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        filter.connect(gain).connect(this.ctx.destination);

        const TONIC = 130.81; // C3 — a comfortable low Sa

        const oscA = this.ctx.createOscillator();
        oscA.type = 'sine';
        oscA.frequency.value = TONIC;

        const oscB = this.ctx.createOscillator();
        oscB.type = 'triangle';
        oscB.frequency.value = TONIC * 1.5; // Pa (perfect fifth) — the drone's natural partner

        oscA.connect(filter);
        oscB.connect(filter);

        oscA.start();
        oscB.start();

        this.droneNodes = { oscA, oscB, gain };
    }

    /**
     * Synthesize a bell sound for milestones
     */
    public static playBell(intensity: 'light' | 'medium' | 'deep') {
        if (!this.ctx) this.initialize();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const freq = intensity === 'light' ? 2000 : intensity === 'medium' ? 1000 : 432;
        const duration = intensity === 'light' ? 2 : 5;
        const volume = intensity === 'light' ? 0.05 : 0.2;

        // Bell envelope
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        // FM Synthesis usually better for bells, but simple sine decay works for "pure" tone

        // Add harmonics for richness if 'deep'
        if (intensity === 'deep') {
            const osc2 = this.ctx.createOscillator();
            osc2.frequency.value = freq * 1.5;
            const g2 = this.ctx.createGain();
            g2.gain.value = volume * 0.5;
            osc2.connect(g2).connect(this.ctx.destination);

            g2.gain.exponentialRampToValueAtTime(0.001, t + duration);
            osc2.start(t);
            osc2.stop(t + duration);
        }

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.start(t);
        osc.stop(t + duration);
    }
}
