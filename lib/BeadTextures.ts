"use client";

import * as THREE from 'three';

export type BeadMaterialType = 'tulsi' | 'rudraksha' | 'sandalwood' | 'sphatik';

export interface BeadMaterialDefinition {
    id: BeadMaterialType;
    name: string;
    description: string;
    color: string;
    roughness: number;
    metalness: number;
    bumpScale: number;
    emissive?: string;
    emissiveIntensity?: number;
    tasselColor: string;
    threadColor: string;
}

export const BEAD_MATERIAL_CONFIGS: Record<BeadMaterialType, BeadMaterialDefinition> = {
    tulsi: {
        id: 'tulsi',
        name: 'Sacred Tulsi',
        description: 'Vrindavan holy basil wood with warm golden honey grain and polished temple sheen.',
        color: '#8d4e24',
        roughness: 0.42,
        metalness: 0.08,
        bumpScale: 0.035,
        tasselColor: '#d4882e', // warm saffron silk
        threadColor: '#f3c274',
    },
    rudraksha: {
        id: 'rudraksha',
        name: 'Himalayan Rudraksha',
        description: 'Sacred 5-mukhi teardrop seed with deep natural organic ridges and earthy cinnamon tone.',
        color: '#6d2613',
        roughness: 0.88,
        metalness: 0.02,
        bumpScale: 0.12,
        tasselColor: '#b83b18', // deep sacred vermillion
        threadColor: '#d97d4b',
    },
    sandalwood: {
        id: 'sandalwood',
        name: 'White Sandalwood',
        description: 'Soothing chandan wood with silky smooth cream grain and serene satin luster.',
        color: '#d4b78c',
        roughness: 0.52,
        metalness: 0.04,
        bumpScale: 0.022,
        tasselColor: '#e0a943', // golden turmeric silk
        threadColor: '#f0dfc7',
    },
    sphatik: {
        id: 'sphatik',
        name: 'Divine Sphatik',
        description: 'Pure quartz crystal beads reflecting celestial temple lights with radiant clarity.',
        color: '#f0f5fc',
        roughness: 0.12,
        metalness: 0.15,
        bumpScale: 0.015,
        emissive: '#ffd98c',
        emissiveIntensity: 0.18,
        tasselColor: '#e8c872', // celestial golden thread
        threadColor: '#ffffff',
    },
};

// Texture cache
const textureCache: Partial<Record<BeadMaterialType, { map: THREE.Texture; bump: THREE.Texture }>> = {};

/**
 * Generate procedural canvas textures for authentic mala beads
 */
export function getBeadTextures(type: BeadMaterialType): { map: THREE.Texture; bump: THREE.Texture } {
    if (textureCache[type]) {
        return textureCache[type]!;
    }

    if (typeof document === 'undefined') {
        const fallback = new THREE.Texture();
        return { map: fallback, bump: fallback };
    }

    const width = 512;
    const height = 512;

    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = width;
    mapCanvas.height = height;
    const mapCtx = mapCanvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = width;
    bumpCanvas.height = height;
    const bumpCtx = bumpCanvas.getContext('2d')!;

    if (type === 'tulsi') {
        // Base warm wood gradient
        const grad = mapCtx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#603115');
        grad.addColorStop(0.3, '#945327');
        grad.addColorStop(0.7, '#793d19');
        grad.addColorStop(1, '#522710');
        mapCtx.fillStyle = grad;
        mapCtx.fillRect(0, 0, width, height);

        // Concentric wood ring grain
        bumpCtx.fillStyle = '#808080';
        bumpCtx.fillRect(0, 0, width, height);

        for (let i = 0; i < 60; i++) {
            const y = (i / 60) * height;
            const wave = Math.sin(i * 0.4) * 12;
            const alpha = 0.08 + Math.random() * 0.14;

            mapCtx.strokeStyle = i % 2 === 0 ? `rgba(45, 18, 4, ${alpha})` : `rgba(215, 145, 75, ${alpha})`;
            mapCtx.lineWidth = 2 + Math.random() * 3;
            mapCtx.beginPath();
            mapCtx.moveTo(0, y + wave);
            mapCtx.bezierCurveTo(width * 0.3, y - wave * 1.5, width * 0.7, y + wave * 1.5, width, y - wave);
            mapCtx.stroke();

            // Bump line
            bumpCtx.strokeStyle = i % 2 === 0 ? `rgba(40, 40, 40, ${alpha * 1.5})` : `rgba(220, 220, 220, ${alpha * 1.5})`;
            bumpCtx.lineWidth = 2;
            bumpCtx.beginPath();
            bumpCtx.moveTo(0, y + wave);
            bumpCtx.bezierCurveTo(width * 0.3, y - wave * 1.5, width * 0.7, y + wave * 1.5, width, y - wave);
            bumpCtx.stroke();
        }

        // Natural fine wood pores
        const imgData = mapCtx.getImageData(0, 0, width, height);
        const bumpData = bumpCtx.getImageData(0, 0, width, height);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 22;
            imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
            imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + noise * 0.8));
            imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + noise * 0.5));

            const bNoise = (Math.random() - 0.5) * 35;
            bumpData.data[i] = Math.min(255, Math.max(0, bumpData.data[i] + bNoise));
            bumpData.data[i + 1] = bumpData.data[i];
            bumpData.data[i + 2] = bumpData.data[i];
        }
        mapCtx.putImageData(imgData, 0, 0);
        bumpCtx.putImageData(bumpData, 0, 0);

    } else if (type === 'rudraksha') {
        // Deep rich terracotta base
        mapCtx.fillStyle = '#6b2512';
        mapCtx.fillRect(0, 0, width, height);

        bumpCtx.fillStyle = '#808080';
        bumpCtx.fillRect(0, 0, width, height);

        // 5-Mukhi deep clefts (vertical ridges)
        const mukhiCount = 5;
        for (let m = 0; m < mukhiCount; m++) {
            const x = (m / mukhiCount) * width;

            // Deep shadow cleft in map
            const cleftGrad = mapCtx.createLinearGradient(x - 18, 0, x + 18, 0);
            cleftGrad.addColorStop(0, 'rgba(40, 10, 5, 0)');
            cleftGrad.addColorStop(0.5, 'rgba(25, 5, 0, 0.9)');
            cleftGrad.addColorStop(1, 'rgba(40, 10, 5, 0)');
            mapCtx.fillStyle = cleftGrad;
            mapCtx.fillRect(x - 18, 0, 36, height);

            // Deep groove in bump
            const bumpCleft = bumpCtx.createLinearGradient(x - 22, 0, x + 22, 0);
            bumpCleft.addColorStop(0, 'rgba(128, 128, 128, 0)');
            bumpCleft.addColorStop(0.5, 'rgba(10, 10, 10, 0.95)');
            bumpCleft.addColorStop(1, 'rgba(128, 128, 128, 0)');
            bumpCtx.fillStyle = bumpCleft;
            bumpCtx.fillRect(x - 22, 0, 44, height);
        }

        // Natural organic seed nodules & rugged crevices
        for (let i = 0; i < 900; i++) {
            const rx = Math.random() * width;
            const ry = Math.random() * height;
            const rad = 3 + Math.random() * 9;

            const isHighlight = Math.random() > 0.45;
            mapCtx.fillStyle = isHighlight ? 'rgba(180, 85, 45, 0.4)' : 'rgba(35, 12, 5, 0.55)';
            mapCtx.beginPath();
            mapCtx.arc(rx, ry, rad, 0, Math.PI * 2);
            mapCtx.fill();

            bumpCtx.fillStyle = isHighlight ? 'rgba(230, 230, 230, 0.6)' : 'rgba(20, 20, 20, 0.7)';
            bumpCtx.beginPath();
            bumpCtx.arc(rx, ry, rad, 0, Math.PI * 2);
            bumpCtx.fill();
        }

    } else if (type === 'sandalwood') {
        // Soothing silky cream wood
        const grad = mapCtx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#e5cca8');
        grad.addColorStop(0.5, '#ceaf87');
        grad.addColorStop(1, '#bfa075');
        mapCtx.fillStyle = grad;
        mapCtx.fillRect(0, 0, width, height);

        bumpCtx.fillStyle = '#808080';
        bumpCtx.fillRect(0, 0, width, height);

        // Very delicate, serene wood grain lines
        for (let i = 0; i < 40; i++) {
            const y = (i / 40) * height;
            mapCtx.strokeStyle = 'rgba(140, 105, 65, 0.08)';
            mapCtx.lineWidth = 1.5;
            mapCtx.beginPath();
            mapCtx.moveTo(0, y);
            mapCtx.lineTo(width, y + (Math.random() - 0.5) * 20);
            mapCtx.stroke();

            bumpCtx.strokeStyle = 'rgba(100, 100, 100, 0.12)';
            bumpCtx.lineWidth = 1.5;
            bumpCtx.beginPath();
            bumpCtx.moveTo(0, y);
            bumpCtx.lineTo(width, y);
            bumpCtx.stroke();
        }

    } else if (type === 'sphatik') {
        // Crystalline translucent map with celestial golden refraction
        const grad = mapCtx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        grad.addColorStop(0.4, 'rgba(240, 248, 255, 0.85)');
        grad.addColorStop(0.8, 'rgba(255, 240, 205, 0.75)');
        grad.addColorStop(1, 'rgba(220, 235, 255, 0.9)');
        mapCtx.fillStyle = grad;
        mapCtx.fillRect(0, 0, width, height);

        bumpCtx.fillStyle = '#808080';
        bumpCtx.fillRect(0, 0, width, height);

        // Crystalline internal facet lines
        for (let i = 0; i < 18; i++) {
            const x1 = Math.random() * width;
            const y1 = Math.random() * height;
            const x2 = Math.random() * width;
            const y2 = Math.random() * height;

            mapCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            mapCtx.lineWidth = 2;
            mapCtx.beginPath();
            mapCtx.moveTo(x1, y1);
            mapCtx.lineTo(x2, y2);
            mapCtx.stroke();

            bumpCtx.strokeStyle = 'rgba(240, 240, 240, 0.4)';
            bumpCtx.lineWidth = 2;
            bumpCtx.beginPath();
            bumpCtx.moveTo(x1, y1);
            bumpCtx.lineTo(x2, y2);
            bumpCtx.stroke();
        }
    }

    const mapTexture = new THREE.CanvasTexture(mapCanvas);
    mapTexture.wrapS = THREE.RepeatWrapping;
    mapTexture.wrapT = THREE.RepeatWrapping;
    mapTexture.needsUpdate = true;

    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.needsUpdate = true;

    textureCache[type] = { map: mapTexture, bump: bumpTexture };
    return textureCache[type]!;
}
