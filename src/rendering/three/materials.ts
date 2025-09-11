import * as THREE from 'three';

export const createBasicMaterial = (color: number, opacity: number = 1): THREE.MeshBasicMaterial => {
    return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
};

export const createPhongMaterial = (color: number, shininess: number = 30): THREE.MeshPhongMaterial => {
    return new THREE.MeshPhongMaterial({ color, shininess });
};

export const createStandardMaterial = (color: number, roughness: number = 0.5, metalness: number = 0.5): THREE.MeshStandardMaterial => {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
};

export const createWireframeMaterial = (color: number): THREE.MeshBasicMaterial => {
    return new THREE.MeshBasicMaterial({ color, wireframe: true });
};

export const createShaderMaterial = (vertexShader: string, fragmentShader: string, uniforms: any): THREE.ShaderMaterial => {
    return new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
    });
};