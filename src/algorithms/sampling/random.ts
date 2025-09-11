import { Sample } from '../../types/sampling';

export function randomSampling(numSamples: number, bounds: [number, number][]): Sample[] {
    const samples: Sample[] = [];

    for (let i = 0; i < numSamples; i++) {
        const sample: number[] = bounds.map(([min, max]) => {
            return Math.random() * (max - min) + min;
        });
        samples.push(sample);
    }

    return samples;
}