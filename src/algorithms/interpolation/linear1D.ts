export function linearInterpolation1D(x: number[], y: number[], xNew: number[]): number[] {
    const yNew: number[] = [];
    for (const xValue of xNew) {
        if (xValue <= x[0]) {
            yNew.push(y[0]);
        } else if (xValue >= x[x.length - 1]) {
            yNew.push(y[y.length - 1]);
        } else {
            for (let i = 0; i < x.length - 1; i++) {
                if (xValue >= x[i] && xValue <= x[i + 1]) {
                    const slope = (y[i + 1] - y[i]) / (x[i + 1] - x[i]);
                    const interpolatedValue = y[i] + slope * (xValue - x[i]);
                    yNew.push(interpolatedValue);
                    break;
                }
            }
        }
    }
    return yNew;
}