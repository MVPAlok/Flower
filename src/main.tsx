import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./page.css";

// a small noise tile for the page-wide film grain
(() => {
  const c = document.createElement("canvas");
  c.width = c.height = 140;
  const x = c.getContext("2d")!;
  const img = x.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  document.documentElement.style.setProperty("--page-grain", `url(${c.toDataURL("image/png")})`);
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
