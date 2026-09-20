"use client";

import React, { Suspense, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useMantraEngine } from '@/hooks/useMantraEngine';
import AuraBackground from '@/components/AuraBackground';
import MalaHelix from '@/components/MalaHelix';
import GlassOverlay from '@/components/GlassOverlay';
import Dashboard from '@/components/Dashboard';
import { SpatialAudio } from '@/lib/SpatialAudio';
import type { BeadMaterialType } from '@/lib/BeadTextures';

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
  const [activeMaterial, setActiveMaterial] = useState<BeadMaterialType>('tulsi');
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);

  // Restore bead material preference on mount
  useEffect(() => {
    const savedMaterial = localStorage.getItem('nitya_material') as BeadMaterialType | null;
    if (savedMaterial && ['tulsi', 'rudraksha', 'sandalwood', 'sphatik'].includes(savedMaterial)) {
      setActiveMaterial(savedMaterial);
    } else if (mantra.recommendedBead) {
      setActiveMaterial(mantra.recommendedBead);
    }
  }, [mantra.recommendedBead]);

  // Strict Mobile Pinch & Multi-Touch Prevention
  useEffect(() => {
    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('touchmove', preventMultiTouch, { passive: false });
    window.addEventListener('gesturestart', preventGesture);
    window.addEventListener('gesturechange', preventGesture);

    return () => {
      window.removeEventListener('touchmove', preventMultiTouch);
      window.removeEventListener('gesturestart', preventGesture);
      window.removeEventListener('gesturechange', preventGesture);
    };
  }, []);

  const handleSelectMaterial = useCallback((mat: BeadMaterialType) => {
    setActiveMaterial(mat);
    localStorage.setItem('nitya_material', mat);
  }, []);

  const handleToggleAudio = useCallback(() => {
    setIsAudioMuted(prev => {
      const next = !prev;
      SpatialAudio.setMuted(next);
      return next;
    });
  }, []);

  const handleToggleZenMode = useCallback(() => {
    setIsZenMode(prev => !prev);
  }, []);

  const toggleDashboard = useCallback(() => {
    setIsDashboardOpen(prev => !prev);
  }, []);

  // Progress within the current round (0 -> 1)
  const intensity = (count % mantra.roundLength) / mantra.roundLength;

  return (
    <main className="relative w-full h-screen bg-[#070402] overflow-hidden select-none touch-none">

      {/* 3D Sacred Scene Layer */}
      <div className="absolute inset-0 z-0 touch-none cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [0, 0, 14.5], fov: 45 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          {/* Temple Altar Lighting — warm glowing diya light */}
          <ambientLight intensity={0.4} color="#ffe8c2" />
          <directionalLight position={[6, 8, 8]} intensity={1.1} color="#fff1cc" />
          <directionalLight position={[-6, -6, 6]} intensity={0.4} color="#ff9030" />

          {/* Living Temple Background: Yantra Mandala, Prana Embers, Warm Diya Aura */}
          <AuraBackground intensity={intensity} />

          {/* Main 3D Interactive Sacred Mala */}
          <Suspense fallback={null}>
            <MalaHelix
              onIncrement={increment}
              materialType={activeMaterial}
              count={count}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Divine Sanctuary Glass Overlay */}
      <GlassOverlay
        count={count}
        round={round}
        lifetimeCount={lifetimeCount}
        mantra={mantra}
        isListening={isListening}
        voiceStatus={voiceStatus}
        onToggleListen={toggleMode}
        onOpenSettings={toggleDashboard}
        activeMaterial={activeMaterial}
        onSelectMaterial={handleSelectMaterial}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
        isZenMode={isZenMode}
        onToggleZenMode={handleToggleZenMode}
      />

      {/* Sacred Practice Dashboard & Settings */}
      <Dashboard
        round={round}
        mantraId={mantraId}
        onSelectMantra={setMantra}
        activeMaterial={activeMaterial}
        onSelectMaterial={handleSelectMaterial}
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
      />

    </main>
  );
}
