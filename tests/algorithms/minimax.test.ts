import { minimaxSampling } from '../../src/algorithms/sampling/minimax';

describe('Minimax Sampling Algorithm', () => {
    it('should return a set of points with optimal separation', () => {
        const numPoints = 30;
        const bounds = [[0, 1], [0, 1], [0, 1]]; // 3D space
        const points = minimaxSampling(numPoints, bounds);
        
        expect(points.length).toBe(numPoints);
        // Additional checks can be added here to verify the optimal separation
    });

    it('should handle edge cases with zero points', () => {
        const numPoints = 0;
        const bounds = [[0, 1], [0, 1], [0, 1]];
        const points = minimaxSampling(numPoints, bounds);
        
        expect(points.length).toBe(0);
    });

    it('should handle edge cases with negative points', () => {
        const numPoints = -5;
        const bounds = [[0, 1], [0, 1], [0, 1]];
        const points = minimaxSampling(numPoints, bounds);
        
        expect(points.length).toBe(0);
    });

    // Additional tests can be added to cover more scenarios
});