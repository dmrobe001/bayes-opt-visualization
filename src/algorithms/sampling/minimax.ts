export function minimaxSampling(points: number[], numSamples: number): number[] {
    const selectedSamples: number[] = [];
    const distances: number[] = Array(points.length).fill(0);

    while (selectedSamples.length < numSamples) {
        let maxMinDistance = -Infinity;
        let bestPoint = -1;

        for (let i = 0; i < points.length; i++) {
            if (selectedSamples.includes(points[i])) continue;

            // Calculate the minimum distance to the already selected samples
            let minDistance = Infinity;
            for (const sample of selectedSamples) {
                const distance = Math.abs(points[i] - sample);
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }

            // Update the best point if this point has a larger minimum distance
            if (minDistance > maxMinDistance) {
                maxMinDistance = minDistance;
                bestPoint = points[i];
            }
        }

        if (bestPoint !== -1) {
            selectedSamples.push(bestPoint);
        }
    }

    return selectedSamples;
}