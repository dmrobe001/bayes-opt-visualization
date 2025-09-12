export const toyFunction1D = (x: number): number => {
    return Math.sin(3 * x) * (1 - x) + 0.5 * x;
};

export const toyFunction2D = (x: number, y: number): number => {
    return Math.sin(x) * Math.cos(y) + 0.5 * (x + y);
};

// Bimodal 2D toy function: sum of two Gaussian bumps with a shallow central dip
// Domain assumed in [0,1]^2
export const toyFunction2D_bimodal = (x: number, y: number): number => {
    const gauss = (mx: number, my: number, sx: number, sy: number, a: number) => {
        const dx = (x - mx) / sx;
        const dy = (y - my) / sy;
        return a * Math.exp(-0.5 * (dx * dx + dy * dy));
    };
    const peak1 = gauss(0.15, 0.2, 0.15, 0.2, 1.2);
    const peak2 = gauss(0.78, 0.82, 0.2, 0.5, 1.0);
    // const dip = gauss(0.50, 0.50, 0.30, 0.30, 0.6);
    return peak1 + peak2;// - 0.6 * dip;
};

export const toyFunction3D = (x: number, y: number, z: number): number => {
    return Math.sin(x) * Math.cos(y) * Math.sin(z) + 0.5 * (x + y + z);
};