import { BloomHero } from "./hero/BloomHero";
import { Nav } from "./components/Nav";
import { Cursor } from "./components/Cursor";
import { Manifesto } from "./sections/Manifesto";
import { Series } from "./sections/Series";
import { Anatomy } from "./sections/Anatomy";
import { Method } from "./sections/Method";
import { Marquee } from "./sections/Marquee";
import { Prints } from "./sections/Prints";
import { Newsletter } from "./sections/Newsletter";
import { Footer } from "./sections/Footer";
import { useReveal } from "./lib/scroll";

export default function App() {
  useReveal();
  return (
    <>
      <Cursor />
      <Nav />
      <main id="top">
        <BloomHero />
        <Manifesto />
        <Series />
        <Anatomy />
        <Method />
        <Marquee />
        <Prints />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
