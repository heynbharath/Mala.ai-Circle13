"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useSensoryFeedback } from '@/hooks/useSensoryFeedback';

interface MalaHelixProps {
    onIncrement: () => void;
}

const BEAD_COUNT = 108;
const BEAD_STEP = (Math.PI * 2) / BEAD_COUNT; // Angular distance = one counted bead
const MAX_VELOCITY = 40; // rad/s — caps momentum so a fling can't spin into hundreds of counts
const MIN_VELOCITY_DT = 1 / 120; // seconds — floors the timing sample so a burst of events can't fake huge velocity
// A tall loop, like a mala actually hangs when held between two hands —
// not a flat circle (which gets clipped on a portrait phone screen) and
// not a double-helix (which reads as DNA, not a mala).
const RADIUS_X = 2.3;
const RADIUS_Y = 5.5;
const BEAD_SCALE = 0.12; // sized so 108 beads touch around the loop without fusing into a solid ring

const MalaHelix: React.FC<MalaHelixProps> = ({ onIncrement }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const { size } = useThree();

    // Interaction State
    const rotation = useRef(0);
    const velocity = useRef(0);
    const isDragging = useRef(false);
    const lastY = useRef(0);
    const lastTime = useRef(0);
    const countedThisGesture = useRef(false); // true once a real bead-crossing has counted during this gesture
    const distanceSinceLastCount = useRef(0); // consumed in BEAD_STEP chunks -> onIncrement

    const { updateTexture } = useSensoryFeedback();

    const dummy = useMemo(() => new THREE.Object3D(), []);
    // Tulsi wood tone: warm, matte — a real mala bead, not polished chrome.
    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#8a5a2f',
        roughness: 0.75,
        metalness: 0.05,
    }), []);
    const guruMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#FFD700',
        roughness: 0.4,
        metalness: 0.3,
        emissive: '#7a4a00',
        emissiveIntensity: 0.6,
    }), []);

    // Single loop of 108 beads, draped vertically as a mala hangs in the hand.
    useEffect(() => {
        if (!meshRef.current) return;
        for (let i = 0; i < BEAD_COUNT; i++) {
            const angle = (i / BEAD_COUNT) * Math.PI * 2;
            const wobble = Math.sin(angle * 5) * 0.06; // gentle irregularity, like hand-strung beads

            const x = Math.sin(angle) * (RADIUS_X + wobble);
            const y = Math.cos(angle) * (RADIUS_Y + wobble);
            const z = Math.cos(angle * 2) * 0.2;

            dummy.position.set(x, y, z);
            dummy.scale.setScalar(BEAD_SCALE);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [dummy]);

    // Consume accumulated rotation distance in fixed steps, one onIncrement per step
    const consumeDistance = (delta: number) => {
        distanceSinceLastCount.current += Math.abs(delta);
        while (distanceSinceLastCount.current >= BEAD_STEP) {
            distanceSinceLastCount.current -= BEAD_STEP;
            countedThisGesture.current = true;
            onIncrement();
        }
    };

    // Momentum is purely visual (a satisfying spin-and-settle after release).
    // Counting only ever happens from direct pointer motion or a tap — never
    // from residual momentum — so the number on screen always matches an
    // intentional gesture, with no drift after you let go.
    useFrame((_state, delta) => {
        if (!groupRef.current) return;

        if (!isDragging.current) {
            velocity.current *= 0.95;

            if (Math.abs(velocity.current) > 0.001) {
                rotation.current += velocity.current * delta;
                updateTexture(rotation.current, velocity.current);
            }
        }

        groupRef.current.rotation.z = rotation.current;
    });

    const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        isDragging.current = true;
        countedThisGesture.current = false;
        distanceSinceLastCount.current = 0;
        lastY.current = e.clientY;
        lastTime.current = performance.now();
        velocity.current = 0;
    };

    const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!isDragging.current) return;

        const currentY = e.clientY;
        const deltaPixel = currentY - lastY.current;

        const sensitivity = 5.0 / size.height;
        const deltaRotation = deltaPixel * sensitivity;

        rotation.current += deltaRotation;
        consumeDistance(deltaRotation);

        const now = performance.now();
        const dt = Math.max((now - lastTime.current) / 1000, MIN_VELOCITY_DT);
        velocity.current = THREE.MathUtils.clamp(deltaRotation / dt, -MAX_VELOCITY, MAX_VELOCITY);

        lastY.current = currentY;
        lastTime.current = now;

        updateTexture(rotation.current, velocity.current);
    };

    const onPointerUp = () => {
        // Only a gesture that never crossed a full bead-step counts as a tap.
        // This is checked instead of comparing total drag distance, so a
        // real (small) crossing during the move phase is never double-counted.
        if (isDragging.current && !countedThisGesture.current) {
            onIncrement();
        }
        isDragging.current = false;
    };

    useEffect(() => {
        const handleUp = () => { isDragging.current = false; };
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);
        return () => {
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
        };
    }, []);

    return (
        <>
            {/* Full-viewport invisible hit surface so a tap/drag anywhere counts,
                not just precise contact with the thin bead ring. */}
            <mesh
                position={[0, 0, -6]}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
            >
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            <group ref={groupRef}>
                <instancedMesh ref={meshRef} args={[undefined, undefined, BEAD_COUNT]} material={material}>
                    <sphereGeometry args={[1, 16, 16]} />
                </instancedMesh>
                {/* Guru bead — the traditional marker you don't cross, at the top of the loop */}
                <mesh position={[0, RADIUS_Y + 0.05, 0]} material={guruMaterial}>
                    <sphereGeometry args={[BEAD_SCALE * 1.8, 24, 24]} />
                </mesh>
            </group>
        </>
    );
};

export default MalaHelix;
