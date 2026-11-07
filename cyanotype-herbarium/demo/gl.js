// WebGL2 Physically-Inspired Compositor for "Botanical Cyanotype Herbarium (19 世纪普鲁士蓝晒标本志)"
// Passes:
//   1. FS_EMULSION: 300gsm Cotton Watercolour Paper (#F4EFE2) coated with Hand-Brushed Prussian Blue Ferric Emulsion (#0A223D -> #1A4E7A) with authentic hake-brush bristle edges
//   2. FS_PHOTOGRAM: Translucent X-Ray UV Photogram Exposure (opaque veins -> #F5F1E6 paper white; translucent lamina -> #7EB0D2 ice-cyan; perimeter -> #061528 deep indigo UV diffraction halo)
//   3. FS_COPPER: Metallic Copper-Gall Dip-Pen Ink (#C87D4B -> #F0BA88) & Cream Herbarium Linen Tapes
//   4. FS_FINAL: Cold-press cotton paper tooth emboss & subtle museum glass vignette

export const W = 1920, H = 1080;

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*.5+.5; gl_Position = vec4(p,0,1); }`;

const PAPER_FIELD = `
float h21(vec2 p){ p = fract(p*vec2(127.1, 311.7)); p += dot(p, p+34.23); return fract(p.x*p.y); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0 - 2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  return vn(p)*0.50 + vn(p*2.05+13.7)*0.28 + vn(p*4.15+29.3)*0.14 + vn(p*8.4+53.1)*0.08;
}

// Rough 300gsm watercolour cotton paper tooth [0,1]
float cottonTooth(vec2 px){
  float n = vn(px / 1.5) * 0.35 + vn(px / 3.3 + 17.0) * 0.34 + vn(px / 7.2 + 43.0) * 0.21;
  n += (vn(vec2(px.x / 8.5, px.y / 1.8) + 11.0) - 0.5) * 0.16;
  return smoothstep(0.16, 0.85, n + 0.04);
}
`;

// Pass 1: Raw Cotton Paper + Hand-Brushed Prussian Blue Cyanotype Emulsion Coat
const FS_EMULSION = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform vec2 uRes; uniform vec3 uPaperCol;
${PAPER_FIELD}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float tooth = cottonTooth(px);

  // Raw unexposed cotton rag paper (#F4EFE2) with subtle age foxing
  float mottle = fbm(px / 210.0) * 0.6 + fbm(px / 65.0 + 19.0) * 0.4;
  vec3 rawPaper = uPaperCol * (0.96 + 0.055 * mottle) * (0.965 + 0.05 * tooth);

  // Hand-brushed emulsion boundary (54px margin on all sides, with horizontal & vertical hake-brush bristle streaks!)
  float marginX = 52.0, marginY = 48.0;
  // High-frequency bristle channels along the stroke direction
  float bristleH = (vn(vec2(px.x * 0.018, px.y * 0.72 + 7.0)) - 0.5) * 34.0
                 + (h21(vec2(0.0, floor(px.y * 0.45))) - 0.5) * 18.0;
  float bristleV = (vn(vec2(px.x * 0.72 + 13.0, px.y * 0.018)) - 0.5) * 30.0
                 + (h21(vec2(floor(px.x * 0.45), 0.0)) - 0.5) * 16.0;

  float dLeft   = px.x - (marginX + bristleH);
  float dRight  = (uRes.x - marginX + bristleH) - px.x;
  float dTop    = px.y - (marginY + bristleV);
  float dBottom = (uRes.y - marginY + bristleV) - px.y;

  float insideDist = min(min(dLeft, dRight), min(dTop, dBottom));
  // Dry-brush breakup at the very tips of the emulsion brushstrokes
  float coatMask = smoothstep(-8.0, 12.0, insideDist - (1.0 - tooth) * 7.5);

  // Rich Prussian Blue chemical emulsion variation (ferric ferrocyanide wash clouds)
  float chemCloud = fbm(px / 165.0 + 31.0) * 0.65 + fbm(px / 42.0 + 73.0) * 0.35;
  // Horizontal brush-pass streaks inside the blue coat
  float brushStreak = (vn(vec2(px.x / 180.0, px.y / 5.5) + 19.0) - 0.5) * 0.08;
  // Darker pooled Prussian Blue rim where the wet brush stopped near the margin
  float edgePool = exp(-pow(max(0.0, insideDist - 4.0) / 18.0, 2.0)) * 0.22;

  vec3 prussianDeep = vec3(0.035, 0.118, 0.224); // #091E39
  vec3 prussianMid  = vec3(0.078, 0.243, 0.408); // #143E68
  vec3 prussianHigh = vec3(0.137, 0.349, 0.545); // #23598B

  vec3 blueCol = mix(prussianDeep, prussianMid, clamp(chemCloud * 1.15 + brushStreak, 0.0, 1.0));
  blueCol = mix(blueCol, prussianHigh, smoothstep(0.58, 0.92, chemCloud));
  blueCol *= (1.0 - edgePool) * (0.94 + 0.09 * tooth);

  // Pure ferric ferrocyanide emulsion wash without grid stipple

  vec3 finalCol = mix(rawPaper, blueCol, coatMask);
  o = vec4(clamp(finalCol, 0.0, 1.0), coatMask);
}`;

// Pass 2: Translucent UV Photogram Exposure (植物与星图标本紫外线阻光显影)
const FS_PHOTOGRAM = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uSpec; uniform vec2 uRes; uniform vec3 uPaperCol;
${PAPER_FIELD}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec4 sp = texture(uSpec, uv);
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float tooth = cottonTooth(px);

  // Blur specimen alpha to compute the dark Prussian-indigo UV diffraction/capillary halo outside the specimen!
  float blurWide = textureLod(uSpec, uv, 3.5).a;
  float blurMid  = textureLod(uSpec, uv, 1.8).a;
  float halo = clamp(blurWide - sp.a * 0.85, 0.0, 1.0) * 0.55 + clamp(blurMid - sp.a * 0.9, 0.0, 1.0) * 0.35;

  // Deepen the Prussian blue right around the specimen silhouette (经典蓝晒接触暗环)
  vec3 baseRgb = prev.rgb * (1.0 - halo * 0.42 * prev.a);

  if (sp.a < 0.003) {
    o = vec4(baseRgb, prev.a);
    return;
  }

  // Specimen opacity (sp.a) blocks UV light:
  //   - Low sp.a (0.15..0.55 = translucent leaf lamina): yields luminous Ice-Cyan / Powder-Blue (#5E9BC4 -> #B4D6EA)
  //   - High sp.a (0.65..1.0 = thick veins, stems, seeds, white ink): yields unexposed Cream Cotton Paper (#F5F0E4)
  float block = clamp(sp.a, 0.0, 1.0);
  // Internal cellular leaf texture modulation
  float cellNoise = (vn(px / 2.6 + 53.0) - 0.5) * 0.08;
  float effBlock = clamp(block + cellNoise * (1.0 - block * 0.5), 0.0, 1.0);

  vec3 cyanMid   = vec3(0.220, 0.465, 0.665); // #3877AA
  vec3 cyanIce   = vec3(0.665, 0.825, 0.915); // #AAD2EA
  vec3 paperWarm = uPaperCol * (0.985 + 0.035 * tooth);

  vec3 exposedCol;
  if (effBlock < 0.52) {
    exposedCol = mix(baseRgb, cyanMid, smoothstep(0.0, 0.52, effBlock));
  } else if (effBlock < 0.82) {
    exposedCol = mix(cyanMid, cyanIce, smoothstep(0.52, 0.82, effBlock));
  } else {
    exposedCol = mix(cyanIce, paperWarm, smoothstep(0.82, 0.98, effBlock));
  }

  o = vec4(clamp(exposedCol, 0.0, 1.0), prev.a);
}`;

// Pass 3: Metallic Copper-Gall Dip-Pen Ink (#C87D4B -> #F2C18D) & Cream Herbarium Linen Tapes
const FS_COPPER = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uLayer; uniform vec2 uRes;
${PAPER_FIELD}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec4 L = texture(uLayer, uv);
  if (L.a < 0.003) { o = prev; return; }

  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float tooth = cottonTooth(px);

  // Detect warm metallic copper ink vs cream linen tape / white calligraphy
  float isCopper = smoothstep(0.08, 0.25, L.r - L.b) * (1.0 - smoothstep(0.82, 0.95, L.g));
  vec3 col = L.rgb;
  if (isCopper > 0.2) {
    // Subtle metallic copper-gold sheen across the sheet
    float sheen = 0.5 + 0.5 * sin(uv.x * 9.0 - uv.y * 6.0 + fbm(px / 45.0) * 2.5);
    vec3 copDark = vec3(0.72, 0.42, 0.24);
    vec3 copBright = vec3(0.95, 0.74, 0.49);
    col = mix(col, mix(copDark, copBright, sheen), isCopper * 0.65);
  }
  col *= (0.96 + 0.06 * tooth);

  float cov = clamp(L.a * (0.95 + 0.07 * tooth), 0.0, 1.0);
  o = vec4(mix(prev.rgb, clamp(col, 0.0, 1.0), cov), prev.a);
}`;

// Pass 4: Final Cotton-Rag Relief Emboss
const FS_FINAL = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uS; uniform vec2 uRes;
${PAPER_FIELD}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  vec4 S = texture(uS, uv);

  float t0 = cottonTooth(px);
  float tx = cottonTooth(px + vec2(1.0, 0.0));
  float ty = cottonTooth(px + vec2(0.0, 1.0));
  float g = (tx - t0) * -0.82 + (ty - t0) * 0.82;
  vec3 c = S.rgb * (1.0 + g * 0.095);

  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float vig = 1.0 - 0.08 * dot(q, q);
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

export function makeCyanotypeComp(canvas, w = W, h = H) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false, alpha: false });
  if (!gl) throw new Error('WebGL2 unavailable');

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const P = {
    emulsion: createProg(gl, FS_EMULSION),
    photogram: createProg(gl, FS_PHOTOGRAM),
    copper: createProg(gl, FS_COPPER),
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
    beginEmulsion(paperRGB = [0.957, 0.937, 0.886]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[cur].f);
      gl.disable(gl.BLEND);
      gl.useProgram(P.emulsion.p);
      gl.uniform2f(P.emulsion.u.uRes, w, h);
      gl.uniform3f(P.emulsion.u.uPaperCol, ...paperRGB);
      quad();
    },
    photogramPass(canvas2d, paperRGB = [0.957, 0.937, 0.886]) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mipTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.photogram.p);
      gl.uniform2f(P.photogram.u.uRes, w, h);
      gl.uniform3f(P.photogram.u.uPaperCol, ...paperRGB);
      gl.uniform1i(P.photogram.u.uPrev, 0);
      gl.uniform1i(P.photogram.u.uSpec, 1);
      quad();
      cur = nx;
    },
    copperPass(canvas2d) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, flatTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.copper.p);
      gl.uniform2f(P.copper.u.uRes, w, h);
      gl.uniform1i(P.copper.u.uPrev, 0);
      gl.uniform1i(P.copper.u.uLayer, 1);
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
