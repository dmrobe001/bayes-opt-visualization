import { Matrix } from 'some-matrix-library'; // Replace with actual matrix library import

export function choleskyDecomposition(matrix: Matrix): Matrix {
    const n = matrix.rows;
    const L = new Matrix(n, n);

    for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
            sum += L.get(j, k) * L.get(j, k);
        }
        L.set(j, j, Math.sqrt(matrix.get(j, j) - sum));

        for (let i = j + 1; i < n; i++) {
            sum = 0;
            for (let k = 0; k < j; k++) {
                sum += L.get(i, k) * L.get(j, k);
            }
            L.set(i, j, (matrix.get(i, j) - sum) / L.get(j, j));
        }
    }

    return L;
}