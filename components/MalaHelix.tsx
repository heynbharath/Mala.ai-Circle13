"use client";

import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useSensoryFeedback } from '@/hooks/useSensoryFeedback';
import { SpatialAudio } from '@/lib/SpatialAudio';
import {
    BEAD_MATERIAL_CONFIGS,
    getBeadTextures,
    type BeadMaterialType
} from '@/lib/BeadTextures';

interface MalaHelixProps {
    onIncrement: () => void;
    materialType?: BeadMaterialType;
    count?: number;
}

const BEAD_COUNT = 108;
const BEAD_STEP = (Math.PI * 2) / BEAD_COUNT; // Angular step for 1 bead

// Authentic tall draped mala proportions
const RADIUS_X = 2.45;
const RADIUS_Y = 5.4;
const BEAD_RADIUS = 0.13;
const KNOT_RADIUS = 0.038;

// Swipe distance in pixels needed to roll exactly 1 bead
const SWIPE_THRESHOLD_PX = 32;

const MalaHelix: React.FC<MalaHelixProps> = ({
    onIncrement,
    materialType = 'tulsi',
    count = 0
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const knotsMeshRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const tasselGroupRef = useRef<THREE.Group>(null);
    const focalRingRef = useRef<THREE.Group>(null);
    const activeGlowRef = useRef<THREE.PointLight>(null);
    const { size } = useThree();

    // Rotation & Kinematics State
    // The mala is anchored; it rotates bead-by-bead to bring the next bead to the finger rest
    const currentAngle = useRef(0);
    const targetAngle = useRef(0);
    const beadIndexOffset = useRef(0); // integer bead counter for precise detents
    const dragOffsetAngle = useRef(0); // temporary elastic pull while finger is down

    // Single-pointer interaction locking
    const activePointerId = useRef<number | null>(null);
    const isDragging = useRef(false);
    const startY = useRef(0);
    const lastY = useRef(0);
    const startTime = useRef(0);
    const hasAdvancedThisGesture = useRef(false);
    const lastAdvanceTime = useRef(0);

    const { updateTexture } = useSensoryFeedback();

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const knotDummy = useMemo(() => new THREE.Object3D(), []);

    // Material configuration
    const matConfig = BEAD_MATERIAL_CONFIGS[materialType] || BEAD_MATERIAL_CONFIGS.tulsi;

    // Load procedural canvas textures
    const textures = useMemo(() => {
        return getBeadTextures(materialType);
    }, [materialType]);

    // Primary Bead Material
    const beadMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: matConfig.color,
            map: textures.map,
            bumpMap: textures.bump,
            bumpScale: matConfig.bumpScale,
            roughness: matConfig.roughness,
            metalness: matConfig.metalness,
            emissive: matConfig.emissive || '#000000',
            emissiveIntensity: matConfig.emissiveIntensity || 0,
        });
    }, [matConfig, textures]);

    // Silk Thread / Knot Material
    const threadMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: matConfig.threadColor,
            roughness: 0.7,
            metalness: 0.1,
        });
    }, [matConfig.threadColor]);

    // Sacred Gold Accents Material
    const goldMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: '#f5c342',
            roughness: 0.25,
            metalness: 0.88,
            emissive: '#7a5105',
            emissiveIntensity: 0.4,
        });
    }, []);

    // Silk Tassel Material
    const tasselMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            color: matConfig.tasselColor,
            roughness: 0.65,
            metalness: 0.15,
        });
    }, [matConfig.tasselColor]);

    // Generate Thread Path
    const { threadCurve, beadPositions } = useMemo(() => {
        const points: THREE.Vector3[] = [];
        const beadPosList: { pos: THREE.Vector3; rot: number }[] = [];

        for (let i = 0; i < BEAD_COUNT; i++) {
            const angle = (i / BEAD_COUNT) * Math.PI * 2;
            const wobble = Math.sin(angle * 6) * 0.045 + Math.cos(angle * 3) * 0.025;
            const x = Math.sin(angle) * (RADIUS_X + wobble);
            const y = Math.cos(angle) * (RADIUS_Y + wobble);
            const z = Math.sin(angle * 2) * 0.22;

            const pos = new THREE.Vector3(x, y, z);
            points.push(pos);
            beadPosList.push({ pos, rot: angle });
        }

        const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
        return { threadCurve: curve, beadPositions: beadPosList };
    }, []);

    // Build the 3D Continuous Thread Tube Geometry
    const threadGeometry = useMemo(() => {
        return new THREE.TubeGeometry(threadCurve, 280, 0.016, 8, true);
    }, [threadCurve]);

    // Position 108 Beads and Knots
    useEffect(() => {
        if (!meshRef.current || !knotsMeshRef.current) return;

        for (let i = 0; i < BEAD_COUNT; i++) {
            const { pos, rot } = beadPositions[i];
            const naturalVariation = 1 + (Math.sin(i * 17) * 0.035);
            dummy.position.copy(pos);
            dummy.rotation.z = -rot;
            dummy.scale.set(
                BEAD_RADIUS * naturalVariation * 1.04,
                BEAD_RADIUS * naturalVariation * 0.96,
                BEAD_RADIUS * naturalVariation * 1.04
            );
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);

            const nextIdx = (i + 1) % BEAD_COUNT;
            const knotPos = pos.clone().lerp(beadPositions[nextIdx].pos, 0.5);
            knotDummy.position.copy(knotPos);
            knotDummy.scale.setScalar(KNOT_RADIUS);
            knotDummy.updateMatrix();
            knotsMeshRef.current.setMatrixAt(i, knotDummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        knotsMeshRef.current.instanceMatrix.needsUpdate = true;
    }, [beadPositions, dummy, knotDummy]);

    // Trigger exactly ONE bead advancement
    const advanceOneBead = useCallback(() => {
        const now = performance.now();
        if (now - lastAdvanceTime.current < 120) return; // Debounce safeguard
        lastAdvanceTime.current = now;

        beadIndexOffset.current += 1;
        targetAngle.current = beadIndexOffset.current * BEAD_STEP;
        hasAdvancedThisGesture.current = true;

        SpatialAudio.playBeadClack();
        onIncrement();

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(14); // Crisp physical bead click
        }
    }, [onIncrement]);

    // Frame update: Smooth magnetic spring to target bead angle
    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;

        // Target angle combining locked bead detent + temporary elastic finger pull
        const desiredAngle = targetAngle.current + dragOffsetAngle.current;

        // Smooth critically-damped spring interpolation (snaps cleanly into place)
        const springSpeed = isDragging.current ? 18 : 12;
        currentAngle.current = THREE.MathUtils.damp(
            currentAngle.current,
            desiredAngle,
            springSpeed,
            delta
        );

        // Keep mala hanging vertically anchored, with very gentle meditative breathing
        const gentleSwayX = Math.sin(t * 0.7) * 0.012;
        const gentleSwayY = Math.cos(t * 0.5) * 0.015;
        groupRef.current.position.x = gentleSwayX;
        groupRef.current.position.y = gentleSwayY;
        groupRef.current.rotation.z = currentAngle.current;

        // Tassel sways gently below the guru bead
        if (tasselGroupRef.current) {
            const tasselSway = Math.sin(t * 1.5) * 0.03;
            tasselGroupRef.current.rotation.z = tasselSway;
        }

        // Pulse the sacred focal ring
        if (focalRingRef.current) {
            const scale = 1 + Math.sin(t * 2.8) * 0.04;
            focalRingRef.current.scale.setScalar(scale);
        }

        // Active bead golden aura light
        if (activeGlowRef.current) {
            activeGlowRef.current.intensity = 1.3 + Math.sin(t * 3.2) * 0.35;
        }
    });

    // =========================================================================
    // STRICT SINGLE-POINTER TOUCH & DRAG LOGIC (Pinch-Proof)
    // =========================================================================

    const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
        // Multi-touch guard: only allow primary pointer
        if (e.pointerType === 'touch' && !e.isPrimary) return;
        if (activePointerId.current !== null) return;

        e.stopPropagation();
        activePointerId.current = e.pointerId;
        isDragging.current = true;
        hasAdvancedThisGesture.current = false;
        startY.current = e.clientY;
        lastY.current = e.clientY;
        startTime.current = performance.now();
        dragOffsetAngle.current = 0;
    };

    const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!isDragging.current) return;
        if (e.pointerId !== activePointerId.current) return; // Ignore any other finger

        const currentY = e.clientY;
        const deltaFromStart = currentY - startY.current; // Positive = pulling downward

        // Elastic resistance: thumb pulls down bead
        // Clamp to at most 1 bead's worth of visual deflection so it never spins wildly
        const maxDeflection = BEAD_STEP * 1.2;
        const rawAngle = (deltaFromStart / SWIPE_THRESHOLD_PX) * BEAD_STEP;
        dragOffsetAngle.current = THREE.MathUtils.clamp(rawAngle, -maxDeflection * 0.3, maxDeflection);

        // If pulled down past threshold and haven't counted yet on this stroke:
        if (deltaFromStart >= SWIPE_THRESHOLD_PX && !hasAdvancedThisGesture.current) {
            advanceOneBead();
            // Reset startY so subsequent intentional stroke in same gesture could be rolled after a delay
            startY.current = currentY;
            dragOffsetAngle.current = 0;
        }

        lastY.current = currentY;
    };

    const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
        if (e.pointerId !== activePointerId.current) return;

        const duration = performance.now() - startTime.current;
        const deltaFromStart = Math.abs(e.clientY - startY.current);

        // If it was a quick tap or small touch without pulling past threshold, count 1 bead!
        if (!hasAdvancedThisGesture.current && duration < 320 && deltaFromStart < 15) {
            advanceOneBead();
        }

        isDragging.current = false;
        activePointerId.current = null;
        dragOffsetAngle.current = 0; // Release elastic tension back to snapped bead
    };

    const onPointerCancel = () => {
        isDragging.current = false;
        activePointerId.current = null;
        dragOffsetAngle.current = 0;
    };

    // Global cleanup if pointer leaves window
    useEffect(() => {
        const handleGlobalUp = () => {
            isDragging.current = false;
            activePointerId.current = null;
            dragOffsetAngle.current = 0;
        };
        window.addEventListener('pointerup', handleGlobalUp);
        window.addEventListener('pointercancel', handleGlobalUp);
        return () => {
            window.removeEventListener('pointerup', handleGlobalUp);
            window.removeEventListener('pointercancel', handleGlobalUp);
        };
    }, []);

    // Guru bead Y coordinate
    const guruY = RADIUS_Y + 0.06;

    // Focal Finger Rest position (right side where hand traditionally holds the mala)
    const focalX = RADIUS_X;
    const focalY = 0;

    return (
        <>
            {/* Full-viewport touch hit plane (touch-action none) */}
            <mesh
                position={[0, 0, -3]}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
            >
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Sacred Focal Finger Rest Marker (The Sacred Touch Point) */}
            <group ref={focalRingRef} position={[focalX, focalY, 0]}>
                {/* Luminous Outer Halo Ring */}
                <mesh>
                    <ringGeometry args={[0.22, 0.25, 32]} />
                    <meshBasicMaterial
                        color="#ffd573"
                        transparent
                        opacity={0.65}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
                {/* Subtle Inner Glow Ring */}
                <mesh>
                    <ringGeometry args={[0.16, 0.18, 32]} />
                    <meshBasicMaterial
                        color="#ffa834"
                        transparent
                        opacity={0.4}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            </group>

            {/* Active counting touch point halo light */}
            <pointLight
                ref={activeGlowRef}
                position={[focalX, focalY, 0.7]}
                color="#ffd573"
                intensity={1.4}
                distance={4.5}
                decay={2}
            />

            {/* Anchored Sacred Mala Loop */}
            <group ref={groupRef}>
                {/* Continuous 3D Sacred Silk Thread Cord */}
                <mesh geometry={threadGeometry} material={threadMaterial} />

                {/* 108 Individual Hand-Tied Brahma-Granthi Knots */}
                <instancedMesh
                    ref={knotsMeshRef}
                    args={[undefined, undefined, BEAD_COUNT]}
                    material={threadMaterial}
                >
                    <sphereGeometry args={[1, 10, 10]} />
                </instancedMesh>

                {/* 108 Sacred Beads */}
                <instancedMesh
                    ref={meshRef}
                    args={[undefined, undefined, BEAD_COUNT]}
                    material={beadMaterial}
                >
                    <sphereGeometry args={[1, 24, 24]} />
                </instancedMesh>

                {/* ============================================================== */}
                {/* SACRED SUMERU (GURU BEAD) ASSEMBLY                             */}
                {/* ============================================================== */}
                <group position={[0, guruY, 0]}>
                    {/* Main Sumeru Carved Bead */}
                    <mesh material={beadMaterial} scale={[0.22, 0.2, 0.22]}>
                        <sphereGeometry args={[1, 32, 32]} />
                    </mesh>

                    {/* Gold Filigree Central Ring */}
                    <mesh material={goldMaterial} scale={[0.23, 0.03, 0.23]}>
                        <cylinderGeometry args={[1, 1, 1, 32]} />
                    </mesh>

                    {/* Sacred Stupa (Bindu Cap) above Sumeru */}
                    <mesh position={[0, 0.21, 0]} material={goldMaterial}>
                        <coneGeometry args={[0.08, 0.16, 24]} />
                    </mesh>
                    <mesh position={[0, 0.31, 0]} material={goldMaterial}>
                        <sphereGeometry args={[0.035, 16, 16]} />
                    </mesh>

                    {/* Lower Golden Wire Coil & Flowing Silk Tassel Assembly */}
                    <group ref={tasselGroupRef} position={[0, -0.22, 0]}>
                        <mesh position={[0, -0.04, 0]} material={goldMaterial}>
                            <cylinderGeometry args={[0.065, 0.075, 0.08, 24]} />
                        </mesh>
                        <mesh position={[0, -0.12, 0]} material={tasselMaterial}>
                            <sphereGeometry args={[0.08, 20, 20]} />
                        </mesh>
                        <mesh position={[0, -0.48, 0]} material={tasselMaterial}>
                            <coneGeometry args={[0.13, 0.65, 24, 1, true]} />
                        </mesh>
                        <mesh position={[0, -0.78, 0]} material={goldMaterial}>
                            <sphereGeometry args={[0.02, 12, 12]} />
                        </mesh>
                    </group>
                </group>
            </group>
        </>
    );
};

export default MalaHelix;
