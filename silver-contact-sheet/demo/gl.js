// WebGL2 Physically-Inspired Compositor for:
// "Silver Gelatin Contact Sheet & China-Marker Proof (银盐接触印相 × 红铅笔暗房手记)"
// Passes:
//   1. FS_BARYTA: Darkroom Safe-Light Bench + 310gsm Ilford Baryta Fiber-Base Paper (#EFEAD9) with fixer stain
//   2. FS_SILVER: Hurter-Driffield S-Curve Silver-Gelatin Emulsion (D-max #0B0C0E, Selenium Split-Tone Midtones, Tri-X 400 Film Grain Clumping)
//   3. FS_WAX_LOUPE: China-Marker / Grease-Pencil Wax Buildup (#E63B2E / #F2B830) + 8x Schneider Optical Loupe Refraction
//   4. FS_FINAL: Baryta Pearl Micro-Sheen Relief & Darkroom Vignette

export const W = 1920, H = 1080;

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*.5+.5; gl_Position = vec4(p,0,1); }`;

const NOISE_LIB = `
float h21(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0 - 2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  mat2 m = mat2(0.8, -0.6, 0.6, 0.8);
  float v = 0.0, a = 0.5;
  for(int i=0; i<4; i++){ v += a * vn(p); p = m * p * 2.03 + 17.3; a *= 0.5; }
  return v;
}

// Baryta fiber paper micro-pearl tooth [0,1]
float barytaTooth(vec2 px){
  float n = vn(px / 1.8) * 0.45 + vn(px / 4.2 + 23.0) * 0.35 + vn(px / 9.5 + 61.0) * 0.20;
  return smoothstep(0.18, 0.84, n);
}

// Tri-X 400 silver halide grain clumping [-0.5, 0.5]
float silverGrain(vec2 px){
  float g1 = h21(floor(px * 0.95) + vec2(13.7, 71.3));
  float g2 = vn(px * 0.62 + 41.0);
  float g3 = vn(px * 0.28 + 109.0);
  return (g1 * 0.48 + g2 * 0.34 + g3 * 0.18) - 0.5;
}
`;

// Pass 1: Darkroom Wet Bench + Baryta Fiber-Base Paper Sheet
const FS_BARYTA = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform vec2 uRes;
${NOISE_LIB}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float tooth = barytaTooth(px);

  // Darkroom slate bench around the 28px outer margin, with subtle amber-red safelight reflection
  float wood = fbm(vec2(px.x / 190.0, px.y / 38.0) + 11.0);
  vec3 benchCol = vec3(0.055, 0.052, 0.058) + vec3(0.035, 0.012, 0.008) * wood;

  // Baryta contact-sheet paper bounds (inset 28px)
  float mx = 28.0, my = 26.0;
  float deckle = (vn(px / 14.0 + 7.0) - 0.5) * 3.5;
  float dEdge = min(min(px.x - mx, uRes.x - mx - px.x), min(px.y - my, uRes.y - my - px.y)) + deckle;
  float paperMask = smoothstep(-1.5, 1.8, dEdge);
  float shadowMask = smoothstep(-16.0, 2.0, dEdge) * (1.0 - paperMask);

  // Warm Baryta paper base (#EFEAD9) with subtle fixer/hypo chemical clouds
  float chem = fbm(px / 220.0 + 37.0);
  vec3 baryta = vec3(0.937, 0.918, 0.855) * (0.975 + 0.035 * chem) * (0.98 + 0.03 * tooth);

  // Subtle darkroom hypo water-ring stain near top-right & bottom-left
  float ringDist = length(px - vec2(uRes.x - 210.0, 145.0));
  float ring = exp(-pow((ringDist - 68.0) / 7.5, 2.0)) * 0.045 + smoothstep(72.0, 0.0, ringDist) * 0.02;
  baryta -= vec3(ring * 0.6, ring * 0.75, ring * 1.1);

  vec3 col = benchCol * (1.0 - shadowMask * 0.65);
  col = mix(col, baryta, paperMask);
  o = vec4(clamp(col, 0.0, 1.0), paperMask);
}`;

// Pass 2: Silver-Gelatin Emulsion Exposure (Black-and-White Contact Sheet & Enlarger Prints)
const FS_SILVER = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uSilver; uniform vec2 uRes;
${NOISE_LIB}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec4 S = texture(uSilver, uv);
  if (S.a < 0.003) { o = prev; return; }

  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float tooth = barytaTooth(px);
  float grain = silverGrain(px);

  // Detect warm amber film-edge markings ("KODAK TRI-X 400") vs monochrome silver-gelatin emulsion
  float isAmberCode = smoothstep(0.12, 0.35, S.r - S.b) * smoothstep(0.35, 0.75, S.r);
  float lum = dot(S.rgb, vec3(0.299, 0.587, 0.114));

  // Midtone-weighted Tri-X 400 silver halide grain clumping
  float midWeight = 4.0 * lum * (1.0 - lum);
  float grainedLum = clamp(lum + grain * (0.095 * midWeight + 0.025), 0.0, 1.0);

  // Split-grade selenium-toned silver gelatin curve:
  //   - Deep D-max silver blacks: #0A0B0E (cool-neutral dense silver)
  //   - Midtones: #5E636B -> #9D9E98 (platinum-selenium cool-warm split)
  //   - Highlights: #EFEAD9 (warm Baryta fiber paper base)
  vec3 dMaxBlack = vec3(0.039, 0.043, 0.055);
  vec3 shadowTone = vec3(0.185, 0.198, 0.220);
  vec3 midTone    = vec3(0.545, 0.556, 0.552);
  vec3 highTone   = vec3(0.935, 0.916, 0.855) * (0.985 + 0.025 * tooth);

  vec3 silverCol;
  if (grainedLum < 0.32) {
    silverCol = mix(dMaxBlack, shadowTone, smoothstep(0.0, 0.32, grainedLum));
  } else if (grainedLum < 0.72) {
    silverCol = mix(shadowTone, midTone, smoothstep(0.32, 0.72, grainedLum));
  } else {
    silverCol = mix(midTone, highTone, smoothstep(0.72, 1.0, grainedLum));
  }

  vec3 finalRgb = mix(silverCol, S.rgb * (0.96 + 0.06 * grain), isAmberCode);
  o = vec4(mix(prev.rgb, clamp(finalRgb, 0.0, 1.0), S.a), prev.a);
}`;

// Pass 3: Optical 8x Loupe Magnification + China-Marker / Grease-Pencil Wax Pass
const FS_WAX_LOUPE = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uWax; uniform vec2 uRes; uniform vec3 uLoupe;
${NOISE_LIB}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float tooth = barytaTooth(px);

  // 1) Check if pixel is inside the 8x Schneider Darkroom Loupe lens (uLoupe = cx, cy, r)
  vec2 dLoupe = px - uLoupe.xy;
  float rL = length(dLoupe);
  float R = uLoupe.z;

  vec3 baseCol = texture(uPrev, uv).rgb;

  if (R > 10.0 && rL < R * 1.32) {
    // Cast shadow of the loupe barrel on the contact sheet
    vec2 dShadow = px - (uLoupe.xy + vec2(14.0, 18.0));
    float rS = length(dShadow);
    if (rL >= R && rS < R * 1.16) {
      float sh = smoothstep(R * 1.16, R * 0.95, rS) * 0.52;
      baseCol *= (1.0 - sh);
    }

    // Inside the optical glass lens: 1.36x magnification with barrel distortion & subtle RGB chromatic aberration
    if (rL < R * 0.92) {
      float normR = rL / (R * 0.92);
      float zoom = 1.0 / (1.36 - 0.08 * normR * normR);
      vec2 samplePx = uLoupe.xy + dLoupe * zoom;
      vec2 sampleUv = vec2(samplePx.x / uRes.x, 1.0 - samplePx.y / uRes.y);
      vec2 caShift = (dLoupe / max(1.0, R)) * 0.0018 * normR;

      float cR = texture(uPrev, sampleUv + caShift).r;
      float cG = texture(uPrev, sampleUv).g;
      float cB = texture(uPrev, sampleUv - caShift).b;
      vec3 magCol = vec3(cR, cG, cB) * 1.05;

      // Also magnify the China-marker wax layer under the loupe!
      vec4 wMag = texture(uWax, sampleUv);
      if (wMag.a > 0.01) {
        magCol = mix(magCol, wMag.rgb, wMag.a * 0.92);
      }

      // Multi-coated optical glass specular reflection arc
      float specArc = smoothstep(0.72, 0.86, normR) * (1.0 - smoothstep(0.86, 0.91, normR))
                    * smoothstep(0.15, 0.85, (-dLoupe.x * 0.7 - dLoupe.y * 0.7) / max(1.0, rL));
      magCol += vec3(0.20, 0.25, 0.30) * specArc;
      // Subtle warm-cyan lens coating tint near rim
      magCol *= (1.0 - 0.08 * pow(normR, 3.0));
      baseCol = magCol;
    }
  }

  // 2) Composite China-Marker / Grease-Pencil Wax Layer (and Loupe metal bezel drawn on uWax)
  vec4 Wx = texture(uWax, uv);
  if (Wx.a > 0.003) {
    // Detect red/yellow grease-pencil wax vs solid metal loupe housing
    float isWax = smoothstep(0.18, 0.45, max(Wx.r - Wx.b, Wx.r - Wx.g));
    float waxSkip = mix(1.0, smoothstep(0.12, 0.72, tooth + (vn(px / 2.4 + 19.0) - 0.5) * 0.35), isWax * 0.48);
    // Waxy sheen highlight along grease-pencil ridges
    vec3 waxCol = Wx.rgb * (0.94 + 0.12 * tooth * isWax);
    float cov = clamp(Wx.a * waxSkip, 0.0, 1.0);
    baseCol = mix(baseCol, clamp(waxCol, 0.0, 1.0), cov);
  }

  o = vec4(clamp(baseCol, 0.0, 1.0), 1.0);
}`;

// Pass 4: Baryta Pearl Surface Micro-Relief & Safe-Light Vignette
const FS_FINAL = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uS; uniform vec2 uRes;
${NOISE_LIB}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  vec4 S = texture(uS, uv);

  float t0 = barytaTooth(px);
  float tx = barytaTooth(px + vec2(1.0, 0.0));
  float ty = barytaTooth(px + vec2(0.0, 1.0));
  float g = (tx - t0) * -0.65 + (ty - t0) * 0.65;
  vec3 c = S.rgb + vec3(g * 0.028);

  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float vig = 1.0 - 0.065 * dot(q, q);
  c *= vig;

  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) + '\n' + src.slice(0, 240));
  }
  return s;
}

function createProg(gl, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'p');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const a = gl.getActiveUniform(p, i);
    u[a.name] = gl.getUniformLocation(p, a.name);
  }
  return { p, u };
}

export function makeSilverContactComp(canvas, w = W, h = H) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false, alpha: false });
  if (!gl) throw new Error('WebGL2 unavailable');

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const P = {
    baryta: createProg(gl, FS_BARYTA),
    silver: createProg(gl, FS_SILVER),
    waxLoupe: createProg(gl, FS_WAX_LOUPE),
    final: createProg(gl, FS_FINAL),
  };

  function makeTex() {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  function makeFBO() {
    const t = makeTex();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, f };
  }

  const FBO = [makeFBO(), makeFBO()];
  let cur = 0;
  const silverTex = makeTex();
  const waxTex = makeTex();

  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.viewport(0, 0, w, h);

  const quad = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  return {
    beginBaryta() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[cur].f);
      gl.disable(gl.BLEND);
      gl.useProgram(P.baryta.p);
      gl.uniform2f(P.baryta.u.uRes, w, h);
      quad();
    },
    silverPass(canvas2d) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, silverTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.silver.p);
      gl.uniform2f(P.silver.u.uRes, w, h);
      gl.uniform1i(P.silver.u.uPrev, 0);
      gl.uniform1i(P.silver.u.uSilver, 1);
      quad();
      cur = nx;
    },
    waxLoupePass(canvas2d, loupe = [0, 0, 0]) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, waxTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.waxLoupe.p);
      gl.uniform2f(P.waxLoupe.u.uRes, w, h);
      gl.uniform3f(P.waxLoupe.u.uLoupe, loupe[0], loupe[1], loupe[2]);
      gl.uniform1i(P.waxLoupe.u.uPrev, 0);
      gl.uniform1i(P.waxLoupe.u.uWax, 1);
      quad();
      cur = nx;
    },
    finish() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);
      gl.useProgram(P.final.p);
      gl.uniform2f(P.final.u.uRes, w, h);
      gl.uniform1i(P.final.u.uS, 0);
      quad();
    },
  };
}
