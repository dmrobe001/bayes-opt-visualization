import React from 'react';

const Axes: React.FC = () => {
    return (
        <group>
            {/* X Axis */}
            <line>
                <geometry attach="geometry" vertices={[[0, 0, 0], [1, 0, 0]]} />
                <lineBasicMaterial attach="material" color="blue" />
            </line>
            <text position={[1, 0, 0]} color="black">X</text>

            {/* Y Axis */}
            <line>
                <geometry attach="geometry" vertices={[[0, 0, 0], [0, 1, 0]]} />
                <lineBasicMaterial attach="material" color="red" />
            </line>
            <text position={[0, 1, 0]} color="black">Y</text>

            {/* Z Axis */}
            <line>
                <geometry attach="geometry" vertices={[[0, 0, 0], [0, 0, 1]]} />
                <lineBasicMaterial attach="material" color="green" />
            </line>
            <text position={[0, 0, 1]} color="black">Z</text>
        </group>
    );
};

export default Axes;