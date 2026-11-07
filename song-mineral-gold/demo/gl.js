// WebGL2 Physically-Inspired Compositor for "Song Silk & Mineral Gold (宋韵古绢 × 矿物岩彩描金)"
// Pipeline:
//   1. Aged Woven Song Silk (古绢经纬暗纹 + 千年茶褐包浆 + 绢眼微孔)
//   2. Mineral Rock Pigments (青金石/石青、孔雀石/石绿、朱砂、赭石、蛤粉 — 矿石晶体微颗粒 + 胶矾水渍晕边 + 绢丝透底)
//   3. Soot Ink & Cinnabar Seals (松烟墨入绢 + 朱砂印泥飞白漏丝)
//   4. 24K Mud-Gold Relief (泥金勾勒追光着色器 — 随宫灯暖光源产生真实金属高光流转)
//   5. Silk Brocade Mounting & Museum Lighting (宋锦装裱绫边 + 柔和画案烛光暗角)

export const W = 1920, H = 1080;

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*.5+.5; gl_Position = vec4(p,0,1); }`;

// Shared procedural noise & woven silk heightfield
const SILK_FIELD = `
float h21(vec2 p){ p = fract(p*vec2(127.1, 311.7)); p += dot(p, p+34.23); return fract(p.x*p.y); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0 - 2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  return vn(p)*0.52 + vn(p*2.07+13.1)*0.28 + vn(p*4.13+29.7)*0.13 + vn(p*8.3+51.2)*0.07;
}

// Woven Song silk heightfield: warp (经线) & weft (纬线) with natural hand-loom slubs (竹节丝结)
vec2 silkWeave(vec2 px){
  // Slight irregularity in thread spacing
  float warpJitter = (vn(vec2(px.x*0.09, px.y*0.012)) - 0.5) * 0.55;
  float weftJitter = (vn(vec2(px.x*0.012, px.y*0.09)) - 0.5) * 0.55;
  float wx = (px.x + warpJitter) * (3.14159265 / 2.35);
  float wy = (px.y + weftJitter) * (3.14159265 / 2.65);

  float warp = abs(sin(wx));
  float weft = abs(sin(wy));
  // Alternating over-under plain weave modulation
  float overUnder = sin(wx) * sin(wy);
  float threadTop = max(warp * (0.78 + 0.22*overUnder), weft * (0.78 - 0.22*overUnder));

  // Occasional horizontal raw-silk slub (粗丝竹节纹)
  float slub = smoothstep(0.74, 0.96, vn(vec2(px.x*0.022, px.y*0.48 + 7.3))) * 0.22;
  // Tiny inter-thread pinhole gap (绢眼)
  float pinhole = smoothstep(0.26, 0.04, warp) * smoothstep(0.26, 0.04, weft);

  float height = clamp(threadTop + slub - pinhole*0.35, 0.0, 1.0);
  return vec2(height, pinhole);
}
`;

// Pass 1: Tea-Aged Song Silk Base (#C6B08C with patina & subtle age mottling)
const FS_SILK = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform vec2 uRes; uniform vec3 uSilkCol;
${SILK_FIELD}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  vec2 sw = silkWeave(px);
  float h = sw.x, hole = sw.y;

  // Low-frequency museum patina (千年茶熏包浆与水渍微晕)
  float patina = fbm(px / 260.0) * 0.65 + fbm(px / 75.0 + 19.4) * 0.35;
  // Subtle darkening toward top/bottom/edges of the album leaf
  vec2 dEdge = abs(uv - 0.5) * 2.0;
  float ageEdge = smoothstep(0.55, 1.02, max(dEdge.x*0.92, dEdge.y*0.96));

  // Subtle vertical crease of an ancient mounted album leaf (册页微折痕)
  float crease = exp(-pow((uv.x - 0.665)*uRes.x / 2.2, 2.0)) * 0.035;

  vec3 col = uSilkCol * (0.93 + 0.11 * patina - 0.085 * ageEdge + crease);
  // Silk thread sheen + darker pinhole crevices
  col *= (0.935 + 0.095 * h - 0.085 * hole);
  // Microscopic warm foxing specks (极淡古绢陈斑)
  float speck = smoothstep(0.86, 0.94, vn(px / 4.2 + 91.0)) * 0.045;
  col -= vec3(speck * 0.9, speck * 1.0, speck * 1.15);

  // Alpha stores accumulated mineral/gold thickness (0 on bare silk)
  o = vec4(clamp(col, 0.0, 1.0), 0.0);
}`;

// Pass 2: Coarse Crystalline Mineral Pigment Layer (青金石/石青、孔雀石/石绿、朱砂、蛤粉)
const FS_MINERAL = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uLayer; uniform vec2 uRes; uniform float uGran;
${SILK_FIELD}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec4 m = texture(uLayer, uv);
  if (m.a < 0.003) { o = prev; return; }

  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  vec2 sw = silkWeave(px);
  float silkH = sw.x;

  // Alum-glue water tide mark at pigment edges (胶矾水晕边)
  float blurA = textureLod(uLayer, uv, 3.0).a;
  float tide = clamp(m.a - blurA, 0.0, 1.0) * 0.28;

  // Crushed mineral crystal granulation (碾碎矿石晶体颗粒与云母微闪)
  float crystalCoarse = vn(px / 2.3 + 41.0);
  float crystalFine = h21(floor(px * 0.85) + 17.0);
  float gran = (crystalCoarse - 0.5) * 0.16 * uGran + (crystalFine - 0.5) * 0.09 * uGran;

  // Thin washes sink into silk valleys; heavy opaque mineral (厚涂石青/石绿/蛤粉) covers silk ridges
  float density = clamp(m.a + tide, 0.0, 1.0);
  float silkMod = mix(1.0 - 0.28 * (1.0 - silkH), 0.98 + 0.04 * silkH, smoothstep(0.35, 0.88, density));
  float cov = clamp(density * silkMod, 0.0, 0.985);

  // Mineral colour shifts slightly richer at tide edges and sparkles slightly on crystal facets
  vec3 minCol = m.rgb * (1.0 - 0.10 * tide + gran);
  // Subtle mica sparkle on Azurite/Malachite crystals
  float mica = smoothstep(0.93, 0.995, crystalFine) * density * 0.085;
  minCol += vec3(mica * 0.95, mica * 0.92, mica * 0.82);

  vec3 outRgb = mix(prev.rgb, clamp(minCol, 0.0, 1.0), cov);
  float outHeight = clamp(prev.a + cov * 0.65, 0.0, 1.0);
  o = vec4(outRgb, outHeight);
}`;

// Pass 3: Soot Ink (松烟墨) & Cinnabar Seal Paste (朱砂印泥)
const FS_INK = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uLayer; uniform vec2 uRes;
${SILK_FIELD}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec4 L = texture(uLayer, uv);
  if (L.a < 0.003) { o = prev; return; }

  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  vec2 sw = silkWeave(px);

  // Detect red seal paste vs dark soot ink
  float isRedSeal = smoothstep(0.18, 0.45, L.r - L.g);
  // Seal paste leaves tiny authentic silk pinhole gaps (印泥透绢飞白)
  float sealHole = isRedSeal * (sw.y * 0.55 + smoothstep(0.78, 0.95, vn(px / 3.1 + 63.0)) * 0.35);
  float alpha = clamp(L.a * (0.94 + 0.08 * sw.x) * (1.0 - sealHole), 0.0, 1.0);

  vec3 col = L.rgb * (0.96 + 0.06 * sw.x);
  o = vec4(mix(prev.rgb, col, alpha), prev.a);
}`;

// Pass 4: Specular 24K Mud-Gold Ink & Gold Leaf (泥金勾勒追光层)
const FS_GOLD = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uGold; uniform vec2 uRes; uniform vec2 uLight;
${SILK_FIELD}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec4 G = texture(uGold, uv);
  if (G.a < 0.004) { o = prev; return; }

  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  vec2 sw = silkWeave(px);

  // Compute micro-normal from gold stroke bevel + underlying silk weave + gold powder grain
  vec2 du = vec2(1.0 / uRes.x, 0.0), dv = vec2(0.0, 1.0 / uRes.y);
  float gx = texture(uGold, uv + du).a - texture(uGold, uv - du).a;
  float gy = texture(uGold, uv + dv).a - texture(uGold, uv - dv).a;
  float grain = (h21(floor(px * 1.1) + 9.0) - 0.5) * 0.35;

  vec3 N = normalize(vec3(-gx * 2.4 + (sw.x - 0.5) * 0.55 + grain, -gy * 2.4 + (sw.x - 0.5) * 0.45, 1.0));
  vec2 lDir2 = (uLight - uv) * vec2(uRes.x / uRes.y, 1.0);
  vec3 L = normalize(vec3(lDir2 * 1.35, 0.88));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);

  float diff = clamp(dot(N, L), 0.0, 1.0);
  float spec = pow(clamp(dot(N, H), 0.0, 1.0), 22.0);
  float distFall = exp(-dot(lDir2, lDir2) * 1.35);

  // Rich antique Song mud-gold palette: warm bronze shadow -> imperial gold -> champagne glint
  vec3 goldDark = vec3(0.58, 0.43, 0.18);
  vec3 goldMid  = vec3(0.87, 0.71, 0.36);
  vec3 goldSpec = vec3(1.00, 0.96, 0.78);

  vec3 goldCol = mix(goldDark, goldMid, 0.38 + 0.62 * diff);
  goldCol = mix(goldCol, goldSpec, clamp(spec * (0.55 + 0.75 * distFall), 0.0, 0.92));

  // Gold powder sits on silk threads
  float cov = clamp(G.a * (0.88 + 0.18 * sw.x), 0.0, 1.0);
  o = vec4(mix(prev.rgb, goldCol, cov), clamp(prev.a + cov * 0.5, 0.0, 1.0));
}`;

// Pass 5: Final Silk Relief Emboss, Song Brocade Frame & Warm Palace-Lantern Lighting
const FS_FINAL = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uS; uniform vec2 uRes; uniform vec2 uLight;
${SILK_FIELD}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  vec4 S = texture(uS, uv);

  // Physical micro-emboss of woven silk + thick mineral impasto
  vec2 sw0 = silkWeave(px);
  vec2 swX = silkWeave(px + vec2(1.0, 0.0));
  vec2 swY = silkWeave(px + vec2(0.0, 1.0));
  float grad = (swX.x - sw0.x) * -0.8 + (swY.x - sw0.x) * 0.8;
  float silkRelief = 1.0 + grad * 0.085 * (1.0 - 0.42 * S.a);

  vec3 c = S.rgb * silkRelief;

  // Song Brocade Mounting Border (宋锦深青灰绫边装裱, 28px outer margin + 2px gold inner line)
  float bx = min(px.x, uRes.x - px.x);
  float by = min(px.y, uRes.y - px.y);
  float bDist = min(bx, by);
  if (bDist < 30.0) {
    // Woven dark slate-indigo brocade with subtle geometric fret sheen
    float brocadeWeave = sin(px.x * 1.4) * sin(px.y * 1.4) * 0.04;
    float pattern = smoothstep(0.45, 0.55, abs(fract(px.x / 18.0) - 0.5) + abs(fract(px.y / 18.0) - 0.5)) * 0.025;
    vec3 brocade = vec3(0.145, 0.172, 0.212) + brocadeWeave + pattern;
    // Inner 2.5px antique gold fillet (泥金镶界)
    if (bDist >= 26.5 && bDist < 29.5) {
      brocade = vec3(0.76, 0.61, 0.31) * (0.92 + 0.12 * sw0.x);
    } else if (bDist >= 29.5) {
      // Tiny recessed shadow where brocade meets silk leaf
      c *= 0.82;
    }
    if (bDist < 29.5) c = brocade;
  }

  // Warm Museum / Palace-Lantern Ambient Pool & Gentle Vignette
  vec2 dL = (uv - uLight) * vec2(uRes.x / uRes.y, 1.0);
  float glow = exp(-dot(dL, dL) * 0.95);
  c *= mix(vec3(0.92, 0.90, 0.88), vec3(1.045, 1.018, 0.968), glow);

  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float vig = 1.0 - 0.14 * dot(q, q);
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

export function makeSilkComp(canvas, w = W, h = H) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false, alpha: false });
  if (!gl) throw new Error('WebGL2 unavailable');

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const P = {
    silk: createProg(gl, FS_SILK),
    mineral: createProg(gl, FS_MINERAL),
    ink: createProg(gl, FS_INK),
    gold: createProg(gl, FS_GOLD),
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
  const mipLayerTex = makeTex(true);
  const flatLayerTex = makeTex(false);

  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.viewport(0, 0, w, h);

  const quad = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  return {
    // Tea-aged Song silk (#C8B490 -> [0.784, 0.706, 0.565])
    beginSilk(silkRGB = [0.784, 0.706, 0.565]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[cur].f);
      gl.disable(gl.BLEND);
      gl.useProgram(P.silk.p);
      gl.uniform2f(P.silk.u.uRes, w, h);
      gl.uniform3f(P.silk.u.uSilkCol, ...silkRGB);
      quad();
    },
    mineralPass(canvas2d, gran = 1.0) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mipLayerTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.mineral.p);
      gl.uniform2f(P.mineral.u.uRes, w, h);
      gl.uniform1f(P.mineral.u.uGran, gran);
      gl.uniform1i(P.mineral.u.uPrev, 0);
      gl.uniform1i(P.mineral.u.uLayer, 1);
      quad();
      cur = nx;
    },
    inkPass(canvas2d) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, flatLayerTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.ink.p);
      gl.uniform2f(P.ink.u.uRes, w, h);
      gl.uniform1i(P.ink.u.uPrev, 0);
      gl.uniform1i(P.ink.u.uLayer, 1);
      quad();
      cur = nx;
    },
    goldPass(canvas2d, lightUV = [0.44, 0.56]) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, flatLayerTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.gold.p);
      gl.uniform2f(P.gold.u.uRes, w, h);
      gl.uniform2f(P.gold.u.uLight, lightUV[0], lightUV[1]);
      gl.uniform1i(P.gold.u.uPrev, 0);
      gl.uniform1i(P.gold.u.uGold, 1);
      quad();
      cur = nx;
    },
    finish(lightUV = [0.44, 0.56]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);
      gl.useProgram(P.final.p);
      gl.uniform2f(P.final.u.uRes, w, h);
      gl.uniform2f(P.final.u.uLight, lightUV[0], lightUV[1]);
      gl.uniform1i(P.final.u.uS, 0);
      quad();
    },
  };
}
