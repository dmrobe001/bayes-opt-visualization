import { GaussianProcess } from '../gpr/gpr';
import { samplePoints } from '../sampling/minimax';
import { ExpectedImprovement } from './acquisition';

export function optimizeEI(
  objectiveFunction: (x: number[]) => number,
  bounds: number[][],
  nSamples: number,
  nIterations: number
) {
  const samples = samplePoints(bounds, nSamples);
  const gpr = new GaussianProcess(samples, objectiveFunction);
  
  for (let i = 0; i < nIterations; i++) {
    const ei = ExpectedImprovement(gpr);
    const nextSample = ei.maximize(bounds);
    const nextValue = objectiveFunction(nextSample);
    
    gpr.addSample(nextSample, nextValue);
  }

  return gpr.getSamples();
}