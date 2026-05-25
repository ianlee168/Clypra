import { TemplateDefinition } from "../types";
import lottieData from "./glitch-title.json";

export const glitchTitle: TemplateDefinition = {
  id: "glitch-title",
  name: "Glitch Title",
  category: "energetic",
  description: "Corrupted digital title with RGB split and displacement",
  tags: ["glitch", "cyberpunk", "hacker", "displacement", "energetic"],
  durationFrames: 120,
  fps: 30,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "glitch-text", defaultText: "SYSTEM ERROR", maxCharacters: 20, role: "primary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./glitch-title.json",
  lottieData,
  thumbnailFrame: 30
};
export default glitchTitle;
