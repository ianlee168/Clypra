import { TemplateDefinition } from "../types";
import lottieData from "./cinematic-opener.json";

export const cinematicOpener: TemplateDefinition = {
  id: "cinematic-opener",
  name: "Cinematic Opener",
  category: "cinematic",
  description: "Wide letterbox title reveal, blockbuster feel",
  tags: ["cinematic", "blockbuster", "opener", "wide", "slow"],
  durationFrames: 144,
  fps: 24,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "main-title", defaultText: "THE TITLE", maxCharacters: 20, role: "primary" },
    { layerName: "sub-title", defaultText: "A Film by Someone", maxCharacters: 32, role: "secondary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./cinematic-opener.json",
  lottieData,
  thumbnailFrame: 72
};
export default cinematicOpener;
