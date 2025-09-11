import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Camera, Scene } from 'three';

export class Controls {
    private controls: OrbitControls;

    constructor(camera: Camera, canvas: HTMLCanvasElement) {
        this.controls = new OrbitControls(camera, canvas);
        this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.controls.dampingFactor = 0.25;
        this.controls.screenSpacePanning = false;
        this.controls.maxPolarAngle = Math.PI / 2; // limit vertical rotation
    }

    update() {
        this.controls.update();
    }

    reset() {
        this.controls.reset();
    }

    dispose() {
        this.controls.dispose();
    }
}