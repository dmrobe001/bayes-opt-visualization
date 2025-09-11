export type KernelFunction = (x: number[], y: number[]) => number;

export function squaredExponentialKernel(lengthScale: number): KernelFunction {
    return (x: number[], y: number[]) => {
        const distanceSquared = x.reduce((sum, xi, i) => sum + Math.pow(xi - y[i], 2), 0);
        return Math.exp(-distanceSquared / (2 * Math.pow(lengthScale, 2)));
    };
}

export function rationalQuadraticKernel(lengthScale: number, alpha: number): KernelFunction {
    return (x: number[], y: number[]) => {
        const distanceSquared = x.reduce((sum, xi, i) => sum + Math.pow(xi - y[i], 2), 0);
        return (1 + distanceSquared / (2 * alpha * Math.pow(lengthScale, 2))) ** -alpha;
    };
}

export function periodicKernel(lengthScale: number, period: number): KernelFunction {
    return (x: number[], y: number[]) => {
        const distance = x.reduce((sum, xi, i) => sum + Math.pow(xi - y[i], 2), 0);
        return Math.exp(-2 * Math.pow(Math.sin(Math.PI * Math.sqrt(distance) / period), 2) / Math.pow(lengthScale, 2));
    };
}