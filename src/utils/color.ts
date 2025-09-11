export function interpolateColor(value: number, min: number, max: number): string {
    const ratio = (value - min) / (max - min);
    const r = Math.round(255 * ratio);
    const g = 0;
    const b = Math.round(255 * (1 - ratio));
    return `rgb(${r}, ${g}, ${b})`;
}

export function getColorForValue(value: number, min: number, max: number): string {
    if (value < min) return 'blue';
    if (value > max) return 'red';
    return interpolateColor(value, min, max);
}

export function generateColorGradient(startColor: string, endColor: string, steps: number): string[] {
    const start = hexToRgb(startColor);
    const end = hexToRgb(endColor);
    const colorArray = [];

    for (let i = 0; i <= steps; i++) {
        const r = Math.round(start.r + (end.r - start.r) * (i / steps));
        const g = Math.round(start.g + (end.g - start.g) * (i / steps));
        const b = Math.round(start.b + (end.b - start.b) * (i / steps));
        colorArray.push(`rgb(${r}, ${g}, ${b})`);
    }

    return colorArray;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    let r = 0, g = 0, b = 0;
    if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return { r, g, b };
}