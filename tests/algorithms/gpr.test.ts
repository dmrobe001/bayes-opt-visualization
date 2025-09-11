import { GaussianProcessRegressor } from '../../src/algorithms/gpr/gpr';
import { createToyFunction } from '../../src/data/toyFunctions';

describe('Gaussian Process Regression', () => {
    let gpr;
    let toyFunction;

    beforeEach(() => {
        toyFunction = createToyFunction();
        gpr = new GaussianProcessRegressor();
    });

    test('should fit the model to the data', () => {
        const samples = [
            { x: 0, y: toyFunction(0) },
            { x: 1, y: toyFunction(1) },
            { x: 2, y: toyFunction(2) },
        ];
        gpr.fit(samples);
        expect(gpr.samples).toHaveLength(3);
    });

    test('should predict values correctly', () => {
        const samples = [
            { x: 0, y: toyFunction(0) },
            { x: 1, y: toyFunction(1) },
        ];
        gpr.fit(samples);
        const prediction = gpr.predict(1.5);
        expect(prediction).toBeCloseTo(toyFunction(1.5), 5);
    });

    test('should return variance for predictions', () => {
        const samples = [
            { x: 0, y: toyFunction(0) },
            { x: 1, y: toyFunction(1) },
        ];
        gpr.fit(samples);
        const { mean, variance } = gpr.predictWithVariance(1.5);
        expect(mean).toBeCloseTo(toyFunction(1.5), 5);
        expect(variance).toBeGreaterThan(0);
    });

    test('should handle new samples correctly', () => {
        const initialSamples = [
            { x: 0, y: toyFunction(0) },
            { x: 1, y: toyFunction(1) },
        ];
        gpr.fit(initialSamples);
        const newSample = { x: 2, y: toyFunction(2) };
        gpr.addSample(newSample);
        expect(gpr.samples).toHaveLength(3);
        const prediction = gpr.predict(2);
        expect(prediction).toBeCloseTo(toyFunction(2), 5);
    });
});