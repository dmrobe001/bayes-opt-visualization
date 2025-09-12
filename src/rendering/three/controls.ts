import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Camera } from 'three';

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

    setTarget(x: number, y: number, z: number) {
        this.controls.target.set(x, y, z);
        this.controls.update();
    }

    setAutoRotate(enabled: boolean, speed = 1.0) {
        this.controls.autoRotate = enabled;
        this.controls.autoRotateSpeed = speed;
    }

    setEnabled(enabled: boolean) {
        this.controls.enabled = enabled;
    }

    setPolarLimits(min: number, max: number) {
        this.controls.minPolarAngle = min;
        this.controls.maxPolarAngle = max;
    }

    onInteractionStart(cb: () => void) {
        this.controls.addEventListener('start', cb as unknown as EventListener);
    }

    onInteractionEnd(cb: () => void) {
        this.controls.addEventListener('end', cb as unknown as EventListener);
    }

    dispose() {
        this.controls.dispose();
    }
}