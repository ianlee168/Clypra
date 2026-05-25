import { TemplateDefinition } from "../types";
import lottieData from "./clean-lower-third.json";

export const cleanLowerThird: TemplateDefinition = {
  id: "clean-lower-third",
  name: "Clean Lower Third",
  category: "lower-third",
  description: "Classic broadcast lower-third with name and title",
  tags: ["lower-third", "broadcast", "clean", "minimal"],
  durationFrames: 150,
  fps: 30,
  width: 1920,
  height: 1080,
  textLayers: [
    { layerName: "primary-text", defaultText: "FULL NAME", maxCharacters: 24, role: "primary" },
    { layerName: "secondary-text", defaultText: "Job Title / Location", maxCharacters: 36, role: "secondary" }
  ],
  defaultPlacement: "lower-third",
  lottieFile: "./clean-lower-third.json",
  lottieData,
  thumbnailFrame: 45
};
export default cleanLowerThird;
