// This file contains utility functions for grid-related operations.

export function createGrid(dimensions: number[], spacing: number): number[][] {
    const grid: number[][] = [];
    const [xDim, yDim, zDim] = dimensions;

    for (let x = 0; x < xDim; x += spacing) {
        for (let y = 0; y < yDim; y += spacing) {
            for (let z = 0; z < zDim; z += spacing) {
                grid.push([x, y, z]);
            }
        }
    }

    return grid;
}

export function getGridPoints(grid: number[][]): number[][] {
    return grid.map(point => [...point]);
}

export function getGridSize(grid: number[][]): number {
    return grid.length;
}