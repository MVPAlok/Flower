<div align="center">

# bloom

**A cinematic landing page built around one 30-second macro film of a rose after the rain.**

You look at the rose through a sheet of wet glass. The word *bloom* sits on it as real water.<br/>
Scroll, and the camera pulls focus, rain hits the glass, a lens follows a falling drop,<br/>
and the film dissolves into soft pink bokeh. Then the rest of the page picks up the same language.

React 19 · Vite · TypeScript · hand-written WebGL2 · **no animation libraries**

<img src="docs/demo.gif" alt="Scrolling through bloom: water letters on glass, the rack focus and melt, rain, the drop lens, the fall, the bokeh ending, then the landing page sections" width="100%"/>

<sub>▶ Full-quality recording: <a href="docs/demo.mp4"><code>docs/demo.mp4</code></a></sub>

</div>

---

## Contents

1. [The idea](#1-the-idea)
2. [Run it](#2-run-it)
3. [The hero, chapter by chapter](#3-the-hero-chapter-by-chapter)
4. [The landing page, section by section](#4-the-landing-page-section-by-section)
5. [How it was built, step by step](#5-how-it-was-built-step-by-step)
   - [5.1 Making the film](#51-making-the-film)
   - [5.2 Turning the film into frames](#52-turning-the-film-into-frames)
   - [5.3 Loading 360 frames without a wait](#53-loading-360-frames-without-a-wait)
   - [5.4 Pinning the hero and reading the scroll](#54-pinning-the-hero-and-reading-the-scroll)
   - [5.5 One loop drives the hero](#55-one-loop-drives-the-hero)
   - [5.6 Water letters](#56-water-letters)
   - [5.7 Ripples: a tiny wave simulation](#57-ripples-a-tiny-wave-simulation)
   - [5.8 Tracking the real drop](#58-tracking-the-real-drop)
   - [5.9 Camera language](#59-camera-language)
   - [5.10 The fall, the bokeh and the seamless hand-off](#510-the-fall-the-bokeh-and-the-seamless-hand-off)
   - [5.11 The landing page engine](#511-the-landing-page-engine)
   - [5.12 Water outside the hero](#512-water-outside-the-hero)
6. [Design system](#6-design-system)
7. [Phones, accessibility and performance](#7-phones-accessibility-and-performance)
8. [Project structure](#8-project-structure)
9. [Customising it](#9-customising-it)
10. [Credits and licences](#10-credits-and-licences)

---

## 1. The idea

The film is about **water on a surface**: drops sitting on a petal, a drop acting as a lens, a reflection inside it, and everything dissolving into bokeh at the end. So the page treats the **screen as a surface too**: a pane of glass with water on it, drawn in a WebGL shader.

- The title isn't printed on top of the film. It's **made of water**, and each letter magnifies the rose behind it like a lens.
- You can **touch** it: the cursor sends ripples across the glass, and rain makes its own ripples.
- The camera **behaves like a real lens**: it pulls focus, fringes colour at the edges, and glows red around highlights.
- Below the hero, every section reuses that vocabulary: water-ripple images, a sticky diagram of a drop, a film strip, and a footer word that turns to water.

---

## 2. Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run frames` | Re-extract the WebP frames from `source/flower-hero.mp4` (needs `ffmpeg` and bash; on Windows use Git Bash) |

You need Node 18 or newer. The only runtime dependencies are `react` and `react-dom`.

---

## 3. The hero, chapter by chapter

The hero is **pinned for 720vh** (seven screen-heights of scrolling), split into six chapters:

<p align="center"><img src="docs/timeline.svg" alt="Timeline of the six hero chapters with video frames, shader effects and text" width="100%"/></p>

### 01 · Surface (0 – 10%)

<img src="docs/screens/h01-surface.jpg" alt="Widescreen bars, a viewfinder readout, and the word bloom sitting on the glass as water" width="100%"/>

The film is frozen on its first, blurry frame, framed by black widescreen bars and a live viewfinder readout (REC · ƒ/2.8 · 1:1 · focus distance · timecode). **"bloom"** sits on the glass as thick drops of water. Inside each letter the rose is sharp and magnified, as if seen through a lens. Each letter has a highlight on its top-left edge, a dark rim and a soft shadow on the glass.

<img src="docs/screens/h02-ripples.jpg" alt="The cursor sending ripples through the glass and the water letters" width="100%"/>

Moving the cursor sends **ripples** across the glass and through the letters.

### 02 · Focus (10 – 24%)

<img src="docs/screens/h03-melt.jpg" alt="The rose pulled into focus while the water letters melt and run down the glass" width="100%"/>

A **rack focus** pulls the rose sharp, and the focus distance in the readout changes with it. The water letters **melt**: each column runs down the glass by a different amount, and the drops merge into each other like mercury. The widescreen bars open.

### 03 · Rain (24 – 50%) and 04 · Inside the drop (50 – 78%)

| | |
|---|---|
| <img src="docs/screens/h04-rain.jpg" alt="The wet petal, with rain rippling on the glass and the line 'Every petal holds a small storm.'"/> | <img src="docs/screens/h05-drop-lens.jpg" alt="The hanging drop with the words 'upside down' inverted inside it"/> |
| Raindrops hit the glass and ripple. Scrolling faster brings heavier rain. *"Every petal holds a small storm."* rises line by line. | A lens **follows the real drop in the footage**. Inside it, the words "upside down." appear **inverted**, the same way the garden does. Colour fringes grow at the edges. |

### 05 · Fall (78 – 86%)

| | |
|---|---|
| <img src="docs/screens/h06-fall.jpg" alt="The moment the drop lets go: a ripple shockwave with strong colour fringing"/> | <img src="docs/screens/h07-dive.jpg" alt="Diving into the drop, the image dissolving into bokeh"/> |
| The moment the drop lets go: a **ripple shockwave** spreads from it, colour splits around the edges, a red glow flashes, and the bars snap shut and open again. | The camera falls into the drop and the image dissolves. |

### 06 · Stay a while (86 – 100%)

| | |
|---|---|
| <img src="docs/screens/h08-bokeh.jpg" alt="Bokeh discs with 'Stay a while.' still out of focus"/> | <img src="docs/screens/h09-end.jpg" alt="'Stay a while.' in sharp focus on soft blush, with two buttons"/> |
| Bokeh discs drift with the cursor at different depths. **"Stay a *while*."** starts out of focus… | …and resolves like a lens finding focus. The screen settles into blush, the exact colour the next section starts in, so there's no visible edge. |

---

## 4. The landing page, section by section

Light sections are wine on blush; dark sections are blush on deep wine. The nav stays hidden while the film plays (the viewfinder is the header there), then slides in as a glass pill and changes colour to match whatever is under it.

### (01) The film: manifesto

<img src="docs/screens/l01-manifesto.jpg" alt="Large serif manifesto with round photo chips inside the sentence, and the figures 360, 30, 1" width="100%"/>

A large serif paragraph whose words **develop** from pale and blurred to sharp ink as you scroll, like a print in a developer tray. Small round photos from the film sit **inside the sentence** and grow into place. Below it are the figures that define the film: **360** frames, **30** seconds, **1** drop.

### (02) The series: pinned horizontal gallery

<img src="docs/screens/l02-series.jpg" alt="Dark gallery with plates sliding sideways, roman numerals and a 03 / 06 counter" width="100%"/>

Scrolling down **slides six plates sideways**. Each plate is a frame from the film, with a roman numeral, its title, timecode and frame number, and a live `01 / 06` counter in the corner. Hover a plate and the photo **ripples like water**.

### (03) Anatomy of a drop: sticky diagram

<img src="docs/screens/l03-anatomy.jpg" alt="The drop in a circle with rotating text around it, a marker on the drop, and three steps on the right" width="100%"/>

The drop sits inside a slowly rotating ring of text. As you scroll, three steps light up in turn: **surface tension**, **a tiny lens**, **upside down**. A pulsing marker moves to the matching spot on the drop: where it hangs from the petal, the highlight on its curve, and the rose flipped inside it.

### (04) The method, with a running film strip

| | |
|---|---|
| <img src="docs/screens/l04-method.jpg" alt="Three rules with large red roman numerals"/> | <img src="docs/screens/l05-filmstrip.jpg" alt="A tilted strip of film with sprocket holes"/> |
| Three rules, each with a large roman numeral: *Wait for the rain. Find the drop. Slow everything down.* | A tilted strip of 35mm-style film with sprocket holes runs sideways as you scroll, showing frames from across the clip. |

### Marquee, (05) Prints and (06) Newsletter

| | |
|---|---|
| <img src="docs/screens/l06-marquee.jpg" alt="Giant italic 'after the rain' with an outlined line below"/> | <img src="docs/screens/l07-prints.jpg" alt="Three framed prints, staggered"/> |
| A solid line and an outlined line of "after the rain ✦" drift in opposite directions. Scrolling fast speeds them up and leans them. | "Take a *drop* home." Three frames as framed prints with mats, staggered, that lift on hover. |

<img src="docs/screens/l08-newsletter.jpg" alt="'Get the next drop.' with a glass email field" width="100%"/>

"Get the next *drop*.": a glass email field over a soft drop of light.

### Footer

<img src="docs/screens/l09-footer.jpg" alt="Footer links and a giant gradient wordmark" width="100%"/>

Links, a round back-to-top drop, and a giant gradient **bloom** that turns to water while the pointer is over it.

**Across the page:** a glass droplet cursor (desktop) that swells over links and shows a word over images ("Look", "Enquire", "Top"), plus light film grain.

---

## 5. How it was built, step by step

This follows the order the page was actually made in, and names the file for each step.

### 5.1 Making the film

<img src="docs/screens/s00-source-film.jpg" alt="Six frames from the source film from 0.5s to 29s" width="100%"/>

The film was generated in Gemini as three 10-second clips, each prompted to begin exactly where the previous one ended, so they join into one continuous 30-second shot. The story was planned for scrolling: no cuts, slow steady camera moves, and a calm, low-detail ending that makes a good background for text.

- **0–6s:** the rose comes into focus.
- **6–16s:** the camera drifts along the wet petal edge.
- **16–24s:** a drop swells at the tip, with the garden reflected in it.
- **24–27s:** the drop falls and the camera dives in.
- **27–30s:** pink bokeh.

The Gemini watermark in the corner was removed with an ffmpeg `delogo` patch over soft background. The cleaned clip is `source/flower-hero.mp4` (1280×720, 24fps).

### 5.2 Turning the film into frames

A `<video>` element can't be scrubbed reliably by scroll: seeking is slow and imprecise. Separate images are predictable. `scripts/extract-frames.sh` keeps **every second frame**, which gives **360 WebP images**:

```bash
ffmpeg -i source/flower-hero.mp4 -an -vf "select='not(mod(n\,2))',scale=1280:-2" -vsync vfr \
       -c:v libwebp -quality 72 public/frames/desktop/f_%04d.webp     # ~6.9 MB
ffmpeg -i source/flower-hero.mp4 -an -vf "select='not(mod(n\,2))',scale=720:-2"  -vsync vfr \
       -c:v libwebp -quality 64 public/frames/mobile/f_%04d.webp      # ~3.5 MB
```

`-vsync vfr` (rather than the newer `-fps_mode`) keeps the script working with older ffmpeg versions. The stills used on the landing page (`public/stills/`) were exported from the same clip.

### 5.3 Loading 360 frames without a wait

`src/hero/FrameStore.ts` loads frames **in passes**: every 8th frame first (45 frames covering the whole film), then every 4th, every 2nd, then the rest.

- The preloader only waits for the first pass, so you can scroll the whole film almost immediately while the gaps fill in.
- `get(i)` always returns the **nearest frame that has loaded**, so scrubbing never shows a blank.
- Six downloads run in parallel, and each image is decoded with `createImageBitmap` so it's ready for the GPU.
- Phones, or browsers with *Save-Data* on, get the 720px set.

### 5.4 Pinning the hero and reading the scroll

```
<section class="bloom" style="height: 720vh">    ← the scroll track
  <div class="bloom__stage">                     ← position: sticky; top: 0; height: 100svh
    <canvas/> + letterbox, viewfinder, text
```

Scroll progress `p` (0 → 1) is how far the track has scrolled past the top. It's **eased toward its target** every frame, frame-rate independently, so even a mouse wheel glides:

```ts
current += (target - current) * (1 - Math.exp(-dt * 6));
```

`frameAt(p)` (`src/hero/config.ts`) keeps the film frozen on frame 0 during *Surface*, plays frames 0 → 359 between 10% and 92% of the scroll, then holds on the last frame while the ending settles.

### 5.5 One loop drives the hero

`tick()` in `src/hero/BloomHero.tsx` runs once per animation frame. Each time it:

1. Eases the scroll and works out each chapter's progress (`focus`, `rain`, `drop`, `fall`, `bokeh`, each 0 → 1).
2. Writes CSS variables onto the stage (`--bars`, `--intro`, `--rain-in`, `--drop-in`, `--end` and so on). The HTML text and buttons are styled purely from those variables, so **React never re-renders while you scroll**.
3. Picks the frame, adds new ripples (cursor, rain, shockwave) and steps the simulation.
4. Draws the glass with one WebGL2 pass (`src/hero/WaterRenderer.ts`).

Every fade is a `smooth(a, b, x)` ramp over part of a chapter. To re-time anything, change two numbers.

```mermaid
flowchart LR
  S[Scroll] --> P["p (eased) 0→1"]
  P --> C["chapter progress<br/>focus · rain · drop · fall · bokeh"]
  C --> V["CSS variables<br/>--bars --intro --rain-in --end …"]
  C --> U["shader uniforms<br/>focus · melt · ca · lens · flash · wash"]
  P --> F["frameAt(p) → FrameStore"]
  M[Cursor + rain] --> R["ripple simulation"]
  F --> G[WebGL2 canvas]
  U --> G
  R --> G
  V --> D["text & buttons (CSS only)"]
```

### 5.6 Water letters

<img src="docs/screens/s02-water-letters.png" alt="Three panels: the word drawn sharp, blurred, then thresholded into rounded drops" width="100%"/>

`src/hero/WaterMask.ts` draws "bloom" white-on-black. The shader (`src/hero/shaders.ts`) then turns it into water in three moves:

1. **Round it.** The word is read from a **blurred mipmap** of that image and cut at a threshold. Every sharp corner becomes a fat, rounded drop, the classic "gooey" trick, and the blurred value inside works as the drop's height (a dome).
2. **Shape the surface.** Sampling the height a few pixels left, right, up and down gives the **slope** (a normal) at every point.
3. **Make it look wet.** That slope bends the film inside the letter like a lens. The film there is read at a much sharper focus than the background, which is why the letters show a crisp rose over a blurred one. Light from the top-left adds a **highlight**. The edge gets a **dark rim**, and a blurred, offset copy becomes a **soft shadow** on the glass.

**The melt:** each column of the word is pulled down by a smooth noisy amount, and the blur grows at the same time. The letters drip at different speeds and merge into each other. On tall phone screens the drips are broader and shorter, so the shapes stay liquid instead of spiky.

### 5.7 Ripples: a tiny wave simulation

`WaterRenderer.ts` runs a **damped 2D wave equation** at a quarter of the screen resolution, swapping between two half-float textures each frame (red = height now, green = height one step ago):

```glsl
float next = (left + right + up + down) * .5 - previous;
next *= damp;                       // ripples fade out
next += strength * exp(-d*d / r*r); // a new bump: cursor, raindrop or shockwave
```

- The **cursor** adds a bump wherever it moves, stronger when it moves faster.
- **Rain** adds random bumps, more of them the faster you scroll.
- The **fall** adds one big bump plus a wide negative ring at the drop, which makes the shockwave.

The slope of this height field bends the film and adds small glints. On phones the simulation is switched off to save battery, and everything else stays.

### 5.8 Tracking the real drop

<img src="docs/screens/s01-drop-track.jpg" alt="Six frames with a yellow box marking the tracked drop" width="100%"/>

The hanging drop moves and grows through the film, so its **centre and size were measured by hand** at 12 points between frames 160 and 310. They're stored in `src/hero/dropTrack.ts`, and the code blends between them for every frame in between.

The shader converts that position from the video to the screen, using the same cover-fit and push-in as the film. It then draws a second texture, the words "upside down.", **flipped both ways** inside the drop with a slight fisheye bulge, the way a real drop inverts what's behind it.

### 5.9 Camera language

| Effect | How |
|---|---|
| **Rack focus** | The film is read from a blurrier mipmap level. The level eases from 4.2 to 0 during *Focus*, with short refocus pulses at the drop and the fall. The viewfinder's focus distance is calculated from it. |
| **Chromatic aberration** | Red and blue are sampled slightly apart, more toward the edges. It grows through *Inside the drop* and spikes at the fall. |
| **Halation** | A very blurred copy of the frame finds bright areas and adds a red glow around them, as film does. |
| **Letterbox** | Two black bars, plain HTML, set by `--bars`. They open during *Focus* and snap during the fall. |
| **Viewfinder** | REC dot, ƒ/2.8 · 1:1 · live focus distance, and the timecode of the current frame. |
| **Also** | Vignette, film grain in the shader, and a slow 5% push-in across the whole hero. |

### 5.10 The fall, the bokeh and the seamless hand-off

- **The fall:** when the scroll crosses frame 306 (the drop has just let go), the shockwave fires once. It's re-armed if you scroll back up. A red flash fades out after it.
- **The bokeh:** fourteen soft discs are drawn in the shader. Each one moves with the cursor by an amount set by its "depth", which gives parallax.
- **The hand-off:** "Stay a *while*." un-blurs with a CSS `filter: blur()` driven by scroll. The shader's final wash is exactly blush `#f7dcd5`, the background of the first section below, so the hero ends without an edge.
- **Paused when hidden:** once the hero has scrolled fully off screen, the loop stops drawing.

### 5.11 The landing page engine

`src/lib/scroll.ts` is one shared animation loop for everything below the hero:

- **`useScrollVar(ref, "pin")`** gives a tall section a `--sp` variable (0 → 1) as it scrolls past its sticky stage. Series and Anatomy use this.
- **`useScrollVar(ref, "pass")`** gives `--sp` as an element travels through the viewport. The Manifesto and the film strip use this.
- **`onFrame()`** lets the nav and the marquee run every frame, with the scroll velocity.
- **`useReveal()`** adds `.is-in` to `[data-reveal]` elements the first time they appear, for the slide-up reveals.

A few techniques worth knowing:

- **Manifesto words** use one CSS formula. Each word knows its index `--i` and the total `--n`, and its visibility is `clamp(0.12, (sp × 2.1 − 0.42) × n − i + 1, 1)`. A "front" sweeps through the words as you scroll.
- **Series** measures how far the row has to travel (`--travel`) and moves it with `translateX(sp × −travel)`.
- **Anatomy** maps scroll to a step (0, 1, 2) and moves the marker with a CSS transition.
- **The nav** checks which section is under it (`elementsFromPoint`, skipping itself) and switches between light and dark.

### 5.12 Water outside the hero

`src/components/RippleImage.tsx` gives each image its own SVG filter (`feTurbulence` → `feDisplacementMap`). On hover, the displacement swells and settles over about a second, like a touched water surface. The footer wordmark uses the same filter, but keeps flowing while the pointer stays over it.

---

## 6. Design system

| Font | Used for |
|---|---|
| **Outfit** Bold | The water word, the nav logo, the footer wordmark (rounded shapes make good drops) |
| **Instrument Serif** | Headlines and statements, with the *italic* for single accent words |
| **Italiana** | Roman numerals and large figures |
| **Instrument Sans** | Body text and buttons |
| **Geist Mono** | Labels, timecodes, the viewfinder |

All are self-hosted in `public/fonts` (cut down to Latin characters), so the page loads nothing from Google.

| Colour | Value | Where |
|---|---|---|
| Wine | `#2a0a10` | Text on light sections, solid buttons |
| Deep wine | `#140306` | Dark section backgrounds |
| Blush | `#f7dcd5` | Light backgrounds, and the hero's final wash |
| Rose | `#d8344b` | Small accents: numerals, italic words, the cursor dot |
| Peach / pink | `#ffd3c2` / `#f6a8c4` | Gradients on the wordmark, accents on dark |

---

## 7. Phones, accessibility and performance

<img src="docs/mobile-strip.jpg" alt="Phone layout: hero, drop lens, ending, manifesto, series and footer" width="100%"/>

**Phones**
- The 720px frames are used and the canvas resolution is capped.
- The ripple simulation is off. The water letters, melt, drop lens, focus effects and bokeh all stay.
- The Series gallery becomes a swipeable row, and Anatomy becomes a normal stacked section.
- The nav keeps just the logo and "Collect a print".

**Reduced motion** (when a visitor has asked their device for less motion)
- No ripples, push-in or flash, and a gentler rack focus. The scroll follows directly.
- Reveals appear without movement. The marquee, the image ripples and the animated markers stop.

**Accessibility**
- "bloom" is a real, visually hidden `<h1>`, and the ending a real `<h2>`.
- The manifesto keeps its full text, the photo chips have descriptions, and the email field has a label.
- The custom cursor only appears on devices with a fine pointer.

**Performance**
- The hero runs one loop and a single main shader pass, plus a small quarter-resolution simulation, and it stops drawing when it's off screen.
- The rest of the page shares one loop that only updates elements near the viewport.
- Images below the hero load lazily.

---

## 8. Project structure

```
flower/
├─ index.html                 font + poster preload
├─ source/flower-hero.mp4     the 30s film (watermark removed)
├─ scripts/extract-frames.sh  film → WebP frames
├─ public/
│  ├─ frames/desktop|mobile/  360 × WebP each (~6.9 MB / ~3.5 MB)
│  ├─ stills/                 plates, chips, anatomy drop, film-strip thumbnails
│  ├─ fonts/                  Outfit, Instrument Serif/Sans, Italiana, Geist Mono (+ licences)
│  └─ poster.webp             first frame, behind the preloader
├─ docs/                      README screenshots, demo GIF/MP4, timeline
└─ src/
   ├─ main.tsx                mounts the app, page grain
   ├─ App.tsx                 cursor + nav + hero + sections + footer
   ├─ styles.css              hero styling, tokens, fonts
   ├─ page.css                landing page styling
   ├─ hero/
   │  ├─ BloomHero.tsx        pinned hero, the tick() loop, all hero text
   │  ├─ WaterRenderer.ts     WebGL2: ripple simulation + main pass
   │  ├─ shaders.ts           water word, ripples, drop lens, focus, aberration, halation, bokeh
   │  ├─ WaterMask.ts         draws the word and the upside-down text
   │  ├─ dropTrack.ts         the drop's position, frame by frame
   │  ├─ FrameStore.ts        progressive frame loading
   │  └─ config.ts            chapters, frame mapping, helpers
   ├─ lib/scroll.ts           shared scroll loop, --sp variables, reveals
   ├─ components/             Nav, Cursor, RippleImage, Sparkle, Preloader
   └─ sections/               Manifesto, Series, Anatomy, Method, Marquee, Prints, Newsletter, Footer
```

---

## 9. Customising it

| Change | Where |
|---|---|
| The word on the glass | `WORD` in `src/hero/config.ts` |
| Hero chapter timing / length | `CH`, `FILM_END`, `TRACK_VH` in `src/hero/config.ts` |
| Timing inside a chapter | the `smooth(a, b, …)` lines in `tick()`, `src/hero/BloomHero.tsx` |
| Hero text and buttons | JSX at the bottom of `src/hero/BloomHero.tsx` |
| The text inside the drop | `drawLensText()` in `src/hero/WaterMask.ts` |
| Water look (refraction, highlights, melt, bokeh) | `src/hero/shaders.ts` |
| Section text | the files in `src/sections/` |
| Plates in the gallery | `PLATES` in `src/sections/Series.tsx` |
| Colours and fonts | the top of `src/styles.css` |

**Using a different film**
1. Put it in `source/` and run `npm run frames -- source/your-film.mp4`.
2. Update `FRAME_COUNT` and `CLIP_SECONDS` in `config.ts`.
3. **Re-measure the drop** in `dropTrack.ts`, or set the lens amount to 0.
4. Re-export the stills in `public/stills/`.

**Before going live**
- **Newsletter:** the form is front-end only. Connect `onSubmit` in `src/sections/Newsletter.tsx` to your email service (Mailchimp, Buttondown, Formspree…).
- **Social links:** the footer's Instagram and Vimeo links are placeholders.
- **Prints:** the sizes and "signed and numbered" wording are sample content.

---

## 10. Credits and licences

- **Film:** generated with Gemini for this project, as three 10-second clips joined into one shot.
- **Fonts:** Outfit, Instrument Serif, Instrument Sans, Italiana and Geist Mono are all under the SIL Open Font License. The licence files are in `public/fonts/`, and Instrument Serif comes from the Instrument Serif project, also OFL.
- **Code:** written from scratch with React, TypeScript and WebGL2. No animation, scroll or 3D libraries.
