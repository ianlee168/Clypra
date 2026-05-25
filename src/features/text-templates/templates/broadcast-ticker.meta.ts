import { TemplateDefinition } from "../types";
import lottieData from "./broadcast-ticker.json";

export const broadcastTicker: TemplateDefinition = {
  id: "broadcast-ticker",
  name: "Broadcast Ticker",
  category: "broadcast",
  description: "News-style bottom ticker with scrolling text",
  tags: ["broadcast", "news", "ticker", "scrolling", "lower-third"],
  durationFrames: 240,
  fps: 30,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "category", defaultText: "BREAKING", maxCharacters: 12, role: "accent" },
    { layerName: "ticker-text", defaultText: "Your scrolling headline text goes here — add as much as you need", maxCharacters: 120, role: "primary" }
  ],
  defaultPlacement: "lower-third",
  lottieFile: "./broadcast-ticker.json",
  lottieData,
  thumbnailFrame: 60
};
export default broadcastTicker;
