import { TemplateDefinition } from "../types";
import lottieData from "./minimal-fade-title.json";

export const minimalFadeTitle: TemplateDefinition = {
  id: "minimal-fade-title",
  name: "Minimal Fade",
  category: "minimal",
  description: "Nothing but the text. Slow fade in, slow fade out.",
  tags: ["minimal", "fade", "clean", "slow", "quiet"],
  durationFrames: 120,
  fps: 24,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "title", defaultText: "A QUIET MOMENT", maxCharacters: 24, role: "primary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./minimal-fade-title.json",
  lottieData,
  thumbnailFrame: 48
};
export default minimalFadeTitle;
