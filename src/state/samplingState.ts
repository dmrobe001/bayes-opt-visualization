import { SamplingMethod } from '../types/sampling';

interface SamplingState {
    method: SamplingMethod;
    sampleCount: number;
    samples: number[][];
}

const initialState: SamplingState = {
    method: 'random', // Default sampling method
    sampleCount: 30, // Default number of samples
    samples: [], // Initial empty samples array
};

export const samplingState = {
    state: initialState,
    setMethod(method: SamplingMethod) {
        this.state.method = method;
    },
    setSampleCount(count: number) {
        this.state.sampleCount = count;
    },
    addSample(sample: number[]) {
        this.state.samples.push(sample);
    },
    resetSamples() {
        this.state.samples = [];
    },
};