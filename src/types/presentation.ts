export interface PresentationStep {
    id: number;
    description: string;
    action: () => void;
}

export interface PresentationState {
    currentStep: number;
    steps: PresentationStep[];
    isPlaying: boolean;
    playbackSpeed: number;
}

export interface ControlPanelOptions {
    samplingMethod: 'factorial' | 'random' | 'minimax' | 'latinHypercube';
    numberOfSamples: number;
    markCoordinates: boolean;
}

export interface VisualizationSettings {
    showGPRMean: boolean;
    showGPRVariance: boolean;
    showExpectedImprovement: boolean;
    interpolationMethod: 'linear' | 'gpr';
}