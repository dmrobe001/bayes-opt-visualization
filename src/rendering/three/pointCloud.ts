import * as THREE from 'three';

export class PointCloud {
    private points: THREE.Points;
    private geometry: THREE.BufferGeometry;
    private material: THREE.PointsMaterial;

    constructor(pointData: Float32Array, colorData: Float32Array) {
        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(pointData, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colorData, 3));

        this.material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            sizeAttenuation: true,
        });

        this.points = new THREE.Points(this.geometry, this.material);
    }

    public getPoints(): THREE.Points {
        return this.points;
    }

    public updatePoints(pointData: Float32Array, colorData: Float32Array): void {
        this.geometry.setAttribute('position', new THREE.BufferAttribute(pointData, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colorData, 3));
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
    }
}