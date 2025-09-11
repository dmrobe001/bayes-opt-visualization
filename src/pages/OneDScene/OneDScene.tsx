import React, { useState, useMemo, useCallback } from 'react';
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
const EXTRA_X = [0.15, 0.45, 0.8, 0.58]; // placeholder EI sequence

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
            let extras: SamplePoint[] = [];
            if (currentStep >= 7) {
                const count = Math.min(currentStep - 6, EXTRA_X.length);
                extras = EXTRA_X.slice(0, count).map(x => ({ x, revealed: true, y: toyFunction1D(x) }));
            }
            const revealed = [...base, ...extras].filter(p => p.revealed && p.y !== undefined);
            return { samples: base, extraSamples: extras, revealedPoints: revealed };
        }, [currentStep]);
    const xs = revealedPoints.map(p => p.x);
    const ys = revealedPoints.map(p => p.y as number);

    const interpCurve = useMemo(() => {
        if (currentStep < 5 || revealedPoints.length < 2) return null;
        const grid: number[] = Array.from({ length: 101 }, (_, i) => i / 100);
        const yVals = linearInterpolation1D(xs, ys, grid);
        return { grid, yVals };
    }, [currentStep, xs, ys, revealedPoints.length]);

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

        const handleAdvance = useCallback(() => {
            nextStep();
        }, [nextStep]);

        const handleScrub = useCallback((s: number) => setCurrentStep(s), [setCurrentStep]);

    return (
        <div className="one-d-scene" onClick={handleAdvance} style={{ cursor: 'pointer' }}>
                    <h2>1D Bayesian Optimization (Prototype Sequence)</h2>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>Click canvas or use timeline. Step {currentStep}/{totalSteps - 1}</p>
                    <div style={{ maxWidth: 820, marginBottom: '0.5rem' }}>
                        <TimelineScrubber currentStep={currentStep} totalSteps={totalSteps} onStepChange={handleScrub} />
                    </div>
            <svg viewBox="0 0 100 60" width="800" height="480" style={{ background: '#fafafa', border: '1px solid #ccc' }}>
                {/* Axes */}
                <line x1={5} y1={50} x2={95} y2={50} stroke="#0b61ff" strokeWidth={1.5} />
                <line x1={5} y1={50} x2={5} y2={10} stroke="#ff2d2d" strokeWidth={1.5} />
                {/* Samples (initial) */}
                {samples.map((s, i) => {
                    const xPos = 5 + s.x * 90;
                    const yPos = s.revealed && s.y !== undefined ? 50 - (s.y + 1) * 20 : 50; // normalize y ~[-1,1]
                    const fill = s.revealed && s.y !== undefined ? `rgba(200,0,0,${0.3 + 0.7 * (0.5 + s.y / 2)})` : '#000';
                    return <circle key={i} cx={xPos} cy={yPos} r={2.2} fill={fill} stroke="#222" />;
                })}
                {/* Extra BO samples */}
                {extraSamples.map((s, i) => {
                    const xPos = 5 + s.x * 90;
                    const yPos = s.y !== undefined ? 50 - (s.y + 1) * 20 : 50;
                    return <circle key={`e-${i}`} cx={xPos} cy={yPos} r={2} fill="#aa0000" stroke="#400" />;
                })}
                {/* Linear interpolation */}
                {interpCurve && (
                    <polyline
                        points={interpCurve.grid.map((g, idx) => `${5 + g * 90},${50 - (interpCurve.yVals[idx] + 1) * 20}`).join(' ')}
                        fill="none"
                        stroke="#333"
                        strokeDasharray="4 2"
                        strokeWidth={1}
                    />
                )}
                {/* GPR mean */}
                {gprCurve && (
                    <polyline
                        points={gprCurve.grid.map((g, idx) => `${5 + g * 90},${50 - (gprCurve.yMean[idx] + 1) * 20}`).join(' ')}
                        fill="none"
                        stroke="#d40000"
                        strokeWidth={1.4}
                    />
                )}
                {/* Variance band */}
                {gprCurve && (
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
                        fill="rgba(255,0,0,0.12)"
                        stroke="none"
                    />
                )}
            </svg>
            <ul style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                <li>Steps 1-4: reveal samples</li>
                <li>Step 5: linear interpolation</li>
                <li>Step 6: pseudo GPR mean + variance band</li>
                <li>Steps 7-10: add BO samples (placeholder EI)</li>
            </ul>
        </div>
    );
};

export default OneDScene;