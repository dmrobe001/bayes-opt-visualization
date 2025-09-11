import { useState, useEffect } from 'react';

const usePresentation = (totalSteps: number) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    const nextStep = () => {
        setCurrentStep((prevStep) => Math.min(prevStep + 1, totalSteps - 1));
    };

    const previousStep = () => {
        setCurrentStep((prevStep) => Math.max(prevStep - 1, 0));
    };

    const play = () => {
        if (!isPlaying) {
            setIsPlaying(true);
            const id = setInterval(nextStep, 1000); // Adjust the interval as needed
            setIntervalId(id);
        }
    };

    const pause = () => {
        if (isPlaying && intervalId) {
            clearInterval(intervalId);
            setIsPlaying(false);
            setIntervalId(null);
        }
    };

    const reset = () => {
        pause();
        setCurrentStep(0);
    };

    useEffect(() => {
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [intervalId]);

    return {
        currentStep,
        isPlaying,
        nextStep,
        previousStep,
        play,
        pause,
        reset,
        setCurrentStep, // expose for timeline scrubbing
    };
};

export default usePresentation;