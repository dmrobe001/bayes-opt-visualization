import { Step } from '../../types/presentation';

const sequence: Step[] = [
    {
        description: "Initialize the 2D design space with a grid of black points.",
        action: "initializeGrid",
        params: { rows: 4, cols: 4 }
    },
    {
        description: "Move all points to their correct z positions and shade them red.",
        action: "updatePointColors",
        params: { color: 'red' }
    },
    {
        description: "Rotate the camera down to a perspective view.",
        action: "rotateCamera",
        params: { angle: 45 }
    },
    {
        description: "Start rotating the plot slowly.",
        action: "startRotation",
        params: { speed: 0.1 }
    },
    {
        description: "Draw a triangulated mesh interpolating between the samples.",
        action: "drawMesh",
        params: {}
    },
    {
        description: "Stop rotation on user drag.",
        action: "enableDragControl",
        params: {}
    },
    {
        description: "Resume slow rotation after user interaction.",
        action: "resumeRotation",
        params: {}
    },
    {
        description: "Display GPR mean surface.",
        action: "showGPRMean",
        params: {}
    },
    {
        description: "Display GPR variance surface.",
        action: "showGPRVariance",
        params: {}
    },
    {
        description: "Add new samples at the maximum of Expected Improvement.",
        action: "addSamplesAtMaxEI",
        params: {}
    },
    {
        description: "Update GPR mean and variance surfaces after adding new samples.",
        action: "updateGPRSurfaces",
        params: {}
    }
];

export default sequence;