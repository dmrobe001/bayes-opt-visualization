import { hexToRgb, rgbToHex, interpolateColors } from '../../src/utils/color';

describe('Color Utility Functions', () => {
    test('hexToRgb converts hex to RGB', () => {
        expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
        expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
        expect(hexToRgb('#FF5733')).toEqual({ r: 255, g: 87, b: 51 });
    });

    test('rgbToHex converts RGB to hex', () => {
        expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#FFFFFF');
        expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
        expect(rgbToHex({ r: 255, g: 87, b: 51 })).toBe('#FF5733');
    });

    test('interpolateColors returns the correct interpolated color', () => {
        expect(interpolateColors('#FFFFFF', '#000000', 0.5)).toEqual({ r: 127.5, g: 127.5, b: 127.5 });
        expect(interpolateColors('#FF5733', '#33FF57', 0.5)).toEqual({ r: 127.5, g: 87, b: 127.5 });
    });
});