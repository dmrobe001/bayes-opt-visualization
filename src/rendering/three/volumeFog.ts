import * as THREE from 'three';

export class VolumeFog {
    constructor(scene) {
        this.scene = scene;
        this.fogMaterial = new THREE.ShaderMaterial({
            uniforms: {
                fogColor: { value: new THREE.Color(0xffffff) },
                fogDensity: { value: 0.1 },
            },
            vertexShader: `
                varying vec3 vPosition;
                void main() {
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 fogColor;
                uniform float fogDensity;
                varying vec3 vPosition;

                void main() {
                    float distance = length(vPosition);
                    float fogFactor = exp(-fogDensity * distance * distance);
                    gl_FragColor = vec4(fogColor, fogFactor);
                }
            `,
            transparent: true,
        });

        this.geometry = new THREE.BoxGeometry(100, 100, 100);
        this.fogMesh = new THREE.Mesh(this.geometry, this.fogMaterial);
        this.scene.add(this.fogMesh);
    }

    updateFogDensity(density) {
        this.fogMaterial.uniforms.fogDensity.value = density;
    }

    updateFogColor(color) {
        this.fogMaterial.uniforms.fogColor.value.set(color);
    }
}