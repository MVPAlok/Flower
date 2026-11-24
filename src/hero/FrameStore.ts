import { FRAME_COUNT, frameUrl } from "./config";

/**
 * Loads the WebP sequence in two passes: every 8th frame first (so the scrub
 * works almost immediately), then fills in the gaps. `get(i)` always returns
 * the nearest decoded frame, so scrubbing never shows a blank.
 */
export class FrameStore {
  frames: (ImageBitmap | HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
  loaded = 0;
  private aborted = false;

  constructor(
    private set: "desktop" | "mobile",
    private onProgress: (loaded: number, total: number) => void,
  ) {}

  async load(): Promise<void> {
    const order: number[] = [];
    const seen = new Set<number>();
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < FRAME_COUNT; i += step) if (!seen.has(i)) (seen.add(i), order.push(i));
    }
    if (!seen.has(FRAME_COUNT - 1)) order.splice(1, 0, FRAME_COUNT - 1);

    let cursor = 0;
    const worker = async () => {
      while (cursor < order.length && !this.aborted) {
        const i = order[cursor++];
        try {
          this.frames[i] = await this.decode(frameUrl(i, this.set));
        } catch {
          /* a missing frame just falls back to its neighbour */
        }
        this.loaded++;
        this.onProgress(this.loaded, FRAME_COUNT);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  }

  private async decode(url: string): Promise<ImageBitmap | HTMLImageElement> {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    if ("createImageBitmap" in window) {
      try {
        return await createImageBitmap(img);
      } catch {
        /* fall through */
      }
    }
    return img;
  }

  /** Nearest loaded frame to index i. */
  get(i: number) {
    const idx = Math.round(i);
    if (this.frames[idx]) return { frame: this.frames[idx]!, index: idx };
    for (let d = 1; d < FRAME_COUNT; d++) {
      const a = this.frames[idx - d];
      if (a) return { frame: a, index: idx - d };
      const b = this.frames[idx + d];
      if (b) return { frame: b, index: idx + d };
    }
    return null;
  }

  dispose() {
    this.aborted = true;
    this.frames.forEach((f) => f && "close" in f && f.close());
  }
}
