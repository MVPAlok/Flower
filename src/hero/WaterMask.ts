const DISPLAY = `"Outfit", "Arial Rounded MT Bold", sans-serif`;
const SERIF = `"Instrument Serif", "Times New Roman", serif`;

/**
 * The word, drawn white-on-black for the shader. The shader blurs it and
 * cuts it at a threshold, which rounds every corner into a fat drop of water.
 */
export function drawWordMask(c: HTMLCanvasElement, word: string, cssW: number, cssH: number) {
  const scale = Math.min(1.25, window.devicePixelRatio || 1);
  const W = (c.width = Math.round(cssW * scale));
  const H = (c.height = Math.round(cssH * scale));
  const x = c.getContext("2d")!;
  x.fillStyle = "#000";
  x.fillRect(0, 0, W, H);
  const portrait = cssH > cssW;
  let size = H * 0.5;
  x.font = `700 ${size}px ${DISPLAY}`;
  size *= Math.min(1, (W * (portrait ? 0.9 : 0.66)) / x.measureText(word).width);
  x.font = `700 ${size}px ${DISPLAY}`;
  if ("letterSpacing" in x) (x as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${-size * 0.03}px`;
  x.fillStyle = "#fff";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(word, W / 2, H * 0.5);
}

/** Text that will be seen inverted inside the falling drop. Drawn normally here. */
export function drawLensText(c: HTMLCanvasElement) {
  c.width = 1024;
  c.height = 512;
  const x = c.getContext("2d")!;
  x.clearRect(0, 0, 1024, 512);
  x.fillStyle = "#fff";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `italic 150px ${SERIF}`;
  x.fillText("upside", 512, 196);
  x.fillText("down.", 512, 336);
}
