
import React, { useEffect, useRef } from 'react';

interface FireworkEffectProps {
    audio?: HTMLAudioElement | null;
    /**
     * Function to determine opacity of the canvas based on time.
     */
    getOpacity: (t: number) => number;
    /**
     * Time offset to subtract from audio.currentTime for the shader uniform.
     * Default: 0
     */
    timeOffset?: number;
}

export const FireworkEffect: React.FC<FireworkEffectProps> = ({ audio, getOpacity, timeOffset = 0 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef<number | null>(null);

    useEffect(() => {
        if (!audio) return;

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        const canvas = canvasRef.current;
        let gl: WebGLRenderingContext | null = null;
        let program: WebGLProgram | null = null;
        let buffer: WebGLBuffer | null = null;
        let vertexCount = 0;

        if (canvas) {
            gl = canvas.getContext('webgl', { alpha: true, depth: false, antialias: false });
            
            if (gl) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

                const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
                    const shader = gl.createShader(type)!;
                    gl.shaderSource(shader, source);
                    gl.compileShader(shader);
                    return shader;
                };

                if (isIOS) {
                    const vsSource = `
                        attribute vec2 a_data; // x = firework_index, y = type (0=head, >0=particle)
                        uniform float u_time;
                        uniform vec2 u_resolution;
                        varying vec3 v_color;
                        varying float v_alpha;

                        float hash(float n) { return fract(sin(n) * 43758.5453123); }

                        void main() {
                            float i = a_data.x;
                            float type = a_data.y;
                            float lifespan = 4.0; 
                            float spacing = 0.6; 
                            float t = u_time * 0.7 + i * spacing;
                            float id = floor(t / lifespan);
                            float fr = fract(t / lifespan);
                            float xTarget = (hash(id + i * 123.4) - 0.5) * 1.6;
                            float yTarget = (hash(id + i * 567.8) - 0.2) * 0.8;
                            float risingPhase = 0.35;
                            vec2 pos = vec2(-10.0);
                            float size = 0.0;
                            vec3 color = vec3(0.0);
                            float alpha = 0.0;

                            if (fr < risingPhase) {
                                if (type < 0.5) {
                                    float p = fr / risingPhase;
                                    pos = vec2(xTarget, mix(-1.2, yTarget, p));
                                    size = 35.0; 
                                    color = vec3(1.0, 0.9, 0.5);
                                    alpha = 1.0;
                                }
                            } else {
                                if (type > 0.5) {
                                    float p = (fr - risingPhase) / (1.0 - risingPhase);
                                    vec2 center = vec2(xTarget, yTarget);
                                    vec3 baseColor = vec3(hash(id + 1.0), hash(id + 2.0), hash(id + 3.0));
                                    color = mix(baseColor, vec3(1.0), 0.4);
                                    float j = type;
                                    float ang = j * 0.1256 + hash(id) * 6.28;
                                    float speed = 0.3 + hash(j * 17.0) * 0.5;
                                    vec2 partPos = center + vec2(cos(ang), sin(ang)) * p * speed;
                                    partPos.y -= p * p * 0.15;
                                    pos = partPos;
                                    size = 20.0 * (1.0 - p); 
                                    alpha = 1.0 - p;
                                }
                            }
                            v_color = color;
                            v_alpha = alpha;
                            float aspect = u_resolution.x / u_resolution.y;
                            gl_Position = vec4(pos.x / (aspect * 0.5), pos.y / 0.5, 0.0, 1.0);
                            gl_PointSize = size * (u_resolution.y / 800.0);
                        }
                    `;
                    const fsSource = `
                        precision mediump float;
                        varying vec3 v_color;
                        varying float v_alpha;
                        void main() {
                            vec2 coord = gl_PointCoord - vec2(0.5);
                            float dist = length(coord);
                            if (dist > 0.5) discard;
                            float glow = 1.0 - (dist * 2.0);
                            glow = pow(glow, 1.5); 
                            gl_FragColor = vec4(v_color, v_alpha * glow * 0.6);
                        }
                    `;
                    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
                    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
                    program = gl.createProgram()!;
                    gl.attachShader(program, vs);
                    gl.attachShader(program, fs);
                    gl.linkProgram(program);

                    const data: number[] = [];
                    for(let i=0; i<12; i++) {
                        data.push(i, 0); 
                        for(let j=1; j<=50; j++) data.push(i, j);
                    }
                    vertexCount = data.length / 2;
                    buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
                    const aData = gl.getAttribLocation(program, 'a_data');
                    gl.enableVertexAttribArray(aData);
                    gl.vertexAttribPointer(aData, 2, gl.FLOAT, false, 0, 0);
                } else {
                    const vsSource = `
                        attribute vec2 position;
                        void main() {
                            gl_Position = vec4(position, 0.0, 1.0);
                        }
                    `;
                    const fsSource = `
                        precision highp float;
                        uniform float u_time;
                        uniform vec2 u_resolution;
                        float hash(float n) { return fract(sin(n) * 43758.5453123); }
                        void main() {
                            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
                            vec3 finalColor = vec3(0.0);
                            for(float i = 0.0; i < 12.0; i++) {
                                float lifespan = 4.0; 
                                float spacing = 0.6; 
                                float t = u_time * 0.7 + i * spacing;
                                float id = floor(t / lifespan);
                                float fr = fract(t / lifespan);
                                float xTarget = (hash(id + i * 123.4) - 0.5) * 1.6;
                                float yTarget = (hash(id + i * 567.8) - 0.2) * 0.8;
                                float risingPhase = 0.35;
                                if (fr < risingPhase) {
                                    float p = fr / risingPhase;
                                    vec2 pos = vec2(xTarget, mix(-1.2, yTarget, p));
                                    float dist = length(uv - pos);
                                    float head = 0.003 / dist;
                                    float trail = 0.0;
                                    if (uv.y < pos.y && uv.y > -1.2) {
                                        float xDist = abs(uv.x - pos.x);
                                        trail = (0.0005 / xDist) * smoothstep(0.1, 0.0, pos.y - uv.y - 0.05);
                                        trail *= smoothstep(-1.2, -1.0, uv.y);
                                    }
                                    finalColor += (head + trail * 0.5) * vec3(1.0, 0.9, 0.5);
                                } else {
                                    float p = (fr - risingPhase) / (1.0 - risingPhase);
                                    vec2 pos = vec2(xTarget, yTarget);
                                    vec3 color = vec3(hash(id + 1.0), hash(id + 2.0), hash(id + 3.0));
                                    color = mix(color, vec3(1.0), 0.4);
                                    float particles = 0.0;
                                    for(float j = 0.0; j < 50.0; j++) {
                                        float ang = j * 0.1256 + hash(id) * 6.28;
                                        float speed = 0.3 + hash(j * 17.0) * 0.5;
                                        vec2 partPos = pos + vec2(cos(ang), sin(ang)) * p * speed;
                                        partPos.y -= p * p * 0.15;
                                        float pDist = length(uv - partPos);
                                        particles += (0.0008 / pDist) * (1.0 - p);
                                    }
                                    finalColor += particles * color;
                                }
                            }
                            gl_FragColor = vec4(finalColor, clamp(finalColor.r + finalColor.g + finalColor.b, 0.0, 1.0) * 0.8);
                        }
                    `;
                    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
                    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
                    program = gl.createProgram()!;
                    gl.attachShader(program, vs);
                    gl.attachShader(program, fs);
                    gl.linkProgram(program);
                    vertexCount = 6;
                    buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
                    const posAttrib = gl.getAttribLocation(program, 'position');
                    gl.enableVertexAttribArray(posAttrib);
                    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);
                }
            }
        }

        const update = () => {
            if (!audio || !canvas || !gl || !program) {
                 reqRef.current = requestAnimationFrame(update);
                 return;
            }

            const t = audio.currentTime;
            const opacity = getOpacity(t);

            if (opacity > 0.001) {
                if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                    canvas.width = canvas.clientWidth;
                    canvas.height = canvas.clientHeight;
                    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                }

                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);

                gl.useProgram(program);
                
                const timeLoc = gl.getUniformLocation(program, 'u_time');
                const resLoc = gl.getUniformLocation(program, 'u_resolution');
                
                // Use offset time
                gl.uniform1f(timeLoc, t - timeOffset);
                gl.uniform2f(resLoc, canvas.width, canvas.height);

                if (isIOS) {
                    gl.drawArrays(gl.POINTS, 0, vertexCount);
                } else {
                    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
                }
                
                canvas.style.opacity = opacity.toString();
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

    }, [audio, getOpacity, timeOffset]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none z-[2] transition-opacity duration-100 ease-linear"
            style={{ transform: 'translateZ(0)', willChange: 'opacity' }}
        />
    );
};
