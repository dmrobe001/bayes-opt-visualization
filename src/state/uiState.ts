import { useState } from 'react';

export interface UIState {
    currentStep: number;
    samplingMethod: string;
    sampleCount: number;
    markCoordinates: boolean;
}

const useUIState = () => {
    const [uiState, setUIState] = useState<UIState>({
        currentStep: 0,
        samplingMethod: 'grid', // default sampling method
        sampleCount: 30, // default sample count
        markCoordinates: false,
    });

    const updateCurrentStep = (step: number) => {
        setUIState((prevState) => ({ ...prevState, currentStep: step }));
    };

    const updateSamplingMethod = (method: string) => {
        setUIState((prevState) => ({ ...prevState, samplingMethod: method }));
    };

    const updateSampleCount = (count: number) => {
        setUIState((prevState) => ({ ...prevState, sampleCount: count }));
    };

    const toggleMarkCoordinates = () => {
        setUIState((prevState) => ({ ...prevState, markCoordinates: !prevState.markCoordinates }));
    };

    return {
        uiState,
        updateCurrentStep,
        updateSamplingMethod,
        updateSampleCount,
        toggleMarkCoordinates,
    };
};

export default useUIState;