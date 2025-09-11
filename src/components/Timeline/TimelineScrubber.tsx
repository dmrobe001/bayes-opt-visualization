import React from 'react';

interface TimelineScrubberProps {
    currentStep: number;
    totalSteps: number;
    onStepChange: (step: number) => void;
}

const TimelineScrubber: React.FC<TimelineScrubberProps> = ({ currentStep, totalSteps, onStepChange }) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const step = Number(event.target.value);
        onStepChange(step);
    };

    return (
        <div className="timeline-scrubber">
            <input
                type="range"
                min={0}
                max={totalSteps - 1}
                value={currentStep}
                onChange={handleChange}
                className="timeline-slider"
            />
            <div className="timeline-indicator">
                Step {currentStep + 1} of {totalSteps}
            </div>
        </div>
    );
};

export default TimelineScrubber;