
import React, { useEffect, useRef } from 'react';

interface GlitchEffectProps {
    audio?: HTMLAudioElement | null;
    /**
     * Function that returns configuration for the glitch effect at time `t`.
     * If not provided, defaults to continuous medium intensity.
     */
    getIntensity?: (t: number) => {
        isActive: boolean;
        heavyThreshold: number;
        minorThreshold: number;
        heavyScaleBase: number;
        heavyScaleVar: number;
        minorScaleBase: number;
        minorScaleVar: number;
        rgbOffsetMax: number;
    };
}

export const GlitchEffect: React.FC<GlitchEffectProps> = ({ audio, getIntensity }) => {
    const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
    const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
    const redOffsetRef = useRef<SVGFEOffsetElement>(null);
    const blueOffsetRef = useRef<SVGFEOffsetElement>(null);
    const reqRef = useRef<number | null>(null);

    // Glitch Effect Logic (Visual Only)
    useEffect(() => {
        let lastTime = 0;
        const fps = 24; 
        const interval = 1000 / fps;

        const animate = (time: number) => {
            if (time - lastTime > interval) {
                lastTime = time;

                let config = {
                    isActive: true,
                    heavyThreshold: 0.96,
                    minorThreshold: 0.6,
                    heavyScaleBase: 20,
                    heavyScaleVar: 20,
                    minorScaleBase: 2,
                    minorScaleVar: 3,
                    rgbOffsetMax: 3
                };

                if (audio && getIntensity) {
                    config = getIntensity(audio.currentTime);
                }

                if (!config.isActive) {
                    // Force stabilization
                    if (displacementRef.current) displacementRef.current.setAttribute('scale', "0");
                    if (redOffsetRef.current) redOffsetRef.current.setAttribute('dx', "0");
                    if (blueOffsetRef.current) blueOffsetRef.current.setAttribute('dx', "0");
                } else {
                    // 1. Tearing Effect (Displacement Map)
                    if (turbulenceRef.current && displacementRef.current) {
                        const r = Math.random();
                        if (r > config.heavyThreshold) {
                             // Big Glitch
                             turbulenceRef.current.setAttribute('seed', Math.round(Math.random() * 1000).toString());
                             displacementRef.current.setAttribute('scale', (config.heavyScaleBase + Math.random() * config.heavyScaleVar).toString());
                             turbulenceRef.current.setAttribute('baseFrequency', `0.001 ${0.02 + Math.random() * 0.1}`); 
                        } else if (r > config.minorThreshold) {
                             // Minor Glitch
                             turbulenceRef.current.setAttribute('seed', Math.round(Math.random() * 1000).toString());
                             displacementRef.current.setAttribute('scale', (config.minorScaleBase + Math.random() * config.minorScaleVar).toString());
                             turbulenceRef.current.setAttribute('baseFrequency', `0.002 ${0.3 + Math.random() * 0.5}`); 
                        } else {
                             // Stabilization
                             displacementRef.current.setAttribute('scale', "0");
                        }
                    }

                    // 2. RGB Split
                    if (redOffsetRef.current && blueOffsetRef.current) {
                        const r = Math.random();
                        if (r > 0.8) {
                            const rX = (Math.random() - 0.5) * config.rgbOffsetMax;
                            const bX = (Math.random() - 0.5) * config.rgbOffsetMax;
                            
                            redOffsetRef.current.setAttribute('dx', rX.toFixed(1));
                            blueOffsetRef.current.setAttribute('dx', bX.toFixed(1));
                        } else {
                            redOffsetRef.current.setAttribute('dx', "0");
                            blueOffsetRef.current.setAttribute('dx', "0");
                        }
                    }
                }
            }

            reqRef.current = requestAnimationFrame(animate);
        };

        reqRef.current = requestAnimationFrame(animate);

        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
    }, [audio, getIntensity]);

    return (
        <>
            <style>{`
                .effect-glitch-active {
                    filter: url(#glitch-filter);
                    will-change: filter;
                    transform: translateZ(0);
                }
            `}</style>
            <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none', visibility: 'hidden' }}>
                <defs>
                    <filter id="glitch-filter" x="-20%" y="-20%" width="140%" height="140%" primitiveUnits="userSpaceOnUse">
                        <feTurbulence 
                            ref={turbulenceRef}
                            type="fractalNoise" 
                            baseFrequency="0.002 0.4" 
                            numOctaves="1" 
                            seed="1" 
                            result="noise" 
                        />
                        <feDisplacementMap 
                            ref={displacementRef}
                            in="SourceGraphic" 
                            in2="noise" 
                            scale="0" 
                            xChannelSelector="R" 
                            yChannelSelector="G" 
                            result="displaced"
                        />
                        <feColorMatrix 
                            in="displaced" 
                            type="matrix" 
                            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" 
                            result="red"
                        />
                        <feOffset ref={redOffsetRef} in="red" dx="0" dy="0" result="red_offset" />
                        <feColorMatrix 
                            in="displaced" 
                            type="matrix" 
                            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" 
                            result="green"
                        />
                        <feColorMatrix 
                            in="displaced" 
                            type="matrix" 
                            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" 
                            result="blue"
                        />
                        <feOffset ref={blueOffsetRef} in="blue" dx="0" dy="0" result="blue_offset" />
                        <feBlend in="red_offset" in2="green" mode="screen" result="rg" />
                        <feBlend in="rg" in2="blue_offset" mode="screen" result="rgb" />
                    </filter>
                </defs>
            </svg>
            <div 
                className="absolute inset-0 pointer-events-none z-[40] opacity-30 mix-blend-overlay"
                style={{
                    backgroundImage: `repeating-linear-gradient(transparent 0px, transparent 2px, #000 3px), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundSize: '100% 6px, 150px 150px'
                }}
                aria-hidden="true"
            />
        </>
    );
};
