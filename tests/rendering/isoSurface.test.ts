import { render, screen } from '@testing-library/react';
import IsoSurface from '../../src/rendering/three/isoSurface';

describe('IsoSurface Component', () => {
    test('renders without crashing', () => {
        render(<IsoSurface />);
        const isoSurfaceElement = screen.getByTestId('iso-surface');
        expect(isoSurfaceElement).toBeInTheDocument();
    });

    test('displays correct iso-surface based on props', () => {
        const testProps = {
            data: [/* mock data for iso-surface */],
            isoLevel: 0.5,
        };
        render(<IsoSurface {...testProps} />);
        const isoSurfaceElement = screen.getByTestId('iso-surface');
        expect(isoSurfaceElement).toHaveAttribute('data-iso-level', '0.5');
    });

    test('updates when props change', () => {
        const { rerender } = render(<IsoSurface isoLevel={0.5} />);
        expect(screen.getByTestId('iso-surface')).toHaveAttribute('data-iso-level', '0.5');

        rerender(<IsoSurface isoLevel={0.8} />);
        expect(screen.getByTestId('iso-surface')).toHaveAttribute('data-iso-level', '0.8');
    });
});