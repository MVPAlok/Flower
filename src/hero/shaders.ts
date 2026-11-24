export const VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * .5 + .5;
  gl_Position = vec4(a_pos, 0., 1.);
}
`;

/**
 * Ripple simulation — a damped 2D wave equation, run at low resolution.
 * R = height now, G = height one step ago. Impulses (cursor, rain, the
 * shockwave) are added as little Gaussian bumps.
 */
export const SIM_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_prev;
uniform vec2 u_texel;
uniform float u_aspect;
uniform float u_damp;
uniform vec4 u_drops[8];   // x, y (uv, y up), radius (in screen heights), strength
uniform int u_count;
out vec4 o;
void main() {
  vec2 s = texture(u_prev, v_uv).rg;
  float n = (texture(u_prev, v_uv + vec2(u_texel.x, 0.)).r +
             texture(u_prev, v_uv - vec2(u_texel.x, 0.)).r +
             texture(u_prev, v_uv + vec2(0., u_texel.y)).r +
             texture(u_prev, v_uv - vec2(0., u_texel.y)).r) * .5 - s.g;
  n *= u_damp;
  for (int i = 0; i < 8; i++) {
    if (i >= u_count) break;
    vec4 d = u_drops[i];
    vec2 q = (v_uv - d.xy) * vec2(u_aspect, 1.);
    n += d.w * exp(-dot(q, q) / (d.z * d.z));
  }
  o = vec4(clamp(n, -4., 4.), s.r, 0., 1.);
}
`;

/**
 * The picture: the film seen through wet glass, shot on a real lens.
 *  water   — the word as thick, rounded drops (blurred + thresholded mask),
 *            plus ripples from the simulation; both bend the film
 *  camera  — rack focus (mip blur), chromatic aberration, red halation,
 *            vignette, grain
 *  lens    — a lens that follows the real drop in the footage, with text
 *            upside down inside it
 *  bokeh   — soft discs that drift with the cursor at different depths
 */
export const MAIN_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_frame;
uniform sampler2D u_mask;      // r = the word
uniform sampler2D u_sim;       // r = ripple height
uniform sampler2D u_lensText;  // text drawn normally; shown inverted inside the drop
uniform vec2  u_res;
uniform vec2  u_videoRes;
uniform float u_time;
uniform float u_push;          // >= 1, slow push-in
uniform float u_focus;         // rack focus: mip level of blur
uniform float u_ca;            // chromatic aberration strength
uniform float u_halation;
uniform float u_letters;       // 0..1 word visibility
uniform float u_melt;          // 0..1 letters merge and run down
uniform float u_ripple;        // ripple strength
uniform vec4  u_lens;          // x, y (video uv), r (frame heights), amount
uniform float u_flash;
uniform float u_bokeh;
uniform vec2  u_mouse;         // -1..1
uniform float u_wash;          // 0..1 blush at the end
uniform float u_centerX;
out vec4 o;

float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(float x) { float i = floor(x), f = fract(x); return mix(hash(vec2(i, 1.7)), hash(vec2(i + 1., 1.7)), f * f * (3. - 2. * f)); }

// screen uv (y down) → video uv, cover-fit + push
vec2 toVideo(vec2 uv) {
  float sa = u_res.x / u_res.y, va = u_videoRes.x / u_videoRes.y;
  vec2 v = uv;
  if (sa > va) v.y = (uv.y - .5) * (va / sa) + .5;
  else         v.x = (uv.x - .5) * (sa / va) + u_centerX;
  return vec2(.5) + (v - .5) / u_push;
}
// video uv → screen uv (inverse of the above)
vec2 toScreen(vec2 v) {
  float sa = u_res.x / u_res.y, va = u_videoRes.x / u_videoRes.y;
  v = vec2(.5) + (v - .5) * u_push;
  vec2 uv = v;
  if (sa > va) uv.y = (v.y - .5) / (va / sa) + .5;
  else         uv.x = (v.x - u_centerX) / (sa / va) + .5;
  return uv;
}

// the word as water: blurred mask → rounded dome; melting pulls it down the glass
float word(vec2 uv, float lod) {
  float k = clamp((u_res.x / u_res.y) / 1.6, .4, 1.);     // tall screens: shorter drips
  float drip = vnoise(uv.x * mix(4., 9., k)) * .75 + vnoise(uv.x * mix(10., 31., k) + 4.) * .25 * k;
  vec2 m = uv - vec2(0., (u_melt * (.03 + drip * .45) + u_melt * u_melt * .35) * k);
  return textureLod(u_mask, m, lod).r;
}

vec3 scene(vec2 vuv, float lod, vec2 caDir) {
  float r = textureLod(u_frame, vuv + caDir, lod).r;
  float g = textureLod(u_frame, vuv, lod).g;
  float b = textureLod(u_frame, vuv - caDir, lod).b;
  return vec3(r, g, b);
}

void main() {
  vec2 uv = vec2(v_uv.x, 1. - v_uv.y);          // y down
  float aspect = u_res.x / u_res.y;
  vec2 px = 1. / u_res;
  vec2 c = (uv - .5) * vec2(aspect, 1.);
  float edge = length(c);

  // ---------- water height + normal ----------
  vec2 sp = 1.5 / vec2(textureSize(u_sim, 0));
  float sL = texture(u_sim, vec2(v_uv.x - sp.x, v_uv.y)).r;
  float sR = texture(u_sim, vec2(v_uv.x + sp.x, v_uv.y)).r;
  float sU = texture(u_sim, vec2(v_uv.x, v_uv.y + sp.y)).r;
  float sD = texture(u_sim, vec2(v_uv.x, v_uv.y - sp.y)).r;
  vec2 nRipple = vec2(sR - sL, -(sU - sD)) * u_ripple;

  float lod = 2.2 + u_melt * 3.6;
  float e = 3.5 * px.y * (1. + u_melt * 2.);
  float w  = word(uv, lod);
  float wx = word(uv + vec2(e, 0.), lod) - word(uv - vec2(e, 0.), lod);
  float wy = word(uv + vec2(0., e), lod) - word(uv - vec2(0., e), lod);
  float th = .42 - u_melt * .14;
  float inWord = smoothstep(th, th + .1, w) * u_letters;       // the drop's footprint
  float dome   = smoothstep(th, .95, w);                   // height inside it
  vec2 nWord = vec2(wx, wy) * 1.6 * u_letters;

  vec2 n = nRipple + nWord * inWord;

  // ---------- the film behind the glass ----------
  vec2 vuv = toVideo(uv);
  vec2 caDir = normalize(c + 1e-5) * u_ca * .004 * (.25 + edge * 1.4);
  float sceneLod = u_focus + smoothstep(.45, 1.1, edge) * 1.2;

  // inside a water letter: a fisheye lens — magnified, slightly inverted, and sharp
  vec2 letterUV = vuv + vec2(wx, wy) * -.16 + (vuv - .5) * -.06 * dome;
  float letterLod = max(0., u_focus - 3.2);

  vec3 col = scene(vuv - n * .06, sceneLod, caDir);
  vec3 inLetter = scene(letterUV, letterLod, caDir * 2.);
  inLetter *= 1.06 + dome * .12;
  col = mix(col, inLetter, inWord);

  // drop shadow and dark rim of the water letters
  float sh = word(uv - vec2(.004, .012), lod + 1.) ;
  col *= 1. - .28 * smoothstep(.3, .7, sh) * (1. - inWord) * u_letters;
  float rim = inWord * (1. - smoothstep(th + .08, th + .28, w));
  col *= 1. - rim * .35;

  // specular highlights: light from the top-left
  vec3 N = normalize(vec3(-n * 9., 1.));
  vec3 L = normalize(vec3(-.45, -.65, 1.));
  float spec = pow(max(dot(reflect(-L, N), vec3(0., 0., 1.)), 0.), 60.);
  float specMask = clamp(inWord + min(length(nRipple) * 2.5, .45), 0., 1.);
  col += spec * specMask * .9;
  col += pow(max(dot(N, L), 0.), 8.) * inWord * .06;

  // ---------- lens following the real drop ----------
  if (u_lens.w > .001) {
    vec2 cs = toScreen(u_lens.xy);
    // radius in screen-height units: frame height × cover scale × push
    float va = u_videoRes.x / u_videoRes.y;
    float rS = u_lens.z * u_push * (aspect > va ? aspect / va : 1.);
    vec2 d = (uv - cs) * vec2(aspect, 1.) / rS;      // -1..1 inside the drop
    float inDrop = smoothstep(.86, .7, length(d));
    if (inDrop > 0.) {
      vec2 bulge = d * (1. - .25 * dot(d, d));
      vec2 tuv = vec2(.5) + vec2(-bulge.x, -bulge.y) * vec2(.62, .5);  // inverted, like a real lens
      vec4 t = texture(u_lensText, tuv);
      col = mix(col, vec3(1., .97, .95), t.a * inDrop * u_lens.w * .8);
    }
  }

  // ---------- bokeh discs drifting with the cursor ----------
  if (u_bokeh > .001) {
    for (int i = 0; i < 14; i++) {
      float fi = float(i);
      vec2 base = vec2(hash(vec2(fi, 1.)), hash(vec2(fi, 2.)));
      float depth = .3 + hash(vec2(fi, 3.)) * 1.4;
      vec2 pos = base + u_mouse * .04 * depth + vec2(sin(u_time * .2 + fi), cos(u_time * .17 + fi * 1.3)) * .015;
      float r = .05 + hash(vec2(fi, 4.)) * .09;
      float dd = length((uv - pos) * vec2(aspect, 1.));
      float disc = smoothstep(r, r * .82, dd) * (.55 + .45 * smoothstep(r * .6, r, dd));
      col += disc * vec3(1., .86, .8) * .16 * u_bokeh * (1.4 - depth * .5);
    }
  }

  // ---------- film look ----------
  vec3 glow = textureLod(u_frame, vuv, 6.).rgb;
  float lum = dot(glow, vec3(.3, .59, .11));
  col += vec3(1., .3, .22) * max(lum - .42, 0.) * u_halation * 1.4;
  col += u_flash * vec3(1., .78, .72) * .55;

  col = mix(col, col * vec3(1.04, .98, .96), .5);                 // warm grade
  col *= mix(.62, 1., smoothstep(1.15, .35, edge));               // vignette
  col = mix(col, vec3(.969, .863, .835), u_wash);                  // blush wash at the end
  col += (hash(gl_FragCoord.xy + fract(u_time) * 97.) - .5) * .045;  // grain
  o = vec4(col, 1.);
}
`;
