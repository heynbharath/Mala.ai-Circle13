"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AuraBackgroundProps {
    intensity?: number; // 0 -> 1 progress in current round
}

const PARTICLE_COUNT = 140;

const AuraBackground: React.FC<AuraBackgroundProps> = ({ intensity = 0 }) => {
    const auraMeshRef = useRef<THREE.Mesh>(null);
    const mandalaRef = useRef<THREE.Mesh>(null);
    const particlesRef = useRef<THREE.Points>(null);
    const diyaLightRef = useRef<THREE.PointLight>(null);

    // Procedural Circular Glow Texture for Floating Prana Particles
    const particleTexture = useMemo(() => {
        if (typeof document === 'undefined') return new THREE.Texture();
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 230, 150, 1)');
        grad.addColorStop(0.25, 'rgba(255, 180, 70, 0.7)');
        grad.addColorStop(0.6, 'rgba(210, 100, 30, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }, []);

    // Procedural Sacred Lotus Mandala / Yantra Texture
    const mandalaTexture = useMemo(() => {
        if (typeof document === 'undefined') return new THREE.Texture();
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d')!;

        ctx.clearRect(0, 0, 1024, 1024);
        const cx = 512;
        const cy = 512;

        ctx.strokeStyle = 'rgba(255, 215, 110, 0.55)';
        ctx.lineWidth = 2.5;

        // Concentric sacred geometry rings
        const rings = [120, 180, 240, 310, 390, 480];
        rings.forEach((r, idx) => {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();

            // Lotus Petals for this ring
            const petals = 12 + idx * 8;
            for (let i = 0; i < petals; i++) {
                const angle = (i / petals) * Math.PI * 2;
                const px = cx + Math.cos(angle) * r;
                const py = cy + Math.sin(angle) * r;

                ctx.beginPath();
                ctx.arc(px, py, 14 + idx * 6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 190, 60, 0.08)';
                ctx.fill();
                ctx.stroke();
            }
        });

        // 108 Petal Outer Radiant Ring
        for (let i = 0; i < 108; i++) {
            const angle = (i / 108) * Math.PI * 2;
            const r1 = 480;
            const r2 = 506;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
            ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
            ctx.strokeStyle = i % 27 === 0 ? 'rgba(255, 240, 180, 0.85)' : 'rgba(255, 200, 80, 0.35)';
            ctx.lineWidth = i % 27 === 0 ? 3.5 : 1.5;
            ctx.stroke();
        }

        // Central Bindu dot
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 225, 140, 0.85)';
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }, []);

    // Initialize Prana Particles Positions & Velocities
    const [particlePositions, particleData] = useMemo(() => {
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const data: { speedY: number; wobbleSpeed: number; wobbleAmp: number; startX: number }[] = [];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const x = (Math.random() - 0.5) * 14;
            const y = (Math.random() - 0.5) * 16;
            const z = (Math.random() - 0.5) * 8 - 2;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            data.push({
                speedY: 0.15 + Math.random() * 0.35,
                wobbleSpeed: 0.8 + Math.random() * 1.5,
                wobbleAmp: 0.05 + Math.random() * 0.15,
                startX: x,
            });
        }
        return [positions, data];
    }, []);

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;

        // Slow meditative rotation of background aura
        if (auraMeshRef.current) {
            auraMeshRef.current.rotation.z = t * 0.02;
            const auraScale = 4.5 + intensity * 0.8 + Math.sin(t * 0.6) * 0.15;
            auraMeshRef.current.scale.setScalar(auraScale);
        }

        // Slow celestial spin of the Lotus Mandala
        if (mandalaRef.current) {
            mandalaRef.current.rotation.z = -t * 0.035;
            const mandalaScale = 11.5 + intensity * 1.2 + Math.sin(t * 0.8) * 0.2;
            mandalaRef.current.scale.setScalar(mandalaScale);
        }

        // Gentle Diya Ghee Lamp Flicker
        if (diyaLightRef.current) {
            diyaLightRef.current.intensity =
                1.4 +
                Math.sin(t * 7.1) * 0.12 +
                Math.sin(t * 13.3) * 0.08 +
                intensity * 0.6;
        }

        // Upward floating sacred prana particles
        if (particlesRef.current) {
            const posAttr = particlesRef.current.geometry.attributes.position;
            const array = posAttr.array as Float32Array;

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const idx = i * 3;
                const d = particleData[i];

                // Drift upward
                array[idx + 1] += d.speedY * delta;

                // Subtle lateral wobble like rising incense smoke
                array[idx] = d.startX + Math.sin(t * d.wobbleSpeed + i) * d.wobbleAmp;

                // Reset when floating out of top viewport
                if (array[idx + 1] > 8.5) {
                    array[idx + 1] = -8.5;
                }
            }
            posAttr.needsUpdate = true;
        }
    });

    return (
        <>
            {/* Temple Diya Warm Lights */}
            <pointLight
                ref={diyaLightRef}
                position={[0, -2, 4]}
                color="#ffaa3b"
                intensity={1.5}
                distance={18}
                decay={2}
            />

            {/* Subtle Divine Rim Light */}
            <pointLight
                position={[0, 4, -4]}
                color="#ffd57a"
                intensity={0.8}
                distance={15}
            />

            {/* Sacred Golden Lotus Mandala Yantra in Deep Background */}
            <mesh ref={mandalaRef} position={[0, 0, -9.5]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial
                    map={mandalaTexture}
                    transparent
                    opacity={0.16 + intensity * 0.22}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Warm Ethereal Backlit Disc */}
            <mesh ref={auraMeshRef} position={[0, 0, -8.5]}>
                <circleGeometry args={[1, 64]} />
                <meshBasicMaterial
                    color="#e07a1f"
                    transparent
                    opacity={0.14 + intensity * 0.2}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Floating Prana Embers (Sacred Fire Particles) */}
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[particlePositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    map={particleTexture}
                    size={0.45}
                    sizeAttenuation
                    transparent
                    opacity={0.7}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </>
    );
};

export default AuraBackground;
