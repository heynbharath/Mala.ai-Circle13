"use client";

import React, { Suspense, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useMantraEngine } from '@/hooks/useMantraEngine';
import AuraBackground from '@/components/AuraBackground';
import MalaHelix from '@/components/MalaHelix';
import GlassOverlay from '@/components/GlassOverlay';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const {
    count,
    round,
    lifetimeCount,
    mantraId,
    mantra,
    setMantra,
    isListening,
    voiceStatus,
    toggleMode,
    increment
  } = useMantraEngine();

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const toggleDashboard = useCallback(() => setIsDashboardOpen(prev => !prev), []);

  // Progress within the current round (0 -> 1), used to drive ambient visuals.
  const intensity = (count % mantra.roundLength) / mantra.roundLength;

  return (
    <main className="relative w-full h-screen bg-[#0a0603] overflow-hidden">

      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>

          {/* Environment — warm temple light, not cold sci-fi */}
          <ambientLight intensity={0.25} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#FFD700" />
          <pointLight position={[-10, -5, -5]} intensity={0.4} color="#7a1f0a" />

          {/* Background glow */}
          <AuraBackground intensity={intensity} />

          {/* Main 3D Interactive Element — drag or tap the mala to count */}
          <Suspense fallback={null}>
            <MalaHelix onIncrement={increment} />
          </Suspense>

        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      <GlassOverlay
        count={count}
        round={round}
        lifetimeCount={lifetimeCount}
        mantra={mantra}
        isListening={isListening}
        voiceStatus={voiceStatus}
        onToggleListen={toggleMode}
        onOpenSettings={toggleDashboard}
      />

      {/* Overlay Dashboard (hidden by default, triggered by settings) */}
      <Dashboard
        round={round}
        mantraId={mantraId}
        onSelectMantra={setMantra}
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />

    </main>
  );
}
