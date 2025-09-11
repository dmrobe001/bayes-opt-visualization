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
        const xs = sortedPoints.map(p => p.x);
        const ys = sortedPoints.map(p => p.y as number);

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

        const interpCurve = useMemo(() => {
            if (!showInterpolation || currentStep < 5 || sortedPoints.length < 2) return null;
        const grid: number[] = Array.from({ length: 101 }, (_, i) => i / 100);
        const yVals = linearInterpolation1D(xs, ys, grid);
        return { grid, yVals };
        }, [showInterpolation, currentStep, xs, ys, sortedPoints.length]);

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
                                                    GPR variance
                                                </label>
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
                            return <circle key={i} cx={xPos} cy={yPos} r={1.5} fill={fill} stroke="#111" strokeWidth={0.4} />;
                })}
                {/* Extra BO samples */}
                {extraSamples.map((s, i) => {
                    const xPos = 5 + s.x * 90;
                    const yPos = s.y !== undefined ? 50 - (s.y + 1) * 20 : 50;
                            return <circle key={`e-${i}`} cx={xPos} cy={yPos} r={1.4} fill={colorForY(s.y)} stroke="#300" strokeWidth={0.35} />;
                })}
                {/* Linear interpolation */}
            {interpCurve && showInterpolation && (
                    <polyline
                        points={interpCurve.grid.map((g, idx) => `${5 + g * 90},${50 - (interpCurve.yVals[idx] + 1) * 20}`).join(' ')}
                        fill="none"
                stroke="#555"
                strokeDasharray="3 2"
                strokeWidth={0.7}
                    />
                )}
                {/* GPR mean */}
            {gprCurve && showGPRMean && (
                    <polyline
                        points={gprCurve.grid.map((g, idx) => `${5 + g * 90},${50 - (gprCurve.yMean[idx] + 1) * 20}`).join(' ')}
                        fill="none"
                stroke="#c00000"
                strokeWidth={0.9}
                    />
                )}
                {/* Variance band */}
            {gprCurve && showGPRVar && (
                    <polygon
                        points={[
                            ...gprCurve.grid.map((g, idx) => `${5 + g * 90},${50 - (gprCurve.yMean[idx] + gprCurve.variance[idx] + 1) * 20}`),
                            ...gprCurve.grid
                                .slice()
                                .reverse()
                                .map((g, ri) => {
                                    const idx = gprCurve.grid.length - 1 - ri;
                                    return `${5 + g * 90},${50 - (gprCurve.yMean[idx] - gprCurve.variance[idx] + 1) * 20}`;
                                }),
                        ].join(' ')}
                fill="rgba(220,0,0,0.08)"
                        stroke="none"
                    />
                )}
                    {/* Expected Improvement (scaled) */}
                    {eiCurve && showEI && (
                        <polyline
                            points={eiCurve.grid.map((g, idx) => `${5 + g * 90},${50 - (eiCurve.scaled[idx] + 1) * 20}`).join(' ')}
                            fill="none"
                            stroke="#ff9500"
                            strokeWidth={0.8}
                            strokeDasharray="2 2"
                        />
                    )}
            </svg>
            {/* Removed descriptive list now that labels are on the timeline */}
        </div>
    );
};

export default OneDScene;