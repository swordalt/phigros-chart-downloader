
import React, { useEffect, useRef } from 'react';

interface RadialGlowEffectProps {
    audio?: HTMLAudioElement | null;
    /**
     * Function to determine intensity of the glow based on time.
     */
    getIntensity: (t: number) => number;
}

export const RadialGlowEffect: React.FC<RadialGlowEffectProps> = ({ audio, getIntensity }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef<number | null>(null);

    useEffect(() => {
        if (!audio) return;

        const canvas = canvasRef.current;
        let gl: WebGLRenderingContext | null = null;
        let program: WebGLProgram | null = null;
        let buffer: WebGLBuffer | null = null;

        if (canvas) {
            gl = canvas.getContext('webgl', { alpha: true });
            if (gl) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

                const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
                    const shader = gl.createShader(type)!;
                    gl.shaderSource(shader, source);
                    gl.compileShader(shader);
                    return shader;
                };

                const vsSource = `
                    attribute vec2 position;
                    void main() {
                        gl_Position = vec4(position, 0.0, 1.0);
                    }
                `;
                
                const fsSource = `
                    precision mediump float;
                    uniform float u_time;
                    uniform vec2 u_resolution;
                    uniform float u_intensity;
                    
                    void main() {
                        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
                        float dist = length(uv);
                        
                        // Radial glow
                        float glow = 0.02 / (dist * dist + 0.01);
                        glow *= u_intensity;
                        
                        // Color: Reddish/Orange
                        vec3 color = vec3(1.0, 0.3, 0.1) * glow;
                        
                        // Soft edge
                        float alpha = smoothstep(1.0, 0.0, dist);
                        
                        gl_FragColor = vec4(color, 1.0);
                    }
                `;

                const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
                const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
                program = gl.createProgram()!;
                gl.attachShader(program, vs);
                gl.attachShader(program, fs);
                gl.linkProgram(program);

                buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
                
                const posAttrib = gl.getAttribLocation(program, 'position');
                gl.enableVertexAttribArray(posAttrib);
                gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);
            }
        }

        const update = () => {
            if (!audio || !canvas || !gl || !program) {
                 reqRef.current = requestAnimationFrame(update);
                 return;
            }

            const t = audio.currentTime;
            const intensity = getIntensity(t);

            if (intensity > 0.01) {
                if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                    canvas.width = canvas.clientWidth;
                    canvas.height = canvas.clientHeight;
                    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                }
                
                gl.useProgram(program);
                
                const timeLoc = gl.getUniformLocation(program, 'u_time');
                const resLoc = gl.getUniformLocation(program, 'u_resolution');
                const intLoc = gl.getUniformLocation(program, 'u_intensity');
                
                gl.uniform1f(timeLoc, t);
                gl.uniform2f(resLoc, canvas.width, canvas.height);
                gl.uniform1f(intLoc, intensity);
                
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                
                canvas.style.opacity = "1";
            } else {
                canvas.style.opacity = "0";
            }

            reqRef.current = requestAnimationFrame(update);
        };

        update();

        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
            if (gl && buffer) gl.deleteBuffer(buffer);
            if (gl && program) gl.deleteProgram(program);
        };
    }, [audio, getIntensity]);

    return (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[2]" style={{ opacity: 0, transform: 'translateZ(0)', willChange: 'opacity' }} />
    );
};
