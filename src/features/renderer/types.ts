export interface ColorStop {
  position: number; // 0.0–1.0
  color: string; // hex or rgba()
}

export interface GradientFill {
  type: "linear" | "radial" | "conic";
  angle?: number; // degrees, for linear
  stops: ColorStop[];
}

export interface TextureFill {
  type: "texture";
  src: string; // relative path to asset
  blendMode: GlobalCompositeOperation;
  opacity: number; // 0.0–1.0
}

export interface SolidFill {
  type: "solid";
  color: string;
}

export type Fill = SolidFill | GradientFill | TextureFill;

export interface Stroke {
  color: string;
  width: number; // px
  position: "outside" | "inside" | "center";
  opacity: number; // 0.0–1.0
  join?: CanvasLineJoin; // default: 'round'
}

export interface Shadow {
  type: "drop" | "inner" | "glow";
  color: string;
  blur: number; // px
  offsetX: number;
  offsetY: number;
  opacity: number; // 0.0–1.0
  spread?: number; // glow only
}

export interface BevelConfig {
  depth: number; // px — number of stacked offset copies
  highlightColor: string; // top-left edge
  shadowColor: string; // bottom-right edge
}

export interface FloorReflectionConfig {
  enabled: boolean;
  opacity: number; // 0.0–1.0
  blur: number; // px
  offsetY: number; // px from baseline
  fadeLength: number; // px length of vertical fade-out
}

export interface BackgroundConfig {
  color: string;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
  stroke?: Stroke;
}

export interface GlitchConfig {
  enabled: boolean;
  rgbOffset: number; // px — horizontal channel split
  slices: number; // number of horizontal displacement slices
  sliceMaxOffset: number; // max px horizontal shift per slice
  scanlineOpacity: number; // 0.0–1.0
  glitchIntensity?: number; // 0.0–1.0 — probability of glitch occurring per frame
  blockArtifacts?: boolean; // enable random colored block artifacts
  blockColor1?: string; // first artifact color (default: channelColor1)
  blockColor2?: string; // second artifact color (default: cyan)
  noiseBar?: boolean; // enable animated noise bar sweep
  dynamicOffset?: boolean; // enable dynamic offset variation
  channelColor1?: string; // red channel color (default: #FF0000)
  channelColor2?: string; // cyan channel color (default: #00FFFF)
}

export interface NewspaperConfig {
  enabled: boolean;
  dotSpacing: number; // px — spacing between halftone dots
  offsetAmount: number; // px — CMYK plate misalignment offset
  inkBleed: number; // px — ink bleeding blur amount
  paperColor: string; // background paper color
  foxingDensity: number; // 0-10 — age spots and paper texture density
  separations: Array<{
    // CMYK-style color separations
    color: string; // rgba color for this ink layer
    dx: number; // horizontal offset in px
    dy: number; // vertical offset in px
  }>;
}

export interface FrostedGlassConfig {
  enabled: boolean;
  etchOpacity: number; // 0.0–1.0 — opacity of etched text
  glassBlur: number; // px — backdrop blur amount
  backgroundGradient: {
    // radial gradient for background
    centerColor: string; // center color (teal)
    edgeColor: string; // edge color (slate)
  };
  highlightColor: string; // color for top-left highlight
  depthColor: string; // color for bottom-right shadow depth
  glowColor: string; // ambient backlight glow color
  glowIntensity: number; // 0.0–1.0 — glow opacity
  surfaceScale: number; // 0.0–5.0 — specular lighting surface scale
  specularConstant: number; // 0.0–2.0 — specular reflection intensity
  noiseFrequency: number; // 0.0–2.0 — frosted texture grain frequency
  noiseOpacity: number; // 0.0–1.0 — frosted texture opacity
}

export interface BurnedWoodConfig {
  enabled: boolean;
  woodTone: "Honey Oak" | "Dark Walnut" | "Spiced Cherry"; // wood color preset
  scorchIntensity: number; // 0.0–2.0 — burn darkness multiplier
  charcoalWidth: number; // px — width of charred edge
  bleedRadius: number; // px — glow/bleed radius around burn
  warpStrength: number; // 0–30 — displacement distortion strength
  grainDetail: number; // 0.5–3.0 — wood grain density multiplier
  knotCount: number; // 0–5 — number of wood knots to render
}

export interface VictorianOrnateConfig {
  enabled: boolean;
  bgType: "Oxblood" | "Midnight Navy" | "Forest Green"; // background color preset
  goldTone: "Antique Gold" | "Champagne Gold" | "Rose Gold"; // gold gradient preset
  borderStyle: "Intricate Filigree" | "Minimalist" | "Double Line"; // border decoration style
  embossDepth: number; // 0–10 — depth of embossed shadow layers
  patternOpacity: number; // 0.0–0.2 — damask pattern visibility
  subtitle?: string; // optional subtitle text below main text
  showOrnaments: boolean; // show corner filigree ornaments
  showDivider: boolean; // show decorative divider below subtitle
}

export interface CalligraphyInkConfig {
  enabled: boolean;
  inkColor: string; // primary ink color (dark blue-black)
  bleedAmount: number; // 0.0–5.0 — ink bleeding/feathering radius in px
  paperWarmth: string; // warm paper background color
  fiberDensity: number; // 0–1000 — number of visible paper fibers
  dryBrushIntensity: number; // 0.0–1.0 — trailing dry brush stroke visibility
  inkGradient: {
    // gradient stops for ink richness variation
    start: string; // darkest ink
    mid1: string; // primary ink color
    mid2: string; // lighter ink
    mid3: string; // even lighter
    end: string; // lightest edge
  };
}

export interface TextEffectDefinition {
  id: string;
  name: string;
  category: EffectCategory;
  description: string;
  tags: string[];

  font: {
    family: string;
    weight: number;
    style: "normal" | "italic";
    letterSpacing: number; // px
    lineHeight: number; // multiplier
  };

  background?: BackgroundConfig;
  fills: Fill[]; // rendered back-to-front
  strokes: Stroke[]; // rendered widest-first (outside-in)
  shadows: Shadow[];
  bevel?: BevelConfig;
  glitch?: GlitchConfig;
  newspaper?: NewspaperConfig;
  frostedGlass?: FrostedGlassConfig;
  burnedWood?: BurnedWoodConfig;
  victorianOrnate?: VictorianOrnateConfig;
  calligraphyInk?: CalligraphyInkConfig;
  floorReflection?: FloorReflectionConfig;
}

export type EffectCategory = "metallic" | "neon" | "gradient" | "retro" | "grunge" | "clean" | "glitch" | "organic" | "space" | "3d";
