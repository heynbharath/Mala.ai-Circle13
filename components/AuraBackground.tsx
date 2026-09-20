"use client";

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface AuraBackgroundProps {
    intensity?: number;
}

const AuraBackground: React.FC<AuraBackgroundProps> = ({ intensity = 0 }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const t = state.clock.elapsedTime;

        if (meshRef.current) {
            meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.2;
            meshRef.current.rotation.y = Math.sin(t * 0.3) * 0.2;

            // Pulse scale slightly with intensity
            const scale = 3 + intensity * 0.4;
            meshRef.current.scale.setScalar(scale);
        }
    });

    return (
        <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.2}>
            {/* A soft, self-lit disc of warm light, smaller than the mala loop
                so it reads as a glow behind it — no external environment map,
                so it renders identically offline and never depends on a CDN fetch. */}
            <mesh ref={meshRef} position={[0, 0, -8]}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial
                    color="#3a1600"
                    roughness={0.7}
                    metalness={0}
                    emissive="#FFA500"
                    emissiveIntensity={0.4 + intensity * 0.7}
                />
            </mesh>
        </Float>
    );
};

export default AuraBackground;
