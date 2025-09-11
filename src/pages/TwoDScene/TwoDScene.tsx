import React, { useEffect, useMemo, useRef, useState } from 'react';
import TimelineScrubber from '../../components/Timeline/TimelineScrubber';
import usePresentation from '../../hooks/usePresentation';
import { toyFunction2D } from '../../data/toyFunctions';

type Pt = { x: number; y: number; z: number };

const TRANS_MS = 500;
const TOTAL_STEPS = 5; // 0:init, 1:reveal z+color, 2:tilt+rotate, 3:tri mesh, 4:hold

function scaleRed(y: number, minZ: number, maxZ: number): string {
    if (maxZ - minZ < 1e-9) return '#aa0000';
    const t = (y - minZ) / (maxZ - minZ);
    const r = Math.round(40 + t * 215);
    const g = Math.round(0 + t * 30);
    const b = Math.round(0 + t * 25);
    return `rgb(${r},${g},${b})`;
}

// Simple 3D-ish projection: rotate around Z, then apply tilt to raise by z
function project(p: Pt, opts: { theta: number; tilt: number; sx: number; sy: number; zScale: number; cx: number; cy: number }) {
    const { theta, tilt, sx, sy, zScale, cx, cy } = opts;
    const xc = p.x - 0.5;
    const yc = p.y - 0.5;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const xr = xc * cosT - yc * sinT;
    const yr = xc * sinT + yc * cosT;
    const X = cx + xr * sx;
    const Y = cy - yr * sy - tilt * p.z * zScale;
    return { X, Y };
}

const TwoDScene: React.FC = () => {
    const { currentStep, nextStep, setCurrentStep } = usePresentation(TOTAL_STEPS);

    // Grid setup
    const rows = 4, cols = 4;
    const gridPts = useMemo<Pt[]>(() => {
        const pts: Pt[] = [];
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const x = i / (cols - 1);
                const y = j / (rows - 1);
                const z = toyFunction2D(x, y); // may not be in [-1,1]
                pts.push({ x, y, z });
            }
        }
        return pts;
    }, []);

    // Normalize z to [-1,1] for consistent visuals
    const { zMin, zMax } = useMemo(() => {
        const zs = gridPts.map(p => p.z);
        return { zMin: Math.min(...zs), zMax: Math.max(...zs) };
    }, [gridPts]);
    const normPts = useMemo(() => gridPts.map(p => ({ ...p, z: zMin === zMax ? 0 : ((p.z - zMin) / (zMax - zMin)) * 2 - 1 })), [gridPts, zMin, zMax]);

    // Step-driven display state
    const showZ = currentStep >= 1;
    const showTilt = currentStep >= 2;
    const showMesh = currentStep >= 3;

    // Animated tilt (0 -> 1)
    const [tilt, setTilt] = useState(0);
    useEffect(() => {
        const target = showTilt ? 1 : 0;
        let raf = 0, t0: number | null = null;
        const step = (t: number) => {
            if (t0 === null) t0 = t;
            const p = Math.min(1, (t - t0) / TRANS_MS);
            const e = p * (2 - p);
            setTilt(prev => prev + (target - prev) * e);
            if (p < 1) raf = requestAnimationFrame(step); else setTilt(target);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [showTilt]);

    // Slow rotation when step >= 2, pause on pointer interaction
        const [theta, setTheta] = useState(0);
        const [userPaused, setUserPaused] = useState(false);
        const rotating = currentStep >= 2 && !userPaused;
    useEffect(() => {
        let raf = 0;
        if (rotating) {
            const loop = () => {
                setTheta(th => (th + 0.003) % (Math.PI * 2));
                raf = requestAnimationFrame(loop);
            };
            raf = requestAnimationFrame(loop);
        }
        return () => cancelAnimationFrame(raf);
    }, [rotating]);

        const handlePointerDown: React.PointerEventHandler<SVGSVGElement> = () => {
            // Pause rotation and give control to user until next advance
            setUserPaused(true);
        };
        const handlePointerUp: React.PointerEventHandler<SVGSVGElement> = () => {
            // Keep paused; resume will occur on next step advance per presentation spec
        };

    // Layout/projection constants
    const proj = { theta, tilt: Math.max(0, Math.min(1, tilt)), sx: 80, sy: 80, zScale: 30, cx: 50, cy: 50 };

    // Build mesh triangles (two per grid cell)
    type Tri = [Pt, Pt, Pt];
    const triangles: Tri[] = useMemo(() => {
        const idx = (i: number, j: number) => j * cols + i;
        const tris: Tri[] = [];
        for (let j = 0; j < rows - 1; j++) {
            for (let i = 0; i < cols - 1; i++) {
                const p00 = normPts[idx(i, j)];
                const p10 = normPts[idx(i + 1, j)];
                const p11 = normPts[idx(i + 1, j + 1)];
                const p01 = normPts[idx(i, j + 1)];
                tris.push([p00, p10, p11]);
                tris.push([p00, p11, p01]);
            }
        }
        return tris;
    }, [normPts]);

    // Timeline labels
    const labels = [
        '2D grid',
        'apply z + color',
        'tilt + rotate',
        'triangulated mesh',
        'hold',
    ];

    // Advance click
        const handleAdvance = () => { setUserPaused(false); nextStep(); };

    return (
        <div className="two-d-scene" style={{ cursor: 'default' }}>
            <h2>2D Design Space</h2>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>Click canvas or use timeline. Step {currentStep}/{TOTAL_STEPS - 1}</p>
            <div style={{ width: '100%', margin: '0 0 0.5rem 0' }}>
                <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} style={{ width: '100%' }}>
                    <TimelineScrubber
                        currentStep={currentStep}
                        totalSteps={TOTAL_STEPS}
                        onStepChange={setCurrentStep}
                        labels={labels}
                    />
                </div>
            </div>

            <svg
                viewBox="0 0 100 60"
                width="800"
                height="480"
                style={{ background: '#fafafa', border: '1px solid #ccc', cursor: 'pointer' }}
                onClick={handleAdvance}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
            >
                {/* Axes: X and Y in blue, Z in red */}
                <line x1={5} y1={55} x2={95} y2={55} stroke="#0b61ff" strokeWidth={0.9} />
                <text x={50} y={59} textAnchor="middle" fill="#0b61ff" fontSize={3}>Design variable 1</text>
                <line x1={5} y1={55} x2={5} y2={5} stroke="#0b61ff" strokeWidth={0.9} />
                <text x={1} y={30} fill="#0b61ff" fontSize={3} transform="rotate(-90 1 30)" textAnchor="middle">Design variable 2</text>
                {/* Z axis indicator */}
                <line x1={95} y1={55} x2={95} y2={5} stroke="#ff2d2d" strokeDasharray="3 2" strokeWidth={0.7} />
                <text x={98} y={30} fill="#ff2d2d" fontSize={3} transform="rotate(-90 98 30)" textAnchor="middle">outcome (z)</text>

                {/* Mesh (behind points) */}
                {showMesh && triangles.map((tri, idx) => {
                    const avgZ = (tri[0].z + tri[1].z + tri[2].z) / 3;
                    const c = scaleRed(avgZ, -1, 1);
                    const pts = tri.map(p => project(p, proj)).map(p => `${p.X},${p.Y}`).join(' ');
                    return (
                        <polygon key={idx} points={pts} fill={c} opacity={0.25} stroke="#800" strokeOpacity={0.1} strokeWidth={0.2} />
                    );
                })}

                {/* Points */}
                {normPts.map((p, i) => {
                    const pos = project({ x: p.x, y: p.y, z: showZ ? p.z : 0 }, proj);
                    const fill = showZ ? scaleRed(p.z, -1, 1) : '#000';
                    return (
                        <g key={i} transform={`translate(${pos.X},${pos.Y})`} style={{ transition: `transform ${TRANS_MS}ms ease` }}>
                            <circle cx={0} cy={0} r={1.2} fill={fill} stroke="#111" strokeWidth={0.35} />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default TwoDScene;