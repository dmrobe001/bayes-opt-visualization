import { PresentationState } from '../types/presentation';

class PresentationMachine {
    private state: PresentationState;
    private currentStep: number;
    private totalSteps: number;

    constructor(totalSteps: number) {
        this.totalSteps = totalSteps;
        this.currentStep = 0;
        this.state = this.initializeState();
    }

    private initializeState(): PresentationState {
        return {
            currentScene: 'OneDScene',
            samplingMethod: 'random',
            markedCoordinates: false,
            // Add other initial state properties as needed
        };
    }

    public nextStep(): void {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.updateState();
        }
    }

    public previousStep(): void {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateState();
        }
    }

    public goToStep(step: number): void {
        if (step >= 0 && step < this.totalSteps) {
            this.currentStep = step;
            this.updateState();
        }
    }

    private updateState(): void {
        // Logic to update the presentation state based on the current step
        // This could involve changing scenes, updating sampling methods, etc.
    }

    public getCurrentState(): PresentationState {
        return this.state;
    }

    public toggleMarkedCoordinates(): void {
        this.state.markedCoordinates = !this.state.markedCoordinates;
    }

    // Additional methods to handle specific interactions can be added here
}

export default PresentationMachine;