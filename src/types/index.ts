export type SamplePoint = {
    x: number;
    y: number;
    z?: number; // Optional for 1D and 2D cases
    color: string;
};

export type GPRModel = {
    mean: (x: number) => number;
    variance: (x: number) => number;
    covariance: (x1: number, x2: number) => number;
};

export type OptimizationStep = {
    samplePoints: SamplePoint[];
    gprModel: GPRModel;
    expectedImprovement: number;
};

export type PresentationState = {
    currentStep: number;
    totalSteps: number;
    samplingMethod: string;
    isPlaying: boolean;
};

export type ControlPanelState = {
    numberOfSamples: number;
    selectedSamplingMethod: string;
    markCoordinates: boolean;
};