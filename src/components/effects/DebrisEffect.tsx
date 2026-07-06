
import React, { useEffect, useRef } from 'react';

interface DebrisEffectProps {
    audio?: HTMLAudioElement | null;
}

export const DebrisEffect: React.FC<DebrisEffectProps> = ({ audio }) => {
    const debrisCanvasRef = useRef<HTMLCanvasElement>(null);
    const debrisReqRef = useRef<number | null>(null);

    useEffect(() => {
        if (!audio) return;

        const canvas = debrisCanvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: {
            x: number;
            y: number;
            size: number;
            speed: number;
            opacity: number;
        }[] = [];

        // 1:33 = 93s (Start)
        // 2:36 = 156s (Fade Out Start)
        const startTime = 93.0;
        const fadeOutStart = 156.0;
        const endTime = 158.0;

        const renderDebris = () => {
             if (!audio || !debrisCanvasRef.current) return;
             const t = audio.currentTime;
             const canvas = debrisCanvasRef.current;
             const ctx = canvas.getContext('2d');
             if (!ctx) return;

             // Manage Canvas Size
             if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                 canvas.width = canvas.clientWidth;
                 canvas.height = canvas.clientHeight;
             }

             ctx.clearRect(0, 0, canvas.width, canvas.height);

             // Do nothing if completely outside relevant time
             if (t < startTime || t > endTime + 1) { 
                 if (particles.length > 0) particles = []; 
                 debrisReqRef.current = requestAnimationFrame(renderDebris);
                 return;
             }
             
             // Calculate progress (0 to 1) for intensity scaling
             let progress = 0;
             if (t >= startTime && t < fadeOutStart) {
                progress = (t - startTime) / (fadeOutStart - startTime);
             } else if (t >= fadeOutStart) {
                progress = 1.0;
             }
             
             // Calculate Global Opacity for smooth removal
             let globalAlpha = 1.0;
             if (t >= fadeOutStart) {
                 globalAlpha = 1.0 - (t - fadeOutStart) / (endTime - fadeOutStart);
                 if (globalAlpha < 0) globalAlpha = 0;
             }

             // Spawning Logic
             if (t < fadeOutStart && t >= startTime) {
                 // Start slow, speed up generation
                 const spawnCount = Math.floor(1 + progress * 2); 
                 for (let i = 0; i < spawnCount; i++) {
                     // 20% chance per slot to keep density managed
                     if (Math.random() < 0.2) { 
                         particles.push({
                             x: Math.random() * canvas.width,
                             y: canvas.height + 60, 
                             size: 20 + Math.random() * 80, 
                             // Speed accelerates with progress
                             speed: (2 + Math.random() * 3) * (1 + progress * 5), 
                             opacity: 0.1 + Math.random() * 0.4
                         });
                     }
                 }
             }

             // Update and Draw
             ctx.fillStyle = '#000000';
             
             for (let i = particles.length - 1; i >= 0; i--) {
                 const p = particles[i];
                 p.y -= p.speed;
                 
                 const alpha = p.opacity * globalAlpha;
                 if (alpha > 0) {
                    ctx.globalAlpha = alpha;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                 }

                 // Cleanup offscreen
                 if (p.y < -100) {
                     particles.splice(i, 1);
                 }
             }
             ctx.globalAlpha = 1.0;

             debrisReqRef.current = requestAnimationFrame(renderDebris);
        };

        debrisReqRef.current = requestAnimationFrame(renderDebris);

        return () => {
            if (debrisReqRef.current) cancelAnimationFrame(debrisReqRef.current);
            particles = [];
        };
    }, [audio]);

    return (
        <canvas
            ref={debrisCanvasRef}
            className="absolute inset-0 pointer-events-none z-[2]"
            style={{ transform: 'translateZ(0)' }}
        />
    );
};
