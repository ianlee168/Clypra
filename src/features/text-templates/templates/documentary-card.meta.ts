import { TemplateDefinition } from "../types";
import lottieData from "./documentary-card.json";

export const documentaryCard: TemplateDefinition = {
  id: "documentary-card",
  name: "Documentary Card",
  category: "documentary",
  description: "Ken Burns style location/name card, understated authority",
  tags: ["lower-third", "documentary", "classic", "minimal", "elegance"],
  durationFrames: 96,
  fps: 24,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "location", defaultText: "LAGOS, NIGERIA", maxCharacters: 28, role: "primary" },
    { layerName: "year", defaultText: "2026", maxCharacters: 4, role: "accent" }
  ],
  defaultPlacement: "lower-third",
  lottieFile: "./documentary-card.json",
  lottieData,
  thumbnailFrame: 48
};
export default documentaryCard;
