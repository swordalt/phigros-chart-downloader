
import React, { useEffect, useRef } from 'react';

interface OverlayEffectProps {
    audio?: HTMLAudioElement | null;
    /**
     * Function that returns the opacity (0 to 1) at a given time `t`.
     * Can return multiple opacities if managing multiple layers (like dim vs blackout),
     * but for simplicity, we can pass CSS variable updaters or just simple opacity.
     */
    getOpacity: (t: number) => { dim?: number; black?: number };
}

export const OverlayEffect: React.FC<OverlayEffectProps> = ({ audio, getOpacity }) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const reqRef = useRef<number | null>(null);

    useEffect(() => {
        const update = () => {
            if (!audio || !overlayRef.current) {
                reqRef.current = requestAnimationFrame(update);
                return;
            }

            const t = audio.currentTime;
            const { dim = 0, black = 0 } = getOpacity(t);

            overlayRef.current.style.setProperty('--overlay-dim-opacity', dim.toString());
            overlayRef.current.style.setProperty('--overlay-black-opacity', black.toString());

            reqRef.current = requestAnimationFrame(update);
        };

        reqRef.current = requestAnimationFrame(update);

        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
    }, [audio, getOpacity]);

    return (
        <div ref={overlayRef} className="absolute inset-0 pointer-events-none z-[1]">
             <div 
                className="absolute inset-0 bg-black transition-opacity duration-100 ease-linear"
                style={{ zIndex: 1, opacity: 'var(--overlay-black-opacity, 0)', transform: 'translateZ(0)', willChange: 'opacity' }}
            />
            <div 
                className="absolute inset-0 bg-black transition-opacity duration-100 ease-linear"
                style={{ zIndex: 50, opacity: 'var(--overlay-dim-opacity, 0)', transform: 'translateZ(0)', willChange: 'opacity' }}
            />
        </div>
    );
};
