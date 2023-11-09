window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  const gl = canvas.getContext('webgl');
  
  const vertexShaderSource = `
  attribute vec4 a_position;

  void main() {
      gl_Position = a_position;
  }
  `;

  const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 iResolution = u_resolution;
      vec2 uv = (fragCoord - 0.5 * iResolution) / iResolution.y;
      float t = u_time * 0.1;

      uv *= mat2(cos(t), -sin(t), sin(t), cos(t));

      vec3 ro = vec3(0.0, 0.0, -1.0);
      vec3 lookat = mix(vec3(0.0), vec3(-1.0, 0.0, -1.0), sin(t * 1.56) * 0.5 + 0.5);
      float zoom = mix(0.2, 0.7, sin(t) * 0.5 + 0.5);

      vec3 f = normalize(lookat - ro);
      vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
      vec3 u = cross(f, r);
      vec3 c = ro + f * zoom;
      vec3 i = c + uv.x * r + uv.y * u;

      vec3 rd = normalize(i - ro);

      //float radius = mix(0.3, 1.5, sin(t * 0.4) * 0.5 + 0.5);
      float radius = 0.5;
      float dS, dO;
      vec3 p;

      for (int i = 0; i < 100; i++) {
          p = ro + rd * dO;
          dS = -(length(vec2(length(p.xz) - 1.0, p.y)) - radius);
          if (dS < 0.001)
              break;
          dO += dS;
      }
      

      vec3 col = vec3(
        0.0
      );

      if (dS < 0.001) {
          float x = atan(p.x, p.z) + t * 0.5;
          float y = atan(length(p.xz) - 1.0, p.y);

          float bands = sin(y * 10.0 + x * 30.0);
          float ripples = sin((x * 10.0 - y * 30.0) * 3.0) * 0.5 + 0.5;
          float waves = sin(x * 2.0 - y * 6.0 + t * 20.0);

          float b1 = smoothstep(-0.2, 0.2, bands);
          float b2 = smoothstep(-0.2, 0.2, bands - 0.5);

          float m = b1 * (1.0 - b2);
          m = max(m, ripples * b2 * max(0.0, waves));
          m += max(0.0, waves * 0.3 * b2);

          col += mix(m, 1.0 - m, smoothstep(-0.3, 0.3, cos(x + t)));
      }

      fragColor = vec4(col, 1.0);
  }

  

  void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      vec4 fragColor;

      mainImage(fragColor, fragCoord);

      gl_FragColor = fragColor;
  }
  `;

  function compileShader(gl, source, type){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);

    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      console.log("Shader compilation error: ", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
      console.log("Program linking error: ", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  function resizeCanvasToDisplaySize(canvas) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if(canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
    return false;
  }

  function render() {
    resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), gl.canvas.width, gl.canvas.height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), performance.now() / 1000);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }

  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
  const program = createProgram(gl, vertexShader, fragmentShader);

  if(program) render();
});
