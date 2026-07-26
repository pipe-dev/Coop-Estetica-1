import React, { useEffect, useRef } from 'react';

const vertexShaderSource = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5; // map to 0..1
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  varying vec2 vUv;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;

  // Palette function for iridescence
  vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
      return a + b*cos( 6.28318*(c*t+d) );
  }

  uniform vec3 u_baseColor;
  uniform vec3 u_midColor;
  uniform vec3 u_lightColor;
  uniform vec3 u_glintColor;

  uniform vec3 u_targetBaseColor;
  uniform vec3 u_targetMidColor;
  uniform vec3 u_targetLightColor;
  uniform vec3 u_targetGlintColor;

  void main() {
    // Normalize and adjust aspect ratio
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv.x *= u_resolution.x / u_resolution.y;

    // Mouse influence (normalized and centered)
    vec2 mouse = u_mouse / u_resolution.xy;
    mouse.x *= u_resolution.x / u_resolution.y;
    
    // Diagonal rotation (45 degrees)
    float angle = 0.785398; 
    float s = sin(angle);
    float c = cos(angle);
    mat2 rot = mat2(c, -s, s, c);
    
    vec2 rotatedUv = rot * uv;
    
    // Fluid displacement using sine waves, time, and mouse
    float distToMouse = length(uv - mouse);
    float mouseForce = smoothstep(0.8, 0.0, distToMouse); // Stronger near mouse
    
    float time = u_time * 0.5; // Increased global speed (was 0.2)
    float wave1 = sin(rotatedUv.x * 5.0 + time + mouseForce * 2.0);
    float wave2 = cos(rotatedUv.y * 3.0 - time * 1.5 + mouseForce * 1.5);
    
    // Distort the rotated UV (increased distortion amplitudes for more fluid motion)
    float distortion = wave1 * 0.4 + wave2 * 0.3;
    float stripPos = rotatedUv.x * 2.0 + distortion;
    
    // Create the bands
    float bands = sin(stripPos * 4.0);
    
    // Map bands to colors for a metallic sheen
    float normBands = bands * 0.5 + 0.5;
    
    // Precise 12s cycle: 4s Blue -> 2s transition -> 4s Gold -> 2s transition back to Blue
    float periodTime = mod(u_time, 12.0);
    float shiftWave = smoothstep(4.0, 6.0, periodTime) * (1.0 - smoothstep(10.0, 12.0, periodTime));

    vec3 baseColor   = mix(u_baseColor,   u_targetBaseColor,   shiftWave);
    vec3 midColor    = mix(u_midColor,    u_targetMidColor,    shiftWave);
    vec3 lightColor  = mix(u_lightColor,  u_targetLightColor,  shiftWave);
    vec3 glintColor  = mix(u_glintColor,  u_targetGlintColor,  shiftWave);

    // Metallic lighting response curve (sharp peaks, dark valleys)
    float metallicCurve = pow(normBands, 2.0); // Broad metallic
    float specular = pow(normBands, 12.0);     // Sharp reflection
    float extremeGlint = pow(normBands, 40.0); // Intense edge light
    
    vec3 color = mix(baseColor, midColor, metallicCurve);
    color = mix(color, lightColor, specular);
    color = mix(color, glintColor, extremeGlint);
    
    // Add dynamic glint depending on time and mouse
    float glintWave = sin(rotatedUv.y * 10.0 - time * 2.0) * 0.5 + 0.5;
    color += glintColor * extremeGlint * glintWave * 0.5;

    // Soften shadows so the background isn't pitch black
    vec3 shadowColor = baseColor * 0.35;
    vec3 finalColor = mix(shadowColor, color, smoothstep(-0.7, 0.9, bands));

    // Boost overall brightness and clarity
    finalColor *= 1.15;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const createShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const InteractiveBackground = ({ variant = 'gold' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', { 
      antialias: false, 
      alpha: false,
      powerPreference: 'low-power' // [PERFORMANCE] Request low power GPU
    });

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Compile shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(program));
      return;
    }

    // Set up geometry (full screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Get locations
    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseUniformLocation = gl.getUniformLocation(program, 'u_mouse');

    const baseColorLocation = gl.getUniformLocation(program, 'u_baseColor');
    const midColorLocation = gl.getUniformLocation(program, 'u_midColor');
    const lightColorLocation = gl.getUniformLocation(program, 'u_lightColor');
    const glintColorLocation = gl.getUniformLocation(program, 'u_glintColor');

    const targetBaseColorLocation = gl.getUniformLocation(program, 'u_targetBaseColor');
    const targetMidColorLocation = gl.getUniformLocation(program, 'u_targetMidColor');
    const targetLightColorLocation = gl.getUniformLocation(program, 'u_targetLightColor');
    const targetGlintColorLocation = gl.getUniformLocation(program, 'u_targetGlintColor');

    // Classic Gold Palette
    const goldPalette = {
      base: [0.15, 0.10, 0.00],
      mid: [0.60, 0.45, 0.10],
      light: [1.00, 0.85, 0.40],
      glint: [1.00, 0.95, 0.80]
    };

    // Primary & Target Palettes
    const isBlueVariant = (variant === 'blue' || variant === 'roseGold');
    const primaryColors = isBlueVariant ? {
      base: [0.02, 0.08, 0.22],   // Deep oceanic sapphire base
      mid: [0.10, 0.42, 0.85],    // Metallic Electric Sapphire Blue (#1A6BD9)
      light: [0.45, 0.75, 0.98],  // Luminous Cyan Specular (#73BFFA)
      glint: [0.85, 0.94, 1.00]   // Glacial Ice Blue Glint (#D9F0FF)
    } : goldPalette;

    const targetColors = isBlueVariant ? goldPalette : goldPalette;

    // State
    let animationFrameId;
    let startTime = performance.now();
    let mouse = { x: 0, y: 0 };
    let targetMouse = { x: 0, y: 0 };
    
    // FPS Throttling for low-end devices (Cap at 30 FPS)
    let lastRenderTime = 0;
    const fpsInterval = 1000 / 30; // 33.33ms

    // Resize handler
    const resizeCanvas = () => {
      // [PERFORMANCE] Downscale resolution for mobile to save GPU fill rate
      const isMobile = window.innerWidth < 768;
      // Use 0.75 for mobile (tostadoras), 1 for desktop. Never go above 1.
      const dpr = isMobile ? 0.75 : 1;
      
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Mouse handler
    const handleMouseMove = (e) => {
      const isMobile = window.innerWidth < 768;
      const dpr = isMobile ? 0.75 : 1;
      // Flip Y axis for WebGL
      targetMouse.x = e.clientX * dpr;
      targetMouse.y = (window.innerHeight - e.clientY) * dpr;
    };
    
    // For touch devices
    const handleTouchMove = (e) => {
        if (e.touches.length > 0) {
            const isMobile = window.innerWidth < 768;
            const dpr = isMobile ? 0.75 : 1;
            targetMouse.x = e.touches[0].clientX * dpr;
            targetMouse.y = (window.innerHeight - e.touches[0].clientY) * dpr;
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    // Render loop
    const render = (now) => {
      animationFrameId = requestAnimationFrame(render);
      
      // Calculate elapsed time since last render
      const elapsed = now - lastRenderTime;

      // If enough time has elapsed, draw the next frame
      if (elapsed > fpsInterval) {
        lastRenderTime = now - (elapsed % fpsInterval);

        // Lerp mouse for smooth following
        mouse.x += (targetMouse.x - mouse.x) * 0.05;
        mouse.y += (targetMouse.y - mouse.y) * 0.05;

        const currentTime = (now - startTime) * 0.001; // in seconds

        gl.useProgram(program);

        // Bind buffer
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        // Set uniforms
        gl.uniform1f(timeUniformLocation, currentTime);
        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
        gl.uniform2f(mouseUniformLocation, mouse.x, mouse.y);

        gl.uniform3fv(baseColorLocation, primaryColors.base);
        gl.uniform3fv(midColorLocation, primaryColors.mid);
        gl.uniform3fv(lightColorLocation, primaryColors.light);
        gl.uniform3fv(glintColorLocation, primaryColors.glint);

        gl.uniform3fv(targetBaseColorLocation, targetColors.base);
        gl.uniform3fv(targetMidColorLocation, targetColors.mid);
        gl.uniform3fv(targetLightColorLocation, targetColors.light);
        gl.uniform3fv(targetGlintColorLocation, targetColors.glint);

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
      
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1, /* Stay behind everything */
        pointerEvents: 'none', /* Don't block clicks */
        backgroundColor: '#000000'
      }}
    />
  );
};

export default InteractiveBackground;
