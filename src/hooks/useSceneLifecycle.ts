import { useEffect } from 'react';

const useSceneLifecycle = (onMount: () => void, onUnmount: () => void) => {
    useEffect(() => {
        // Call the onMount function when the component mounts
        onMount();

        // Cleanup function to call onUnmount when the component unmounts
        return () => {
            onUnmount();
        };
    }, [onMount, onUnmount]);
};

export default useSceneLifecycle;