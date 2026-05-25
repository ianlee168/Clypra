import { TemplateDefinition } from "../types";
import lottieData from "./split-reveal.json";

export const splitReveal: TemplateDefinition = {
  id: "split-reveal",
  name: "Split Reveal",
  category: "kinetic",
  description: "Text reveals as two halves split apart vertically",
  tags: ["split", "reveal", "kinetic", "vertical", "rectangle"],
  durationFrames: 120,
  fps: 30,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "main-text", defaultText: "REVEALED", maxCharacters: 16, role: "primary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./split-reveal.json",
  lottieData,
  thumbnailFrame: 40
};
export default splitReveal;
