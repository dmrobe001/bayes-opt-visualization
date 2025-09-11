export function factorialSampling(dimensions: number, levels: number): number[][] {
    const samples: number[][] = [];
    const step = 1 / (levels - 1);

    for (let i = 0; i < levels; i++) {
        const sample: number[] = [];
        for (let j = 0; j < dimensions; j++) {
            sample.push(i * step);
        }
        samples.push(sample);
    }

    return samples;
}