export const easeInOutQuad = (t: number): number => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

export const easeInQuad = (t: number): number => {
    return t * t;
};

export const easeOutQuad = (t: number): number => {
    return t * (2 - t);
};

export const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (4 * t * t - 4 * t + 1) + 1;
};

export const easeInCubic = (t: number): number => {
    return t * t * t;
};

export const easeOutCubic = (t: number): number => {
    return (t - 1) * (t - 1) * (t - 1) + 1;
};

export const easeInOutQuart = (t: number): number => {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
};

export const easeInQuart = (t: number): number => {
    return t * t * t * t;
};

export const easeOutQuart = (t: number): number => {
    return 1 - (t - 1) * (t - 1) * (t - 1) * (t - 1);
};

export const easeInOutQuint = (t: number): number => {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + (t - 1) * (16 * t * t * t * t - 16 * t * t * t + 5);
};

export const easeInQuint = (t: number): number => {
    return t * t * t * t * t;
};

export const easeOutQuint = (t: number): number => {
    return 1 + (t - 1) * (t - 1) * (t - 1) * (t - 1) * (t - 1);
};