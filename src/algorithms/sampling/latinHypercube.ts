export function latinHypercubeSampling(numSamples: number, dimensions: number): number[][] {
    const samples: number[][] = [];
    const interval = 1 / numSamples;

    for (let d = 0; d < dimensions; d++) {
        const tempSamples: number[] = [];
        for (let i = 0; i < numSamples; i++) {
            tempSamples.push((i + Math.random()) * interval);
        }
        tempSamples.sort((a, b) => a - b);

        for (let i = 0; i < numSamples; i++) {
            samples.push(tempSamples.map((value, index) => (index === d ? value : Math.random())));
        }
    }

    return samples;
}