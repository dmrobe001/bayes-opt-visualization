import React from 'react';

interface TimelineScrubberProps {
    currentStep: number;
    totalSteps: number;
    onStepChange: (step: number) => void;
    labels?: string[];
}

const TimelineScrubber: React.FC<TimelineScrubberProps> = ({ currentStep, totalSteps, onStepChange, labels }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onStepChange(Number(e.target.value));
    };

    const effectiveLabels = labels && labels.length === totalSteps ? labels : undefined;
    const SLIDER_WIDTH_PCT = 78; // percent of container width
    const offsetPct = (100 - SLIDER_WIDTH_PCT) / 2;

    return (
        <div className="timeline-scrubber" style={{ width: '100%' }}>
            <div style={{ position: 'relative', width: '100%', paddingBottom: effectiveLabels ? 34 : 0 }}>
                <div style={{ width: `${SLIDER_WIDTH_PCT}%`, margin: '0 auto', position: 'relative' }}>
                    <input
                        type="range"
                        min={0}
                        max={totalSteps - 1}
                        value={currentStep}
                        onChange={handleChange}
                        className="timeline-slider"
                        style={{ width: '100%', zIndex: 2, position: 'relative' }}
                    />
                </div>
                {effectiveLabels && (
                    <div style={{ position: 'absolute', left: 0, top: 20, width: '100%', height: 26, pointerEvents: 'none' }}>
                        {effectiveLabels.map((lab, i) => {
                            const pctWithin = (i / (totalSteps - 1)) * SLIDER_WIDTH_PCT;
                            const absoluteLeft = offsetPct + pctWithin;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        position: 'absolute',
                                        left: `${absoluteLeft}%`,
                                        top: 0,
                                        transform: 'translateX(-50%)',
                                        fontSize: '0.55rem',
                                        fontFamily: 'sans-serif',
                                        lineHeight: 1.05,
                                        maxWidth: 80,
                                        textAlign: 'center',
                                        whiteSpace: 'normal',
                                        color: i === currentStep ? '#d40000' : '#333',
                                        fontWeight: i === currentStep ? 600 : 400,
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    {lab}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="timeline-indicator" style={{ fontSize: '0.62rem', marginTop: 2 }}>
                Step {currentStep + 1} / {totalSteps}
            </div>
        </div>
    );
};

export default TimelineScrubber;