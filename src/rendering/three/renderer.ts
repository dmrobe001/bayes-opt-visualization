import * as THREE from 'three';

export class Renderer {
    private renderer: THREE.WebGLRenderer;

    constructor(container: HTMLElement) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    public resize(width: number, height: number) {
        this.renderer.setSize(width, height);
    }

    public render(scene: THREE.Scene, camera: THREE.Camera) {
        this.renderer.render(scene, camera);
    }

    public getDomElement(): HTMLElement {
        return this.renderer.domElement;
    }

    public dispose() {
        this.renderer.dispose();
    }
}