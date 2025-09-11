import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import usePresentation from '../../hooks/usePresentation';
import { linearInterpolation1D } from '../../algorithms/interpolation/linear1D';
import { toyFunction1D } from '../../data/toyFunctions';
import { GaussianProcessRegression } from '../../algorithms/gpr/gpr';
import TimelineScrubber from '../../components/Timeline/TimelineScrubber';
// Placeholder imports – to be implemented
// import { GaussianProcess } from '../../algorithms/gpr/gpr';

// Sequence definition:
// 0: Show axis + 4 black sample markers at y=0 (unrevealed)
// 1-4: Each step raises one sample to true y and colors it (red shade)
// 5: Show linear interpolation trace
// 6: Show GPR mean + variance band (initial fit on 4 samples)
// 7-10: Iteratively add BO sample: show EI candidate marker appear at x, rise, update GPR
// (For now we'll stub EI steps with deterministic extra x positions.)

const INITIAL_X = [0, 0.33, 0.66, 1];

interface SamplePoint { x: number; y?: number; revealed: boolean; }

const buildInitialSamples = (): SamplePoint[] => INITIAL_X.map(x => ({ x, revealed: false }));

// Central authority for number of steps (inclusive range 0..N-1)
const totalSteps = 11;

const OneDScene: React.FC = () => {
        const { currentStep, nextStep, setCurrentStep } = usePresentation(totalSteps);
    const TRANS_MS = 350;

        // Pure reconstruction of state from step index (enables scrubbing & replay)
                const { samples, extraSamples, revealedPoints } = useMemo(() => {
                const base = buildInitialSamples();
                const primaryRevealCount = Math.min(Math.max(currentStep, 0), 4);
                for (let i = 0; i < primaryRevealCount; i++) {
                    base[i].revealed = true;
                    base[i].y = toyFunction1D(base[i].x);
                }

                let boSamples: SamplePoint[] = [];
                if (currentStep >= 7) {
                    const numBO = Math.min(currentStep - 6, 4); // allow up to 4 BO additions
                    const working: SamplePoint[] = base.filter(p => p.revealed).map(p => ({ ...p }));
                    const addBOSample = () => {
                        // Fit GP to current working set
                        if (working.length < 2) return null;
                        const gp = new GaussianProcessRegression({ lengthScale: 0.25, noise: 1e-3, signalVariance: 1 });
                        const X = working.map(p => [p.x]);
                        const yv = working.map(p => p.y!);
                        gp.fit(X, yv);
                        // Dense grid for EI
                        const grid: number[] = Array.from({ length: 501 }, (_, i) => i / 500); // finer grid
                        // Compute mean/variance
                        const pred = gp.predict(grid.map(g => [g]));
                        const best = Math.max(...yv);
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
                        let bestIdx = 0; let bestEI = -Infinity;
                        for (let i = 0; i < grid.length; i++) {
                            const mu = pred.mean[i];
                            const sigma = pred.variance[i];
                                const s = Math.sqrt(Math.max(sigma, 0));
                                let ei = 0;
                                if (s > 1e-9) {
                                    const z = (mu - best - xi) / s;
                                    ei = (mu - best - xi) * Phi(z) + s * phi(z);
                                }
                            // Penalize proximity to existing samples to avoid duplicates / extremely close points
                            const minDist = working.reduce((m, p) => Math.min(m, Math.abs(p.x - grid[i])), Infinity);
                            const penalty = minDist < 0.01 ? 0.0 : 1.0; // drop EI if too close
                            const adjusted = ei * penalty;
                            if (adjusted > bestEI) { bestEI = adjusted; bestIdx = i; }
                        }
                        const xNew = grid[bestIdx];
                        const yNew = toyFunction1D(xNew);
                        const sample: SamplePoint = { x: xNew, y: yNew, revealed: true };
                        working.push(sample);
                        return sample;
                    };
                            for (let k = 0; k < numBO; k++) {
                                const s = addBOSample();
                                if (s) boSamples.push(s);
                            }
                }
                const revealed = [...base.filter(p => p.revealed), ...boSamples];
                        return { samples: base, extraSamples: boSamples, revealedPoints: revealed };
            }, [currentStep]);
        // Use all currently revealed points, sorted by x for interpolation stability
    const sortedPoints = useMemo(() => revealedPoints.slice().sort((a,b)=>a.x-b.x), [revealedPoints]);

        // Interpolation visibility toggle (auto logic + user override)
            const [showInterpolation, setShowInterpolation] = useState(false);
            const [showGPRMean, setShowGPRMean] = useState(true);
            const [showGPRVar, setShowGPRVar] = useState(true);
                const [showEI, setShowEI] = useState(false); // not auto-activated, enabled only once GPR exists
        const userToggledRef = useRef(false);

        // Auto-manage default visibility based on step progression while allowing manual override
        useEffect(() => {
            if (currentStep < 5) {
                // Before interpolation step, always hidden and reset user toggle flag
                setShowInterpolation(false);
                userToggledRef.current = false;
                return;
            }
            if (currentStep === 5) {
                // At interpolation introduction, enable unless user previously toggled
                if (!userToggledRef.current) setShowInterpolation(true);
                return;
            }
            if (currentStep === 6) {
                // When GPR appears, auto-hide unless user explicitly re-enabled earlier this step
                if (!userToggledRef.current) setShowInterpolation(false);
                return;
            }
            // For steps > 6 do nothing automatic; user control persists
        }, [currentStep]);

        const handleInterpolationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
            userToggledRef.current = true;
            setShowInterpolation(e.target.checked);
        };

        // Reset current step UI to defaults (revert user overrides)
        const resetStep = useCallback(() => {
            userToggledRef.current = false;
            // Interpolation defaults by step
            if (currentStep < 5) setShowInterpolation(false);
            else if (currentStep === 5) setShowInterpolation(true);
            else setShowInterpolation(false);
            // GPR visibility defaults
            setShowGPRMean(currentStep >= 6);
            setShowGPRVar(currentStep >= 6);
            // EI default is off
            setShowEI(false);
        }, [currentStep]);

    const interpCurve = useMemo(() => {
            // Compute xs/ys here so this memo depends only on sortedPoints (stable),
            // avoiding re-creation every render that would restart the tween.
            if (!showInterpolation || currentStep < 5 || sortedPoints.length < 2) return null;
            const xs = sortedPoints.map(p => p.x);
            const ys = sortedPoints.map(p => p.y as number);
            const grid: number[] = Array.from({ length: 101 }, (_, i) => i / 100);
            const yVals = linearInterpolation1D(xs, ys, grid);
            return { grid, yVals };
        }, [showInterpolation, currentStep, sortedPoints]);

        // True GPR prediction
            const gprCurve = useMemo(() => {
            if (currentStep < 6 || revealedPoints.length < 2) return null;
            const gp = new GaussianProcessRegression({ lengthScale: 0.25, noise: 1e-3, signalVariance: 1 });
            const X = revealedPoints.map(p => [p.x]);
            const yv = revealedPoints.map(p => p.y!);
            gp.fit(X, yv);
            const grid: number[] = Array.from({ length: 101 }, (_, i) => i / 100);
            const pred = gp.predict(grid.map(g => [g]));
            return { grid, yMean: pred.mean, variance: pred.variance.map(v => Math.sqrt(v)) };
        }, [currentStep, revealedPoints]);

        // Cache last geometry so we can animate out when hidden
    const lastInterpRef = useRef<{ grid: number[]; yVals: number[] } | null>(null);
    const lastGprRef = useRef<{ grid: number[]; yMean: number[]; variance: number[] } | null>(null);
    const lastEiRef = useRef<{ grid: number[]; scaled: number[]; raw: number[] } | null>(null);

        // Presence + animated visibility for each overlay
        const interpVisible = !!(showInterpolation && currentStep >= 5);
        const gprMeanVisible = !!(showGPRMean && currentStep >= 6);
        const gprVarVisible = !!(showGPRVar && currentStep >= 6);
        const eiVisible = !!(showEI && currentStep >= 6);

        const [interpMounted, setInterpMounted] = useState(false);
        const [gprMeanMounted, setGprMeanMounted] = useState(false);
        const [gprVarMounted, setGprVarMounted] = useState(false);
        const [eiMounted, setEiMounted] = useState(false);
        const [interpIn, setInterpIn] = useState(false);
        const [gprMeanIn, setGprMeanIn] = useState(false);
        const [gprVarIn, setGprVarIn] = useState(false);
        const [eiIn, setEiIn] = useState(false);

        useEffect(() => {
            if (interpVisible) {
                setInterpMounted(true);
                setInterpIn(false);
                const id = requestAnimationFrame(() => setInterpIn(true));
                return () => cancelAnimationFrame(id);
            } else {
                setInterpIn(false);
                const t = setTimeout(() => setInterpMounted(false), TRANS_MS);
                return () => clearTimeout(t);
            }
        }, [interpVisible]);
        useEffect(() => {
            if (gprMeanVisible) {
                setGprMeanMounted(true);
                setGprMeanIn(false);
                const id = requestAnimationFrame(() => setGprMeanIn(true));
                return () => cancelAnimationFrame(id);
            } else {
                setGprMeanIn(false);
                const t = setTimeout(() => setGprMeanMounted(false), TRANS_MS);
                return () => clearTimeout(t);
            }
        }, [gprMeanVisible]);
        useEffect(() => {
            if (gprVarVisible) {
                setGprVarMounted(true);
                setGprVarIn(false);
                const id = requestAnimationFrame(() => setGprVarIn(true));
                return () => cancelAnimationFrame(id);
            } else {
                setGprVarIn(false);
                const t = setTimeout(() => setGprVarMounted(false), TRANS_MS);
                return () => clearTimeout(t);
            }
        }, [gprVarVisible]);
        useEffect(() => {
            if (eiVisible) {
                setEiMounted(true);
                setEiIn(false);
                const id = requestAnimationFrame(() => setEiIn(true));
                return () => cancelAnimationFrame(id);
            } else {
                setEiIn(false);
                const t = setTimeout(() => setEiMounted(false), TRANS_MS);
                return () => clearTimeout(t);
            }
        }, [eiVisible]);

        const curveAnimStyle = (vis: boolean) => ({
            opacity: vis ? 1 : 0,
            transform: `scaleY(${vis ? 1 : 0})`,
            transition: `opacity ${TRANS_MS}ms ease, transform ${TRANS_MS}ms ease`,
            transformOrigin: '0px 50px', // x-axis at y=50
            transformBox: 'view-box' as any,
        });

        // Tweened display states for smooth morphs
        const [interpDisplay, setInterpDisplay] = useState<{ grid: number[]; yVals: number[] } | null>(null);
        const [gprDisplay, setGprDisplay] = useState<{ grid: number[]; yMean: number[]; variance: number[] } | null>(null);
        const [eiDisplay, setEiDisplay] = useState<{ grid: number[]; scaled: number[] } | null>(null);

        // Animate interpolation curve to new values
        useEffect(() => {
            if (!interpCurve) return;
            const last = lastInterpRef.current;
            const startVals = last?.yVals ?? Array(interpCurve.grid.length).fill(-1);
            const endVals = interpCurve.yVals;
            let raf = 0; let t0: number | null = null;
            const step = (t: number) => {
                if (t0 === null) t0 = t;
                const p = Math.min(1, (t - t0) / TRANS_MS);
                const e = p * (2 - p);
                const yVals = endVals.map((v, i) => startVals[i] + (v - startVals[i]) * e);
                setInterpDisplay({ grid: interpCurve.grid, yVals });
                if (p < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
            return () => cancelAnimationFrame(raf);
        }, [interpCurve]);

        // Animate GPR mean and sigma
        useEffect(() => {
            if (!gprCurve) return;
            const last = lastGprRef.current;
            const n = gprCurve.grid.length;
            const startMean = last?.yMean ?? Array(n).fill(-1);
            const startVar = last?.variance ?? Array(n).fill(0);
            const endMean = gprCurve.yMean;
            const endVar = gprCurve.variance;
            let raf = 0; let t0: number | null = null;
            const step = (t: number) => {
                if (t0 === null) t0 = t;
                const p = Math.min(1, (t - t0) / TRANS_MS);
                const e = p * (2 - p);
                const yMean = endMean.map((v, i) => startMean[i] + (v - startMean[i]) * e);
                const variance = endVar.map((v, i) => startVar[i] + (v - startVar[i]) * e);
                setGprDisplay({ grid: gprCurve.grid, yMean, variance });
                if (p < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
            return () => cancelAnimationFrame(raf);
        }, [gprCurve]);

    // Update last known interpolation AFTER tween so it serves as start of next morph
    useEffect(() => { if (interpCurve) lastInterpRef.current = interpCurve; }, [interpCurve]);

    // Update last known GPR AFTER tween so it serves as start of next morph
    useEffect(() => { if (gprCurve) lastGprRef.current = gprCurve; }, [gprCurve]);

                // Expected Improvement (EI) calculation (maximization). Scaled to [-1, 0] for display; toggle controlled.
                        const eiCurve = useMemo(() => {
                            if (currentStep < 6 || revealedPoints.length < 2) return null;
                            const gp = new GaussianProcessRegression({ lengthScale: 0.25, noise: 1e-3, signalVariance: 1 });
                            gp.fit(revealedPoints.map(p => [p.x]), revealedPoints.map(p => p.y!));
                            const grid: number[] = Array.from({ length: 251 }, (_, i) => i / 250);
                            const pred = gp.predict(grid.map(g => [g]));
                            const best = Math.max(...revealedPoints.map(p => p.y!));
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
                            const raw: number[] = pred.mean.map((mu, i) => {
                                const s = Math.sqrt(Math.max(pred.variance[i], 0));
                                if (s < 1e-9) return 0;
                                const z = (mu - best - xi) / s;
                                return (mu - best - xi) * Phi(z) + s * phi(z);
                            });
                            const maxEI = Math.max(...raw);
                            const scaled = raw.map(v => maxEI > 0 ? (v / maxEI) - 1 : -1);
                            return { grid, scaled, raw };
                        }, [currentStep, revealedPoints]);
    useEffect(() => { if (eiCurve) lastEiRef.current = eiCurve; }, [eiCurve]);

        // Animate EI curve
        useEffect(() => {
            if (!eiCurve) return;
            const last = lastEiRef.current;
            const start = last?.scaled ?? Array(eiCurve.grid.length).fill(-1);
            const end = eiCurve.scaled;
            let raf = 0; let t0: number | null = null;
            const step = (t: number) => {
                if (t0 === null) t0 = t;
                const p = Math.min(1, (t - t0) / TRANS_MS);
                const e = p * (2 - p);
                const scaled = end.map((v, i) => start[i] + (v - start[i]) * e);
                setEiDisplay({ grid: eiCurve.grid, scaled });
                if (p < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
            return () => cancelAnimationFrame(raf);
        }, [eiCurve]);

            // Color scaling: darkest (black) at min, vivid red at max, gradient in between
            const colorForY = (y?: number) => {
                if (y === undefined || revealedPoints.length === 0) return '#000';
                const ysAll = revealedPoints.map(p => p.y as number);
                const minY = Math.min(...ysAll);
                const maxY = Math.max(...ysAll);
                if (maxY - minY < 1e-9) return '#aa0000';
                const t = (y - minY) / (maxY - minY);
                // interpolate from black to bright red (avoid dark mid-tones muddy look)
                const r = Math.round(40 + t * 215); // 40..255
                const g = Math.round(0 + t * 30);   // 0..30 slight warmth
                const b = Math.round(0 + t * 25);   // 0..25 subtle depth
                return `rgb(${r},${g},${b})`;
            };

        const handleAdvance = useCallback(() => {
            nextStep();
        }, [nextStep]);

        const handleScrub = useCallback((s: number) => setCurrentStep(s), [setCurrentStep]);

        return (
            <div className="one-d-scene" style={{ cursor: 'default' }}>
                    <h2>1D Bayesian Optimization (Prototype Sequence)</h2>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Click canvas or use timeline. Step {currentStep}/{totalSteps - 1}</p>
                                            <div style={{ width: '100%', margin: '0 0 0.5rem 0' }}>
                                        <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} style={{ width: '100%' }}>
                                                        <TimelineScrubber
                                                            currentStep={currentStep}
                                                            totalSteps={totalSteps}
                                                            onStepChange={handleScrub}
                                                            labels={[
                                                                'experimental design', // 0 introduction (axes + hidden samples)
                                                                'Initial Sample 1',    // 1 reveal 1
                                                                'Initial Sample 2',    // 2 reveal 2
                                                                'Initial Sample 3',    // 3 reveal 3
                                                                'Initial Sample 4',    // 4 reveal 4 complete
                                                                'linear interpolation',// 5 show interpolation
                                                                'GPR',                 // 6 show GPR
                                                                'BO 1',                // 7 add BO sample 1
                                                                'BO 2',                // 8 add BO sample 2
                                                                'BO 3',                // 9 add BO sample 3
                                                                'BO 4'                 // 10 add BO sample 4 (previously BO5 removed to align with totalSteps=11)
                                                            ]}
                                                        />
                                        </div>
                    <label
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', marginLeft: '0.25rem', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={showInterpolation}
                            onChange={e => { e.stopPropagation(); handleInterpolationToggle(e); }}
                            disabled={currentStep < 5}
                        />
                                    Linear interpolation
                                </label>
                                                <label
                                                    onClick={e => e.stopPropagation()}
                                                    onMouseDown={e => e.stopPropagation()}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', marginLeft: '0.75rem', userSelect: 'none' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={showGPRMean}
                                                        onChange={e => { e.stopPropagation(); setShowGPRMean(e.target.checked); }}
                                                        disabled={currentStep < 6}
                                                    />
                                                    GPR mean
                                                </label>
                                                <label
                                                    onClick={e => e.stopPropagation()}
                                                    onMouseDown={e => e.stopPropagation()}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', marginLeft: '0.75rem', userSelect: 'none' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={showGPRVar}
                                                        onChange={e => { e.stopPropagation(); setShowGPRVar(e.target.checked); }}
                                                        disabled={currentStep < 6}
                                                    />
                                                    GPR ±σ
                                                </label>
                                                <button
                                                    onClick={e => { e.stopPropagation(); resetStep(); }}
                                                    onMouseDown={e => e.stopPropagation()}
                                                    style={{ marginLeft: '0.75rem', fontSize: '0.72rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}
                                                    title="Revert user changes and restore defaults for this step"
                                                >
                                                    Reset step
                                                </button>
                                                        <label
                                                            onClick={e => e.stopPropagation()}
                                                            onMouseDown={e => e.stopPropagation()}
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', marginLeft: '0.75rem', userSelect: 'none' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={showEI}
                                                                onChange={e => { e.stopPropagation(); setShowEI(e.target.checked); }}
                                                                disabled={currentStep < 6}
                                                            />
                                                            Expected Improvement
                                                        </label>
                            </div>
                        <svg
                    viewBox="0 0 100 60"
                    width="800"
                    height="480"
                    style={{ background: '#fafafa', border: '1px solid #ccc', cursor: 'pointer' }}
                    onClick={handleAdvance}
                >
                {/* Axes */}
                        <line x1={5} y1={50} x2={95} y2={50} stroke="#0b61ff" strokeWidth={0.9} />
                        <line x1={5} y1={50} x2={5} y2={10} stroke="#ff2d2d" strokeWidth={0.9} />
                        {/* Axis labels */}
                        <text x={50} y={57} textAnchor="middle" fill="#0b61ff" fontSize={3}>Design variable 1</text>
                        <text x={2} y={30} fill="#ff2d2d" fontSize={3} transform="rotate(-90 2 30)" textAnchor="middle">performance measurement</text>
                {/* Samples (initial) */}
                        {samples.map((s, i) => {
                    const xPos = 5 + s.x * 90;
                    const yPos = s.revealed && s.y !== undefined ? 50 - (s.y + 1) * 20 : 50; // normalize y ~[-1,1]
                            const fill = s.revealed && s.y !== undefined ? colorForY(s.y) : '#000';
                            return (
                                <g key={i} transform={`translate(${xPos},${yPos})`} style={{ transition: `transform ${TRANS_MS}ms ease` }}>
                                    <circle cx={0} cy={0} r={1.5} fill={fill} stroke="#111" strokeWidth={0.4} />
                                </g>
                            );
                })}
                {/* Extra BO samples */}
                {extraSamples.map((s, i) => {
                    const xPos = 5 + s.x * 90;
                    const yPos = s.y !== undefined ? 50 - (s.y + 1) * 20 : 50;
                            return (
                                <g key={`e-${i}`} transform={`translate(${xPos},${yPos})`} style={{ transition: `transform ${TRANS_MS}ms ease` }}>
                                    <circle cx={0} cy={0} r={1.4} fill={colorForY(s.y)} stroke="#300" strokeWidth={0.35} />
                                </g>
                            );
                })}
                {/* Linear interpolation */}
            {interpMounted && (
                (() => {
                    // Prefer last known curve while tween initializes to prevent an instant jump to end state
                    const src = interpDisplay ?? lastInterpRef.current ?? (interpVisible ? interpCurve : null);
                    if (!src) return null;
                    return (
                        <polyline
                            points={src.grid.map((g, idx) => `${5 + g * 90},${50 - (src.yVals[idx] + 1) * 20}`).join(' ')}
                            fill="none"
                            stroke="#555"
                            strokeDasharray="3 2"
                            strokeWidth={0.7}
                            style={curveAnimStyle(interpIn)}
                        />
                    );
                })()
            )}
                {/* GPR mean */}
            {gprMeanMounted && (
                (() => {
                    const src = gprDisplay ?? (gprMeanVisible ? gprCurve : lastGprRef.current);
                    if (!src) return null;
                    return (
                        <polyline
                            points={src.grid.map((g, idx) => `${5 + g * 90},${50 - (src.yMean[idx] + 1) * 20}`).join(' ')}
                            fill="none"
                            stroke="#c00000"
                            strokeWidth={0.9}
                            style={curveAnimStyle(gprMeanIn)}
                        />
                    );
                })()
            )}
                {/* Variance band */}
            {gprVarMounted && (
                (() => {
                    const src = gprDisplay ?? (gprVarVisible ? gprCurve : lastGprRef.current);
                    if (!src) return null;
                    return (
                        <polygon
                            points={[
                                ...src.grid.map((g, idx) => `${5 + g * 90},${50 - (src.yMean[idx] + src.variance[idx] + 1) * 20}`),
                                ...src.grid
                                    .slice()
                                    .reverse()
                                    .map((g, ri) => {
                                        const idx = src.grid.length - 1 - ri;
                                        return `${5 + g * 90},${50 - (src.yMean[idx] - src.variance[idx] + 1) * 20}`;
                                    }),
                            ].join(' ')}
                            fill="rgba(220,0,0,0.08)"
                            stroke="none"
                            style={curveAnimStyle(gprVarIn)}
                        />
                    );
                })()
            )}
                    {/* Expected Improvement (scaled) */}
                    {eiMounted && (
                        (() => {
                            const src = eiDisplay ?? (eiVisible ? eiCurve : lastEiRef.current);
                            if (!src) return null;
                            return (
                                <polyline
                                    points={src.grid.map((g, idx) => `${5 + g * 90},${50 - (src.scaled[idx] + 1) * 20}`).join(' ')}
                                    fill="none"
                                    stroke="#ff9500"
                                    strokeWidth={0.8}
                                    strokeDasharray="2 2"
                                    style={curveAnimStyle(eiIn)}
                                />
                            );
                        })()
                    )}
            </svg>
            {/* Removed descriptive list now that labels are on the timeline */}
        </div>
    );
};

export default OneDScene;