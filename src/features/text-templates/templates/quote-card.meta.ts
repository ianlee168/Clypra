import { TemplateDefinition } from "../types";
import lottieData from "./quote-card.json";

export const quoteCard: TemplateDefinition = {
  id: "quote-card",
  name: "Quote Card",
  category: "documentary",
  description: "Attributed quote with decorative marks, thoughtful pacing",
  tags: ["quote", "documentary", "attribution", "serif", "minimal"],
  durationFrames: 144,
  fps: 24,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "quote-text", defaultText: "The best time to start was yesterday. The next best time is now.", maxCharacters: 96, role: "primary" },
    { layerName: "attribution", defaultText: "— Unknown", maxCharacters: 32, role: "secondary" }
  ],
  defaultPlacement: "center",
  lottieFile: "./quote-card.json",
  lottieData,
  thumbnailFrame: 72
};
export default quoteCard;
