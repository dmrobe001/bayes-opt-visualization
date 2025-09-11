import * as THREE from 'three';

export class IsoSurface {
    constructor(private scene: THREE.Scene) {}

    createIsoSurface(data: number[][][], isoLevel: number, color: number) {
        const geometry = this.generateIsoSurfaceGeometry(data, isoLevel);
        const material = new THREE.MeshStandardMaterial({ color: color, transparent: true, opacity: 0.7 });
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        return mesh;
    }

    private generateIsoSurfaceGeometry(data: number[][][], isoLevel: number): THREE.BufferGeometry {
        const vertices: number[] = [];
        const indices: number[] = [];
        const sizeX = data.length;
        const sizeY = data[0].length;
        const sizeZ = data[0][0].length;

        for (let x = 0; x < sizeX - 1; x++) {
            for (let y = 0; y < sizeY - 1; y++) {
                for (let z = 0; z < sizeZ - 1; z++) {
                    const cubeIndex = this.getCubeIndex(data, x, y, z, isoLevel);
                    if (cubeIndex === 0 || cubeIndex === 255) continue; // No intersection

                    const verticesList = this.getVerticesForCube(x, y, z, cubeIndex);
                    const faces = this.getFaces(cubeIndex);

                    for (const face of faces) {
                        const v0 = verticesList[face[0]];
                        const v1 = verticesList[face[1]];
                        const v2 = verticesList[face[2]];

                        vertices.push(...v0, ...v1, ...v2);
                        indices.push(vertices.length / 3 - 3, vertices.length / 3 - 2, vertices.length / 3 - 1);
                    }
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    private getCubeIndex(data: number[][][], x: number, y: number, z: number, isoLevel: number): number {
        let index = 0;
        if (data[x][y][z] < isoLevel) index |= 1;
        if (data[x + 1][y][z] < isoLevel) index |= 2;
        if (data[x + 1][y + 1][z] < isoLevel) index |= 4;
        if (data[x][y + 1][z] < isoLevel) index |= 8;
        if (data[x][y][z + 1] < isoLevel) index |= 16;
        if (data[x + 1][y][z + 1] < isoLevel) index |= 32;
        if (data[x + 1][y + 1][z + 1] < isoLevel) index |= 64;
        if (data[x][y + 1][z + 1] < isoLevel) index |= 128;
        return index;
    }

    private getVerticesForCube(x: number, y: number, z: number, cubeIndex: number): number[][] {
        const vertices = [
            [x, y, z],
            [x + 1, y, z],
            [x + 1, y + 1, z],
            [x, y + 1, z],
            [x, y, z + 1],
            [x + 1, y, z + 1],
            [x + 1, y + 1, z + 1],
            [x, y + 1, z + 1],
        ];
        return vertices;
    }

    private getFaces(cubeIndex: number): number[][] {
        const edgeTable = [
            [], // Add the edge table data here
        ];
        return edgeTable[cubeIndex];
    }
}