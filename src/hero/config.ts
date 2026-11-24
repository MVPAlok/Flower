/** 30s @ 24fps, every 2nd frame kept → 360 frames (see scripts/extract-frames.sh). */
export const FRAME_COUNT = 360;
/** Length of the source clip in seconds — drives the on-screen timecode. */
export const CLIP_SECONDS = 30;

export const frameUrl = (i: number, set: "desktop" | "mobile") =>
  `/frames/${set}/f_${String(i + 1).padStart(4, "0")}.webp`;

/** Height of the pinned scroll track, in viewport heights. */
export const TRACK_VH = 720;

/** The word rendered as water on the glass. */
export const WORD = "bloom";

/**
 * Scroll chapters (0..1 of the pinned track).
 *  surface  frozen on frame 0 · "bloom" sits on the glass as water, the rose blurred behind
 *  focus    rack focus pulls the rose sharp · the water letters merge and run down the glass
 *  rain     the wet petal · raindrops hit the glass and ripple
 *  drop     the drop swells · a lens follows it, with text upside down inside
 *  fall     the drop lets go · shockwave, red flash, letterbox snaps
 *  bokeh    pink bokeh drifts with the cursor · "Stay a while." comes into focus
 */
export const CH = {
  surface: [0, 0.1],
  focus: [0.1, 0.24],
  rain: [0.24, 0.5],
  drop: [0.5, 0.78],
  fall: [0.78, 0.86],
  bokeh: [0.86, 1],
} as const;
/** The film plays between the end of `surface` and FILM_END, then holds. */
export const FILM_START = CH.surface[1];
export const FILM_END = 0.92;

export const CHAPTERS = ["Surface", "Focus", "Rain", "Inside the drop", "Fall", "Stay a while"] as const;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const range = (p: number, [a, b]: readonly [number, number]) => clamp((p - a) / (b - a));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** 0 → 1 → 0 bump between a and b. */
export const bump = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return Math.sin(t * Math.PI);
};

/** Scroll progress → frame index (float). */
export const frameAt = (p: number) => clamp((p - FILM_START) / (FILM_END - FILM_START)) * (FRAME_COUNT - 1);
