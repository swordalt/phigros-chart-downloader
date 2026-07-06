
import React, { useCallback } from 'react';
import { SongEffectType } from '../song-effects';
import { GlitchEffect } from './effects/GlitchEffect';
import { DebrisEffect } from './effects/DebrisEffect';
import { CrackingEffect } from './effects/CrackingEffect';
import { TextScrambleEffect } from './effects/TextScrambleEffect';
import { FireworkEffect } from './effects/FireworkEffect';
import { OverlayEffect } from './effects/OverlayEffect';
import { RadialGlowEffect } from './effects/RadialGlowEffect';

interface SongEffectRendererProps {
    effect: SongEffectType;
    audio?: HTMLAudioElement | null;
    songName?: string;
}

export const SongEffectRenderer: React.FC<SongEffectRendererProps> = ({ effect, audio, songName }) => {
    
    // --- Configuration Logic ---

    // Config for DESTRUCTION 3,2,1
    const getDestructionGlitchIntensity = useCallback((t: number) => {
        const config = {
            isActive: true,
            heavyThreshold: 0.96,
            minorThreshold: 0.6,
            heavyScaleBase: 20,
            heavyScaleVar: 20,
            minorScaleBase: 2,
            minorScaleVar: 3,
            rgbOffsetMax: 3
        };

        if (t < 63.5) {
            config.isActive = false;
        } else if (t < 75.5) {
            // Normal - defaults
        } else if (t < 93.0) {
            config.isActive = false;
        } else if (t < 105.2) {
            // LOW intensity
            config.heavyThreshold = 0.98;
            config.minorThreshold = 0.8;
            config.heavyScaleBase = 10;
            config.heavyScaleVar = 10;
            config.minorScaleBase = 1;
            config.minorScaleVar = 2;
            config.rgbOffsetMax = 1.5;
        } else if (t < 156.0) {
            // HIGH intensity
            config.heavyThreshold = 0.92;
            config.minorThreshold = 0.5;
            config.heavyScaleBase = 20;
            config.heavyScaleVar = 20;
            config.minorScaleBase = 4;
            config.minorScaleVar = 5;
            config.rgbOffsetMax = 3;
        } else if (t < 158.0) {
            // Fade OUT
            const p = (t - 156.0) / 2.0; 
            const multiplier = 1 - p;
            config.heavyScaleBase *= multiplier;
            config.heavyScaleVar *= multiplier;
            config.minorScaleBase *= multiplier;
            config.minorScaleVar *= multiplier;
            config.rgbOffsetMax *= multiplier;
            config.heavyThreshold = 0.96 + (0.04 * p); 
            config.minorThreshold = 0.6 + (0.4 * p);
            if (multiplier <= 0.05) config.isActive = false;
        } else {
            config.isActive = false;
        }
        return config;
    }, []);

    // Config for Luminescence
    const getLuminescenceOverlay = useCallback(() => {
        // Dim Screen & Blackout removed as per request
        return { dim: 0, black: 0 };
    }, []);

    const getLuminescenceFireworkOpacity = useCallback((t: number) => {
        const fireworkStart = 133.0;
        const fireworkFadeOutStart = 151.0; 
        const fireworkFadeOutEnd = 153.0;   

        if (t < fireworkStart || t > fireworkFadeOutEnd) return 0;

        let opacity = 1;
        if (t >= fireworkFadeOutStart) {
            opacity = 1 - (t - fireworkFadeOutStart) / (fireworkFadeOutEnd - fireworkFadeOutStart);
        }
        return opacity;
    }, []);

    // Config for Distorted Fate
    const getDistortedFateOverlay = useCallback(() => {
        // Blackout removed as per request
        return { black: 0 };
    }, []);

    const getDistortedFateGlow = useCallback((t: number) => {
        let intensity = 0;
        if (t >= 99.5 && t < 125.5) {
            // Burst
            const dt = t - 99.5;
            intensity = 5.0 * Math.exp(-dt * 5.0);
        } else if (t >= 125.5 && t < 149.0) {
            // Pulse
            const dt = t - 125.5;
            const ramp = Math.min(1, dt / 2.0);
            intensity = 1.5 * ramp + Math.sin(t * 3.0) * 0.2; 
        } else if (t >= 149.0 && t < 150.0) {
            // Fade
            const dt = t - 149.0;
            intensity = 1.5 * (1.0 - dt);
        }
        return Math.max(0, intensity);
    }, []);

    if (!effect) return null;

    return (
        <>
            {effect === 'glitch' && (
                <>
                    <GlitchEffect 
                        audio={audio} 
                        getIntensity={songName === 'DESTRUCTION 3,2,1' ? getDestructionGlitchIntensity : undefined} 
                    />
                    {songName === 'DESTRUCTION 3,2,1' && <DebrisEffect audio={audio} />}
                    {songName === 'Aleph-0' && <TextScrambleEffect audio={audio} />}
                </>
            )}

            {effect === 'luminescence' && (
                <>
                    <OverlayEffect audio={audio} getOpacity={getLuminescenceOverlay} />
                    <FireworkEffect 
                        audio={audio} 
                        getOpacity={getLuminescenceFireworkOpacity} 
                        timeOffset={133.0} 
                    />
                </>
            )}

            {effect === 'distorted-fate' && (
                <>
                    <OverlayEffect audio={audio} getOpacity={getDistortedFateOverlay} />
                    <RadialGlowEffect audio={audio} getIntensity={getDistortedFateGlow} />
                </>
            )}
            
            {effect === 'cracking' && <CrackingEffect audio={audio} />}
        </>
    );
};
