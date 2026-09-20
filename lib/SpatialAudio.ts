"use client";

export class SpatialAudio {
    private static ctx: AudioContext | null = null;
    private static droneNodes: {
        oscillators: OscillatorNode[];
        gains: GainNode[];
        masterGain: GainNode;
        filter: BiquadFilterNode;
        lfo: OscillatorNode;
    } | null = null;
    private static isAudioMuted: boolean = false;

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
        if (muted && this.droneNodes && this.ctx) {
            this.droneNodes.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
        } else if (!muted && this.droneNodes && this.ctx) {
            this.droneNodes.masterGain.gain.setTargetAtTime(0.08, this.ctx.currentTime, 1);
        }
    }

    public static isMuted(): boolean {
        return this.isAudioMuted;
    }

    /**
     * Start the sacred 136.1 Hz cosmic Om / Tanpura drone.
     * Features Sa (136.1 Hz) + Pa (204.15 Hz) + High Sa (272.2 Hz) + Deep Sa (68.05 Hz)
     * with slow meditative harmonic breathing.
     */
    public static startAmbience() {
        this.initialize();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        if (this.droneNodes) return; // Already running

        const t = this.ctx.currentTime;
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0, t);
        masterGain.gain.linearRampToValueAtTime(this.isAudioMuted ? 0 : 0.08, t + 4);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, t);
        filter.Q.setValueAtTime(2.0, t);

        // Primordial Om Frequency (136.1 Hz)
        const SA = 136.1;
        const frequencies = [
            { freq: SA * 0.5, type: 'sine' as OscillatorType, vol: 0.28 }, // Sub Sa (68.05 Hz)
            { freq: SA, type: 'sine' as OscillatorType, vol: 0.45 },       // Root Sa (136.1 Hz)
            { freq: SA * 1.5, type: 'triangle' as OscillatorType, vol: 0.32 }, // Pa fifth (204.15 Hz)
            { freq: SA * 2, type: 'sine' as OscillatorType, vol: 0.15 },   // Upper Sa (272.2 Hz)
        ];

        const oscillators: OscillatorNode[] = [];
        const gains: GainNode[] = [];

        frequencies.forEach(({ freq, type, vol }) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(vol, t);

            osc.connect(gain);
            gain.connect(filter);
            osc.start();

            oscillators.push(osc);
            gains.push(gain);
        });

        // Slow LFO for organic tanpura breathing rhythm
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.12, t); // 8-second slow breath wave
        lfoGain.gain.setValueAtTime(150, t);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        filter.connect(masterGain);
        masterGain.connect(this.ctx.destination);

        this.droneNodes = {
            oscillators,
            gains,
            masterGain,
            filter,
            lfo
        };
    }

    public static stopAmbience() {
        if (!this.droneNodes || !this.ctx) return;
        const t = this.ctx.currentTime;
        this.droneNodes.masterGain.gain.setTargetAtTime(0, t, 0.5);
        setTimeout(() => {
            if (this.droneNodes) {
                this.droneNodes.oscillators.forEach(osc => {
                    try { osc.stop(); } catch { }
                });
                try { this.droneNodes.lfo.stop(); } catch { }
                this.droneNodes = null;
            }
        }, 600);
    }

    /**
     * Organic tactile bead clack sound when sliding beads.
     * Mimics authentic wood/rudraksha seed acoustic contact.
     */
    public static playBeadClack(pitchVariance = 1.0) {
        if (this.isAudioMuted) return;
        if (!this.ctx) this.initialize();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Bandpass filter for authentic hollow wooden resonant click
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime((900 + Math.random() * 300) * pitchVariance, t);
        filter.Q.setValueAtTime(3.5, t);

        osc.type = 'triangle';
        const baseFreq = (420 + Math.random() * 80) * pitchVariance;
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.045);

        // Very snappy acoustic transient
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.09, t + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.055);
    }

    /**
     * Synthesize multi-harmonic Tibetan Singing Bowl & Temple Bell acoustics.
     */
    public static playBell(intensity: 'light' | 'medium' | 'deep' | 'quarter') {
        if (this.isAudioMuted) return;
        if (!this.ctx) this.initialize();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const t = this.ctx.currentTime;

        if (intensity === 'quarter') {
            // Light singing bowl chime for 27 / 81 milestone
            this.createHarmonicBell(880, [1.0, 2.76, 5.4], 2.8, 0.08);
        } else if (intensity === 'light') {
            this.createHarmonicBell(1200, [1.0, 2.0, 3.4], 1.8, 0.06);
        } else if (intensity === 'medium') {
            // Half-mala (54) milestone: warm resonant bronze singing bowl
            this.createHarmonicBell(528, [1.0, 2.76, 4.07, 5.4], 5.0, 0.16);
        } else {
            // Deep 108 Completion: Grand temple bell with deep 432 Hz fundamental & shimmer
            this.createHarmonicBell(216, [1.0, 2.0, 2.76, 4.0, 5.4, 8.9], 7.5, 0.25);
            // Secondary low gong resonance
            setTimeout(() => {
                this.createHarmonicBell(108, [1.0, 1.5, 2.0], 8.0, 0.2);
            }, 50);
        }
    }

    private static createHarmonicBell(
        fundamental: number,
        partials: number[],
        duration: number,
        masterVolume: number
    ) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0, t);
        masterGain.gain.linearRampToValueAtTime(masterVolume, t + 0.015);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        masterGain.connect(this.ctx.destination);

        partials.forEach((mult, index) => {
            const osc = this.ctx!.createOscillator();
            const pGain = this.ctx!.createGain();

            // High partials decay faster than the fundamental
            const partialDur = duration / (1 + index * 0.35);
            const freq = fundamental * mult;
            const amp = (1 / (index + 1)) * 0.6;

            osc.type = index === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            // Subtle beating on high overtones
            if (index > 0) {
                osc.detune.setValueAtTime((Math.random() - 0.5) * 8, t);
            }

            pGain.gain.setValueAtTime(amp, t);
            pGain.gain.exponentialRampToValueAtTime(0.0001, t + partialDur);

            osc.connect(pGain);
            pGain.connect(masterGain);

            osc.start(t);
            osc.stop(t + duration);
        });
    }
}
