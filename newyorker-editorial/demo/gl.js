// WebGL2 Compositor for "New Yorker Gouache Editorial (《纽约客》炭笔水粉插画报)"
// Physical passes:
//   1. FS_PAPER: 300gsm Warm Cotton Rag Magazine Stock (#F5EFE4) with isotropic felt weave & cotton fibres
//   2. FS_GOUACHE: Velvety Matte Opaque Gouache (丝绒哑光不透明水粉) with dry-brush bristle feathering & pigment overlap
//   3. FS_CHARCOAL: Dry Vine Charcoal & Graphite Construction Lines (松弛干炭笔与起稿铅笔线，附着于纸纹高点)
//   4. FS_TYPE: Crisp Letterpress Editorial Serif Typography (报刊铅字印刷层)
//   5. FS_FINAL: Cotton-paper micro-relief emboss & subtle warm reading-room vignette

export const W = 1920, H = 1080;

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*.5+.5; gl_Position = vec4(p,0,1); }`;

const COTTON_TOOTH = `
float h21(vec2 p){ p = fract(p*vec2(127.1, 311.7)); p += dot(p, p+34.23); return fract(p.x*p.y); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0 - 2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  return vn(p)*0.50 + vn(p*2.1+11.3)*0.28 + vn(p*4.3+27.1)*0.14 + vn(p*8.7+43.9)*0.08;
}

// 300gsm cold-press cotton rag paper tooth [0,1]
float cottonTooth(vec2 px){
  float fine = vn(px / 1.45) * 0.36 + vn(px / 3.1 + 19.0) * 0.34 + vn(px / 6.8 + 47.0) * 0.20;
  // Short random cotton linter fibres
  float fibreX = (vn(vec2(px.x / 7.5, px.y / 1.7) + 13.0) - 0.5) * 0.14;
  float fibreY = (vn(vec2(px.x / 1.7, px.y / 7.5) + 71.0) - 0.5) * 0.14;
  return smoothstep(0.18, 0.84, fine + fibreX + fibreY + 0.04);
}
`;

// Pass 1: Warm Cotton Rag Magazine Stock (#F5EFE4)
const FS_PAPER = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform vec2 uRes; uniform vec3 uPaperCol;
${COTTON_TOOTH}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float t = cottonTooth(px);
  float mottle = fbm(px / 220.0) * 0.6 + fbm(px / 65.0 + 15.0) * 0.4;

  // Tiny warm cotton flecks
  float fleck = smoothstep(0.86, 0.94, vn(px / 3.2 + 83.0)) * 0.025;
  vec3 c = uPaperCol * (0.975 + 0.042 * mottle - fleck);
  c *= (0.97 + 0.045 * t);

  o = vec4(clamp(c, 0.0, 1.0), 0.0);
}`;

// Pass 2: Velvety Matte Opaque Gouache (丝绒哑光不透明水粉)
const FS_GOUACHE = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uLayer; uniform vec2 uRes;
${COTTON_TOOTH}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec4 g = texture(uLayer, uv);
  if (g.a < 0.003) { o = prev; return; }

  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float t = cottonTooth(px);

  // Dry-brush bristle breakup where gouache alpha tapers at stroke ends
  float thr = 1.0 - g.a * 1.32;
  float cov = smoothstep(thr - 0.08, thr + 0.08, t) * smoothstep(0.0, 0.14, g.a);

  // Velvety chalky matte micro-texture (不透明水粉特有的粉质丝绒哑光感)
  float chalk = (vn(px / 1.9 + 31.0) - 0.5) * 0.045 + (h21(floor(px * 0.9)) - 0.5) * 0.028;
  // Slight edge richness where wet gouache meets dry cotton
  float blurA = textureLod(uLayer, uv, 2.5).a;
  float rim = clamp(g.a - blurA, 0.0, 1.0) * 0.12;

  vec3 gouacheCol = g.rgb * (1.0 + chalk - rim * 0.08);
  // Subtle pigment interaction when overlapping an existing gouache plate
  if (prev.a > 0.15) {
    gouacheCol *= (1.0 - 0.045 * prev.a);
  }

  o = vec4(mix(prev.rgb, clamp(gouacheCol, 0.0, 1.0), cov), clamp(prev.a + cov * 0.75, 0.0, 1.0));
}`;

// Pass 3: Dry Vine Charcoal & Graphite Pencil Sketch Lines (干炭笔与铅笔速写线)
const FS_CHARCOAL = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uLayer; uniform vec2 uRes;
${COTTON_TOOTH}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec4 ch = texture(uLayer, uv);
  if (ch.a < 0.003) { o = prev; return; }

  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float t = cottonTooth(px);
  float fineGrain = h21(floor(px * 1.15) + 19.0);

  // Charcoal sticks strongly to the raised ridges of the cotton tooth, leaving tiny powdery skips in valleys
  float toothStick = smoothstep(1.0 - ch.a * 1.26 - 0.09, 1.0 - ch.a * 1.26 + 0.09, t * 0.78 + fineGrain * 0.22);
  float cov = clamp(toothStick * smoothstep(0.0, 0.16, ch.a), 0.0, 0.98);

  vec3 col = ch.rgb * (0.95 + 0.08 * fineGrain);
  o = vec4(mix(prev.rgb, col, cov), clamp(prev.a + cov * 0.3, 0.0, 1.0));
}`;

// Pass 4: Crisp Letterpress Editorial Serif Typography
const FS_TYPE = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uLayer; uniform vec2 uRes;
${COTTON_TOOTH}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec4 ty = texture(uLayer, uv);
  if (ty.a < 0.003) { o = prev; return; }

  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float t = cottonTooth(px);
  float cov = clamp(ty.a * (0.96 + 0.05 * t), 0.0, 1.0);
  o = vec4(mix(prev.rgb, ty.rgb, cov), prev.a);
}`;

// Pass 5: Final Cotton-Rag Emboss & Subtle Editorial Page Framing
const FS_FINAL = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uS; uniform vec2 uRes;
${COTTON_TOOTH}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  vec4 S = texture(uS, uv);

  // Cotton paper micro-emboss (velvety gouache smooths the tooth slightly)
  float t0 = cottonTooth(px);
  float tx = cottonTooth(px + vec2(1.0, 0.0));
  float ty = cottonTooth(px + vec2(0.0, 1.0));
  float g = (tx - t0) * -0.75 + (ty - t0) * 0.75;
  float smoothFactor = 1.0 - 0.38 * S.a;
  vec3 c = S.rgb * (1.0 + g * 0.095 * smoothFactor);

  // Subtle warm reading-lamp vignette at the page corners
  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float vig = 1.0 - 0.09 * dot(q, q);
  c *= mix(vec3(0.96, 0.94, 0.90), vec3(1.0), vig);

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

export function makeEditorialComp(canvas, w = W, h = H) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false, alpha: false });
  if (!gl) throw new Error('WebGL2 unavailable');

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const P = {
    paper: createProg(gl, FS_PAPER),
    gouache: createProg(gl, FS_GOUACHE),
    charcoal: createProg(gl, FS_CHARCOAL),
    type: createProg(gl, FS_TYPE),
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
  const flatTex = makeTex(false);

  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.viewport(0, 0, w, h);

  const quad = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  return {
    beginPaper(paperRGB = [0.961, 0.941, 0.898]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[cur].f);
      gl.disable(gl.BLEND);
      gl.useProgram(P.paper.p);
      gl.uniform2f(P.paper.u.uRes, w, h);
      gl.uniform3f(P.paper.u.uPaperCol, ...paperRGB);
      quad();
    },
    gouachePass(canvas2d) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mipTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.gouache.p);
      gl.uniform2f(P.gouache.u.uRes, w, h);
      gl.uniform1i(P.gouache.u.uPrev, 0);
      gl.uniform1i(P.gouache.u.uLayer, 1);
      quad();
      cur = nx;
    },
    charcoalPass(canvas2d) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, flatTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.charcoal.p);
      gl.uniform2f(P.charcoal.u.uRes, w, h);
      gl.uniform1i(P.charcoal.u.uPrev, 0);
      gl.uniform1i(P.charcoal.u.uLayer, 1);
      quad();
      cur = nx;
    },
    typePass(canvas2d) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, flatTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.type.p);
      gl.uniform2f(P.type.u.uRes, w, h);
      gl.uniform1i(P.type.u.uPrev, 0);
      gl.uniform1i(P.type.u.uLayer, 1);
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
