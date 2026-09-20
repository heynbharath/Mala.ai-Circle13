"use client";

import React, { useRef, useMemo, useEffect } from 'react';
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
const BEAD_STEP = (Math.PI * 2) / BEAD_COUNT;
const MAX_VELOCITY = 35;
const MIN_VELOCITY_DT = 1 / 120;

// Authentic tall draped mala proportions
const RADIUS_X = 2.45;
const RADIUS_Y = 5.4;
const BEAD_RADIUS = 0.13;
const KNOT_RADIUS = 0.038;

const MalaHelix: React.FC<MalaHelixProps> = ({
    onIncrement,
    materialType = 'tulsi',
    count = 0
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const knotsMeshRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const tasselGroupRef = useRef<THREE.Group>(null);
    const activeGlowRef = useRef<THREE.PointLight>(null);
    const { size } = useThree();

    // Interaction State
    const rotation = useRef(0);
    const targetRotation = useRef(0);
    const velocity = useRef(0);
    const isDragging = useRef(false);
    const lastY = useRef(0);
    const lastTime = useRef(0);
    const countedThisGesture = useRef(false);
    const distanceSinceLastCount = useRef(0);
    const swayAngle = useRef(0);

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
        const mat = new THREE.MeshStandardMaterial({
            color: matConfig.color,
            map: textures.map,
            bumpMap: textures.bump,
            bumpScale: matConfig.bumpScale,
            roughness: matConfig.roughness,
            metalness: matConfig.metalness,
            emissive: matConfig.emissive || '#000000',
            emissiveIntensity: matConfig.emissiveIntensity || 0,
        });
        return mat;
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
            roughness: 0.28,
            metalness: 0.85,
            emissive: '#7a5105',
            emissiveIntensity: 0.35,
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
            // Gentle natural organic drape wobble
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

    // Position 108 Beads and 108 Brahma-Granthi Knots
    useEffect(() => {
        if (!meshRef.current || !knotsMeshRef.current) return;

        for (let i = 0; i < BEAD_COUNT; i++) {
            const { pos, rot } = beadPositions[i];

            // Organic bead shape: slight oblate compression along thread axis
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

            // Knot position: halfway between bead i and bead i + 1
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

    // Consume accumulated rotation distance in fixed steps, one onIncrement per step
    const consumeDistance = (delta: number) => {
        distanceSinceLastCount.current += Math.abs(delta);
        while (distanceSinceLastCount.current >= BEAD_STEP) {
            distanceSinceLastCount.current -= BEAD_STEP;
            countedThisGesture.current = true;
            SpatialAudio.playBeadClack();
            onIncrement();
        }
    };

    // Frame update: fluid kinematics, tassel physics, and gentle ambient float
    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const t = state.clock.elapsedTime;

        if (!isDragging.current) {
            // Apply momentum damping
            velocity.current *= 0.94;

            if (Math.abs(velocity.current) > 0.001) {
                rotation.current += velocity.current * delta;
                updateTexture(rotation.current, velocity.current);
            }
        }

        // Subtly sway the whole sacred mala as if suspended in temple air
        const gentleSwayX = Math.sin(t * 0.8) * 0.015;
        const gentleSwayY = Math.cos(t * 0.6) * 0.02;
        groupRef.current.position.x = gentleSwayX;
        groupRef.current.position.y = gentleSwayY;
        groupRef.current.rotation.z = rotation.current;

        // Dynamic Silk Tassel sway responding to mala rotation velocity
        if (tasselGroupRef.current) {
            const targetSway = -velocity.current * 0.06 + Math.sin(t * 1.8) * 0.04;
            swayAngle.current = THREE.MathUtils.lerp(swayAngle.current, targetSway, 0.1);
            tasselGroupRef.current.rotation.z = swayAngle.current;
        }

        // Pulsate active bead golden light
        if (activeGlowRef.current) {
            activeGlowRef.current.intensity = 1.4 + Math.sin(t * 3.5) * 0.4;
        }
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

        const sensitivity = 5.2 / size.height;
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
        if (isDragging.current && !countedThisGesture.current) {
            // Tap counts exactly one bead and turns mala by one bead step
            SpatialAudio.playBeadClack();
            onIncrement();
            velocity.current = 2.5; // gentle turn flick
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

    // Top Guru Bead & Tassel Position
    const guruY = RADIUS_Y + 0.06;

    return (
        <>
            {/* Full-viewport interactive hit surface for intuitive, fluid touch */}
            <mesh
                position={[0, 0, -4]}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
            >
                <planeGeometry args={[200, 200]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Active counting touch point halo light */}
            <pointLight
                ref={activeGlowRef}
                position={[RADIUS_X + 0.2, 0, 0.6]}
                color="#ffd573"
                intensity={1.5}
                distance={4.5}
                decay={2}
            />

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
                    {/* Main Sumeru Carved Bead (Larger than regular beads) */}
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
                        {/* Golden Tassel Collar / Binding Ring */}
                        <mesh position={[0, -0.04, 0]} material={goldMaterial}>
                            <cylinderGeometry args={[0.065, 0.075, 0.08, 24]} />
                        </mesh>

                        {/* Upper Silk Bulb */}
                        <mesh position={[0, -0.12, 0]} material={tasselMaterial}>
                            <sphereGeometry args={[0.08, 20, 20]} />
                        </mesh>

                        {/* Lower Flowing Silk Strands Cone */}
                        <mesh position={[0, -0.48, 0]} material={tasselMaterial}>
                            <coneGeometry args={[0.13, 0.65, 24, 1, true]} />
                        </mesh>

                        {/* Golden Trim End Beaded Accents */}
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
