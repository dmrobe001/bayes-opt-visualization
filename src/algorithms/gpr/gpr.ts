import { squaredExponentialKernel, KernelFunction } from './kernels';
import { choleskyDecomposition, choleskySolve } from './cholesky';

// Basic Gaussian Process Regression for low-dimensional demo use.
export interface GPPrediction { mean: number[]; variance: number[]; }

export class GaussianProcessRegression {
    private X: number[][] = [];
    private y: number[] = [];
    private L: number[][] | null = null; // Cholesky factor of (K + noise^2 I)
    private alpha: number[] | null = null; // (K + noise^2 I)^{-1} y
    private kernel: KernelFunction;
    private noise: number;
    private lengthScale: number;
    private signalVariance: number;

    constructor(opts?: { lengthScale?: number; noise?: number; signalVariance?: number; kernel?: KernelFunction }) {
        this.lengthScale = opts?.lengthScale ?? 0.25;
        this.noise = opts?.noise ?? 1e-4;
        this.signalVariance = opts?.signalVariance ?? 1.0;
        this.kernel = opts?.kernel ?? squaredExponentialKernel(this.lengthScale);
    }

    private computeKernelMatrix(A: number[][], B: number[][]): number[][] {
        const K: number[][] = Array.from({ length: A.length }, () => Array(B.length).fill(0));
        for (let i = 0; i < A.length; i++) {
            for (let j = 0; j < B.length; j++) {
                K[i][j] = this.signalVariance * this.kernel(A[i], B[j]);
            }
        }
        return K;
    }

    fit(X: number[][], y: number[]): void {
        this.X = X;
        this.y = y;
        const n = X.length;
        const K = this.computeKernelMatrix(X, X);
        for (let i = 0; i < n; i++) K[i][i] += this.noise * this.noise;
        this.L = choleskyDecomposition(K);
        // Solve for alpha: (K + σ^2 I) alpha = y
        this.alpha = choleskySolve(this.L, y);
    }

    predict(Xs: number[][]): GPPrediction {
        if (!this.L || !this.alpha) throw new Error('Model not fit');
        const K_s = this.computeKernelMatrix(this.X, Xs); // n x m
        // Mean: k(X, X*)^T alpha
        const mean: number[] = Array(Xs.length).fill(0);
        for (let j = 0; j < Xs.length; j++) {
            let sum = 0;
            for (let i = 0; i < this.X.length; i++) sum += K_s[i][j] * this.alpha[i];
            mean[j] = sum;
        }
        // Solve v = L^{-1} K_s
        const v: number[][] = Array.from({ length: this.X.length }, () => Array(Xs.length).fill(0));
        for (let j = 0; j < Xs.length; j++) {
            // forward solve for each column
            for (let i = 0; i < this.X.length; i++) {
                let sum = 0;
                for (let k = 0; k < i; k++) sum += this.L[i][k] * v[k][j];
                v[i][j] = (K_s[i][j] - sum) / this.L[i][i];
            }
        }
        // Variance: k(X*, X*) - v^T v (element-wise along columns)
        const K_ss_diag: number[] = Xs.map(() => this.signalVariance); // since k(x,x)=signalVariance for SE kernel
        const variance = K_ss_diag.map((k, j) => {
            let sum = 0;
            for (let i = 0; i < this.X.length; i++) sum += v[i][j] * v[i][j];
            return Math.max(1e-12, k - sum);
        });
        return { mean, variance };
    }
}