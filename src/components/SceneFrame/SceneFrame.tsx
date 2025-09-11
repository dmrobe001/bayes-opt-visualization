import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const SceneFrame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Initialize any necessary Three.js components or settings here
    }, []);

    return (
        <Canvas ref={canvasRef} style={{ height: '100%', width: '100%' }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls />
            {/* Add your 3D objects and visualizations here */}
        </Canvas>
    );
};

export default SceneFrame;