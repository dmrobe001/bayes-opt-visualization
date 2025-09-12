import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import TimelineScrubber from '../../components/Timeline/TimelineScrubber';
import usePresentation from '../../hooks/usePresentation';
import { toyFunction2D } from '../../data/toyFunctions';
import { Controls } from '../../rendering/three/controls';

type Pt = { x: number; y: number; z: number };

const TRANS_MS = 500;
const TOTAL_STEPS = 5; // 0:init, 1:reveal z+color, 2:tilt+rotate, 3:tri mesh, 4:hold

const TwoDScene: React.FC = () => {
    const { currentStep, nextStep, setCurrentStep } = usePresentation(TOTAL_STEPS);
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer>();
    const sceneRef = useRef<THREE.Scene>();
    const cameraRef = useRef<THREE.PerspectiveCamera>();
    const controlsRef = useRef<Controls>();
    const draggingRef = useRef(false);
    const rafRef = useRef<number>();

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
    // Normalize z to [0,1] for elevation and color
    const norm01 = useMemo(() => gridPts.map(p => ({ x: p.x, y: p.y, z01: zMax === zMin ? 0 : (p.z - zMin) / (zMax - zMin) })), [gridPts, zMin, zMax]);

    // Step-driven display state
    const showZ = currentStep >= 1;
    const showTilt = currentStep >= 2;
    const showMesh = currentStep >= 3;
    const zScale = 0.3; // world units height for max z

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

    const labels = [
        '2D grid',
        'apply z + color',
        'tilt + rotate',
        'triangulated mesh',
        'hold',
    ];

        const handleAdvance = () => { setUserPaused(false); nextStep(); };

        // Three.js scene setup
    const pointsRef = useRef<THREE.Points>();
    const meshRef = useRef<THREE.Mesh>();
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

            // Points
            const positions = new Float32Array(norm01.length * 3);
            const colors = new Float32Array(norm01.length * 3);
            for (let i = 0; i < norm01.length; i++) {
                const p = norm01[i];
                const z = showZ ? p.z01 : 0;
                positions[i * 3 + 0] = p.x - 0.5;
                positions[i * 3 + 1] = p.y - 0.5;
                positions[i * 3 + 2] = z * zScale;
                const t = z; // 0..1
                colors[i * 3 + 0] = (40 + t * 215) / 255;
                colors[i * 3 + 1] = (0 + t * 30) / 255;
                colors[i * 3 + 2] = (0 + t * 25) / 255;
            }
            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            const mat = new THREE.PointsMaterial({ size: 0.04, vertexColors: true, sizeAttenuation: true });
            if (pointsRef.current) scene.remove(pointsRef.current);
            pointsRef.current = new THREE.Points(geom, mat);
            scene.add(pointsRef.current);

            // Triangulated surface (wireframe)
            if (showMesh) {
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
                        const p00 = norm01[idx(i, j)], p10 = norm01[idx(i + 1, j)], p11 = norm01[idx(i + 1, j + 1)], p01 = norm01[idx(i, j + 1)];
                        const tri = [p00, p10, p11, p00, p11, p01] as const;
                        for (const p of tri) {
                            const z = showZ ? p.z01 : 0;
                            pos[k + 0] = p.x - 0.5;
                            pos[k + 1] = p.y - 0.5;
                            pos[k + 2] = z * zScale;
                            const t = z;
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
                const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
                if (meshRef.current) { scene.remove(meshRef.current); (meshRef.current.geometry as THREE.BufferGeometry).dispose(); (meshRef.current.material as THREE.Material).dispose(); }
                meshRef.current = new THREE.Mesh(g, m);
                scene.add(meshRef.current);
            } else if (meshRef.current) {
                scene.remove(meshRef.current);
                (meshRef.current.geometry as THREE.BufferGeometry).dispose();
                (meshRef.current.material as THREE.Material).dispose();
                meshRef.current = undefined;
            }
        }, [norm01, showZ, showMesh, rows, cols]);

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
                const autoRotate = currentStep >= 2 && ready && !draggingRef.current;
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
        }, [rebuildScene, currentStep, userPaused, tilt]);

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
            <div
                ref={containerRef}
                style={{ width: 800, height: 480, background: '#fafafa', border: '1px solid #ccc', cursor: 'pointer' }}
                onClick={() => { setUserPaused(false); handleAdvance(); }}
                onPointerDown={() => setUserPaused(true)}
            />
        </div>
    );
};

export default TwoDScene;