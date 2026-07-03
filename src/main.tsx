import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/nunito-sans/400.css";
import "@fontsource/nunito-sans/600.css";
import "@fontsource/nunito-sans/700.css";
import "@fontsource/nunito-sans/800.css";
import "./index.css";
import App from "./app.tsx";
import { sounds } from "./sounds";

// Unlock Web Audio API context on first user gesture
const handleGesture = () => {
  sounds.init();
  window.removeEventListener("pointerdown", handleGesture);
};
window.addEventListener("pointerdown", handleGesture);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
