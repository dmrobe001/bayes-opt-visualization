import { SceneState } from '../types/presentation';

const initialState: SceneState = {
    currentScene: 'OneDScene',
    currentStep: 0,
    totalSteps: 0,
    isPlaying: false,
    playbackSpeed: 1,
};

export const sceneState = {
    state: initialState,
    setCurrentScene(scene: string) {
        this.state.currentScene = scene;
    },
    setCurrentStep(step: number) {
        this.state.currentStep = step;
    },
    setTotalSteps(steps: number) {
        this.state.totalSteps = steps;
    },
    togglePlayback() {
        this.state.isPlaying = !this.state.isPlaying;
    },
    setPlaybackSpeed(speed: number) {
        this.state.playbackSpeed = speed;
    },
};