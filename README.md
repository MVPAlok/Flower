# The art of bloom — "Surface tension"

A cinematic landing page built around a 30-second macro film of a rose after the rain. The page opens on a scroll-driven hero. You look at the rose through a sheet of glass with real water on it. The water is drawn by a WebGL2 shader, and it bends, magnifies and ripples the film behind it.

React 19 · Vite · TypeScript · hand-written WebGL2 · no animation libraries.

## Run it

```bash
npm install
npm run frames   # first time only: turns source/flower-hero.mp4 into WebP frames (needs ffmpeg + bash)
npm run dev
```

On Windows, run `npm run frames` from **Git Bash** (or WSL), with `ffmpeg` installed. The frames are already extracted in `public/frames`, so you only need this if you change the video.

## The scroll story (`src/hero/config.ts`)

The hero is pinned for 720vh. The film is frozen during *Surface*, plays through to 92% of the scroll, then holds on the last frame.

| Scroll | Film | What happens |
|---|---|---|
| **01 Surface** (0–10%) | Frame 0, blurry | Widescreen black bars and a live viewfinder readout. **"bloom"** sits on the glass as thick water: each letter is a lens showing a sharp, magnified piece of the blurred rose. Moving the cursor makes ripples. |
| **02 Focus** (10–24%) | 0–5s | A rack focus pulls the rose sharp, and the focus distance in the readout changes with it. The water letters melt, merge and run down the glass. The bars open. |
| **03 Rain** (24–50%) | 5–15s | Raindrops hit the glass and ripple (faster scrolling brings heavier rain). *"Every petal holds a small storm."* |
| **04 Inside the drop** (50–78%) | 15–25s | A lens follows the real drop in the footage (`dropTrack.ts`). Inside it, "upside down." appears inverted, like the garden. Colour fringing grows. |
| **05 Fall** (78–86%) | 25–28s | The drop lets go: a ripple shockwave, a red halation flash, and the bars snap shut and open again. |
| **06 Stay a while** (86–100%) | 28–30s | Bokeh discs drift with the cursor at different depths. *"Stay a while."* comes into focus out of blur, then everything settles into blush for the next section. |

## The landing page (`src/sections/`)

Below the hero, the page keeps the same water-and-glass language. Light sections are wine on blush; dark sections are blush on deep wine. The nav switches colour to match whatever is under it.

| # | Section | What it does |
|---|---|---|
| — | **Nav** (`components/Nav.tsx`) | Hidden while the film plays, because the viewfinder is the header there. It slides in after, as a glass pill. |
| 01 | **Manifesto** (`Manifesto.tsx`) | A large serif paragraph whose words develop from pale and blurred to sharp ink as you scroll, like a print in a developer tray. Round photo chips from the film sit inside the sentence. Below it are the facts: 360 frames, 30 seconds, 1 drop. |
| 02 | **The series** (`Series.tsx`) | A pinned horizontal gallery: scrolling down slides six plates sideways. Each plate ripples like water on hover, with a roman numeral, its timecode and frame number, and a live 01 / 06 counter. On phones it becomes a swipeable row. |
| 03 | **Anatomy of a drop** (`Anatomy.tsx`) | A sticky diagram. The drop sits inside a rotating text ring while three steps (surface tension, lens, upside down) light up in turn, and a pulsing marker moves to the matching spot on the drop. |
| 04 | **The method** (`Method.tsx`) | Three rules with large roman numerals, then a tilted strip of 35mm-style film, with sprocket holes, that runs sideways as you scroll. |
| — | **Marquee** (`Marquee.tsx`) | "after the rain ✦" in giant italic, with an outlined line running the other way. Scrolling speeds it up and leans it. |
| 05 | **Prints** (`Prints.tsx`) | Three frames shown as framed prints, staggered, that lift on hover. |
| 06 | **Newsletter** (`Newsletter.tsx`) | "Get the next *drop*." with a glass email field. It is front-end only: connect it to your email service in `onSubmit`. |
| — | **Footer** (`Footer.tsx`) | Links, plus a giant gradient "bloom" that turns to water while the pointer is over it. |

**Across the page**
- **Cursor:** a glass droplet cursor (desktop) that swells over links and shows a word over images ("Look", "Enquire", "Top").
- **Film grain:** a light grain layer over the whole page.
- **Scroll reveals:** sections slide in as they appear (`data-reveal`).
- **One shared loop:** `lib/scroll.ts` drives every scroll-linked effect.
- **Hero pausing:** the hero's WebGL stops drawing once it's off screen.

**Type**

| Font | Used for |
|---|---|
| Outfit | The water word, the nav logo, the footer word |
| Instrument Serif | Headlines and statements; the italic for accent words |
| Italiana | Roman numerals and big figures |
| Instrument Sans | Body text and buttons |
| Geist Mono | Labels, timecodes, the viewfinder |

**Images:** `public/stills/` holds plates, chips, the anatomy drop and strip thumbnails, all exported from the source video with ffmpeg.

## How the effects work

**One loop.** `tick()` in `src/hero/BloomHero.tsx` runs once per animation frame. It eases the scroll position and works out each chapter's progress. Then it writes CSS variables for the HTML text and buttons, picks the video frame, steps the ripple simulation and draws the shader. React never re-renders while you scroll.

**The water word** (`WaterMask.ts` and `shaders.ts`)
- "bloom" is drawn white-on-black, and the shader reads it from a *blurred* copy of that image (a mipmap). Cutting the blur at a threshold turns every corner into a round, fat drop.
- The slope of that blur gives each letter a surface direction (a normal). That's what bends the film inside the letter, sharpens it like a lens, and puts a highlight on its top-left edge, with a dark rim and a shadow behind it.
- To melt the letters, each column is pulled down by a smooth noisy amount and the blur grows, so the letters merge like mercury.

**Ripples** (`WaterRenderer.ts`)
- A small wave simulation runs at a quarter of the screen resolution and swaps between two textures every frame.
- The cursor, the rain and the shockwave each add a little bump of water to it. The slope of the wave field bends the film and adds glints.

**The drop lens** (`dropTrack.ts`)
- The drop's centre and size were measured by hand at 12 points between frames 160 and 310, and the code blends between them for the frames in between.
- The shader converts that position to the screen, and draws the text texture flipped both ways inside it, with a slight bulge.

**Camera language**
- **Rack focus:** the film is read from a blurrier mipmap level, a cheap and smooth way to blur.
- **Chromatic aberration:** the red and blue channels are sampled slightly apart, more toward the edges.
- **Halation:** bright areas get a red glow, taken from a very blurred copy of the frame.
- **Also:** a vignette, film grain, letterbox bars, and a viewfinder with REC, focus distance and timecode.

**Bokeh:** fourteen soft discs drawn in the shader, each moving with the cursor by an amount set by its depth.

## Customise

| Change | Where |
|---|---|
| Chapter timing | `CH` and `FILM_END` in `src/hero/config.ts` |
| Scroll length | `TRACK_VH` in `src/hero/config.ts` |
| Fade timing inside a chapter | the `smooth(a, b, …)` lines in `tick()`, `src/hero/BloomHero.tsx` |
| Text | JSX at the bottom of `src/hero/BloomHero.tsx` |
| The word on the glass | `WORD` in `src/hero/config.ts` |
| The drop's track | `KEYS` in `src/hero/dropTrack.ts` (re-measure if you change the video) |
| The text inside the drop | `drawLensText()` in `src/hero/WaterMask.ts` |
| Water look (refraction, highlights, melt) | `src/hero/shaders.ts` |
| Colours and type | the top of `src/styles.css` |
| New video | put it in `source/`, run `npm run frames -- source/your-video.mp4`, then update `FRAME_COUNT` and `CLIP_SECONDS` |

## Files

```
source/flower-hero.mp4     the original 30s film (watermark removed)
public/frames/desktop/     360 × WebP, 1280px (~6.9 MB)
public/frames/mobile/      360 × WebP, 720px  (~3.5 MB)
public/fonts/              Outfit, Instrument Serif, Instrument Sans, Italiana, Geist Mono
scripts/extract-frames.sh  video → frames
src/hero/BloomHero.tsx     pinned section, the tick() loop, all the HTML text
src/hero/WaterRenderer.ts  WebGL2: ripple simulation + main pass
src/hero/shaders.ts        water word, ripples, drop lens, rack focus, aberration, halation, bokeh
src/hero/WaterMask.ts      draws the word and the upside-down text for the shader
src/hero/dropTrack.ts      the drop's position, frame by frame
src/hero/FrameStore.ts     progressive frame loading
src/hero/config.ts         chapters, frame mapping, helpers
src/sections/              the landing page sections (see above)
src/lib/scroll.ts          shared scroll loop, scroll-linked CSS variables, reveals
src/components/            Nav, Cursor, RippleImage, Sparkle (✦), Preloader
public/stills/             plates, chips, anatomy image, film-strip thumbnails
src/styles.css             hero styling and design tokens
src/page.css               the landing page styling
```

## Phones and accessibility

- **Phones:** the 720px frames are used and the ripple simulation is switched off to save battery. The water word, melt, drop lens, focus effects and bokeh all stay. The drips are broader on tall screens.
- **Reduced motion:** no ripples, no push-in, no flash, a gentler rack focus, and the scroll follows directly.
- **No WebGL2:** a plain canvas scrub, with the word shown as normal text.
- **Screen readers:** "bloom" is a real (visually hidden) `<h1>` and the ending a real `<h2>`, so screen readers and search engines get the text.

## Licences

Fonts are under the SIL Open Font License (licence files in `public/fonts/`; Instrument Serif is OFL too, from the Instrument Serif project). The film was generated with Gemini for this project.
#   F l o w e r  
 