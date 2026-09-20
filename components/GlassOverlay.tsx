"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sliders,
    Mic,
    Waves,
    MicOff,
    Volume2,
    VolumeX,
    Eye,
    EyeOff,
    Sparkles
} from 'lucide-react';
import type { VoiceStatus } from '@/hooks/useMantraEngine';
import type { MantraDef } from '@/lib/mantras';
import {
    BEAD_MATERIAL_CONFIGS,
    type BeadMaterialType
} from '@/lib/BeadTextures';

interface GlassOverlayProps {
    count: number;
    round: number;
    lifetimeCount: number;
    mantra: MantraDef;
    isListening: boolean;
    voiceStatus: VoiceStatus;
    onToggleListen: () => void;
    onOpenSettings: () => void;
    activeMaterial: BeadMaterialType;
    onSelectMaterial: (mat: BeadMaterialType) => void;
    isAudioMuted: boolean;
    onToggleAudio: () => void;
    isZenMode: boolean;
    onToggleZenMode: () => void;
}

const VOICE_STATUS_LABEL: Record<VoiceStatus, string> = {
    idle: 'CHANT OR ROLL BEAD',
    listening: 'LISTENING TO MAHA MANTRA...',
    unsupported: 'VOICE UNAVAILABLE · ROLL A BEAD',
    denied: 'MIC BLOCKED · ROLL A BEAD',
    error: 'VOICE PAUSED · ROLL A BEAD',
};

const GlassOverlay: React.FC<GlassOverlayProps> = ({
    count,
    round,
    lifetimeCount,
    mantra,
    isListening,
    voiceStatus,
    onToggleListen,
    onOpenSettings,
    activeMaterial,
    onSelectMaterial,
    isAudioMuted,
    onToggleAudio,
    isZenMode,
    onToggleZenMode,
}) => {
    const [idle, setIdle] = useState(false);
    const [showMaterialMenu, setShowMaterialMenu] = useState(false);
    const [celebrationText, setCelebrationText] = useState<string | null>(null);
    const prevCount = useRef(count);

    // Quarter milestones (27, 54, 81) & Round completion (0 or 108)
    useEffect(() => {
        if (count === 27 && prevCount.current !== 27) {
            setCelebrationText('27 Offerings · 1/4 Mala');
            const timer = setTimeout(() => setCelebrationText(null), 3000);
            return () => clearTimeout(timer);
        } else if (count === 54 && prevCount.current !== 54) {
            setCelebrationText('54 Offerings · Half Mala Complete');
            const timer = setTimeout(() => setCelebrationText(null), 3500);
            return () => clearTimeout(timer);
        } else if (count === 81 && prevCount.current !== 81) {
            setCelebrationText('81 Offerings · 3/4 Mala Complete');
            const timer = setTimeout(() => setCelebrationText(null), 3000);
            return () => clearTimeout(timer);
        } else if (count === 0 && prevCount.current > 100) {
            setCelebrationText(`Round ${round} Complete · 108 Sacred Offerings`);
            const timer = setTimeout(() => setCelebrationText(null), 4500);
            return () => clearTimeout(timer);
        }
        prevCount.current = count;
    }, [count, round]);

    // Auto-idle dimming
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const resetIdle = () => {
            setIdle(false);
            clearTimeout(timeout);
            timeout = setTimeout(() => setIdle(true), 5000);
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

    // Progress percentage
    const progressPercent = Math.min(100, Math.round((count / mantra.roundLength) * 100));

    // Circular SVG Progress Ring calculation
    const radius = 88;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (count / mantra.roundLength) * circumference;

    const materials: BeadMaterialType[] = ['tulsi', 'rudraksha', 'sandalwood', 'sphatik'];

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-7 z-40 select-none">
            {/* Top Bar: Sacred Status & Round */}
            <motion.header
                animate={{
                    opacity: isZenMode ? 0 : idle ? 0.25 : 1,
                    y: isZenMode ? -30 : idle ? -10 : 0
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex justify-between items-start pointer-events-auto"
            >
                {/* Voice Status & Connection */}
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full shadow-lg">
                    <div className="relative flex items-center justify-center">
                        <div
                            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                                isListening
                                    ? 'bg-amber-400 animate-ping'
                                    : voiceStatus === 'idle'
                                    ? 'bg-emerald-400'
                                    : 'bg-amber-500'
                            }`}
                        />
                        <div
                            className={`absolute w-2 h-2 rounded-full ${
                                isListening ? 'bg-amber-400' : voiceStatus === 'idle' ? 'bg-emerald-400' : 'bg-amber-500'
                            }`}
                        />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-amber-100/80 font-medium">
                        {VOICE_STATUS_LABEL[voiceStatus]}
                    </span>
                </div>

                {/* Round & Sadhana Stat Badge */}
                <div className="flex items-center gap-2">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-right shadow-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase tracking-[0.25em] text-amber-200/60">Round</span>
                            <span className="font-serif font-bold text-amber-200 text-sm tracking-widest">
                                {round.toString().padStart(2, '0')}
                            </span>
                            <span className="text-white/20 text-xs">|</span>
                            <span className="text-[9px] uppercase tracking-[0.2em] text-white/50">Total</span>
                            <span className="font-mono text-white/80 text-xs">
                                {lifetimeCount}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Center: Divine Sacred Mandala Counter & Sanskrit Typography */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none flex flex-col items-center">
                {/* Radiant Ambient Back-glow */}
                <div className="absolute inset-0 -m-32 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,160,23,0.12)_0%,rgba(160,82,45,0.06)_45%,transparent_75%)] pointer-events-none" />

                {/* Milestone Celebration Banner */}
                <AnimatePresence>
                    {celebrationText && (
                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.92 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.95 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="absolute -top-24 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-amber-500/20 via-amber-300/30 to-amber-500/20 border border-amber-300/40 backdrop-blur-xl px-6 py-2 rounded-full shadow-[0_0_25px_rgba(255,200,80,0.3)] z-50"
                        >
                            <div className="flex items-center gap-2 text-amber-200 text-xs font-serif tracking-[0.2em] uppercase font-semibold">
                                <Sparkles size={14} className="text-amber-300 animate-spin" />
                                <span>{celebrationText}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sanskrit Divine Name Calligraphy */}
                <motion.div
                    animate={{ opacity: isZenMode ? 0.2 : idle ? 0.5 : 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative mb-3 flex flex-col items-center pointer-events-auto"
                >
                    <div className="text-amber-200/90 font-serif text-lg sm:text-2xl font-bold tracking-[0.15em] drop-shadow-[0_2px_12px_rgba(255,190,50,0.5)]">
                        {mantra.sanskrit}
                    </div>
                    <div className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-amber-300/70 font-medium mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                        {mantra.name}
                    </div>
                </motion.div>

                {/* Circular Sacred Progress Ring & Bead Count */}
                <motion.div
                    animate={{
                        opacity: isZenMode ? 0.35 : idle ? 0.7 : 1,
                        scale: isZenMode ? 0.85 : 1
                    }}
                    transition={{ duration: 0.6 }}
                    className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center pointer-events-none"
                >
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                        {/* Background track */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            className="stroke-amber-950/40"
                            strokeWidth="3.5"
                            fill="transparent"
                        />
                        {/* Luminous progress arc */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            className="stroke-amber-400 transition-all duration-300"
                            strokeWidth="3.5"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                            style={{
                                filter: 'drop-shadow(0 0 6px rgba(255, 215, 80, 0.75))',
                            }}
                        />
                        {/* Quarter Milestone Jewel Dots (27, 54, 81, 108) */}
                        {[0, 0.25, 0.5, 0.75].map((pct, idx) => {
                            const ang = pct * Math.PI * 2;
                            const cx = 100 + Math.cos(ang) * radius;
                            const cy = 100 + Math.sin(ang) * radius;
                            const reached = count >= (idx + 1) * 27 || (idx === 0 && count >= 27);
                            return (
                                <circle
                                    key={idx}
                                    cx={cx}
                                    cy={cy}
                                    r={reached ? 4 : 2.5}
                                    className={`transition-colors duration-500 ${
                                        reached ? 'fill-amber-300' : 'fill-white/30'
                                    }`}
                                    style={{
                                        filter: reached ? 'drop-shadow(0 0 4px rgba(255, 230, 100, 0.9))' : 'none'
                                    }}
                                />
                            );
                        })}
                    </svg>

                    {/* Central Number & Glyph */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-3xl sm:text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500 drop-shadow-[0_2px_10px_rgba(255,190,60,0.5)] tracking-tighter">
                            {count}
                        </div>
                        <div className="text-[9px] uppercase tracking-[0.35em] text-amber-200/60 font-medium mt-0.5">
                            of {mantra.roundLength}
                        </div>
                        <div className="text-[9px] font-mono text-amber-300/40 tracking-wider mt-1">
                            {progressPercent}% Complete
                        </div>
                    </div>
                </motion.div>

                {/* Dynamic Mantra Contemplation Text */}
                <motion.div
                    animate={{ opacity: isZenMode ? 0 : idle ? 0.3 : 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative max-w-sm px-4 mt-2"
                >
                    <p className="text-[11px] sm:text-xs text-amber-100/70 italic font-serif leading-relaxed text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                        &ldquo;{mantra.translation}&rdquo;
                    </p>
                </motion.div>
            </div>

            {/* Bottom Bar: Sacred Controls & Bead Switcher */}
            <motion.footer
                animate={{
                    opacity: isZenMode ? 0.15 : idle ? 0.35 : 1,
                    y: isZenMode ? 30 : idle ? 10 : 0
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex flex-col items-center gap-3 pointer-events-auto"
            >
                {/* Bead Material Selector Bubble (Animated) */}
                <AnimatePresence>
                    {showMaterialMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.95 }}
                            className="bg-black/80 backdrop-blur-2xl border border-amber-400/30 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2 mb-1"
                        >
                            {materials.map((mat) => {
                                const active = mat === activeMaterial;
                                const cfg = BEAD_MATERIAL_CONFIGS[mat];
                                return (
                                    <button
                                        key={mat}
                                        onClick={() => {
                                            onSelectMaterial(mat);
                                            setShowMaterialMenu(false);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                                            active
                                                ? 'bg-amber-400 text-black font-semibold shadow-[0_0_12px_rgba(255,200,60,0.5)]'
                                                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <div
                                            className="w-2.5 h-2.5 rounded-full border border-white/20"
                                            style={{ backgroundColor: cfg.color }}
                                        />
                                        <span>{cfg.name}</span>
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Primary Control Buttons */}
                <div className="flex items-center gap-3 sm:gap-4 bg-black/50 backdrop-blur-xl border border-white/15 px-4 py-2 rounded-full shadow-2xl">
                    {/* Bead Material Picker */}
                    <button
                        onClick={() => setShowMaterialMenu(prev => !prev)}
                        className={`p-2.5 rounded-full transition-all duration-300 ${
                            showMaterialMenu
                                ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(255,200,60,0.5)]'
                                : 'text-amber-200/80 hover:bg-white/10'
                        }`}
                        title="Change Bead Material"
                    >
                        <div className="flex items-center gap-1 text-xs">
                            <div
                                className="w-3 h-3 rounded-full border border-amber-300/40"
                                style={{ backgroundColor: BEAD_MATERIAL_CONFIGS[activeMaterial].color }}
                            />
                            <span className="text-[10px] hidden sm:inline uppercase tracking-widest font-medium">
                                {BEAD_MATERIAL_CONFIGS[activeMaterial].name.split(' ')[1] || BEAD_MATERIAL_CONFIGS[activeMaterial].name}
                            </span>
                        </div>
                    </button>

                    {/* Audio Toggle (Cosmic Om Drone & Bells) */}
                    <button
                        onClick={onToggleAudio}
                        className={`p-2.5 rounded-full transition-all duration-300 ${
                            !isAudioMuted
                                ? 'text-amber-300 hover:bg-white/10'
                                : 'text-white/40 hover:bg-white/10'
                        }`}
                        title={isAudioMuted ? 'Unmute Sacred Ambience' : 'Mute Sacred Ambience'}
                    >
                        {isAudioMuted ? (
                            <VolumeX size={18} strokeWidth={1.75} />
                        ) : (
                            <Volume2 size={18} strokeWidth={1.75} className="animate-pulse" />
                        )}
                    </button>

                    {/* Voice Chant Mode Button */}
                    <button
                        onClick={onToggleListen}
                        className={`p-3 rounded-full transition-all duration-300 ${
                            isListening
                                ? 'bg-amber-400 text-black shadow-[0_0_20px_rgba(255,200,60,0.6)] scale-105'
                                : voiceStatus === 'unsupported' || voiceStatus === 'denied'
                                ? 'bg-black/60 text-white/30 border border-white/10'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title={isListening ? 'Stop Voice Detection' : 'Chant with Voice Mode'}
                    >
                        {isListening ? (
                            <Waves size={19} strokeWidth={2} />
                        ) : voiceStatus === 'unsupported' || voiceStatus === 'denied' ? (
                            <MicOff size={19} strokeWidth={1.75} />
                        ) : (
                            <Mic size={19} strokeWidth={1.75} />
                        )}
                    </button>

                    {/* Zen Mode Toggle (Immerse in pure 3D Mala) */}
                    <button
                        onClick={onToggleZenMode}
                        className={`p-2.5 rounded-full transition-all duration-300 ${
                            isZenMode
                                ? 'text-amber-400 bg-amber-400/20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                        title={isZenMode ? 'Exit Zen Mode' : 'Enter Zen Immersion Mode'}
                    >
                        {isZenMode ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                    </button>

                    {/* Sanctuary Settings / Sadhana Journal */}
                    <button
                        onClick={onOpenSettings}
                        className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
                        title="Sacred Practice & Mantras"
                    >
                        <Sliders size={18} strokeWidth={1.75} />
                    </button>
                </div>

                {/* Zen mode floating exit hint when hidden */}
                {isZenMode && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        onClick={onToggleZenMode}
                        className="text-[10px] text-amber-200/80 uppercase tracking-[0.25em] bg-black/40 px-3 py-1 rounded-full border border-amber-400/20"
                    >
                        Tap to Exit Zen Mode
                    </motion.button>
                )}
            </motion.footer>

            {/* Subtle Cinematic Grain overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.025] bg-[url('/noise.svg')] mix-blend-overlay" />
        </div>
    );
};

export default GlassOverlay;
