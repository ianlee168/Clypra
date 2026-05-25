import { TemplateDefinition } from "../types";
import lottieData from "./youtube-endcard.json";

export const youtubeEndcard: TemplateDefinition = {
  id: "youtube-endcard",
  name: "YouTube End Card",
  category: "outro",
  description: "Subscribe prompt with animated arrow and CTA",
  tags: ["outro", "youtube", "subscribe", "cta", "endcard"],
  durationFrames: 150,
  fps: 30,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "channel-name", defaultText: "YourChannel", maxCharacters: 28, role: "primary" },
    { layerName: "cta-text", defaultText: "Don't forget to subscribe!", maxCharacters: 36, role: "secondary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./youtube-endcard.json",
  lottieData,
  thumbnailFrame: 80
};
export default youtubeEndcard;
