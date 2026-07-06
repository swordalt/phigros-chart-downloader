
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    audio: HTMLAudioElement;
    color: string;
    height: number;
    opacity: number;
}

// Global singleton to manage AudioContext and SourceNodes effectively across re-renders
// This prevents the "HTMLMediaElement already connected previously to a different MediaElementSourceNode" error.
let audioContext: AudioContext | null = null;
const sourceMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audio, color, height, opacity }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    // Setup Audio Graph
    useEffect(() => {
        if (!audio) return;

        // 1. Init Context (Singleton)
        if (!audioContext) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            audioContext = new AudioContextClass({ latencyHint: 'playback' });
        }
        const ctx = audioContext;
        if (ctx.state === 'suspended') ctx.resume();

        // 2. Get or Create Source Node using Cache
        let source: MediaElementAudioSourceNode;
        try {
            if (sourceMap.has(audio)) {
                source = sourceMap.get(audio)!;
            } else {
                source = ctx.createMediaElementSource(audio);
                sourceMap.set(audio, source);
            }
        } catch (e) {
            console.error("Failed to initialise audio source:", e);
            return;
        }

        // 3. Create Analyser
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256; 
        analyser.smoothingTimeConstant = 0.5;
        
        // 4. Connect Graph: Source -> Analyser -> Destination
        // Reset any existing connections on the source to ensure clean routing
        try {
            source.disconnect();
        } catch {
            // Ignore if not connected
        }
        
        source.connect(analyser);
        analyser.connect(ctx.destination);
        
        analyserRef.current = analyser;

        return () => {
            // Cleanup: Disconnect this specific analyser path
            analyser.disconnect();
            try {
                // Disconnect source from analyser
                source.disconnect(analyser);
                
                // IMPORTANT: Restore direct connection to destination so audio keeps playing 
                // if the visualizer component unmounts (e.g. disabled in settings)
                // We wrap in try/catch just in case, though disconnect() above should have cleared specific paths.
                // However, source.disconnect(analyser) only removes that specific connection. 
                // To be safe, we connect to destination.
                source.connect(ctx.destination);
            } catch {
                // Ignore errors
            }
        };
    }, [audio]);

    // Animation Loop
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        let dataArray: Uint8Array | null = null;
        let isRunning = true;

        // Use ResizeObserver to handle canvas resizing efficiently
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === canvas) {
                    canvas.width = entry.contentRect.width;
                    canvas.height = entry.contentRect.height;
                }
            }
        });
        resizeObserver.observe(canvas);

        const renderFrame = () => {
            if (!isRunning) return;

            const analyser = analyserRef.current;
            
            // If analyser isn't ready, just keep requesting frames until it is
            if (!analyser) {
                if (audio && !audio.paused) {
                    requestRef.current = requestAnimationFrame(renderFrame);
                }
                return;
            }

            const bufferLength = analyser.frequencyBinCount;
            if (!dataArray || dataArray.length !== bufferLength) {
                dataArray = new Uint8Array(bufferLength);
            }
            
            analyser.getByteFrequencyData(dataArray);

            const canvasCtx = canvas.getContext('2d');
            if (!canvasCtx) {
                if (audio && !audio.paused) {
                    requestRef.current = requestAnimationFrame(renderFrame);
                }
                return;
            }

            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            const usefulBufferLength = Math.floor(bufferLength * 0.70);
            const barWidth = (canvas.width / usefulBufferLength);
            let barHeight;
            let x = 0;

            for (let i = 0; i < usefulBufferLength; i++) {
                const value = dataArray[i];
                const percent = value / 255;
                
                // Non-linear scaling
                barHeight = Math.pow(percent, 1.8) * canvas.height * 0.9; 
                
                // Dynamic alpha
                const alpha = Math.max(0.15, Math.pow(percent, 1.5) * 0.7);
                
                canvasCtx.fillStyle = color;
                canvasCtx.globalAlpha = alpha;
                
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

                // Reflection/Cap
                if (barHeight > 2) {
                    canvasCtx.fillStyle = '#ffffff';
                    canvasCtx.globalAlpha = alpha * 0.6;
                    canvasCtx.fillRect(x, canvas.height - barHeight - 4, barWidth - 2, 2);
                }

                x += barWidth;
            }

            if (audio && !audio.paused) {
                requestRef.current = requestAnimationFrame(renderFrame);
            }
        };

        const handlePlay = () => {
            if (!isRunning) return;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(renderFrame);
        };

        const handleSeeked = () => {
            if (!isRunning) return;
            if (audio && audio.paused) {
                // Render one frame to update the visualizer at the new position
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
                requestRef.current = requestAnimationFrame(renderFrame);
            }
        };

        if (audio) {
            audio.addEventListener('play', handlePlay);
            audio.addEventListener('playing', handlePlay);
            audio.addEventListener('seeked', handleSeeked);
        }

        // Start loop (or draw initial frame if paused)
        requestRef.current = requestAnimationFrame(renderFrame);

        return () => {
            isRunning = false;
            resizeObserver.disconnect();
            if (audio) {
                audio.removeEventListener('play', handlePlay);
                audio.removeEventListener('playing', handlePlay);
                audio.removeEventListener('seeked', handleSeeked);
            }
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [audio, color]); // Re-run if audio changes (new analyser) or color changes

    return (
        <canvas
            ref={canvasRef}
            className="fixed bottom-0 left-0 w-full pointer-events-none z-[5]"
            style={{ 
                height: `${height}vh`, 
                opacity: opacity / 100,
                transform: 'translateZ(0)',
                willChange: 'opacity'
            }}
            aria-hidden="true"
        />
    );
};
