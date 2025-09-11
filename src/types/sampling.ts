export type SamplingMethod = 'factorial' | 'random' | 'minimax' | 'latinHypercube';

export interface SamplePoint {
    x: number;
    y: number;
    z?: number; // Optional for 2D sampling
}

export interface SamplingResult {
    samples: SamplePoint[];
    method: SamplingMethod;
}

export interface MinimaxOptions {
    numPoints: number;
    dimensions: number;
}

export interface RandomSamplingOptions {
    numPoints: number;
    bounds: [number, number][];
}

export interface FactorialOptions {
    levels: number[];
}

export interface LatinHypercubeOptions {
    numPoints: number;
    dimensions: number;
}