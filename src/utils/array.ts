export function unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
}

export function flatten<T>(array: T[][]): T[] {
    return [].concat(...array);
}

export function range(start: number, end: number): number[] {
    return Array.from({ length: end - start }, (_, i) => start + i);
}

export function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function sample<T>(array: T[], n: number): T[] {
    const shuffled = shuffle(array);
    return shuffled.slice(0, n);
}