import { Kernel } from './kernels';
import { Cholesky } from './cholesky';
import { GPRModel } from '../../types/gpr';

export class GaussianProcessRegression {
    private kernel: Kernel;
    private cholesky: Cholesky;
    private X: number[][];
    private y: number[];

    constructor(kernel: Kernel) {
        this.kernel = kernel;
        this.cholesky = new Cholesky();
        this.X = [];
        this.y = [];
    }

    public fit(X: number[][], y: number[]): void {
        this.X = X;
        this.y = y;
        this.cholesky.compute(this.kernel.compute(X, X));
    }

    public predict(X_new: number[][]): { mean: number[]; variance: number[] } {
        const K = this.kernel.compute(this.X, X_new);
        const K_inv = this.cholesky.solve(K);
        const mean = K_inv.map((k, i) => k.reduce((sum, val, j) => sum + val * this.y[j], 0));
        const variance = this.kernel.compute(X_new, X_new).map((k, i) => k - K_inv[i].reduce((sum, val, j) => sum + val * K[j][i], 0));
        return { mean, variance };
    }
}