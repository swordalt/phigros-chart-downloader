
import React, { useEffect, useRef, useState } from 'react';

interface CrackingEffectProps {
    audio?: HTMLAudioElement | null;
}

export const CrackingEffect: React.FC<CrackingEffectProps> = ({ audio }) => {
    const crackCanvasRef = useRef<HTMLCanvasElement>(null);
    const crackReqRef = useRef<number | null>(null);
    const crackDisplacementRef = useRef<SVGFEDisplacementMapElement>(null);
    const [crackMapUrl, setCrackMapUrl] = useState<string>('');
    const mapGeneratedRef = useRef<boolean>(false);

    // Cracking Effect Logic
    useEffect(() => {
        if (!audio) return;
        
        // Reset generation flag when song changes or effect re-mounts
        mapGeneratedRef.current = false;
        setCrackMapUrl('');

        const canvas = crackCanvasRef.current;
        let gl: WebGLRenderingContext | null = null;
        let program: WebGLProgram | null = null;
        let buffer: WebGLBuffer | null = null;

        if (canvas) {
            gl = canvas.getContext('webgl', { alpha: true, preserveDrawingBuffer: true });
            if (gl) {
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
                
                // Updated Shader: Supports both visual cracks and displacement map generation
                const fsSource = `
                    precision highp float;
                    uniform vec2 u_resolution;
                    uniform int u_mode; // 0 = Visual Cracks, 1 = Displacement Map

                    // Hash function
                    vec2 hash2(vec2 p) {
                        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
                        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
                    }
                    
                    // Returns: x = distance to edge, y = cell hash x, z = cell hash y
                    vec3 voronoi(vec2 uv) {
                        vec2 p = floor(uv);
                        vec2 f = fract(uv);
                        
                        vec2 mr;
                        float md = 8.0;
                        vec2 mg;
                        
                        // First pass: find closest point
                        for(int j=-1; j<=1; j++)
                        for(int i=-1; i<=1; i++) {
                            vec2 b = vec2(float(i), float(j));
                            vec2 r = vec2(b) - f + (hash2(p + b) * 0.5 + 0.5); 
                            float d = dot(r, r);
                            
                            if(d < md) {
                                md = d;
                                mr = r; 
                                mg = b;
                            }
                        }
                        
                        // Second pass: distance to borders
                        md = 8.0;
                        for(int j=-1; j<=1; j++)
                        for(int i=-1; i<=1; i++) {
                            vec2 b = vec2(float(i), float(j));
                            vec2 r = vec2(b) - f + (hash2(p + b) * 0.5 + 0.5);
                            
                            if(dot(mr-r, mr-r) > 0.00001) {
                                float d = dot(0.5*(mr+r), normalize(r-mr)); 
                                md = min(md, d);
                            }
                        }
                        
                        // Get hash of the closest cell for displacement color
                        vec2 cellHash = hash2(p + mg) * 0.5 + 0.5; // Map to 0..1
                        
                        return vec3(md, cellHash.x, cellHash.y);
                    }

                    void main() {
                        vec2 uv = gl_FragCoord.xy / u_resolution.y; 
                        uv *= 2.5; // Scale pattern
                        
                        vec3 v = voronoi(uv);
                        float edgeDist = v.x;
                        vec2 cellHash = v.yz;
                        
                        if (u_mode == 1) {
                            // Displacement Map Generation Mode
                            // Output random colors per cell for shards
                            gl_FragColor = vec4(cellHash.x, cellHash.y, 0.0, 1.0);
                        } else {
                            // Visual Cracks Mode
                            float crack = 1.0 - smoothstep(0.0, 0.02, edgeDist);
                            // Visual lines: Light blueish white, lower opacity
                            gl_FragColor = vec4(0.85, 0.92, 1.0, crack * 0.4); 
                        }
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
            const t = audio.currentTime;
            
            // Effect Timings (Shorter duration: 0.6s fade)
            const crackStart = 113.5; // 1:53.5
            const fadeEnd = 114.1; // 0.6s later (was 114.5)
            
            // Darkening Logic removed as per request

            // 2. Crack Logic
            if (gl && program && canvas) {
                if (t >= crackStart && t < fadeEnd) {
                     if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                        canvas.width = canvas.clientWidth;
                        canvas.height = canvas.clientHeight;
                        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                    }

                    gl.useProgram(program);
                    const resLoc = gl.getUniformLocation(program, 'u_resolution');
                    const modeLoc = gl.getUniformLocation(program, 'u_mode');
                    gl.uniform2f(resLoc, canvas.width, canvas.height);

                    // --- Generation Phase (First Frame of Impact) ---
                    if (!mapGeneratedRef.current) {
                        // Render Displacement Map
                        gl.uniform1i(modeLoc, 1);
                        gl.clearColor(0.5, 0.5, 0.0, 1.0); // Neutral gray background
                        gl.clear(gl.COLOR_BUFFER_BIT);
                        gl.drawArrays(gl.TRIANGLES, 0, 6);
                        
                        // Save to Data URL for SVG Filter
                        const mapData = canvas.toDataURL();
                        setCrackMapUrl(mapData);
                        mapGeneratedRef.current = true;
                    }

                    // --- Animation Phase (Visual Cracks) ---
                    gl.uniform1i(modeLoc, 0);
                    gl.clearColor(0, 0, 0, 0);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);

                    const progress = (t - crackStart)/(fadeEnd - crackStart);
                    const intensity = 1.0 - Math.pow(progress, 0.5); // Non-linear fade

                    // Opacity of white lines
                    canvas.style.opacity = intensity.toString();
                     
                    // Displacement Scale: High initial warp (100) fading to 0
                    if (crackDisplacementRef.current) {
                        crackDisplacementRef.current.setAttribute('scale', (100 * intensity).toString());
                    }

                } else {
                    if (canvas) canvas.style.opacity = "0";
                    if (crackDisplacementRef.current) crackDisplacementRef.current.setAttribute('scale', "0");
                }
            }
            
            crackReqRef.current = requestAnimationFrame(update);
        };

        update();

        return () => {
            if (crackReqRef.current) cancelAnimationFrame(crackReqRef.current);
            if (gl && buffer) gl.deleteBuffer(buffer);
            if (gl && program) gl.deleteProgram(program);
        };
    }, [audio]);

    return (
        <>
            <style>{`
                .effect-cracking-active {
                    filter: url(#crack-displacement);
                    will-change: filter;
                    transform: translateZ(0);
                }
            `}</style>
            <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none', visibility: 'hidden' }}>
                <defs>
                    <filter id="crack-displacement">
                        {/* 
                            Default to identity/neutral displacement if map not ready to prevent errors.
                            feImage is used to inject the WebGL generated Voronoi map.
                        */}
                        {crackMapUrl ? (
                            <feImage href={crackMapUrl} result="map" width="100%" height="100%" preserveAspectRatio="none" />
                        ) : (
                            <feFlood floodColor="#808000" result="map" /> 
                        )}
                        <feDisplacementMap 
                            ref={crackDisplacementRef} 
                            in="SourceGraphic" 
                            in2="map" 
                            scale="0" 
                            xChannelSelector="R" 
                            yChannelSelector="G" 
                        />
                    </filter>
                </defs>
            </svg>
            <canvas ref={crackCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[50]" style={{opacity: 0, transform: 'translateZ(0)', willChange: 'opacity'}} />
        </>
    );
};
