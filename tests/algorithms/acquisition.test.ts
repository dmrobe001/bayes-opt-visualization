import { calculateExpectedImprovement } from '../../src/algorithms/bayesOpt/acquisition';
import { createSampleSet } from '../../src/data/sampleSets';

describe('Acquisition Functions', () => {
    it('should calculate expected improvement correctly', () => {
        const sampleSet = createSampleSet();
        const bestSampleValue = Math.max(...sampleSet.map(sample => sample.y));
        const newSamplePoint = 0.5; // Example point to evaluate
        const predictedMean = 0.6; // Example predicted mean at newSamplePoint
        const predictedVariance = 0.1; // Example predicted variance at newSamplePoint

        const expectedImprovement = calculateExpectedImprovement(
            newSamplePoint,
            predictedMean,
            predictedVariance,
            bestSampleValue
        );

        expect(expectedImprovement).toBeGreaterThan(0); // Expect improvement to be positive
    });

    // Additional tests can be added here
});