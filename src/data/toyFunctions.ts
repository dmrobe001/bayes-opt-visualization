export const toyFunction1D = (x: number): number => {
    return Math.sin(3 * x) * (1 - x) + 0.5 * x;
};

export const toyFunction2D = (x: number, y: number): number => {
    return Math.sin(x) * Math.cos(y) + 0.5 * (x + y);
};

export const toyFunction3D = (x: number, y: number, z: number): number => {
    return Math.sin(x) * Math.cos(y) * Math.sin(z) + 0.5 * (x + y + z);
};