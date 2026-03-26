// WebGL 2 cloud tunnel shader - ported from Shadertoy
(function () {
  const canvas = document.getElementById("bgcanvas-wrap");
  if (!canvas || canvas.tagName !== "CANVAS") return;

  const gl = canvas.getContext("webgl2");
  if (!gl) {
    console.error("WebGL 2 not supported");
    return;
  }

  const vertSrc = `#version 300 es
    in vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragSrc = `#version 300 es
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    out vec4 fragColor;

    #define T (iTime * 0.2)
    #define N normalize
    #define P(z) (vec3(tanh(cos((z) * .6) * .7) * 6., \
                       tanh(cos((z) * .3) * .8) * 6., (z)))

    void main()
    {
        vec4 o = vec4(0);
        vec2 u = gl_FragCoord.xy;

        float s, d = 0.0;
        vec3 r = vec3(iResolution, 1.0), q, p, ro = P(T),
             Z = N( P(T+1.) - ro),
             X = N(vec3(Z.z,0,-Z.x));
        u = (u-r.xy/2.)/r.y;

        vec3 D = vec3(u, 1) * mat3(-X, cross(X, Z), Z);

        for(float i = 0.0; i < 40.0; i++) {
            p = ro + D * d ;
            q = P(p.z);
            s = .75 - min(length(p.y  - q.x),
                      min(length(p.xy - q.xy),
                          length(p.x  - q.y)));
            for (float n = .06; n < 3.; n += n)
                s -= abs(dot(sin(p * n * 102.), vec3(.01))) / n;
            s = .0005+abs(s)*.15;

            d += s;
            o += s;
        }

        o = tanh(o * abs(vec4(3,3,3,1) / vec4(cos(T * 1.5 + p*2.), 1)) * exp(-d) / 1.4);

        fragColor = vec4(o.rgb, 1.0);
    }
  `;

  function createShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = createShader(gl.VERTEX_SHADER, vertSrc);
  const fs = createShader(gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  // Fullscreen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "iResolution");
  const uTime = gl.getUniformLocation(prog, "iTime");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener("resize", resize);
  resize();

  // Start time offset to match the Shadertoy t=10 param
  const startTime = performance.now() / 1000 - 10;

  function render() {
    const t = performance.now() / 1000 - startTime;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }

  render();
})();
