export function trilinearInterpolation(x: number, y: number, z: number, points: Array<[number, number, number, number]>): number {
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;
    const z0 = Math.floor(z);
    const z1 = z0 + 1;

    const c000 = getValueAtPoint(x0, y0, z0, points);
    const c100 = getValueAtPoint(x1, y0, z0, points);
    const c010 = getValueAtPoint(x0, y1, z0, points);
    const c110 = getValueAtPoint(x1, y1, z0, points);
    const c001 = getValueAtPoint(x0, y0, z1, points);
    const c101 = getValueAtPoint(x1, y0, z1, points);
    const c011 = getValueAtPoint(x0, y1, z1, points);
    const c111 = getValueAtPoint(x1, y1, z1, points);

    const xd = x - x0;
    const yd = y - y0;
    const zd = z - z0;

    const c00 = c000 * (1 - xd) + c100 * xd;
    const c01 = c001 * (1 - xd) + c101 * xd;
    const c10 = c010 * (1 - xd) + c110 * xd;
    const c11 = c011 * (1 - xd) + c111 * xd;

    const c0 = c00 * (1 - yd) + c10 * yd;
    const c1 = c01 * (1 - yd) + c11 * yd;

    return c0 * (1 - zd) + c1 * zd;
}

function getValueAtPoint(x: number, y: number, z: number, points: Array<[number, number, number, number]>): number {
    const point = points.find(p => p[0] === x && p[1] === y && p[2] === z);
    return point ? point[3] : 0; // Return 0 if point not found
}