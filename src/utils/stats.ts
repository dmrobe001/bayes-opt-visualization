export function mean(data: number[]): number {
    const total = data.reduce((acc, val) => acc + val, 0);
    return total / data.length;
}

export function variance(data: number[]): number {
    const meanValue = mean(data);
    const squaredDiffs = data.map(val => Math.pow(val - meanValue, 2));
    return mean(squaredDiffs);
}

export function standardDeviation(data: number[]): number {
    return Math.sqrt(variance(data));
}

export function minMax(data: number[]): { min: number; max: number } {
    const min = Math.min(...data);
    const max = Math.max(...data);
    return { min, max };
}

export function zScore(data: number[], value: number): number {
    const meanValue = mean(data);
    const stdDev = standardDeviation(data);
    return (value - meanValue) / stdDev;
}