export const compose = (...fns: Function[]) => (x: any) =>
  fns.reduceRight((acc, fn) => fn(acc), x);

export const pipe = (...fns: Function[]) => (x: any) =>
  fns.reduce((acc, fn) => fn(acc), x);

export const map = <T, U>(fn: (item: T) => U, array: T[]): U[] =>
  array.map(fn);

export const filter = <T>(fn: (item: T) => boolean, array: T[]): T[] =>
  array.filter(fn);

export const reduce = <T, U>(fn: (acc: U, item: T) => U, initial: U, array: T[]): U =>
  array.reduce(fn, initial);

export const curry = <T extends any[], U>(fn: (...args: T) => U) => {
  return function curried(...args: any[]) {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...next: any[]) => curried(...args, ...next);
  };
};

export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};