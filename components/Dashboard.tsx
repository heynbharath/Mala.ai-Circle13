"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { Flower2, Flame, Calendar, X, Check } from 'lucide-react';
import { MANTRAS, type MantraId } from '@/lib/mantras';

interface DashboardProps {
    round: number;
    mantraId: MantraId;
    onSelectMantra: (id: MantraId) => void;
    isOpen: boolean;
    onClose: () => void;
}

interface DayStat {
    date: string;
    count: number;
}

const Dashboard: React.FC<DashboardProps> = ({ round, mantraId, onSelectMantra, isOpen, onClose }) => {
    const [heatmapData, setHeatmapData] = useState<DayStat[]>([]);
    const [streak, setStreak] = useState(0);

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

            const recentSessions = await db.sessions
                .where('timestamp')
                .above(Date.now() - 14 * 24 * 60 * 60 * 1000)
                .toArray();

            recentSessions.forEach(s => {
                const key = new Date(s.timestamp).toISOString().split('T')[0];
                if (stats[key] !== undefined) stats[key] += s.count;
            });

            const data = Object.entries(stats).map(([date, count]) => ({ date, count }));
            setHeatmapData(data);
            setStreak(data.filter(d => d.count > 0).length); // consecutive active days, simplified
        };
        fetchStats();
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="absolute bottom-0 left-0 right-0 h-[75vh] overflow-y-auto bg-black/80 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-6 z-50 text-white"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-neon-gold/20 rounded-lg">
                                <Flower2 className="text-neon-gold" size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg tracking-wide">Your Practice</h2>
                                <p className="text-xs text-white/40 uppercase tracking-widest">Nitya</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                            <X size={20} className="text-white/60" />
                        </button>
                    </div>

                    {/* Mantra selection */}
                    <div className="mb-6">
                        <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Choose your Naam</div>
                        <div className="flex flex-col gap-3">
                            {Object.values(MANTRAS).map((mantra) => {
                                const active = mantra.id === mantraId;
                                return (
                                    <button
                                        key={mantra.id}
                                        onClick={() => onSelectMantra(mantra.id)}
                                        className={`text-left p-4 rounded-2xl border transition-colors duration-300 ${active
                                                ? 'bg-neon-gold/10 border-neon-gold/40'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className={`font-semibold ${active ? 'text-neon-gold' : 'text-white'}`}>{mantra.name}</div>
                                                <div className="text-xs text-white/40 mt-0.5">{mantra.subtitle}</div>
                                            </div>
                                            {active && <Check size={18} className="text-neon-gold shrink-0" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Streak + Round Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-neon-gold/10 to-transparent p-6 rounded-2xl border border-neon-gold/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <Flame size={80} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-4xl font-bold font-mono text-neon-gold mb-1">{streak}</div>
                                <div className="text-xs uppercase tracking-[0.2em] text-white/50">Active Streak</div>
                            </div>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="text-4xl font-bold font-mono text-white mb-1">{round}</div>
                                <div className="text-xs uppercase tracking-[0.2em] text-white/50">Total Rounds</div>
                            </div>
                        </div>
                    </div>

                    {/* Heatmap Grid */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4 text-white/60 text-sm">
                            <Calendar size={14} />
                            <span>Recent Flow</span>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {heatmapData.map((day) => (
                                <div key={day.date} className="flex flex-col items-center gap-1">
                                    <div
                                        className={`w-full aspect-square rounded-md transition-all duration-500 ${day.count > 108 * 4 ? 'bg-neon-gold shadow-[0_0_10px_#FFD700]' :
                                                day.count > 108 ? 'bg-neon-gold/60' :
                                                    day.count > 0 ? 'bg-neon-gold/20' :
                                                        'bg-white/5'
                                            }`}
                                    />
                                    <span className="text-[9px] text-white/20 font-mono">{day.date.slice(8)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Dashboard;
