import { useEffect } from 'react';

const useResize = (callback: () => void) => {
    useEffect(() => {
        const handleResize = () => {
            callback();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [callback]);
};

export default useResize;