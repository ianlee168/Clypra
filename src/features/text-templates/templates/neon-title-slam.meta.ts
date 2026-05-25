import { TemplateDefinition } from "../types";
import lottieData from "./neon-title-slam.json";

export const neonTitleSlam: TemplateDefinition = {
  id: "neon-title-slam",
  name: "Neon Title Slam",
  category: "title-card",
  description: "High-energy title that slams in with neon glow",
  tags: ["title-card", "neon", "slam", "glow", "energetic"],
  durationFrames: 90,
  fps: 30,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "title-text", defaultText: "YOUR TITLE", maxCharacters: 16, role: "primary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./neon-title-slam.json",
  lottieData,
  thumbnailFrame: 30
};
export default neonTitleSlam;
