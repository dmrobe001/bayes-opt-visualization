// Lightweight Cholesky decomposition for symmetric positive definite matrices
// Returns lower triangular L such that K = L * L^T
export function choleskyDecomposition(K: number[][]): number[][] {
    const n = K.length;
    const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = 0;
            for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
            if (i === j) {
                const val = K[i][i] - sum;
                L[i][j] = val <= 0 ? 1e-12 : Math.sqrt(val);
            } else {
                L[i][j] = (K[i][j] - sum) / L[j][j];
            }
        }
    }
    return L;
}

export function choleskySolve(L: number[][], b: number[]): number[] {
    const n = L.length;
    // Forward solve Ly = b
    const y = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let k = 0; k < i; k++) sum += L[i][k] * y[k];
        y[i] = (b[i] - sum) / L[i][i];
    }
    // Backward solve L^T x = y
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let k = i + 1; k < n; k++) sum += L[k][i] * x[k];
        x[i] = (y[i] - sum) / L[i][i];
    }
    return x;
}

export function choleskySolveMatrix(L: number[][], B: number[][]): number[][] {
    return B[0].map((_, colIdx) => choleskySolve(L, B.map(row => row[colIdx]))).map((col, i) => col);
}