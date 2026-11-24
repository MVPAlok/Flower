/**
 * Where the hanging drop is in the footage, measured by hand from the frames.
 * x, y: centre in video UV (0..1, y down). r: radius as a fraction of the frame height.
 * Between keyframes we interpolate; outside the range the lens is off.
 */
const KEYS: [frame: number, x: number, y: number, r: number][] = [
  [160, 0.58, 0.65, 0.06],
  [180, 0.55, 0.57, 0.078],
  [200, 0.508, 0.57, 0.08],
  [215, 0.508, 0.58, 0.097],
  [230, 0.5, 0.57, 0.1],
  [245, 0.523, 0.64, 0.105],
  [260, 0.523, 0.67, 0.1],
  [270, 0.516, 0.75, 0.13],
  [280, 0.505, 0.65, 0.16],
  [290, 0.503, 0.51, 0.2],
  [300, 0.503, 0.44, 0.27],
  [310, 0.5, 0.5, 0.44],
];

export const DROP_FIRST = KEYS[0][0];
export const DROP_LAST = KEYS[KEYS.length - 1][0];

export function dropAt(frame: number): { x: number; y: number; r: number } | null {
  if (frame < DROP_FIRST || frame > DROP_LAST) return null;
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [f0, x0, y0, r0] = KEYS[i];
    const [f1, x1, y1, r1] = KEYS[i + 1];
    if (frame >= f0 && frame <= f1) {
      const t = (frame - f0) / (f1 - f0);
      return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, r: r0 + (r1 - r0) * t };
    }
  }
  return null;
}
