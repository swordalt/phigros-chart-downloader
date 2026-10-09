import { useEffect, useState } from 'react';

// Matches Tailwind's `max-md` variant: phones get the mobile layout, tablets and up keep the desktop one.
const MOBILE_QUERY = '(max-width: 767.98px)';

export const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches);

    useEffect(() => {
        const mql = window.matchMedia(MOBILE_QUERY);
        const update = () => setIsMobile(mql.matches);
        update();
        mql.addEventListener('change', update);
        return () => mql.removeEventListener('change', update);
    }, []);

    return isMobile;
};
