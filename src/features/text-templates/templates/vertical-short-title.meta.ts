import { TemplateDefinition } from "../types";
import lottieData from "./vertical-short-title.json";

export const verticalShortTitle: TemplateDefinition = {
  id: "vertical-short-title",
  name: "Vertical Short Title",
  category: "social",
  description: "Short vertical format for TikTok and Shorts",
  tags: ["social", "vertical", "short", "trending"],
  durationFrames: 90,
  fps: 30,
  width: 1080,
  height: 1920,
  textLayers: [
    { layerName: "main-text", defaultText: "Wait for it...", maxCharacters: 40, role: "primary" },
    { layerName: "sub-text", defaultText: "#viral #trending", maxCharacters: 40, role: "secondary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./vertical-short-title.json",
  lottieData,
  thumbnailFrame: 45
};
export default verticalShortTitle;
