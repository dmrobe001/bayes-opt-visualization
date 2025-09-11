# Bayesian Optimization Visualization

This project is an interactive browser-based demonstration of Bayesian optimization techniques, aimed at exploring experimental design spaces. It showcases various sampling methods, Gaussian Process Regression (GPR), and the iterations of Bayesian optimization in a visually engaging manner.

## Features

- **1D, 2D, and 3D Visualizations**: The project includes visualizations for different dimensions, allowing users to understand the optimization process in a clear and intuitive way.
- **Sampling Techniques**: Compare traditional design of experiments (like factorial and one-factor-at-a-time) against random sampling and low-discrepancy sampling methods such as minimax.
- **Interactive Controls**: Users can interact with the visualizations through a control panel, adjusting parameters and exploring different sampling strategies.
- **Smooth Animations**: The visualizations feature smooth transitions and animations to enhance the user experience and understanding of the underlying concepts.

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd bayes-opt-visualization
   ```

2. **Install Dependencies**:
   Make sure you have [Node.js](https://nodejs.org/) installed. Then run:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   Start the development server with:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000` to view the application.

## Usage

- Navigate through the presentation using the provided controls.
- Explore different sampling techniques and their effects on the optimization process.
- Use the timeline scrubber to review previous steps and understand the evolution of the optimization.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.