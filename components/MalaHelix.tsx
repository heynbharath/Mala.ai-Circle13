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
const SAMPLES = 1080; // High-res lookup table for instantaneous O(1) curve evaluation

// Authentic vertical draped mala dimensions (fixed in space, never tilts)
const RADIUS_X = 2.45;
const RADIUS_Y = 5.2;
const BEAD_RADIUS = 0.125;
const KNOT_RADIUS = 0.035;

// Swipe distance in pixels needed to advance 1 bead
const SWIPE_THRESHOLD_PX = 32;

const MalaHelix: React.FC<MalaHelixProps> = ({
    onIncrement,
    materialType = 'tulsi',
    count = 0
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const knotsMeshRef = useRef<THREE.InstancedMesh>(null);
    const guruGroupRef = useRef<THREE.Group>(null);
    const tasselGroupRef = useRef<THREE.Group>(null);
    const activeGlowRef = useRef<THREE.PointLight>(null);

    // Continuous float progress along the curve (0 to 108)
    const currentBeadOffset = useRef(0);
    const targetBeadOffset = useRef(0);
    const dragDeltaBeads = useRef(0);

    // Single pointer tracking (pinch-proof)
    const activePointerId = useRef<number | null>(null);
    const isDragging = useRef(false);
    const startY = useRef(0);
    const lastAdvanceTime = useRef(0);
    const hasAdvancedThisGesture = useRef(false);

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const knotDummy = useMemo(() => new THREE.Object3D(), []);
    const upVector = useMemo(() => new THREE.Vector3(0, 1, 0), []);

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

    // Sacred Gold Sumeru Accents Material
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

    // Precompute Stationary 3D Draped Curve & High-Res Sample Table
    const { threadGeometry, curveLUT } = useMemo(() => {
        const points: THREE.Vector3[] = [];
        const numPoints = 120;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const wobble = Math.sin(angle * 5) * 0.035;
            const x = Math.sin(angle) * (RADIUS_X + wobble);
            const y = Math.cos(angle) * (RADIUS_Y + wobble);
            const z = Math.sin(angle * 2) * 0.15;
            points.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
        const tubeGeom = new THREE.TubeGeometry(curve, 240, 0.016, 8, true);

        // Precompute SAMPLES positions and tangents along the stationary curve
        const lut: { pos: THREE.Vector3; tangent: THREE.Vector3 }[] = [];
        for (let s = 0; s < SAMPLES; s++) {
            const u = s / SAMPLES;
            const pos = curve.getPointAt(u);
            const tangent = curve.getTangentAt(u).normalize();
            lut.push({ pos, tangent });
        }

        return { threadGeometry: tubeGeom, curveLUT: lut };
    }, []);

    // Helper: evaluate position and tangent along the stationary curve at any fractional bead index
    const sampleCurve = useCallback((beadIndex: number): { pos: THREE.Vector3; tangent: THREE.Vector3 } => {
        const normalized = (((beadIndex % BEAD_COUNT) + BEAD_COUNT) % BEAD_COUNT) / BEAD_COUNT;
        const lutIdx = Math.floor(normalized * SAMPLES) % SAMPLES;
        return curveLUT[lutIdx];
    }, [curveLUT]);

    // Update all 108 beads & knots along the stationary curve
    const updateBeadInstances = useCallback((offset: number) => {
        if (!meshRef.current || !knotsMeshRef.current) return;

        for (let i = 0; i < BEAD_COUNT; i++) {
            // Bead position along the fixed curve
            const beadParam = i + offset;
            const { pos, tangent } = sampleCurve(beadParam);

            // Natural organic variation
            const naturalVariation = 1 + (Math.sin(i * 17) * 0.035);

            dummy.position.copy(pos);
            dummy.quaternion.setFromUnitVectors(upVector, tangent);
            dummy.scale.set(
                BEAD_RADIUS * naturalVariation * 1.03,
                BEAD_RADIUS * naturalVariation * 0.96,
                BEAD_RADIUS * naturalVariation * 1.03
            );
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);

            // Knot position: halfway between bead i and bead i + 1
            const knotParam = beadParam + 0.5;
            const knotData = sampleCurve(knotParam);
            knotDummy.position.copy(knotData.pos);
            knotDummy.scale.setScalar(KNOT_RADIUS);
            knotDummy.updateMatrix();
            knotsMeshRef.current.setMatrixAt(i, knotDummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        knotsMeshRef.current.instanceMatrix.needsUpdate = true;
    }, [sampleCurve, dummy, knotDummy, upVector]);

    // Trigger exactly ONE bead advance
    const advanceOneBead = useCallback(() => {
        const now = performance.now();
        if (now - lastAdvanceTime.current < 120) return; // Debounce
        lastAdvanceTime.current = now;

        targetBeadOffset.current += 1;
        hasAdvancedThisGesture.current = true;

        SpatialAudio.playBeadClack();
        onIncrement();

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(14);
        }
    }, [onIncrement]);

    // Frame update: glide beads along the stationary curve
    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;

        // Desired offset combines target bead index + temporary finger drag pull
        const desiredOffset = targetBeadOffset.current + dragDeltaBeads.current;

        // Critically damped spring for smooth bead sliding along the track
        currentBeadOffset.current = THREE.MathUtils.damp(
            currentBeadOffset.current,
            desiredOffset,
            isDragging.current ? 20 : 12,
            delta
        );

        // Update bead instances along the stationary curve
        updateBeadInstances(currentBeadOffset.current);

        // Tassel sways gently in ambient temple air
        if (tasselGroupRef.current) {
            tasselGroupRef.current.rotation.z = Math.sin(t * 1.4) * 0.035;
        }

        // Active focal glow pulse
        if (activeGlowRef.current) {
            activeGlowRef.current.intensity = 1.2 + Math.sin(t * 3.0) * 0.3;
        }
    });

    // =========================================================================
    // STRICT SINGLE-POINTER TOUCH HANDLING (Pinch-Safe)
    // =========================================================================

    const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
        if (e.pointerType === 'touch' && !e.isPrimary) return;
        if (activePointerId.current !== null) return;

        e.stopPropagation();
        activePointerId.current = e.pointerId;
        isDragging.current = true;
        hasAdvancedThisGesture.current = false;
        startY.current = e.clientY;
        dragDeltaBeads.current = 0;
    };

    const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!isDragging.current) return;
        if (e.pointerId !== activePointerId.current) return;

        const deltaY = e.clientY - startY.current; // Positive = pulling downward

        // Elastic bead displacement along the curve (clamped to 1 bead max)
        const beadDisplacement = deltaY / SWIPE_THRESHOLD_PX;
        dragDeltaBeads.current = THREE.MathUtils.clamp(beadDisplacement, -0.3, 1.2);

        // Advance 1 bead once pulled past threshold
        if (deltaY >= SWIPE_THRESHOLD_PX && !hasAdvancedThisGesture.current) {
            advanceOneBead();
            startY.current = e.clientY;
            dragDeltaBeads.current = 0;
        }
    };

    const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
        if (e.pointerId !== activePointerId.current) return;

        const deltaY = Math.abs(e.clientY - startY.current);

        // Tap without dragging counts 1 bead cleanly
        if (!hasAdvancedThisGesture.current && deltaY < 12) {
            advanceOneBead();
        }

        isDragging.current = false;
        activePointerId.current = null;
        dragDeltaBeads.current = 0; // Snap back smoothly to locked bead
    };

    const onPointerCancel = () => {
        isDragging.current = false;
        activePointerId.current = null;
        dragDeltaBeads.current = 0;
    };

    useEffect(() => {
        const handleGlobalUp = () => {
            isDragging.current = false;
            activePointerId.current = null;
            dragDeltaBeads.current = 0;
        };
        window.addEventListener('pointerup', handleGlobalUp);
        window.addEventListener('pointercancel', handleGlobalUp);
        return () => {
            window.removeEventListener('pointerup', handleGlobalUp);
            window.removeEventListener('pointercancel', handleGlobalUp);
        };
    }, []);

    // Guru bead (Sumeru) position at top crown of the stationary drape
    const guruPos = curveLUT[0]?.pos || new THREE.Vector3(0, RADIUS_Y, 0);

    // Focal point position (on right curve where hand holds beads)
    const focalPos = sampleCurve(BEAD_COUNT * 0.25).pos;

    return (
        <>
            {/* Full-viewport touch hit plane */}
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

            {/* Subtle Divine Focal Finger Ring at the active bead position */}
            <group position={[focalPos.x, focalPos.y, focalPos.z]}>
                <mesh>
                    <ringGeometry args={[0.22, 0.25, 32]} />
                    <meshBasicMaterial
                        color="#ffd573"
                        transparent
                        opacity={0.55}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            </group>

            {/* Active counting halo light */}
            <pointLight
                ref={activeGlowRef}
                position={[focalPos.x, focalPos.y, focalPos.z + 0.6]}
                color="#ffd573"
                intensity={1.2}
                distance={4}
                decay={2}
            />

            {/* Stationary Sacred Mala (stays upright, beads slide along it) */}
            <group>
                {/* Continuous 3D Sacred Silk Thread Cord (STATIONARY) */}
                <mesh geometry={threadGeometry} material={threadMaterial} />

                {/* 108 Brahma-Granthi Knots (glides along curve) */}
                <instancedMesh
                    ref={knotsMeshRef}
                    args={[undefined, undefined, BEAD_COUNT]}
                    material={threadMaterial}
                >
                    <sphereGeometry args={[1, 10, 10]} />
                </instancedMesh>

                {/* 108 Sacred Beads (glides along curve) */}
                <instancedMesh
                    ref={meshRef}
                    args={[undefined, undefined, BEAD_COUNT]}
                    material={beadMaterial}
                >
                    <sphereGeometry args={[1, 24, 24]} />
                </instancedMesh>

                {/* ============================================================== */}
                {/* SACRED SUMERU (GURU BEAD) CROWN ASSEMBLY                       */}
                {/* ============================================================== */}
                <group ref={guruGroupRef} position={[guruPos.x, guruPos.y + 0.08, guruPos.z]}>
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
