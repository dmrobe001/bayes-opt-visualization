export function linearInterpolation2D(x: number[], y: number[], z: number[][], xi: number[], yi: number[]): number {
    const x1 = x[0];
    const x2 = x[1];
    const y1 = y[0];
    const y2 = y[1];

    const z11 = z[0][0];
    const z12 = z[0][1];
    const z21 = z[1][0];
    const z22 = z[1][1];

    const denom = (x2 - x1) * (y2 - y1);
    const zInterpolated = (z11 * (x2 - xi[0]) * (y2 - yi[0]) +
                            z21 * (xi[0] - x1) * (y2 - yi[0]) +
                            z12 * (x2 - xi[0]) * (yi[0] - y1) +
                            z22 * (xi[0] - x1) * (yi[0] - y1)) / denom;

    return zInterpolated;
}