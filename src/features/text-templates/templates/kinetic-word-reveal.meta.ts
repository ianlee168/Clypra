import { TemplateDefinition } from "../types";
import lottieData from "./kinetic-word-reveal.json";

export const kineticWordReveal: TemplateDefinition = {
  id: "kinetic-word-reveal",
  name: "Kinetic Word Reveal",
  category: "kinetic",
  description: "Each word reveals individually on a staggered cascade",
  tags: ["kinetic", "reveal", "energetic", "fast", "stagger"],
  durationFrames: 120,
  fps: 30,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "word-1", defaultText: "YOUR", maxCharacters: 12, role: "primary" },
    { layerName: "word-2", defaultText: "STORY", maxCharacters: 12, role: "primary" },
    { layerName: "word-3", defaultText: "STARTS", maxCharacters: 12, role: "primary" },
    { layerName: "word-4", defaultText: "HERE", maxCharacters: 12, role: "primary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./kinetic-word-reveal.json",
  lottieData,
  thumbnailFrame: 50
};
export default kineticWordReveal;
