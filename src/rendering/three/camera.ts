import { PerspectiveCamera } from 'three';

class Camera {
    private camera: PerspectiveCamera;

    constructor(fov: number, aspect: number, near: number, far: number) {
        this.camera = new PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(0, 0, 5); // Default position
    }

    public getCamera(): PerspectiveCamera {
        return this.camera;
    }

    public updateAspectRatio(aspect: number): void {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    public setPosition(x: number, y: number, z: number): void {
        this.camera.position.set(x, y, z);
    }

    public lookAt(x: number, y: number, z: number): void {
        this.camera.lookAt(x, y, z);
    }
}

export default Camera;