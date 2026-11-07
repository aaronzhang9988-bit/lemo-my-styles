// WebGL2 Physically-Inspired Compositor for:
// "Wes Anderson Wool-Felt Diorama Theatre (韦斯·安德森毛毡光影剧场)"
// Passes:
//   1. FS_STAGE_FELT: Needle-Felted Merino Wool Backdrop (#88B2AE Glacier Mint / #F3C6C2 Mendl Pink)
//      with curly wool staple fibers, surface fuzz, and warm 2900K stop-motion overhead stage spotlight
//   2. FS_DIORAMA_PLUSH: 3D Padded Wool-Felt Appliqué Pass (mipmap plush pillow doming, fuzzy stray wool edge hairs,
//      and soft studio drop shadow onto the backing felt)
//   3. FS_STITCH_BRASS: Hand-Sewn Embroidery Thread (twisted cotton floss 3D shadow), Mother-of-Pearl Buttons & Brushed Brass Plaques
//   4. FS_FINAL: 35mm Kodak Vision3 Stop-Motion Film Grain & Wool-Felt Micro-Relief Emboss

export const W = 1920, H = 1080;

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p*.5+.5; gl_Position = vec4(p,0,1); }`;

const FELT_LIB = `
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
  for(int i=0; i<4; i++){ v += a * vn(p); p = m * p * 2.04 + 17.7; a *= 0.5; }
  return v;
}

// Procedural Merino Wool-Felt entangled curly fiber field [0, 1]
float woolFeltField(vec2 px){
  // Multi-angle entangled wool staple strands
  vec2 w1 = px + vec2(vn(px * 0.14) * 9.0, vn(px * 0.14 + 31.0) * 9.0);
  vec2 w2 = px + vec2(vn(px * 0.23 + 57.0) * 6.0, vn(px * 0.23 + 83.0) * 6.0);
  float s1 = vn(vec2(w1.x * 0.55 + w1.y * 0.22, w1.y * 0.55 - w1.x * 0.22));
  float s2 = vn(vec2(w2.x * 0.25 - w2.y * 0.58, w2.x * 0.58 + w2.y * 0.25) + 19.0);
  float nap = vn(px * 0.85 + 103.0) * 0.34 + fbm(px * 0.18 + 7.0) * 0.30;
  return clamp(s1 * 0.36 + s2 * 0.34 + nap, 0.0, 1.0);
}
`;

// Pass 1: Symmetrical Stop-Motion Wool-Felt Stage Backdrop & Overhead Studio Spotlight
const FS_STAGE_FELT = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform vec2 uRes;
${FELT_LIB}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float felt = woolFeltField(px);

  // Wes Anderson Glacier-Mint & Warm Cream striped felt wallpaper backdrop
  vec3 mintBase  = vec3(0.518, 0.694, 0.682); // #84B1AE Belafonte Glacier Mint
  vec3 mintStripe = vec3(0.465, 0.645, 0.635); // #77A5A2 Subtle woven stripe
  float stripe = smoothstep(-0.2, 0.2, sin(px.x * 0.125));
  vec3 wallCol = mix(mintBase, mintStripe, stripe * 0.45);

  // Subtle melange wool-fiber color flecks (warm cream & dark teal hairs mixed in the wool)
  float fleckLight = smoothstep(0.76, 0.94, vn(px * 0.72 + 13.0));
  float fleckDark  = smoothstep(0.78, 0.95, vn(px * 0.68 + 71.0));
  wallCol += vec3(0.08, 0.07, 0.05) * fleckLight - vec3(0.06, 0.07, 0.07) * fleckDark;
  wallCol *= (0.91 + 0.17 * felt);

  // Warm 2900K top-center stop-motion studio tungsten key light
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  float dSpot = length((uv - vec2(0.50, 0.56)) * aspect);
  float spot = 1.06 - 0.22 * smoothstep(0.15, 0.95, dSpot);
  wallCol *= vec3(spot * 1.02, spot * 1.00, spot * 0.96);

  o = vec4(clamp(wallCol, 0.0, 1.0), 1.0);
}`;

// Pass 2: 3D Padded Wool-Felt Appliqué Diorama Pass (with Plush Doming & Fuzzy Wool Edge Hairs)
const FS_DIORAMA_PLUSH = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uDiorama; uniform vec2 uRes;
${FELT_LIB}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float felt = woolFeltField(px);

  // 1) Fuzzy Wool Edge Perturbation: displace UV by 1.8px of curly fiber noise so cut felt edges look furry!
  vec2 fuzzShift = vec2(
    vn(px * 0.65 + 17.0) - 0.5,
    vn(px * 0.65 + 89.0) - 0.5
  ) * (2.6 / uRes);

  vec4 D = texture(uDiorama, uv + fuzzShift);
  vec4 D0 = texture(uDiorama, uv);
  float effA = max(D.a, D0.a * 0.85);

  // 2) Soft Stop-Motion Studio Drop Shadow cast by the felt cutouts onto the backdrop
  vec2 shOff1 = vec2(0.0, 6.5 / uRes.y);
  vec2 shOff2 = vec2(0.0, 14.0 / uRes.y);
  float sh1 = textureLod(uDiorama, uv + shOff1, 1.8).a;
  float sh2 = textureLod(uDiorama, uv + shOff2, 3.0).a;
  float shadow = clamp(sh1 * 0.36 + sh2 * 0.24, 0.0, 0.62) * (1.0 - effA);
  vec3 baseRgb = prev.rgb * (1.0 - shadow * vec3(0.75, 0.82, 0.86));

  if (effA < 0.01) {
    o = vec4(baseRgb, 1.0);
    return;
  }

  // 3) 3D Padded Plush Cushioning (Pillow Bevel Doming near felt piece boundaries & internal color seams)
  vec2 eps = vec2(3.5 / uRes.x, 3.5 / uRes.y);
  vec4 dUp   = textureLod(uDiorama, uv + vec2(0.0, eps.y), 1.0);
  vec4 dDown = textureLod(uDiorama, uv - vec2(0.0, eps.y), 1.0);
  vec4 dLeft = textureLod(uDiorama, uv - vec2(eps.x, 0.0), 1.0);
  vec4 dRight= textureLod(uDiorama, uv + vec2(eps.x, 0.0), 1.0);

  // Color + Alpha difference measures seam proximity for 3D quilted padding!
  float seamUp   = length(D.rgb - dUp.rgb) * 0.8 + abs(D.a - dUp.a);
  float seamDown = length(D.rgb - dDown.rgb) * 0.8 + abs(D.a - dDown.a);
  float plushShade = (seamUp - seamDown) * 0.22;

  // Overall pillow doming from mipmap blur
  float blurA = textureLod(uDiorama, uv, 2.4).a;
  float dome = smoothstep(0.35, 0.98, blurA);

  vec3 feltCol = mix(D0.rgb, D.rgb, 0.65);
  // Add melange wool staple hair variation
  float fleckL = smoothstep(0.74, 0.93, vn(px * 0.78 + 29.0));
  float fleckD = smoothstep(0.76, 0.94, vn(px * 0.74 + 97.0));
  feltCol += vec3(0.075, 0.065, 0.05) * fleckL - vec3(0.06, 0.06, 0.06) * fleckD;

  // Apply wool fiber texture, pillow doming, and top-down plush bevel light
  feltCol *= (0.89 + 0.19 * felt) * (0.93 + 0.09 * dome + plushShade);

  // Fuzzy rim halo where light catches the fine wool hairs at the perimeter
  float fuzzRim = clamp(D.a - D0.a * 0.6, 0.0, 1.0) * 0.22;
  feltCol += vec3(0.98, 0.94, 0.84) * fuzzRim;

  o = vec4(mix(baseRgb, clamp(feltCol, 0.0, 1.0), effA), 1.0);
}`;

// Pass 3: Hand-Sewn Embroidery Thread (3D Floss Relief), Buttons & Brushed Brass Placards
const FS_STITCH_BRASS = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uPrev; uniform sampler2D uStitch; uniform vec2 uRes;
${FELT_LIB}
void main(){
  vec4 prev = texture(uPrev, uv);
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  float felt = woolFeltField(px);

  // Tight 1.5px indentation shadow under every embroidery stitch & button onto the wool felt!
  vec2 shOff = vec2(1.2 / uRes.x, 1.8 / uRes.y);
  float stShadow = texture(uStitch, uv + shOff).a * 0.42;
  vec3 baseRgb = prev.rgb * (1.0 - stShadow * (1.0 - texture(uStitch, uv).a));

  vec4 St = texture(uStitch, uv);
  if (St.a < 0.004) {
    o = vec4(baseRgb, 1.0);
    return;
  }

  // Twisted cotton embroidery thread sheen & subtle brass metallic reflection
  float isGoldBrass = smoothstep(0.10, 0.28, St.r - St.b) * smoothstep(0.55, 0.85, St.g);
  float threadTwist = 0.93 + 0.12 * sin(px.x * 1.4 + px.y * 1.4 + vn(px * 0.5) * 3.0);
  vec3 col = St.rgb * mix(0.95 + 0.08 * felt, threadTwist, 0.65);

  if (isGoldBrass > 0.25) {
    float sheen = 0.5 + 0.5 * sin(uv.x * 11.0 - uv.y * 7.0 + fbm(px / 55.0) * 2.0);
    col = mix(col, col * (0.88 + 0.26 * sheen), isGoldBrass * 0.7);
  }

  o = vec4(mix(baseRgb, clamp(col, 0.0, 1.0), St.a), 1.0);
}`;

// Pass 4: Final Wool-Felt Micro-Normal Emboss & 35mm Film Warmth
const FS_FINAL = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D uS; uniform vec2 uRes;
${FELT_LIB}
void main(){
  vec2 px = vec2(uv.x * uRes.x, (1.0 - uv.y) * uRes.y);
  vec4 S = texture(uS, uv);

  float f0 = woolFeltField(px);
  float fx = woolFeltField(px + vec2(1.0, 0.0));
  float fy = woolFeltField(px + vec2(0.0, 1.0));
  float g = (fx - f0) * -0.85 + (fy - f0) * 0.85;
  vec3 c = S.rgb * (1.0 + g * 0.088);

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

export function makeWesFeltComp(canvas, w = W, h = H) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false, alpha: false });
  if (!gl) throw new Error('WebGL2 unavailable');

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const P = {
    stageFelt: createProg(gl, FS_STAGE_FELT),
    dioramaPlush: createProg(gl, FS_DIORAMA_PLUSH),
    stitchBrass: createProg(gl, FS_STITCH_BRASS),
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
    beginStageFelt() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[cur].f);
      gl.disable(gl.BLEND);
      gl.useProgram(P.stageFelt.p);
      gl.uniform2f(P.stageFelt.u.uRes, w, h);
      quad();
    },
    dioramaPlushPass(canvas2d) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mipTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.dioramaPlush.p);
      gl.uniform2f(P.dioramaPlush.u.uRes, w, h);
      gl.uniform1i(P.dioramaPlush.u.uPrev, 0);
      gl.uniform1i(P.dioramaPlush.u.uDiorama, 1);
      quad();
      cur = nx;
    },
    stitchBrassPass(canvas2d) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, flatTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, FBO[cur].t);

      const nx = 1 - cur;
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO[nx].f);
      gl.useProgram(P.stitchBrass.p);
      gl.uniform2f(P.stitchBrass.u.uRes, w, h);
      gl.uniform1i(P.stitchBrass.u.uPrev, 0);
      gl.uniform1i(P.stitchBrass.u.uStitch, 1);
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
