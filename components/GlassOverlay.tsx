"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Mic, Waves, MicOff } from 'lucide-react';
import type { VoiceStatus } from '@/hooks/useMantraEngine';
import type { MantraDef } from '@/lib/mantras';

interface GlassOverlayProps {
    count: number;
    round: number;
    lifetimeCount: number;
    mantra: MantraDef;
    isListening: boolean;
    voiceStatus: VoiceStatus;
    onToggleListen: () => void;
    onOpenSettings: () => void;
}

// Odometer Digit Component
const OdometerDigit = ({ value }: { value: string }) => {
    return (
        <div className="relative h-[1em] w-[0.6em] overflow-hidden inline-block text-center bg-black/50 rounded-sm mx-[1px]">
            <motion.div
                key={value}
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // Spring-like snapping
                className="absolute inset-0 flex items-center justify-center font-mono font-bold text-white leading-none"
            >
                {value}
            </motion.div>
        </div>
    );
};

// Odometer Display
const Odometer = ({ value }: { value: number }) => {
    const digits = value.toString().padStart(4, '0').split('');
    return (
        <div className="flex items-center text-[4rem] sm:text-[6rem] tracking-tighter transition-all duration-300">
            {digits.map((d, i) => (
                <OdometerDigit key={`${i}-${d}`} value={d} />
            ))}
        </div>
    );
};

const MagneticButton = ({ children, onClick, active }: { children: React.ReactNode, onClick: () => void, active?: boolean }) => {
    const ref = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current!.getBoundingClientRect();
        const x = clientX - (left + width / 2);
        const y = clientY - (top + height / 2);
        setPosition({ x: x * 0.1, y: y * 0.1 });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.button
            ref={ref}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`p-4 rounded-full backdrop-blur-md border transition-all duration-300 ${active
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                    : 'bg-black/40 text-white/80 border-white/20 hover:bg-white/10'
                }`}
        >
            {children}
        </motion.button>
    );
};

const VOICE_STATUS_LABEL: Record<VoiceStatus, string> = {
    idle: 'PRESENT',
    listening: 'LISTENING',
    unsupported: 'VOICE UNAVAILABLE · TURN THE MALA',
    denied: 'MIC BLOCKED · TURN THE MALA',
    error: 'VOICE PAUSED · TURN THE MALA',
};

const GlassOverlay: React.FC<GlassOverlayProps> = ({ count, round, lifetimeCount, mantra, isListening, voiceStatus, onToggleListen, onOpenSettings }) => {

    // Auto-hide UI
    const [idle, setIdle] = useState(false);
    const showHint = lifetimeCount === 0;

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const resetIdle = () => {
            setIdle(false);
            clearTimeout(timeout);
            timeout = setTimeout(() => setIdle(true), 3000);
        };
        window.addEventListener('mousemove', resetIdle);
        window.addEventListener('touchstart', resetIdle);
        resetIdle();
        return () => {
            window.removeEventListener('mousemove', resetIdle);
            window.removeEventListener('touchstart', resetIdle);
            clearTimeout(timeout);
        };
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-8 z-50">
            {/* Top Bar */}
            <motion.header
                animate={{ opacity: idle ? 0 : 1, y: idle ? -20 : 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-between items-start pointer-events-auto"
            >
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-300 ${isListening ? 'bg-red-500 animate-pulse' : voiceStatus === 'idle' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/60 font-mono">
                        {VOICE_STATUS_LABEL[voiceStatus]}
                    </span>
                </div>

                <div className="text-right">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Round</div>
                    <div className="font-mono text-white text-base sm:text-lg tracking-widest">
                        {round.toString().padStart(2, '0')}
                    </div>
                </div>
            </motion.header>

            {/* Center: The Odometer */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                {/* A dark vignette behind the readout, so it stays legible over
                    the glow regardless of which mantra's colors are active. */}
                <div className="absolute inset-0 -m-16 sm:-m-24 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.25)_55%,transparent_75%)]" />
                <motion.div
                    animate={{ opacity: idle ? 0 : 1 }}
                    className="relative text-[9px] sm:text-[11px] uppercase tracking-[0.3em] text-neon-gold mb-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                >
                    {mantra.name}
                </motion.div>
                <div className="relative">
                    <Odometer value={count} />
                </div>
                <motion.div
                    animate={{ opacity: idle ? 0 : 1 }}
                    className="relative text-[8px] sm:text-[10px] uppercase tracking-[0.4em] text-white/70 mt-4 sm:mt-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                >
                    Naam Count
                </motion.div>
                <AnimatePresence>
                    {showHint && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="relative text-[9px] sm:text-[11px] tracking-[0.15em] text-white/70 mt-8 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                        >
                            Turn a bead to begin your japa
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            <motion.footer
                animate={{ opacity: idle ? 0 : 1, y: idle ? 20 : 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center items-center gap-6 sm:gap-8 pointer-events-auto mb-4 sm:mb-8"
            >
                <MagneticButton onClick={onOpenSettings}>
                    <Settings size={18} strokeWidth={1.5} />
                </MagneticButton>

                <MagneticButton onClick={onToggleListen} active={isListening}>
                    {isListening ? (
                        <Waves size={20} strokeWidth={1.5} />
                    ) : voiceStatus === 'unsupported' || voiceStatus === 'denied' ? (
                        <MicOff size={20} strokeWidth={1.5} />
                    ) : (
                        <Mic size={20} strokeWidth={1.5} />
                    )}
                </MagneticButton>
            </motion.footer>

            {/* Cinematic Grain */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('/noise.svg')] mix-blend-overlay"></div>
        </div>
    );
};

export default GlassOverlay;
