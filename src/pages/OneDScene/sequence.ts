export const sequence = [
    {
        step: 1,
        description: "Initialize the 1D scene with an empty plot and 4 black sample points along the x-axis.",
        action: "initializePlot",
        data: {
            points: [
                { x: 0.2, y: null, color: 'black' },
                { x: 0.5, y: null, color: 'black' },
                { x: 0.7, y: null, color: 'black' },
                { x: 0.9, y: null, color: 'black' }
            ]
        }
    },
    {
        step: 2,
        description: "On click, move the first point up to its y value and change its color to red.",
        action: "updatePoint",
        data: { index: 0, yValue: 0.3 }
    },
    {
        step: 3,
        description: "On click, move the second point up to its y value and change its color to red.",
        action: "updatePoint",
        data: { index: 1, yValue: 0.5 }
    },
    {
        step: 4,
        description: "On click, move the third point up to its y value and change its color to red.",
        action: "updatePoint",
        data: { index: 2, yValue: 0.2 }
    },
    {
        step: 5,
        description: "On click, move the fourth point up to its y value and change its color to red.",
        action: "updatePoint",
        data: { index: 3, yValue: 0.8 }
    },
    {
        step: 6,
        description: "Display a linear interpolation trace based on the sampled points.",
        action: "showLinearInterpolation"
    },
    {
        step: 7,
        description: "Display the GPR mean curve and variance band.",
        action: "showGPR",
        data: { mean: [/* GPR mean data */], variance: [/* GPR variance data */] }
    },
    {
        step: 8,
        description: "Add a point at the maximum expected improvement and update the GPR model.",
        action: "addSampleAtEI",
        data: { newPoint: { x: 0.6, y: 0.4 } }
    },
    {
        step: 9,
        description: "Repeat the process for three more iterations.",
        action: "repeatProcess",
        data: { iterations: 3 }
    }
];