// This file implements acquisition functions for Bayesian optimization.

export type AcquisitionFunction = (x: number[], model: any) => number;

export const expectedImprovement: AcquisitionFunction = (x, model) => {
    const { mean, variance } = model.predict(x);
    const bestValue = Math.max(...model.observations);
    const improvement = mean - bestValue;
    const z = improvement / Math.sqrt(variance);
    const ei = improvement * normCDF(z) + Math.sqrt(variance) * normPDF(z);
    return ei;
};

export const probabilityOfImprovement: AcquisitionFunction = (x, model) => {
    const { mean, variance } = model.predict(x);
    const bestValue = Math.max(...model.observations);
    const z = (mean - bestValue) / Math.sqrt(variance);
    return normCDF(z);
};

const normCDF = (z: number): number => {
    return 0.5 * (1 + Math.erf(z / Math.sqrt(2)));
};

const normPDF = (z: number): number => {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
};