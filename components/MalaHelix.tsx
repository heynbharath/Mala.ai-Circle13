"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useSensoryFeedback } from '@/hooks/useSensoryFeedback';

interface MalaHelixProps {
    onIncrement: () => void;
}

const BEAD_COUNT = 108;
const BEAD_STEP = (Math.PI * 2) / BEAD_COUNT; // Angular distance = one counted "click"
const TAP_ROTATION_EPSILON = BEAD_STEP * 0.4; // Below this, a gesture is a tap, not a drag
const MAX_VELOCITY = 40; // rad/s — caps momentum so a fling can't spin into hundreds of counts
const MIN_VELOCITY_DT = 1 / 120; // seconds — floors the timing sample so a burst of events can't fake huge velocity

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
    const gestureDistance = useRef(0); // Total |rotation| moved during current drag
    const distanceSinceLastCount = useRef(0); // Consumed in BEAD_STEP chunks -> onIncrement

    const { updateTexture } = useSensoryFeedback();

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#B0C4DE',
        roughness: 0.4,
        metalness: 0.8,
    }), []);

    useEffect(() => {
        if (!meshRef.current) return;
        for (let i = 0; i < BEAD_COUNT; i++) {
            const t = (i / BEAD_COUNT) * Math.PI * 8;
            const radius = 2.8;
            const heightFactor = 0.12;

            const x = Math.cos(t) * radius;
            const z = Math.sin(t) * radius;
            const y = (i - BEAD_COUNT / 2) * heightFactor;

            dummy.position.set(x, y, z);
            dummy.scale.setScalar(0.25);
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

        groupRef.current.rotation.y = rotation.current;
    });

    const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        isDragging.current = true;
        gestureDistance.current = 0;
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
        gestureDistance.current += Math.abs(deltaRotation);
        consumeDistance(deltaRotation);

        const now = performance.now();
        const dt = Math.max((now - lastTime.current) / 1000, MIN_VELOCITY_DT);
        velocity.current = THREE.MathUtils.clamp(deltaRotation / dt, -MAX_VELOCITY, MAX_VELOCITY);

        lastY.current = currentY;
        lastTime.current = now;

        updateTexture(rotation.current, velocity.current);
    };

    const onPointerUp = () => {
        if (isDragging.current && gestureDistance.current < TAP_ROTATION_EPSILON) {
            // Treated as a tap: count one bead directly.
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
            </group>
        </>
    );
};

export default MalaHelix;
