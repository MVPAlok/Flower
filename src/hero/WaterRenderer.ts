import { MAIN_FRAG, SIM_FRAG, VERT } from "./shaders";

export type Impulse = { x: number; y: number; r: number; s: number }; // screen uv (y down), radius in screen heights, strength

export type WaterState = {
  push: number;
  focus: number;
  ca: number;
  halation: number;
  letters: number;
  melt: number;
  ripple: number;
  lens: [number, number, number, number];
  flash: number;
  bokeh: number;
  mouse: [number, number];
  wash: number;
  centerX: number;
};

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

/**
 * WebGL2: a ripple simulation (ping-pong half-float textures at ¼ resolution)
 * and one full-screen pass that draws the film through wet glass.
 */
export class WaterRenderer {
  private gl: WebGL2RenderingContext;
  private buf: WebGLBuffer;
  private main: Prog;
  private sim: Prog | null = null;
  private tex: { frame: WebGLTexture; mask: WebGLTexture; lens: WebGLTexture };
  private simTex: WebGLTexture[] = [];
  private simFbo: WebGLFramebuffer[] = [];
  private simSize = { w: 1, h: 1 };
  private simIdx = 0;
  private frameKey: unknown = null;
  private videoRes = { w: 1280, h: 720 };
  private start = performance.now();
  readonly canRipple: boolean;

  static supported() {
    try {
      return !!document.createElement("canvas").getContext("webgl2");
    } catch {
      return false;
    }
  }

  constructor(private canvas: HTMLCanvasElement, wantRipples: boolean) {
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("WebGL2 not available");
    this.gl = gl;

    const buf = gl.createBuffer()!;
    this.buf = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    this.main = this.program(MAIN_FRAG, [
      "u_frame", "u_mask", "u_sim", "u_lensText", "u_res", "u_videoRes", "u_time", "u_push", "u_focus", "u_ca",
      "u_halation", "u_letters", "u_melt", "u_ripple", "u_lens", "u_flash", "u_bokeh", "u_mouse", "u_wash", "u_centerX",
    ]);
    this.tex = { frame: this.makeTex(true), mask: this.makeTex(true), lens: this.makeTex(false) };

    this.canRipple = wantRipples && !!gl.getExtension("EXT_color_buffer_float");
    if (this.canRipple) {
      this.sim = this.program(SIM_FRAG, ["u_prev", "u_texel", "u_aspect", "u_damp", "u_drops", "u_count"]);
    }
    // a 1×1 flat sim texture so the main pass always has something bound
    this.simTex = [this.makeSimTex(1, 1), this.makeSimTex(1, 1)];
  }

  private program(frag: string, names: string[]): Prog {
    const gl = this.gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error");
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, frag));
    gl.bindAttribLocation(p, 0, "a_pos");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link error");
    const u: Prog["u"] = {};
    for (const n of names) u[n] = gl.getUniformLocation(p, n);
    return { p, u };
  }

  private makeTex(mips: boolean) {
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([60, 8, 14, 255]));
    return t;
  }

  private makeSimTex(w: number, h: number) {
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (this.canRipple) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    return t;
  }

  private upload(t: WebGLTexture, src: TexImageSource, mips: boolean) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    if (mips) gl.generateMipmap(gl.TEXTURE_2D);
  }

  setFrame(src: TexImageSource & { width: number; height: number }) {
    if (src === this.frameKey) return;
    this.frameKey = src;
    this.videoRes = { w: src.width, h: src.height };
    this.upload(this.tex.frame, src, true);
  }
  setMask(src: HTMLCanvasElement) { this.upload(this.tex.mask, src, true); }
  setLensText(src: HTMLCanvasElement) { this.upload(this.tex.lens, src, false); }

  resize(dpr: number) {
    const w = Math.round(this.canvas.clientWidth * dpr), h = Math.round(this.canvas.clientHeight * dpr);
    if (w <= 0 || h <= 0) return;
    const sizeChanged = this.canvas.width !== w || this.canvas.height !== h;
    this.canvas.width = w;
    this.canvas.height = h;
    if (!this.canRipple) return;
    if (!sizeChanged && this.simFbo.length > 0) return;
    const gl = this.gl;
    const sw = Math.max(64, Math.round(this.canvas.clientWidth / 4)), sh = Math.max(64, Math.round(this.canvas.clientHeight / 4));
    this.simTex.forEach((t) => gl.deleteTexture(t));
    this.simFbo.forEach((f) => gl.deleteFramebuffer(f));
    this.simTex = [this.makeSimTex(sw, sh), this.makeSimTex(sw, sh)];
    this.simFbo = this.simTex.map((t) => {
      const f = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return f;
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.simSize = { w: sw, h: sh };
  }

  /** Advance the ripples one step, adding any new impulses. */
  step(impulses: Impulse[], damp = 0.985) {
    if (!this.sim || !this.simFbo.length) return;
    const gl = this.gl, { p, u } = this.sim;
    const src = this.simIdx, dst = 1 - src;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.simFbo[dst]);
    gl.viewport(0, 0, this.simSize.w, this.simSize.h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.simTex[src]);
    gl.uniform1i(u.u_prev, 0);
    gl.uniform2f(u.u_texel, 1 / this.simSize.w, 1 / this.simSize.h);
    gl.uniform1f(u.u_aspect, this.simSize.w / this.simSize.h);
    gl.uniform1f(u.u_damp, damp);
    const arr = new Float32Array(32);
    const n = Math.min(8, impulses.length);
    for (let i = 0; i < n; i++) {
      const d = impulses[i];
      arr.set([d.x, 1 - d.y, d.r, d.s], i * 4);
    }
    gl.uniform4fv(u.u_drops, arr);
    gl.uniform1i(u.u_count, n);
    this.drawQuad();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.simIdx = dst;
  }

  private drawQuad() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  render(s: WaterState) {
    const gl = this.gl, { p, u } = this.main;
    gl.useProgram(p);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const bind = (unit: number, t: WebGLTexture, name: string) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.uniform1i(u[name], unit);
    };
    bind(0, this.tex.frame, "u_frame");
    bind(1, this.tex.mask, "u_mask");
    bind(2, this.simTex[this.simIdx], "u_sim");
    bind(3, this.tex.lens, "u_lensText");
    gl.uniform2f(u.u_res, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.u_videoRes, this.videoRes.w, this.videoRes.h);
    gl.uniform1f(u.u_time, (performance.now() - this.start) / 1000);
    gl.uniform1f(u.u_push, s.push);
    gl.uniform1f(u.u_focus, s.focus);
    gl.uniform1f(u.u_ca, s.ca);
    gl.uniform1f(u.u_halation, s.halation);
    gl.uniform1f(u.u_letters, s.letters);
    gl.uniform1f(u.u_melt, s.melt);
    gl.uniform1f(u.u_ripple, this.canRipple ? s.ripple : 0);
    gl.uniform4f(u.u_lens, ...s.lens);
    gl.uniform1f(u.u_flash, s.flash);
    gl.uniform1f(u.u_bokeh, s.bokeh);
    gl.uniform2f(u.u_mouse, ...s.mouse);
    gl.uniform1f(u.u_wash, s.wash);
    gl.uniform1f(u.u_centerX, s.centerX);
    this.drawQuad();
  }

  dispose() {
    const gl = this.gl;
    gl.deleteBuffer(this.buf);
    [...Object.values(this.tex), ...this.simTex].forEach((t) => gl.deleteTexture(t));
    this.simFbo.forEach((f) => gl.deleteFramebuffer(f));
    gl.deleteProgram(this.main.p);
    if (this.sim) gl.deleteProgram(this.sim.p);
  }
}
