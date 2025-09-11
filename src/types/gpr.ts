export interface GaussianProcess {
    mean: number[];
    covariance: number[][];
    kernel: (x1: number[], x2: number[]) => number;
}

export interface GPRModel {
    trainingPoints: number[][];
    trainingValues: number[];
    gpr: GaussianProcess;
}

export interface PredictionResult {
    mean: number;
    variance: number;
    confidenceInterval: [number, number];
}

export interface Hyperparameters {
    lengthScale: number;
    variance: number;
    noiseVariance: number;
}