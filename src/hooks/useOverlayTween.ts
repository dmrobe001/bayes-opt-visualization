import { useEffect, useMemo, useRef, useState } from 'react';

// Generic overlay tween hook for arrays of numeric channels (e.g., y, mean, sigma, etc.).
// - Maintains presence (mounted) to allow fade/scale out when hidden
// - Tweens from last data (or baseline) to new data over the given duration
// - Returns tweened display data and an appear style (opacity + scaleY)

export type OverlayChannels = Record<string, number[]>;

interface UseOverlayTweenParams<T extends OverlayChannels> {
  visible: boolean;
  data: T | null;
  duration?: number; // ms
  // Per-channel baseline to start from if no last data; default is 0 for all channels
  baselinePerChannel?: Partial<Record<keyof T & string, number>> & Record<string, number>;
}

export function useOverlayTween<T extends OverlayChannels>(params: UseOverlayTweenParams<T>) {
  const { visible, data, duration = 350, baselinePerChannel = {} as Record<string, number> } = params;

  const lastRef = useRef<T | null>(null);
  const [mounted, setMounted] = useState(false);
  const [inFlag, setInFlag] = useState(false);
  const [display, setDisplay] = useState<T | null>(null);

  // Presence handling
  useEffect(() => {
    if (visible) {
      setMounted(true);
      setInFlag(false);
      const id = requestAnimationFrame(() => setInFlag(true));
      return () => cancelAnimationFrame(id);
    } else {
      setInFlag(false);
      const t = setTimeout(() => setMounted(false), duration);
      return () => clearTimeout(t);
    }
  }, [visible, duration]);

  // Tween on data change
  useEffect(() => {
    if (!data) return;

    const keys = Object.keys(data) as Array<keyof T & string>;
    if (keys.length === 0) return;

    // Build start arrays from last data or per-channel baselines
    const start: Partial<Record<string, number[]>> = {};
    for (const k of keys) {
      const endArr = data[k];
  const baseline = baselinePerChannel[k as string] ?? 0;
      const fromArr = lastRef.current?.[k] ?? Array(endArr.length).fill(baseline);
      // If length mismatches, rebuild start with baseline to avoid indexing issues
      start[k] = fromArr.length === endArr.length ? fromArr.slice() : Array(endArr.length).fill(baseline);
    }

    let raf = 0; let t0: number | null = null;
    const step = (t: number) => {
      if (t0 === null) t0 = t;
      const p = Math.min(1, (t - t0) / duration);
      const e = p * (2 - p); // easeOutQuad
      const out: any = {};
      for (const k of keys) {
        const sArr = start[k]!;
        const eArr = data[k];
        out[k] = eArr.map((v, i) => sArr[i] + (v - sArr[i]) * e);
      }
      setDisplay(out as T);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [data, duration, baselinePerChannel]);

  // Update lastRef after tween completes (or when data updates)
  useEffect(() => { if (data) lastRef.current = data; }, [data]);

  const style = useMemo(() => ({
    opacity: inFlag ? 1 : 0,
    transform: `scaleY(${inFlag ? 1 : 0})`,
    transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
  }), [inFlag, duration]);

  return { mounted, in: inFlag, display, style } as const;
}
