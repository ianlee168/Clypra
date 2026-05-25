import { TemplateDefinition } from "../types";
import lottieData from "./stat-callout.json";

export const statCallout: TemplateDefinition = {
  id: "stat-callout",
  name: "Stat Callout",
  category: "social",
  description: "Animated number + label, data visualization style",
  tags: ["stat", "callout", "numbers", "views", "data"],
  durationFrames: 120,
  fps: 30,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "stat-number", defaultText: "10M", maxCharacters: 8, role: "primary" },
    { layerName: "stat-label", defaultText: "VIEWS", maxCharacters: 16, role: "secondary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./stat-callout.json",
  lottieData,
  thumbnailFrame: 60
};
export default statCallout;
