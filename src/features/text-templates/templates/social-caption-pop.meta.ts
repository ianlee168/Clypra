import { TemplateDefinition } from "../types";
import lottieData from "./social-caption-pop.json";

export const socialCaptionPop: TemplateDefinition = {
  id: "social-caption-pop",
  name: "Social Caption Pop",
  category: "social",
  description: "Bold caption that bounces in, Instagram/TikTok style",
  tags: ["social", "caption", "tiktok", "instagram", "pop", "bob"],
  durationFrames: 90,
  fps: 30,
  width: 1080,
  height: 1080,
  textLayers: [
    { layerName: "caption", defaultText: "Your Caption Here", maxCharacters: 32, role: "primary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./social-caption-pop.json",
  lottieData,
  thumbnailFrame: 30
};
export default socialCaptionPop;
