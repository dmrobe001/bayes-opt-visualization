import React from 'react';

interface ColorBarProps {
    min: number;
    max: number;
    colorScale: (value: number) => string;
    height?: number;
    width?: number;
}

const ColorBar: React.FC<ColorBarProps> = ({ min, max, colorScale, height = 20, width = 300 }) => {
    const steps = 100;
    const stepSize = (max - min) / steps;
    const gradientStops = Array.from({ length: steps + 1 }, (_, i) => {
        const value = min + i * stepSize;
        return (
            <div
                key={i}
                style={{
                    backgroundColor: colorScale(value),
                    height: height,
                    width: `${100 / steps}%`,
                    display: 'inline-block',
                }}
            />
        );
    });

    return (
        <div style={{ display: 'flex', width: width, height: height }}>
            {gradientStops}
        </div>
    );
};

export default ColorBar;