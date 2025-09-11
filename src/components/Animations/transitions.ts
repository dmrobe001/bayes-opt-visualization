export const fadeIn = (element: HTMLElement, duration: number) => {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms`;
    requestAnimationFrame(() => {
        element.style.opacity = '1';
    });
};

export const fadeOut = (element: HTMLElement, duration: number) => {
    element.style.opacity = '1';
    element.style.transition = `opacity ${duration}ms`;
    requestAnimationFrame(() => {
        element.style.opacity = '0';
    });
};

export const slideIn = (element: HTMLElement, duration: number, direction: 'left' | 'right' | 'top' | 'bottom') => {
    const translateValue = direction === 'left' ? '-100%' :
                           direction === 'right' ? '100%' :
                           direction === 'top' ? '-100%' : '100%';
    element.style.transform = `translate(${translateValue})`;
    element.style.transition = `transform ${duration}ms`;
    requestAnimationFrame(() => {
        element.style.transform = 'translate(0)';
    });
};

export const slideOut = (element: HTMLElement, duration: number, direction: 'left' | 'right' | 'top' | 'bottom') => {
    const translateValue = direction === 'left' ? '-100%' :
                           direction === 'right' ? '100%' :
                           direction === 'top' ? '-100%' : '100%';
    element.style.transform = 'translate(0)';
    element.style.transition = `transform ${duration}ms`;
    requestAnimationFrame(() => {
        element.style.transform = `translate(${translateValue})`;
    });
};