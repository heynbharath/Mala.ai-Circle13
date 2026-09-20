"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import {
    Flame,
    Calendar,
    X,
    Check,
    Award,
    Sparkles
} from 'lucide-react';
import { MANTRAS, type MantraId } from '@/lib/mantras';
import {
    BEAD_MATERIAL_CONFIGS,
    type BeadMaterialType
} from '@/lib/BeadTextures';

interface DashboardProps {
    round: number;
    mantraId: MantraId;
    onSelectMantra: (id: MantraId) => void;
    activeMaterial: BeadMaterialType;
    onSelectMaterial: (mat: BeadMaterialType) => void;
    isOpen: boolean;
    onClose: () => void;
}

interface DayStat {
    date: string;
    count: number;
}

const MILESTONES = [
    { target: 1, label: 'First Offering', desc: 'Completed 1 full round of 108 beads' },
    { target: 4, label: 'Four Pillars', desc: 'Completed 4 rounds (432 offerings)' },
    { target: 16, label: 'Daily Sadhana', desc: 'Completed 16 rounds of sacred japa' },
    { target: 64, label: 'Deep Devotion', desc: 'Crossed 64 rounds of meditation' },
    { target: 108, label: 'Maha Purashcharana', desc: 'Completed 108 rounds (11,664 chants)' },
];

const Dashboard: React.FC<DashboardProps> = ({
    round,
    mantraId,
    onSelectMantra,
    activeMaterial,
    onSelectMaterial,
    isOpen,
    onClose
}) => {
    const [heatmapData, setHeatmapData] = useState<DayStat[]>([]);
    const [streak, setStreak] = useState(0);
    const [activeTab, setActiveTab] = useState<'mantras' | 'beads' | 'journal'>('mantras');

    useEffect(() => {
        if (!isOpen) return;

        const fetchStats = async () => {
            const now = new Date();
            const stats: Record<string, number> = {};

            // Initialize last 14 days
            for (let i = 13; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const key = d.toISOString().split('T')[0];
                stats[key] = 0;
            }

            try {
                const recentSessions = await db.sessions
                    .where('timestamp')
                    .above(Date.now() - 14 * 24 * 60 * 60 * 1000)
                    .toArray();

                recentSessions.forEach(s => {
                    const key = new Date(s.timestamp).toISOString().split('T')[0];
                    if (stats[key] !== undefined) stats[key] += s.count;
                });
            } catch (err) {
                console.warn("Could not query session database:", err);
            }

            const data = Object.entries(stats).map(([date, count]) => ({ date, count }));
            setHeatmapData(data);
            setStreak(data.filter(d => d.count > 0).length);
        };
        fetchStats();
    }, [isOpen]);

    const materials: BeadMaterialType[] = ['tulsi', 'rudraksha', 'sandalwood', 'sphatik'];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop blur click-out */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 pointer-events-auto"
                    />

                    {/* Sanctuary Drawer */}
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: '0%' }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        className="fixed bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto bg-gradient-to-b from-[#180f08]/95 to-[#0b0603]/98 backdrop-blur-2xl border-t border-amber-500/25 rounded-t-[2.5rem] p-6 sm:p-8 z-50 text-white shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto"
                    >
                        {/* Drawer handle */}
                        <div className="w-12 h-1.5 bg-amber-200/20 rounded-full mx-auto mb-6" />

                        {/* Sanctuary Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl shadow-[0_0_15px_rgba(255,200,60,0.15)]">
                                    <Sparkles className="text-amber-400" size={22} />
                                </div>
                                <div>
                                    <h2 className="font-serif font-bold text-xl tracking-wide text-amber-100">
                                        Sacred Sanctuary
                                    </h2>
                                    <p className="text-[11px] text-amber-200/50 uppercase tracking-[0.25em]">
                                        Nitya Sadhana Practice
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-amber-200/70 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-2 p-1 bg-black/40 rounded-2xl border border-white/10 mb-6 max-w-md mx-auto">
                            <button
                                onClick={() => setActiveTab('mantras')}
                                className={`flex-1 py-2 rounded-xl text-xs font-serif font-semibold tracking-wider transition-all duration-300 ${
                                    activeTab === 'mantras'
                                        ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(255,200,60,0.4)]'
                                        : 'text-amber-100/60 hover:text-white'
                                }`}
                            >
                                Sacred Naam
                            </button>
                            <button
                                onClick={() => setActiveTab('beads')}
                                className={`flex-1 py-2 rounded-xl text-xs font-serif font-semibold tracking-wider transition-all duration-300 ${
                                    activeTab === 'beads'
                                        ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(255,200,60,0.4)]'
                                        : 'text-amber-100/60 hover:text-white'
                                }`}
                            >
                                Mala Beads
                            </button>
                            <button
                                onClick={() => setActiveTab('journal')}
                                className={`flex-1 py-2 rounded-xl text-xs font-serif font-semibold tracking-wider transition-all duration-300 ${
                                    activeTab === 'journal'
                                        ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(255,200,60,0.4)]'
                                        : 'text-amber-100/60 hover:text-white'
                                }`}
                            >
                                Devotion Journal
                            </button>
                        </div>

                        {/* TAB 1: MANTRAS */}
                        {activeTab === 'mantras' && (
                            <div className="space-y-3 mb-6 max-w-2xl mx-auto">
                                {Object.values(MANTRAS).map((mantra) => {
                                    const active = mantra.id === mantraId;
                                    return (
                                        <button
                                            key={mantra.id}
                                            onClick={() => {
                                                onSelectMantra(mantra.id);
                                                // Automatically suggest recommended bead type
                                                onSelectMaterial(mantra.recommendedBead);
                                            }}
                                            className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                                                active
                                                    ? 'bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent border-amber-400/50 shadow-[0_0_20px_rgba(255,190,50,0.15)]'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm sm:text-base font-serif font-bold text-amber-200">
                                                            {mantra.sanskrit}
                                                        </span>
                                                    </div>
                                                    <div className="font-semibold text-sm text-white">
                                                        {mantra.name}
                                                    </div>
                                                    <div className="text-xs text-amber-100/60 italic font-serif">
                                                        {mantra.subtitle}
                                                    </div>
                                                    <div className="text-[11px] text-white/40 pt-1 leading-relaxed">
                                                        {mantra.translation}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 pt-1">
                                                    {active ? (
                                                        <div className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center">
                                                            <Check size={14} strokeWidth={2.5} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full border border-white/20" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* TAB 2: BEAD MATERIALS */}
                        {activeTab === 'beads' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6 max-w-2xl mx-auto">
                                {materials.map((mat) => {
                                    const active = mat === activeMaterial;
                                    const cfg = BEAD_MATERIAL_CONFIGS[mat];
                                    return (
                                        <button
                                            key={mat}
                                            onClick={() => onSelectMaterial(mat)}
                                            className={`text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                                                active
                                                    ? 'bg-amber-400/15 border-amber-400/60 shadow-[0_0_20px_rgba(255,200,60,0.2)]'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div
                                                    className="w-8 h-8 rounded-full border-2 border-white/30 shadow-lg shrink-0"
                                                    style={{ backgroundColor: cfg.color }}
                                                />
                                                <div>
                                                    <div className={`font-serif font-bold text-sm ${active ? 'text-amber-300' : 'text-white'}`}>
                                                        {cfg.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-amber-100/60 leading-relaxed">
                                                {cfg.description}
                                            </p>
                                            {active && (
                                                <div className="absolute top-3 right-3 text-amber-300">
                                                    <Check size={16} strokeWidth={2.5} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* TAB 3: DEVOTION JOURNAL & STREAKS */}
                        {activeTab === 'journal' && (
                            <div className="max-w-2xl mx-auto space-y-6">
                                {/* Streak + Round Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-amber-500/20 to-transparent p-5 sm:p-6 rounded-2xl border border-amber-400/30 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-15">
                                            <Flame size={75} />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="text-3xl sm:text-4xl font-serif font-black text-amber-300 mb-1">
                                                {streak} <span className="text-base font-normal text-amber-200/70">Days</span>
                                            </div>
                                            <div className="text-[10px] uppercase tracking-[0.25em] text-amber-100/60">
                                                Sadhana Streak
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 p-5 sm:p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="text-3xl sm:text-4xl font-serif font-black text-white mb-1">
                                                {round} <span className="text-base font-normal text-white/50">Rounds</span>
                                            </div>
                                            <div className="text-[10px] uppercase tracking-[0.25em] text-white/50">
                                                Total Malas Chanted
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 14-Day Activity Heatmap */}
                                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5">
                                    <div className="flex items-center gap-2 mb-3 text-amber-200/70 text-xs font-serif tracking-wider">
                                        <Calendar size={14} />
                                        <span>Past 14 Days Devotion Flow</span>
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                        {heatmapData.map((day) => (
                                            <div key={day.date} className="flex flex-col items-center gap-1">
                                                <div
                                                    className={`w-full aspect-square rounded-lg transition-all duration-500 ${
                                                        day.count >= 108 * 4
                                                            ? 'bg-amber-300 shadow-[0_0_12px_#ffd700]'
                                                            : day.count >= 108
                                                            ? 'bg-amber-400/80'
                                                            : day.count > 0
                                                            ? 'bg-amber-500/30'
                                                            : 'bg-white/5'
                                                    }`}
                                                />
                                                <span className="text-[9px] text-white/30 font-mono">
                                                    {day.date.slice(8)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sadhana Milestones */}
                                <div className="bg-black/30 border border-white/10 rounded-2xl p-4 sm:p-5">
                                    <div className="flex items-center gap-2 mb-3 text-amber-200/70 text-xs font-serif tracking-wider">
                                        <Award size={14} />
                                        <span>Sacred Milestones</span>
                                    </div>
                                    <div className="space-y-2">
                                        {MILESTONES.map((m) => {
                                            const unlocked = round >= m.target;
                                            return (
                                                <div
                                                    key={m.target}
                                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                        unlocked
                                                            ? 'bg-amber-400/10 border-amber-400/30 text-amber-200'
                                                            : 'bg-white/5 border-white/5 text-white/40'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                                                unlocked ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/40'
                                                            }`}
                                                        >
                                                            {unlocked ? <Check size={14} /> : m.target}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-xs">
                                                                {m.label}
                                                            </div>
                                                            <div className="text-[10px] text-white/40">
                                                                {m.desc}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs font-serif font-bold">
                                                        {unlocked ? 'Attained' : `${round}/${m.target}`}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Dashboard;
