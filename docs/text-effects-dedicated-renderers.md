# Text Effects Dedicated Renderers

## Overview

This document describes the dedicated renderer architecture implemented for text effects that require precise control over rendering order.

## Problem

The generic `renderTextEffectToContext` function attempts to handle all text effects using a one-size-fits-all approach. This creates issues for effects with complex stroke and glow combinations:

1. **Stroke rendering order conflicts** - The generic renderer sorts strokes widest-first, but some effects need specific layering
2. **Glow shadow interference** - Glow shadows can create unwanted colored strokes that bleed through
3. **Outside stroke positioning** - Outside strokes render underneath fills, making them appear soft instead of bold

## Solution

Create dedicated renderers for effects that need precise control, following the pattern established by `renderNewspaper`, `renderFrostedGlass`, etc.

## Implemented Dedicated Renderers

### 1. Yellow Glow (`renderYellowGlow`)

**File:** `src/features/text-effects/renderers/yellowGlow.ts`

**Rendering Order:**

1. Yellow glow shadows (2 layers for depth)
2. Black outline stroke (10px)
3. White outline stroke (6px)
4. White fill (core)

**Result:** Bold white text with black outline and yellow glow

---

### 2. Neon Crimson (`renderNeonCrimson`)

**File:** `src/features/text-effects/renderers/neonCrimson.ts`

**Rendering Order:**

1. Red glow shadows (3 layers: 120px, 60px, 20px blur)
2. Red outside stroke (8px)
3. White fill
4. Pink inside stroke (clipped to text)

**Result:** White text with pink inner glow, red outer glow, and triple-layered red ambient glow

---

### 3. Electric Rainbow (`renderElectricRainbow`)

**File:** `src/features/text-effects/renderers/electricRainbow.ts`

**Rendering Order:**

1. Drop shadow
2. Black outside stroke (12px, widest)
3. White outside stroke (8px, medium)
4. Rainbow gradient fill

**Result:** Rainbow gradient text with bold white and black outlines

---

### 4. Red Neon Outline (`renderRedNeonOutline`)

**File:** `src/features/text-effects/renderers/redNeonOutline.ts`

**Rendering Order:**

1. Red glow shadows (3 layers for depth)
2. Red outer stroke (5px)
3. White inner stroke (1.5px, gas tube core)
4. Floor reflection (flipped and faded)

**Result:** Hollow neon sign effect with white gas tube core and floor reflection

---

## Architecture

### Type System

Each dedicated renderer has a corresponding config interface in `types.ts`:

```typescript
export interface YellowGlowConfig {
  enabled: boolean;
}

export interface NeonCrimsonConfig {
  enabled: boolean;
}

export interface ElectricRainbowConfig {
  enabled: boolean;
}

export interface RedNeonOutlineConfig {
  enabled: boolean;
}
```

These are added to the `TextEffectDefinition` interface:

```typescript
export interface TextEffectDefinition {
  // ... other properties
  yellowGlow?: YellowGlowConfig;
  neonCrimson?: NeonCrimsonConfig;
  electricRainbow?: ElectricRainbowConfig;
  redNeonOutline?: RedNeonOutlineConfig;
}
```

### Effect Definitions

Each effect definition enables its dedicated renderer:

```typescript
export const glowYellow: TextEffectDefinition = {
  // ... effect properties
  yellowGlow: {
    enabled: true,
  },
};
```

### Main Renderer Integration

The main `renderTextEffectToContext` function checks for dedicated renderers first:

```typescript
export const renderTextEffectToContext = (...) => {
  // Measure text dimensions
  const lines = text.split("\n");
  const lineHeightPx = fontSize * effect.font.lineHeight;
  applyFontConfig(ctx, effect.font, fontSize);

  let textWidth = 0;
  lines.forEach((line) => {
    textWidth = Math.max(textWidth, ctx.measureText(line).width);
  });
  const textHeight = lines.length * lineHeightPx;

  // Check for specialized renderers first
  if (effect.yellowGlow?.enabled) {
    renderYellowGlow(ctx, text, effect, fontSize, x, y, canvasWidth, canvasHeight, lines, lineHeightPx, textWidth, textHeight);
    return;
  }
  if (effect.neonCrimson?.enabled) {
    renderNeonCrimson(ctx, text, effect, fontSize, x, y, canvasWidth, canvasHeight, lines, lineHeightPx, textWidth, textHeight);
    return;
  }
  // ... other dedicated renderers

  // Fall back to generic rendering
  // ...
};
```

## Benefits

1. **Full Control** - Each effect has complete control over its rendering pipeline
2. **No Conflicts** - Dedicated renderers don't interact with generic rendering logic
3. **Easy Debugging** - All rendering logic for an effect is in one file
4. **Maintainability** - Changes to one effect don't affect others
5. **Performance** - No unnecessary checks or conditional logic in the rendering loop

## Adding New Dedicated Renderers

To add a new dedicated renderer:

1. **Create renderer file** in `src/features/text-effects/renderers/[effectName].ts`
2. **Add config interface** in `src/features/text-effects/types.ts`
3. **Add config to TextEffectDefinition** interface
4. **Enable in effect definition** in `src/features/text-effects/effects/definitions.ts`
5. **Import and integrate** in `src/features/text-effects/renderer.ts`

### Template

```typescript
// src/features/text-effects/renderers/myEffect.ts
import { TextEffectDefinition } from "../types";
import { applyFontConfig } from "./helpers";

export const renderMyEffect = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, effect: TextEffectDefinition, fontSize: number, x: number, y: number, canvasWidth: number, canvasHeight: number, lines: string[], lineHeightPx: number, textWidth: number, textHeight: number) => {
  applyFontConfig(ctx, effect.font, fontSize);

  // Your custom rendering logic here
  // Render in the exact order you need
};
```

## When to Use Dedicated Renderers

Use a dedicated renderer when:

- The effect has complex stroke layering requirements
- Glow shadows interfere with stroke rendering
- Outside strokes need to appear bold instead of soft
- The effect requires precise control over rendering order
- The generic renderer produces incorrect visual results

## When to Use Generic Renderer

Use the generic renderer when:

- The effect has simple fills and strokes
- The default rendering order works correctly
- No special rendering techniques are needed
- The effect doesn't have conflicting visual layers
