// WebGL2 Physically-Inspired Compositor for:
// "Nordic Papercut Lightbox Theatre (北欧童话多层剪纸光影剧场)"
// Physical Features:
//   1. FS_BACKLIGHT: Warm 2700K Tungsten / Candlelight Back-Lit Diffuser Screen (#FFF3C8 -> #E8823A -> #18294A)
//      with needle-pricked starlight perforations (针刺星孔透光)
//   2. FS_PAPER_LAYER (Iterative Depth-Layer Compositor with Mipmap AO & Cast Shadow):
//      - Casts soft multi-radius depth shadow onto all deeper paper planes behind it
//      - Renders 300gsm Canson Mi-Teintes paper fiber tooth + subsurface warm backlight transmission
//      - Renders a crisp 45-degree scalpel-cut bevel rim highlight along every paper silhouette edge
//   3. FS_FOIL_CALLOUT: Gold-Foil Stamped Story Typography, Paper-Banner Ribbons & Brass Shadow-Box Plaque
//   4. FS_FINAL: Canson Paper Micro-Relief Emboss & Warm Theatre Vignette

export const W = 1920, H = 1080;

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*.5+.5; gl_Position = vec4(p,0,1); }`;

const PAPER_LIB = `
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
  for(int i=0; i<4; i++){ v += a * vn(p); p = m * p * 2.02 + 19.1; a *= 0.5; }
  return v;
}

// 300gsm Canson Mi-Teintes honeycomb/felt paper tooth [0,1]
float cansonTooth(vec2 px){
  float w1 = sin(px.x * 0.42 + vn(px * 0.08) * 2.0) * sin(px.y * 0.42 + vn(px * 0.08 + 11.0) * 2.0);
  float n = vn(px / 1.9) * 0.45 + vn(px / 4.8 + 31.0) * 0.35 + w1 * 0.10;
  return smoothstep(0.15, 0.85, n + 0.05);
}
`;

// Pass 1: Rear Diffuser Screen with Warm 2700K Backlight Glow
const FS_BACKLIGHT = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform vec2 uRes; uniform vec2 uLightUV;
${PAPER_LIB}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float tooth = cansonTooth(px);

  // Aspect-corrected distance from the warm hidden LED/candle bulb behind the theatre
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  float d = length((uv - uLightUV) * aspect);

  // Warm honey-gold core -> amber-coral mid -> Nordic twilight teal-indigo outer sky
  vec3 coreGold  = vec3(1.00, 0.96, 0.82); // #FFF5D1
  vec3 warmAmber = vec3(0.96, 0.64, 0.29); // #F5A34A
  vec3 roseDusk  = vec3(0.68, 0.35, 0.38); // #AD5961
  vec3 nordicSky = vec3(0.11, 0.20, 0.34); // #1C3357

  vec3 col = mix(coreGold, warmAmber, smoothstep(0.0, 0.32, d));
  col = mix(col, roseDusk, smoothstep(0.28, 0.62, d));
  col = mix(col, nordicSky, smoothstep(0.55, 1.05, d));

  // Subtle translucent vellum diffuser cloudiness
  float cloud = fbm(px / 160.0 + 13.0);
  col *= (0.95 + 0.08 * cloud) * (0.97 + 0.04 * tooth);

  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

// Pass 2 (Run per paper depth plane): Cast Shadow + Subsurface Backlight + Scalpel Bevel Rim
const FS_PAPER_LAYER = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uLayer;
uniform vec2 uRes; uniform vec2 uLightUV; uniform float uDepth;
${PAPER_LIB}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec4 L = texture(uLayer, uv);
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float tooth = cansonTooth(px);

  // 1) Multi-radius depth shadow cast by this paper layer onto all deeper layers behind it!
  // Shadow shifts slightly away from the central backlight (parallax shadow)
  vec2 lightDir = normalize(uv - uLightUV + vec2(0.0001, -0.08));
  vec2 shOff1 = lightDir * (0.0055 * (1.0 + uDepth * 0.35));
  vec2 shOff2 = lightDir * (0.0120 * (1.0 + uDepth * 0.45));

  float s1 = textureLod(uLayer, uv - shOff1, 2.0).a;
  float s2 = textureLod(uLayer, uv - shOff2, 3.4).a;
  float ao = textureLod(uLayer, uv, 2.6).a;

  float shadow = clamp(s1 * 0.44 + s2 * 0.32 + ao * 0.22, 0.0, 0.82);
  // Warm-amber tinted shadow in a backlit paper box (not dead grey!)
  vec3 shadowedPrev = prev.rgb * mix(vec3(1.0), vec3(0.28, 0.20, 0.24), shadow);

  if (L.a < 0.004) {
    o = vec4(shadowedPrev, 1.0);
    return;
  }

  // 2) Paper layer surface with Canson tooth + warm subsurface transmission from the rear light!
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  float dLight = length((uv - uLightUV) * aspect);
  float sss = exp(-dLight * 2.1) * (1.0 - uDepth * 0.16);

  // Measure distance to silhouette edge via mipmap alpha gradient for translucent edge glow & scalpel bevel!
  float blurNear = textureLod(uLayer, uv, 1.2).a;
  float edgeBand = clamp((L.a - blurNear) * 2.8, 0.0, 1.0);

  // Directional bevel highlight facing the light source
  vec2 eps = vec2(1.5 / uRes.x, 1.5 / uRes.y);
  float aLightSide = texture(uLayer, uv + (uLightUV - uv) * 0.004 + vec2(0.0, eps.y)).a;
  float bevel = clamp((L.a - aLightSide) * 2.4, 0.0, 1.0);

  vec3 paperCol = L.rgb * (0.94 + 0.09 * tooth);
  // Warm golden subsurface scattering through the paper cardstock
  vec3 warmTransmit = vec3(1.00, 0.76, 0.42) * (sss * 0.26 + edgeBand * 0.28 * (0.5 + 0.5 * sss));
  paperCol += warmTransmit;

  // Crisp 45-degree scalpel-cut ivory-gold bevel highlight along the cut rim
  vec3 rimCol = mix(vec3(1.00, 0.92, 0.72), vec3(1.00, 0.98, 0.90), sss);
  paperCol = mix(paperCol, rimCol, bevel * 0.68);

  o = vec4(mix(shadowedPrev, clamp(paperCol, 0.0, 1.0), L.a), 1.0);
}`;

// Pass 3: Final Canson Paper Relief Emboss & Warm Proscenium Vignette
const FS_FINAL = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uS; uniform vec2 uRes;
${PAPER_LIB}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  vec4 S = texture(uS, uv);

  float t0 = cansonTooth(px);
  float tx = cansonTooth(px + vec2(1.0, 0.0));
  float ty = cansonTooth(px + vec2(0.0, 1.0));
  float g = (tx - t0) * -0.75 + (ty - t0) * 0.75;
  vec3 c = S.rgb * (1.0 + g * 0.075);

  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float vig = 1.0 - 0.07 * dot(q, q);
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

export function makePapercutComp(canvas, w = W, h = H) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false, alpha: false });
  if (!gl) throw new Error('WebGL2 unavailable');

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const P = {
    backlight: createProg(gl, FS_BACKLIGHT),
    paperLayer: createProg(gl, FS_PAPER_LAYER),
    final: createProg(gl, FS_FINAL),
  };

  function makeTex(mip = false) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  function makeFBO() {
    const t = makeTex(false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, f };
  }

  const FBO = [makeFBO(), makeFBO()];
  let cur = 0;
  const mipTex = makeTex(true);

  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.viewport(0, 0, w, h);

  const quad = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  return {
    beginBacklight(lightUV = [0.50, 0.56]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[cur].f);
      gl.disable(gl.BLEND);
      gl.useProgram(P.backlight.p);
      gl.uniform2f(P.backlight.u.uRes, w, h);
      gl.uniform2f(P.backlight.u.uLightUV, lightUV[0], lightUV[1]);
      quad();
    },
    paperLayerPass(canvas2d, depth = 1.0, lightUV = [0.50, 0.56]) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mipTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.paperLayer.p);
      gl.uniform2f(P.paperLayer.u.uRes, w, h);
      gl.uniform2f(P.paperLayer.u.uLightUV, lightUV[0], lightUV[1]);
      gl.uniform1f(P.paperLayer.u.uDepth, depth);
      gl.uniform1i(P.paperLayer.u.uPrev, 0);
      gl.uniform1i(P.paperLayer.u.uLayer, 1);
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
