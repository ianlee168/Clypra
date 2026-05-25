import { TemplateDefinition } from "../types";
import lottieData from "./typewriter.json";

export const typewriter: TemplateDefinition = {
  id: "typewriter",
  name: "Typewriter",
  category: "kinetic",
  description: "Text types itself character by character",
  tags: ["typewriter", "kinetic", "typing", "retro", "code"],
  durationFrames: 150,
  fps: 30,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "typed-text", defaultText: "What if I told you...", maxCharacters: 48, role: "primary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./typewriter.json",
  lottieData,
  thumbnailFrame: 90
};
export default typewriter;
