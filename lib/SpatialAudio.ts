"use client";

/**
 * Ultra-clean, subtle physical acoustic feedback.
 * No synthetic buzzes, no oscillator drones.
 * Audio is MUTED by default.
 */
export class SpatialAudio {
    private static ctx: AudioContext | null = null;
    private static isAudioMuted: boolean = true; // Silent by default

    public static initialize() {
        if (typeof window === 'undefined') return;
        if (!this.ctx) {
            const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioContextCtor) {
                this.ctx = new AudioContextCtor();
            }
        }
    }

    public static setMuted(muted: boolean) {
        this.isAudioMuted = muted;
    }

    public static isMuted(): boolean {
        return this.isAudioMuted;
    }

    public static startAmbience() {
        // Disabled: user found synthetic ambient drones disruptive
    }

    public static stopAmbience() {
        // No-op
    }

    /**
     * Ultra-subtle, organic wooden bead click (extremely quiet and brief)
     */
    public static playBeadClack() {
        if (this.isAudioMuted) return;
        if (!this.ctx) this.initialize();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        try {
            const t = this.ctx.currentTime;
            // Short, warm acoustic impulse
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(600, t);
            filter.Q.setValueAtTime(2.5, t);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(280, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.025);

            gain.gain.setValueAtTime(0.04, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.03);
        } catch {
            // Audio fail-safe
        }
    }

    /**
     * Subtle completion tone only on full round (108)
     */
    public static playBell(intensity: 'light' | 'medium' | 'deep' | 'quarter') {
        if (this.isAudioMuted) return;
        if (intensity !== 'deep') return; // Only play on full round completion
        if (!this.ctx) this.initialize();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(432, t); // Natural 432 Hz pure tone

            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 3.0);
        } catch {
            // fail-safe
        }
    }
}
