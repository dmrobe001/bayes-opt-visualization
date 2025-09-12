import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import TimelineScrubber from '../../components/Timeline/TimelineScrubber';
import usePresentation from '../../hooks/usePresentation';
import { toyFunction2D_bimodal as toyFunction2D } from '../../data/toyFunctions';
import { Controls } from '../../rendering/three/controls';
import { GaussianProcessRegression } from '../../algorithms/gpr/gpr';

type Pt = { x: number; y: number; z: number };

const TRANS_MS = 500;
const TOTAL_STEPS = 16; // 0:Factorial, 1:Initial, 2:Linear, 3:GPR, 4:EI, 5:BO 1, 6:BO 2, 7:BO 3, 8:BO 4, 9:Random, 10:minimax, 11:measured, 12..15:m-BO 1..4

const TwoDScene: React.FC = () => {
    const { currentStep, nextStep, setCurrentStep } = usePresentation(TOTAL_STEPS);
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer>();
    const sceneRef = useRef<THREE.Scene>();
    const cameraRef = useRef<THREE.PerspectiveCamera>();
    const controlsRef = useRef<Controls>();
    const draggingRef = useRef(false);
    const rafRef = useRef<number>();
    const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
    const pointerMovedRef = useRef(false);

    const rows = 4, cols = 4;
    const gridPts = useMemo<Pt[]>(() => {
        const pts: Pt[] = [];
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const x = i / (cols - 1);
                const y = j / (rows - 1);
                const z = toyFunction2D(x, y);
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
    // Normalize z to [0,1] only for coloring; keep true z for geometry
    const norm01 = useMemo(() => gridPts.map(p => ({ x: p.x, y: p.y, z01: zMax === zMin ? 0 : (p.z - zMin) / (zMax - zMin) })), [gridPts, zMin, zMax]);

    // Step-driven display state
    const showZ = currentStep >= 1; // Step 1+: points at true Z
    const showTilt = currentStep >= 2; // Step 2+: camera tilt and rotation begin
    const zScale = 0.3; // world units height for max z on the axis drawing
    const worldZ = useCallback((zVal: number) => {
        if (!isFinite(zVal) || !isFinite(zMin) || !isFinite(zMax) || zMax === zMin) return 0;
        // Map zMin->0, zMax->zScale, but do NOT clamp so values can exceed the axis
        return ((zVal - zMin) / (zMax - zMin)) * zScale;
    }, [zMin, zMax]);

    // Overlay toggles (will be driven by step changes; UI can temporarily override within a step)
    const [showLinear, setShowLinear] = useState(false);
    const [showGPRMean, setShowGPRMean] = useState(false);
    const [showGPRSigma, setShowGPRSigma] = useState(false);
    const [showEI, setShowEI] = useState(false);

    // Align overlays to the current step
    useEffect(() => {
        // Step mapping:
        // 0: Factorial Sampling -> no surfaces
        // 1: Initial Measurements -> no surfaces
        // 2: Linear -> linear only
        // 3: GPR -> GPR mean + sigma
        // 4: EI -> sigma + EI (mean hidden)
        // 5..8: BO -> GPR mean + sigma (EI hidden)
        // 9: Random Sampling -> GPR mean + sigma
        // 10: minimax -> no surfaces
    // 11: measured -> GPR mean + sigma
    // 12..15: m-BO -> GPR mean + sigma (EI hidden)
    const isBO = currentStep >= 5 && currentStep <= 8;
        const isRandom = currentStep === 9;
        const isMinimax = currentStep === 10;
    const isMeasured = currentStep === 11;
    const isMBO = currentStep >= 12 && currentStep <= 15;
    setShowLinear(currentStep === 2 && !isMinimax);
    setShowGPRMean(currentStep === 3 || isBO || isRandom || isMeasured || isMBO);
    setShowGPRSigma((currentStep >= 3 && !isMinimax) || isRandom || isMeasured || isMBO);
    setShowEI(currentStep === 4 && !isMinimax);
    }, [currentStep]);

    // Rotate toggle: user-controlled, with step-based auto-enable
    const [rotateEnabled, setRotateEnabled] = useState(false);
    const userSetRotateRef = useRef(false);

    // Samples (start with grid samples). Keep in state so overlays recompute automatically on updates.
    const [samples, setSamples] = useState(() => gridPts.map(p => ({ x: p.x, y: p.y, z: p.z })));
    useEffect(() => {
        // If underlying grid changes (unlikely), reset samples to the new grid
        setSamples(gridPts.map(p => ({ x: p.x, y: p.y, z: p.z })));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridPts]);

    // Dense evaluation grid for GP/EI
    const gridRes = 41;
    const evalGrid = useMemo(() => {
        const xs = Array.from({ length: gridRes }, (_, i) => i / (gridRes - 1));
        const ys = Array.from({ length: gridRes }, (_, j) => j / (gridRes - 1));
        const Xs: number[][] = [];
        for (let j = 0; j < gridRes; j++) {
            for (let i = 0; i < gridRes; i++) Xs.push([xs[i], ys[j]]);
        }
        return { xs, ys, Xs };
    }, []);

    // GP fit and prediction over dense grid
    const gpPred = useMemo(() => {
        if (samples.length < 3) return null;
        const gp = new GaussianProcessRegression({ lengthScale: 0.25, noise: 1e-3, signalVariance: 1 });
        gp.fit(samples.map(s => [s.x, s.y]), samples.map(s => s.z));
        const pred = gp.predict(evalGrid.Xs);
        const sigma = pred.variance.map(v => Math.sqrt(Math.max(v, 0)));
        return { mean: pred.mean, sigma };
    }, [samples, evalGrid]);

    // Expected Improvement field (normalized 0..1)
    const eiField = useMemo(() => {
        if (!gpPred || samples.length < 2) return null;
        const best = Math.max(...samples.map(s => s.z));
        const xi = 0.0;
        const phi = (z: number) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
        const erf = (x: number) => {
            const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
            const sign = x < 0 ? -1 : 1; const ax = Math.abs(x);
            const t = 1 / (1 + p * ax);
            const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
            return sign * y;
        };
        const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));
        const raw = gpPred.mean.map((mu, i) => {
            const s = gpPred.sigma[i];
            if (s < 1e-9) return 0;
            const z = (mu - best - xi) / s;
            return (mu - best - xi) * Phi(z) + s * phi(z);
        });
        const maxEI = Math.max(...raw);
        const norm = raw.map(v => maxEI > 0 ? v / maxEI : 0);
        return { raw, norm };
    }, [gpPred, samples]);

    // Animated tilt (camera interpolation 0 -> 1)
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

    // Pause auto-rotation on interaction
    const [userPaused, setUserPaused] = useState(false);

    // Auto-enable rotate at the "tilt + rotate" step unless the user has explicitly set it
    useEffect(() => {
        if (currentStep >= 2 && !userSetRotateRef.current) {
            setRotateEnabled(true);
        }
    }, [currentStep]);

    const labels = [
        'Factoral Sampling',
        'Initial Measurements',
        'Linear',
        'GPR',
        'EI',
        'BO 1',
        'BO 2',
        'BO 3',
    'BO 4',
    'Random Sampling',
    'minimax',
    'measured',
    'm-BO 1',
    'm-BO 2',
    'm-BO 3',
    'm-BO 4',
    ];

        const handleAdvance = () => { setUserPaused(false); nextStep(); };

        // Three.js scene setup
    const pointsRef = useRef<THREE.Points>();
    const pointsBorderRef = useRef<THREE.Points>();
    const minimaxAllRef = useRef<Pt[] | null>(null);
    const minimaxKeepIdxRef = useRef<Set<number> | null>(null);
    const linearRef = useRef<THREE.Mesh>();
    const gprMeanRef = useRef<THREE.Mesh>();
    const gprSigmaUpRef = useRef<THREE.Mesh>();
    const gprSigmaDnRef = useRef<THREE.Mesh>();
    const eiRef = useRef<THREE.Mesh>();
    const axesRef = useRef<THREE.Group>();

        const rebuildScene = useCallback(() => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;

            // Renderer
            if (!rendererRef.current) {
                rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
                rendererRef.current.setPixelRatio(window.devicePixelRatio);
                containerRef.current.appendChild(rendererRef.current.domElement);
            }
            rendererRef.current.setSize(w, h);

            // Scene
            if (!sceneRef.current) sceneRef.current = new THREE.Scene();
            const scene = sceneRef.current;
            scene.background = new THREE.Color(0xfafafa);

            // Camera (Z-up)
            if (!cameraRef.current) {
                cameraRef.current = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
                cameraRef.current.up.set(0, 0, 1);
            }
            cameraRef.current.aspect = w / h;
            cameraRef.current.updateProjectionMatrix();

            // Controls
            if (!controlsRef.current) controlsRef.current = new Controls(cameraRef.current, rendererRef.current.domElement);
            controlsRef.current.setTarget(0, 0, 0);
            controlsRef.current.setPolarLimits(0.0 + 0.001, Math.PI / 2 - 0.05);

            // Lights
            const existingLights = scene.children.filter(c => (c as any).isLight);
            existingLights.forEach(l => scene.remove(l));
            scene.add(new THREE.AmbientLight(0xffffff, 0.9));
            const dir = new THREE.DirectionalLight(0xffffff, 0.6);
            dir.position.set(2, 3, 4);
            scene.add(dir);

            // Axes helper: X,Y blue; Z red. We'll custom draw to match color spec
            if (!axesRef.current) {
                const group = new THREE.Group();
                // Grid origin at (-0.5, -0.5, 0) corresponds to (0,0,0)
                const base = new THREE.Vector3(-0.5, -0.5, 0);
                // X axis (blue) from base to +X
                group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                    base, new THREE.Vector3(0.5, -0.5, 0)
                ]), new THREE.LineBasicMaterial({ color: '#0b61ff' })));
                // Y axis (blue) from base to +Y
                group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                    base, new THREE.Vector3(-0.5, 0.5, 0)
                ]), new THREE.LineBasicMaterial({ color: '#0b61ff' })));
                // Z measurement axis (red, dashed) from base to +Z_max
                const zGeom = new THREE.BufferGeometry().setFromPoints([
                    base, new THREE.Vector3(-0.5, -0.5, zScale)
                ]);
                const zLine = new THREE.Line(zGeom, new THREE.LineDashedMaterial({ color: '#ff2d2d', dashSize: 0.05, gapSize: 0.03 }));
                zLine.computeLineDistances();
                group.add(zLine);
                axesRef.current = group;
                scene.add(group);
            }

            // Points (default: use dynamic samples so BO/random/measured points appear)
            let positions: Float32Array;
            let colors: Float32Array;
            const showColor = currentStep >= 1; // red shading when true
            const isMinimaxStep = currentStep === 10;
            const forceBlack = currentStep >= 11; // measured and m-BO: black points
            if (!isMinimaxStep) {
                positions = new Float32Array(samples.length * 3);
                colors = new Float32Array(samples.length * 3);
                for (let i = 0; i < samples.length; i++) {
                    const s = samples[i];
                    const zTrue = showZ ? s.z : 0;
                    positions[i * 3 + 0] = s.x - 0.5;
                    positions[i * 3 + 1] = s.y - 0.5;
                    positions[i * 3 + 2] = worldZ(zTrue);
                    if (forceBlack) {
                        colors[i * 3 + 0] = 0; colors[i * 3 + 1] = 0; colors[i * 3 + 2] = 0;
                    } else if (showColor) {
                        const t = Math.max(0, Math.min(1, (s.z - zMin) / (zMax - zMin || 1)));
                        colors[i * 3 + 0] = (40 + t * 215) / 255;
                        colors[i * 3 + 1] = (0 + t * 30) / 255;
                        colors[i * 3 + 2] = (0 + t * 25) / 255;
                    } else {
                        colors[i * 3 + 0] = 0;
                        colors[i * 3 + 1] = 0;
                        colors[i * 3 + 2] = 0;
                    }
                }
            } else {
                // minimax: draw 80 grey points on plane, survivors black
                const all = minimaxAllRef.current ?? [];
                const keep = minimaxKeepIdxRef.current ?? new Set<number>();
                positions = new Float32Array(all.length * 3);
                colors = new Float32Array(all.length * 3);
                for (let i = 0; i < all.length; i++) {
                    const p = all[i];
                    positions[i * 3 + 0] = p.x - 0.5;
                    positions[i * 3 + 1] = p.y - 0.5;
                    positions[i * 3 + 2] = 0; // on plane
                    if (keep.has(i)) {
                        colors[i * 3 + 0] = 0;
                        colors[i * 3 + 1] = 0;
                        colors[i * 3 + 2] = 0;
                    } else {
                        colors[i * 3 + 0] = 0.7;
                        colors[i * 3 + 1] = 0.7;
                        colors[i * 3 + 2] = 0.7;
                    }
                }
            }
            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                // Border (white, slightly larger, drawn first)
                const borderMat = new THREE.PointsMaterial({ size: 0.055, color: 0xffffff, sizeAttenuation: true });
                borderMat.depthWrite = false; // don't affect depth buffer
                if (pointsBorderRef.current) scene.remove(pointsBorderRef.current);
                pointsBorderRef.current = new THREE.Points(geom, borderMat);
                pointsBorderRef.current.renderOrder = 1;
                scene.add(pointsBorderRef.current);

                const mat = new THREE.PointsMaterial({ size: 0.04, vertexColors: true, sizeAttenuation: true });
                if (pointsRef.current) scene.remove(pointsRef.current);
                pointsRef.current = new THREE.Points(geom, mat);
                pointsRef.current.renderOrder = 2;
                scene.add(pointsRef.current);

            // Linear surface (triangulated from sample grid)
            if (showLinear) {
                const g = new THREE.BufferGeometry();
                const trisPerCell = 2;
                const cells = (rows - 1) * (cols - 1);
                const vcount = cells * trisPerCell * 3;
                const pos = new Float32Array(vcount * 3);
                const col = new Float32Array(vcount * 3);
                let k = 0;
                const idx = (i: number, j: number) => j * cols + i;
                for (let j = 0; j < rows - 1; j++) {
                    for (let i = 0; i < cols - 1; i++) {
                        const i00 = idx(i, j), i10 = idx(i + 1, j), i11 = idx(i + 1, j + 1), i01 = idx(i, j + 1);
                        const v00 = { x: norm01[i00].x, y: norm01[i00].y, z: worldZ(gridPts[i00].z), t: norm01[i00].z01 };
                        const v10 = { x: norm01[i10].x, y: norm01[i10].y, z: worldZ(gridPts[i10].z), t: norm01[i10].z01 };
                        const v11 = { x: norm01[i11].x, y: norm01[i11].y, z: worldZ(gridPts[i11].z), t: norm01[i11].z01 };
                        const v01 = { x: norm01[i01].x, y: norm01[i01].y, z: worldZ(gridPts[i01].z), t: norm01[i01].z01 };
                        const tri = [v00, v10, v11, v00, v11, v01] as const;
                        for (const p of tri) {
                            pos[k + 0] = p.x - 0.5;
                            pos[k + 1] = p.y - 0.5;
                            pos[k + 2] = p.z;
                            const t = p.t;
                            col[k + 0] = (40 + t * 215) / 255;
                            col[k + 1] = (0 + t * 30) / 255;
                            col[k + 2] = (0 + t * 25) / 255;
                            k += 3;
                        }
                    }
                }
                g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                g.setAttribute('color', new THREE.BufferAttribute(col, 3));
                g.computeVertexNormals();
                const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, transparent: false, opacity: 1.0, side: THREE.DoubleSide });
                if (linearRef.current) { scene.remove(linearRef.current); (linearRef.current.geometry as THREE.BufferGeometry).dispose(); (linearRef.current.material as THREE.Material).dispose(); }
                linearRef.current = new THREE.Mesh(g, m);
                scene.add(linearRef.current);
            } else if (linearRef.current) {
                scene.remove(linearRef.current);
                (linearRef.current.geometry as THREE.BufferGeometry).dispose();
                (linearRef.current.material as THREE.Material).dispose();
                linearRef.current = undefined;
            }

            // GPR mean surface
            if (showGPRMean && gpPred) {
                const w = gridRes - 1, h = gridRes - 1;
                const tris = w * h * 2;
                const pos = new Float32Array(tris * 3 * 3);
                const col = new Float32Array(tris * 3 * 3);
                let k = 0;
                const get = (i: number, j: number) => gpPred.mean[j * gridRes + i];
                for (let j = 0; j < h; j++) {
                    for (let i = 0; i < w; i++) {
                        const x0 = i / w, x1 = (i + 1) / w, y0 = j / h, y1 = (j + 1) / h;
                        const z00 = get(i, j), z10 = get(i + 1, j), z11 = get(i + 1, j + 1), z01 = get(i, j + 1);
                        const t00 = Math.max(0, Math.min(1, (z00 - zMin) / (zMax - zMin)));
                        const t10 = Math.max(0, Math.min(1, (z10 - zMin) / (zMax - zMin)));
                        const t11 = Math.max(0, Math.min(1, (z11 - zMin) / (zMax - zMin)));
                        const t01 = Math.max(0, Math.min(1, (z01 - zMin) / (zMax - zMin)));
                        const tri = [
                            { x: x0, y: y0, z: worldZ(z00), t: t00 }, { x: x1, y: y0, z: worldZ(z10), t: t10 }, { x: x1, y: y1, z: worldZ(z11), t: t11 },
                            { x: x0, y: y0, z: worldZ(z00), t: t00 }, { x: x1, y: y1, z: worldZ(z11), t: t11 }, { x: x0, y: y1, z: worldZ(z01), t: t01 },
                        ] as const;
                        for (const p of tri) {
                            pos[k + 0] = p.x - 0.5;
                            pos[k + 1] = p.y - 0.5;
                            pos[k + 2] = p.z;
                            col[k + 0] = (40 + p.t * 215) / 255;
                            col[k + 1] = (0 + p.t * 30) / 255;
                            col[k + 2] = (0 + p.t * 25) / 255;
                            k += 3;
                        }
                    }
                }
                const g = new THREE.BufferGeometry();
                g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                g.setAttribute('color', new THREE.BufferAttribute(col, 3));
                g.computeVertexNormals();
                const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, transparent: false, opacity: 1.0, side: THREE.DoubleSide });
                if (gprMeanRef.current) { scene.remove(gprMeanRef.current); (gprMeanRef.current.geometry as THREE.BufferGeometry).dispose(); (gprMeanRef.current.material as THREE.Material).dispose(); }
                gprMeanRef.current = new THREE.Mesh(g, m);
                scene.add(gprMeanRef.current);
            } else if (gprMeanRef.current) {
                scene.remove(gprMeanRef.current);
                (gprMeanRef.current.geometry as THREE.BufferGeometry).dispose();
                (gprMeanRef.current.material as THREE.Material).dispose();
                gprMeanRef.current = undefined;
            }

            // GPR +/- sigma surfaces
            if (showGPRSigma && gpPred) {
                const w = gridRes - 1, h = gridRes - 1;
                const tris = w * h * 2;
                const buildSigma = (sign: 1 | -1) => {
                    const pos = new Float32Array(tris * 3 * 3);
                    let k = 0;
                    const get = (i: number, j: number) => gpPred.mean[j * gridRes + i] + sign * gpPred.sigma[j * gridRes + i];
                    for (let j = 0; j < h; j++) {
                        for (let i = 0; i < w; i++) {
                            const x0 = i / w, x1 = (i + 1) / w, y0 = j / h, y1 = (j + 1) / h;
                            const p00 = get(i, j);
                            const p10 = get(i + 1, j);
                            const p11 = get(i + 1, j + 1);
                            const p01 = get(i, j + 1);
                            const tri = [
                                { x: x0, y: y0, z: worldZ(p00) }, { x: x1, y: y0, z: worldZ(p10) }, { x: x1, y: y1, z: worldZ(p11) },
                                { x: x0, y: y0, z: worldZ(p00) }, { x: x1, y: y1, z: worldZ(p11) }, { x: x0, y: y1, z: worldZ(p01) },
                            ];
                            for (const p of tri) {
                                pos[k + 0] = p.x - 0.5;
                                pos[k + 1] = p.y - 0.5;
                                pos[k + 2] = p.z; // already mapped to world Z via worldZ()
                                k += 3;
                            }
                        }
                    }
                    const g = new THREE.BufferGeometry();
                    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                    g.computeVertexNormals();
                    const m = new THREE.MeshStandardMaterial({ color: sign === 1 ? 0xff6666 : 0x6666ff, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
                    return new THREE.Mesh(g, m);
                };
                if (gprSigmaUpRef.current) { scene.remove(gprSigmaUpRef.current); (gprSigmaUpRef.current.geometry as THREE.BufferGeometry).dispose(); (gprSigmaUpRef.current.material as THREE.Material).dispose(); }
                if (gprSigmaDnRef.current) { scene.remove(gprSigmaDnRef.current); (gprSigmaDnRef.current.geometry as THREE.BufferGeometry).dispose(); (gprSigmaDnRef.current.material as THREE.Material).dispose(); }
                gprSigmaUpRef.current = buildSigma(1);
                gprSigmaDnRef.current = buildSigma(-1);
                scene.add(gprSigmaUpRef.current);
                scene.add(gprSigmaDnRef.current);
            } else {
                if (gprSigmaUpRef.current) { scene.remove(gprSigmaUpRef.current); (gprSigmaUpRef.current.geometry as THREE.BufferGeometry).dispose(); (gprSigmaUpRef.current.material as THREE.Material).dispose(); gprSigmaUpRef.current = undefined; }
                if (gprSigmaDnRef.current) { scene.remove(gprSigmaDnRef.current); (gprSigmaDnRef.current.geometry as THREE.BufferGeometry).dispose(); (gprSigmaDnRef.current.material as THREE.Material).dispose(); gprSigmaDnRef.current = undefined; }
            }

            // EI heat surface (height scaled so EI max reaches Z axis max)
            if (showEI && eiField) {
                const w = gridRes - 1, h = gridRes - 1;
                const tris = w * h * 2;
                const pos = new Float32Array(tris * 3 * 3);
                const col = new Float32Array(tris * 3 * 3);
                let k = 0;
                const get = (i: number, j: number) => eiField.norm[j * gridRes + i];
                for (let j = 0; j < h; j++) {
                    for (let i = 0; i < w; i++) {
                        const x0 = i / w, x1 = (i + 1) / w, y0 = j / h, y1 = (j + 1) / h;
                        const e00 = get(i, j), e10 = get(i + 1, j), e11 = get(i + 1, j + 1), e01 = get(i, j + 1);
                        const tri = [
                            { x: x0, y: y0, e: e00 }, { x: x1, y: y0, e: e10 }, { x: x1, y: y1, e: e11 },
                            { x: x0, y: y0, e: e00 }, { x: x1, y: y1, e: e11 }, { x: x0, y: y1, e: e01 },
                        ];
                        for (const p of tri) {
                            pos[k + 0] = p.x - 0.5;
                            pos[k + 1] = p.y - 0.5;
                            pos[k + 2] = Math.max(0.001, p.e * zScale); // EI height 0..zScale
                            // orange heat map
                            const r = 0.6 + 0.4 * p.e;
                            const g = 0.3 * (1 - p.e);
                            const b = 0.05;
                            col[k + 0] = r; col[k + 1] = g; col[k + 2] = b;
                            k += 3;
                        }
                    }
                }
                const g = new THREE.BufferGeometry();
                g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                g.setAttribute('color', new THREE.BufferAttribute(col, 3));
                const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: false, opacity: 1.0, side: THREE.DoubleSide });
                if (eiRef.current) { scene.remove(eiRef.current); (eiRef.current.geometry as THREE.BufferGeometry).dispose(); (eiRef.current.material as THREE.Material).dispose(); }
                eiRef.current = new THREE.Mesh(g, m);
                scene.add(eiRef.current);
            } else if (eiRef.current) {
                scene.remove(eiRef.current);
                (eiRef.current.geometry as THREE.BufferGeometry).dispose();
                (eiRef.current.material as THREE.Material).dispose();
                eiRef.current = undefined;
            }
        }, [norm01, showZ, rows, cols, showLinear, gpPred, showGPRMean, showGPRSigma, gridRes, zMin, zMax, eiField, showEI]);

        // Render loop with optional auto-rotate (camera-based)
        useEffect(() => {
            if (!containerRef.current) return;
            rebuildScene();
            // Hook interaction events once
            controlsRef.current?.onInteractionStart(() => { draggingRef.current = true; controlsRef.current?.setAutoRotate(false); });
            controlsRef.current?.onInteractionEnd(() => { draggingRef.current = false; });
            // Disable interaction during tilt to avoid wobble
            controlsRef.current?.setEnabled(tilt >= 1);
            const animate = () => {
                rafRef.current = requestAnimationFrame(animate);
                // During tilt animation, place camera along a spherical arc. After tilt completes, let OrbitControls own the camera.
                const ready = tilt > 0.999;
                if (cameraRef.current && !ready) {
                    const cam = cameraRef.current;
                    const r = 2.5;
                    const targetPhi = Math.PI / 3; // 60deg from up => 30deg above horizontal
                    const phi = targetPhi * Math.max(0, Math.min(1, tilt));
                    const theta = -Math.PI / 2; // face along -Y initially
                    const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);
                    cam.position.set(
                        r * sinPhi * Math.cos(theta),
                        r * sinPhi * Math.sin(theta),
                        r * cosPhi,
                    );
                    cam.lookAt(0, 0, 0);
                }
                // Enable OrbitControls and auto-rotation after tilt completes
                controlsRef.current?.setEnabled(ready);
                const autoRotate = rotateEnabled && currentStep >= 2 && ready && !draggingRef.current;
                controlsRef.current?.setAutoRotate(autoRotate, 0.8);
                controlsRef.current?.update();
                rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
            };
            animate();
            const onResize = () => rebuildScene();
            window.addEventListener('resize', onResize);
            return () => {
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                window.removeEventListener('resize', onResize);
            };
        }, [rebuildScene, currentStep, rotateEnabled, tilt]);

    // BO steps: add up to 4 samples at EI maxima across steps 5..8, and support scrubbing
    const boSeqRef = useRef<Pt[]>([]); // accumulated BO additions in current session
    useEffect(() => {
        if (currentStep >= 9) return; // don't override Random/Minimax/Measured/m-BO
        const base = gridPts.map(p => ({ x: p.x, y: p.y, z: p.z }));
        const baseLen = base.length;
        const desiredBoCount = currentStep >= 5 && currentStep <= 8 ? Math.min(4, currentStep - 4) : 0; // only for steps 5..8

        // Ensure samples reflect base + prefix of BO sequence of length desiredBoCount
        const ensureSamples = (count: number) => {
            const prefix = boSeqRef.current.slice(0, count);
            setSamples([...base, ...prefix]);
        };

        // If stepping back: trim BO sequence usage
        if (samples.length !== baseLen + desiredBoCount) {
            // If we need fewer than we have, or need to re-sync, reset to exact desired prefix
            if (desiredBoCount <= boSeqRef.current.length) {
                ensureSamples(desiredBoCount);
                return;
            }
        }

        // If we need to generate more BO points, do it iteratively one at a time
        const need = desiredBoCount - boSeqRef.current.length;
        if (need > 0 && eiField) {
            // Pick current EI argmax
            let bestI = 0;
            for (let i = 1; i < eiField.norm.length; i++) if (eiField.norm[i] > eiField.norm[bestI]) bestI = i;
            const i = bestI % gridRes;
            const j = Math.floor(bestI / gridRes);
            const x = i / (gridRes - 1);
            const y = j / (gridRes - 1);
            const z = toyFunction2D(x, y);
            boSeqRef.current = [...boSeqRef.current, { x, y, z }];
            ensureSamples(boSeqRef.current.length);
        }

        // If user rewinds before EI, clear sequence
        if (currentStep < 5 && boSeqRef.current.length) {
            boSeqRef.current = [];
            ensureSamples(0);
        }
    }, [currentStep, eiField, gridPts, gridRes, samples.length]);

    // Random Sampling step (step 9): start over with 16 random samples
    const randomSamplesRef = useRef<Pt[] | null>(null);
    useEffect(() => {
        if (currentStep === 9) {
            if (!randomSamplesRef.current) {
                const rng = Math.random;
                const pts: Pt[] = [];
                const n = 16;
                for (let k = 0; k < n; k++) {
                    const x = rng();
                    const y = rng();
                    const z = toyFunction2D(x, y);
                    pts.push({ x, y, z });
                }
                randomSamplesRef.current = pts;
            }
            setSamples(randomSamplesRef.current.slice());
        }
        // No action in other steps here to avoid clobbering samples
    }, [currentStep]);

    // Minimax generation (step 10) and measured samples (step 11)
    useEffect(() => {
        if (currentStep === 10) {
            if (!minimaxAllRef.current || !minimaxKeepIdxRef.current) {
                // Generate 80 random XY points
                const rng = Math.random;
                const all: Pt[] = [];
                for (let k = 0; k < 80; k++) { all.push({ x: rng(), y: rng(), z: 0 }); }
                // Downsample by repeatedly removing the closest pair until 16 remain
                const indices = Array.from({ length: all.length }, (_, i) => i);
                while (indices.length > 16) {
                    let bestA = 0, bestB = 1; let bestD = Infinity;
                    for (let a = 0; a < indices.length; a++) {
                        const ia = indices[a]; const ax = all[ia].x, ay = all[ia].y;
                        for (let b = a + 1; b < indices.length; b++) {
                            const ib = indices[b]; const dx = ax - all[ib].x, dy = ay - all[ib].y; const d = dx * dx + dy * dy;
                            if (d < bestD) { bestD = d; bestA = a; bestB = b; }
                        }
                    }
                    const hi = Math.max(bestA, bestB), lo = Math.min(bestA, bestB);
                    indices.splice(hi, 1); indices.splice(lo, 1);
                }
                minimaxAllRef.current = all;
                minimaxKeepIdxRef.current = new Set(indices);
            }
        } else if (currentStep === 11) {
            // Ensure minimax survivors exist; if not, generate them now
            if (!minimaxAllRef.current || !minimaxKeepIdxRef.current) {
                const rng = Math.random;
                const all: Pt[] = [];
                for (let k = 0; k < 80; k++) { all.push({ x: rng(), y: rng(), z: 0 }); }
                const indices = Array.from({ length: all.length }, (_, i) => i);
                while (indices.length > 16) {
                    let bestA = 0, bestB = 1; let bestD = Infinity;
                    for (let a = 0; a < indices.length; a++) {
                        const ia = indices[a]; const ax = all[ia].x, ay = all[ia].y;
                        for (let b = a + 1; b < indices.length; b++) {
                            const ib = indices[b]; const dx = ax - all[ib].x, dy = ay - all[ib].y; const d = dx * dx + dy * dy;
                            if (d < bestD) { bestD = d; bestA = a; bestB = b; }
                        }
                    }
                    const hi = Math.max(bestA, bestB), lo = Math.min(bestA, bestB);
                    indices.splice(hi, 1); indices.splice(lo, 1);
                }
                minimaxAllRef.current = all;
                minimaxKeepIdxRef.current = new Set(indices);
            }
            // Use minimax survivors as measured samples with true z
            const survivors = Array.from(minimaxKeepIdxRef.current!).map(i => minimaxAllRef.current![i]);
            const smp = survivors.map(p => ({ x: p.x, y: p.y, z: toyFunction2D(p.x, p.y) }));
            setSamples(smp);
        } else if (currentStep < 11 || currentStep > 15) {
            // Leaving measured/m-BO range: clear m-BO sequence to avoid carry-over
            mboSeqRef.current = [];
        }
    }, [currentStep, samples.length]);

    // m-BO steps (12..15): add up to 4 points by EI starting from minimax survivors, with scrubbing support
    const mboSeqRef = useRef<Pt[]>([]);
    useEffect(() => {
        if (currentStep < 12 || currentStep > 15) return;
        // Base = measured survivors
        if (!(minimaxAllRef.current && minimaxKeepIdxRef.current)) return;
        const survivors = Array.from(minimaxKeepIdxRef.current).map(i => minimaxAllRef.current![i]);
        const base = survivors.map(p => ({ x: p.x, y: p.y, z: toyFunction2D(p.x, p.y) }));
        const desired = currentStep - 11; // 1..4
        const currentAdded = mboSeqRef.current.slice(0, desired);
        const targetLen = base.length + currentAdded.length;
        // Only set samples if count differs to avoid render thrash
        if (samples.length !== targetLen) {
            setSamples([...base, ...currentAdded]);
        }
        // If we need to generate a new point for this step, do it once when EI is ready
        const need = desired - mboSeqRef.current.length;
        if (need > 0 && eiField) {
            let bestI = 0;
            for (let i = 1; i < eiField.norm.length; i++) if (eiField.norm[i] > eiField.norm[bestI]) bestI = i;
            const i = bestI % gridRes; const j = Math.floor(bestI / gridRes);
            const x = i / (gridRes - 1); const y = j / (gridRes - 1); const z = toyFunction2D(x, y);
            mboSeqRef.current = [...mboSeqRef.current, { x, y, z }];
            setSamples([...base, ...mboSeqRef.current.slice(0, desired)]);
        }
    }, [currentStep, eiField, gridRes, samples.length]);

    return (
        <div className="two-d-scene" style={{ cursor: 'default' }}>
            <h2>2D Design Space</h2>
            <p style={{ fontSize: '0.85rem', color: '#666' }}>Click canvas or use timeline. Step {currentStep + 1}/{TOTAL_STEPS}</p>
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
            <div
                ref={containerRef}
                style={{ width: 800, height: 480, background: '#fafafa', border: '1px solid #ccc', cursor: 'pointer' }}
                onPointerDown={(e) => {
                    setUserPaused(true);
                    pointerMovedRef.current = false;
                    pointerDownRef.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerMove={(e) => {
                    if (!pointerDownRef.current) return;
                    const dx = e.clientX - pointerDownRef.current.x;
                    const dy = e.clientY - pointerDownRef.current.y;
                    if (Math.hypot(dx, dy) > 5) pointerMovedRef.current = true; // small threshold
                }}
                onPointerUp={() => {
                    const wasDrag = pointerMovedRef.current || draggingRef.current;
                    pointerDownRef.current = null;
                    if (!wasDrag) { setUserPaused(false); handleAdvance(); }
                }}
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 13 }}>
                <label><input type="checkbox" checked={showLinear} onChange={e => setShowLinear(e.target.checked)} /> Linear</label>
                <label><input type="checkbox" checked={!!showGPRMean} onChange={e => setShowGPRMean(e.target.checked)} /> GPR mean</label>
                <label><input type="checkbox" checked={!!showGPRSigma} onChange={e => setShowGPRSigma(e.target.checked)} /> GPR ± σ</label>
                <label><input type="checkbox" checked={!!showEI} onChange={e => setShowEI(e.target.checked)} /> EI</label>
                <label>
                    <input
                        type="checkbox"
                        checked={rotateEnabled}
                        onChange={e => { userSetRotateRef.current = true; setRotateEnabled(e.target.checked); }}
                    />
                    {' '}rotate
                </label>
            </div>
        </div>
    );
};

export default TwoDScene;