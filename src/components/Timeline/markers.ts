export interface Marker {
    step: number;
    label: string;
    description: string;
}

export const markers: Marker[] = [
    { step: 1, label: "Initial Samples", description: "Display initial sample points on the x-axis." },
    { step: 2, label: "Linear Interpolation", description: "Show linear interpolation between sample points." },
    { step: 3, label: "GPR Mean", description: "Display the Gaussian Process Regression mean." },
    { step: 4, label: "GPR Variance", description: "Show the variance of the GPR model." },
    { step: 5, label: "Max EI Sample", description: "Highlight the sample point that maximizes expected improvement." },
    { step: 6, label: "Update GPR", description: "Update GPR mean and variance after adding new samples." },
];