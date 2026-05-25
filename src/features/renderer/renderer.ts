import { TextEffectDefinition, Fill, Stroke, Shadow, TextureFill } from "./types";
import { parseColor, interpolateColor, applyFontConfig, clipToText } from "./helpers";
import { renderNewspaper } from "./newspaper";
import { renderFrostedGlass } from "./frostedGlass";
import { renderBurnedWood } from "./burnedWood";
import { renderVictorianOrnate } from "./victorianOrnate";
import { renderCalligraphyInk } from "./calligraphyInk";

/**
 * Core Canvas 2D Text Effects Rendering Context Engine.
 * Renders full text layers back-to-front onto any rendering context.
 * @param ctx - The CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D to draw on.
 * @param text - The text string.
 * @param effect - The premium text effect definition.
 * @param fontSize - Master font size in px.
 * @param x - Horizontal anchor center.
 * @param y - Vertical anchor center.
 * @param canvasWidth - Canvas viewport width in px.
 * @param canvasHeight - Canvas viewport height in px.
 */
export const renderTextEffectToContext = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, effect: TextEffectDefinition, fontSize: number, x: number, y: number, canvasWidth: number, canvasHeight: number) => {
  const lines = text.split("\n");
  const lineHeightPx = fontSize * effect.font.lineHeight;

  // Apply default setup
  applyFontConfig(ctx, effect.font, fontSize);

  // Measure text dimensions early for specialized renderers
  let textWidth = 0;
  lines.forEach((line) => {
    textWidth = Math.max(textWidth, ctx.measureText(line).width);
  });
  const textHeight = lines.length * lineHeightPx;



  // 1. Draw Background Box if specified
  if (effect.background) {
    const bg = effect.background;
    let maxWidth = 0;
    const totalHeight = lines.length * lineHeightPx;
    lines.forEach((line) => {
      maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
    });

    const bgWidth = maxWidth + bg.paddingX * 2;
    const bgHeight = totalHeight + bg.paddingY * 2;
    const bgX = x - bgWidth / 2;
    const bgY = y - bgHeight / 2;

    ctx.save();
    ctx.beginPath();
    (ctx as any).roundRect(bgX, bgY, bgWidth, bgHeight, bg.borderRadius);
    ctx.fillStyle = bg.color;
    ctx.fill();

    if (bg.stroke) {
      ctx.strokeStyle = bg.stroke.color;
      ctx.lineWidth = bg.stroke.width;
      ctx.globalAlpha = bg.stroke.opacity;
      ctx.lineJoin = bg.stroke.join || "round";
      ctx.stroke();
    }
    ctx.restore();
  }

  // Measure text bounding bounds for gradient mapping
  const bounds = {
    x: x - textWidth / 2,
    y: y - textHeight / 2,
    w: textWidth,
    h: textHeight,
  };

  // Helper to resolve fills into Canvas gradients or solids
  const resolveFillStyle = (fill: Fill): string | CanvasGradient => {
    if (fill.type === "solid") {
      return fill.color;
    }
    if (fill.type === "linear") {
      const angleRad = ((fill.angle ?? 0) * Math.PI) / 180;
      const cx = bounds.x + bounds.w / 2;
      const cy = bounds.y + bounds.h / 2;
      const dx = Math.cos(angleRad);
      const dy = Math.sin(angleRad);
      const halfLen = Math.abs(bounds.w * dx) / 2 + Math.abs(bounds.h * dy) / 2;

      const grad = ctx.createLinearGradient(cx - dx * halfLen, cy - dy * halfLen, cx + dx * halfLen, cy + dy * halfLen);
      fill.stops.forEach((stop) => grad.addColorStop(stop.position, stop.color));
      return grad;
    }
    if (fill.type === "radial") {
      const cx = bounds.x + bounds.w / 2;
      const cy = bounds.y + bounds.h / 2;
      const r = Math.max(bounds.w, bounds.h) / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      fill.stops.forEach((stop) => grad.addColorStop(stop.position, stop.color));
      return grad;
    }
    if (fill.type === "conic") {
      const cx = bounds.x + bounds.w / 2;
      const cy = bounds.y + bounds.h / 2;
      const grad = ctx.createConicGradient(0, cx, cy);
      fill.stops.forEach((stop) => grad.addColorStop(stop.position, stop.color));
      return grad;
    }
    return "#ffffff";
  };

  // 2. Draw Glow Shadows (type: 'glow', rendered before fill/stroke)
  const glowShadows = effect.shadows.filter((s) => s.type === "glow");
  const isHollow = effect.fills.length === 0;
  glowShadows.forEach((shadow) => {
    ctx.save();
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    ctx.globalAlpha = shadow.opacity;

    const iterations = shadow.spread ? shadow.spread + 1 : 1;
    for (let i = 0; i < iterations; i++) {
      lines.forEach((line, index) => {
        const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
        if (effect.strokes.length > 0) {
          const widestStroke = effect.strokes.reduce((max, s) => (s.width > max ? s.width : max), 2);
          ctx.strokeStyle = shadow.color;
          ctx.lineWidth = widestStroke * 2;
          ctx.lineJoin = "round";
          ctx.strokeText(line, x, lineY);
        } else {
          ctx.fillStyle = shadow.color;
          ctx.fillText(line, x, lineY);
        }
      });
    }
    ctx.restore();
  });

  // 3. Draw Drop Shadows (type: 'drop')
  const dropShadows = effect.shadows.filter((s) => s.type === "drop");
  dropShadows.forEach((shadow) => {
    ctx.save();
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    ctx.globalAlpha = shadow.opacity;

    lines.forEach((line, index) => {
      const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
      if (effect.strokes.length > 0) {
        const widestStroke = effect.strokes.reduce((max, s) => (s.width > max ? s.width : max), 2);
        ctx.strokeStyle = shadow.color;
        ctx.lineWidth = widestStroke * 2;
        ctx.lineJoin = "round";
        ctx.strokeText(line, x, lineY);
      } else {
        ctx.fillStyle = shadow.color;
        ctx.fillText(line, x, lineY);
      }
    });
    ctx.restore();
  });

  // 4. Bevel Extrusion Stacking (if defined)
  if (effect.bevel && effect.bevel.depth > 0) {
    const bevel = effect.bevel;
    ctx.save();

    for (let d = bevel.depth; d > 0; d--) {
      const factor = (bevel.depth - d) / bevel.depth;
      const layerColor = interpolateColor(bevel.shadowColor, bevel.highlightColor, factor);
      ctx.fillStyle = layerColor;

      lines.forEach((line, index) => {
        const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
        const ox = d;
        const oy = d;
        ctx.fillText(line, x + ox, lineY + oy);

        if (d === bevel.depth && effect.strokes.length > 0) {
          const darkStroke = effect.strokes.find((s) => s.color === bevel.shadowColor) || effect.strokes[effect.strokes.length - 1];
          ctx.strokeStyle = darkStroke.color;
          ctx.lineWidth = darkStroke.width * 2;
          ctx.lineJoin = darkStroke.join || "round";
          ctx.strokeText(line, x + ox, lineY + oy);
        }
      });
    }
    ctx.restore();
  }

  // 5. Draw Outside Strokes (rendered widest-first, underneath the fill faces)
  const outsideStrokes = effect.strokes.filter((s) => s.position === "outside");
  const sortedOutsideStrokes = [...outsideStrokes].sort((a, b) => b.width - a.width);
  sortedOutsideStrokes.forEach((stroke) => {
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width * 2;
    ctx.lineJoin = stroke.join || "round";
    ctx.globalAlpha = stroke.opacity;

    lines.forEach((line, index) => {
      const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
      ctx.strokeText(line, x, lineY);
    });
    ctx.restore();
  });

  // 6. Draw Standard Fills (rendered back-to-front at original X, Y, excluding textures)
  const standardFills = effect.fills.filter((f) => f.type !== "texture");
  standardFills.forEach((fill, idx) => {
    ctx.save();
    const fillStyle = resolveFillStyle(fill);
    ctx.fillStyle = fillStyle;
    lines.forEach((line, index) => {
      const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
      ctx.fillText(line, x, lineY);
    });
    ctx.restore();
  });

  // 7. Draw Inside and Center Strokes (rendered widest-first on TOP of the fill faces)
  const nonOutsideStrokes = effect.strokes.filter((s) => s.position !== "outside");
  const sortedNonOutsideStrokes = [...nonOutsideStrokes].sort((a, b) => b.width - a.width);
  sortedNonOutsideStrokes.forEach((stroke, idx) => {
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.position === "center" ? stroke.width : stroke.width * 2;
    ctx.lineJoin = stroke.join || "round";
    ctx.globalAlpha = stroke.opacity;

    if (stroke.position === "inside") {
      ctx.save();
      clipToText(ctx, lines, fontSize, effect.font, x, y);
      lines.forEach((line, index) => {
        const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
        ctx.strokeText(line, x, lineY);
      });
      ctx.restore();
    } else {
      lines.forEach((line, index) => {
        const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
        ctx.strokeText(line, x, lineY);
      });
    }
    ctx.restore();
  });

  // 8. Inner Shadows (type: 'inner') using an offscreen inverted mask
  const innerShadows = effect.shadows.filter((s) => s.type === "inner");
  innerShadows.forEach((shadow) => {
    const offscreen = document.createElement("canvas");
    offscreen.width = canvasWidth;
    offscreen.height = canvasHeight;
    const octx = offscreen.getContext("2d");
    if (!octx) return;

    applyFontConfig(octx, effect.font, fontSize);

    octx.fillStyle = "black";
    octx.fillRect(0, 0, canvasWidth, canvasHeight);

    octx.globalCompositeOperation = "destination-out";
    lines.forEach((line, index) => {
      const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
      octx.fillText(line, x, lineY);
    });

    ctx.save();
    ctx.globalCompositeOperation = "source-atop";
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    ctx.globalAlpha = shadow.opacity;
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();
  });

  // 9. Texture Fills (blendMode composite overlays)
  const textureFills = effect.fills.filter((f) => f.type === "texture") as TextureFill[];
  textureFills.forEach((texture) => {
    const img = new Image();
    img.src = texture.src;
    if (img.complete) {
      ctx.save();
      ctx.globalCompositeOperation = texture.blendMode || "source-atop";
      ctx.globalAlpha = texture.opacity;
      ctx.drawImage(img, bounds.x, bounds.y, bounds.w, bounds.h);
      ctx.restore();
    } else {
      img.onload = () => {
        ctx.save();
        ctx.globalCompositeOperation = texture.blendMode || "source-atop";
        ctx.globalAlpha = texture.opacity;
        ctx.drawImage(img, bounds.x, bounds.y, bounds.w, bounds.h);
        ctx.restore();
      };
    }
  });

  // 10. Glitch Displacement channel offset splits (if defined)
  if (effect.glitch && effect.glitch.enabled) {
    const glitch = effect.glitch;
    const w = canvasWidth;
    const h = canvasHeight;

    const glitchIntensity = glitch.glitchIntensity ?? 1.0;
    const shouldGlitch = Math.random() < glitchIntensity;

    const dynamicOffset = glitch.dynamicOffset && shouldGlitch;
    const offsetMultiplier = dynamicOffset ? 1.5 + Math.random() : 1.0;
    const finalRgbOffset = glitch.rgbOffset * offsetMultiplier;

    const snapshot = ctx.getImageData(0, 0, w, h);

    const channelColor1 = glitch.channelColor1 || "#FF0000";
    const channelColor2 = glitch.channelColor2 || "#00FFFF";

    const offscreenRed = document.createElement("canvas");
    offscreenRed.width = w;
    offscreenRed.height = h;
    const oRedCtx = offscreenRed.getContext("2d")!;
    oRedCtx.putImageData(snapshot, 0, 0);
    oRedCtx.globalCompositeOperation = "source-in";
    oRedCtx.fillStyle = channelColor1;
    oRedCtx.fillRect(0, 0, w, h);

    const offscreenBlue = document.createElement("canvas");
    offscreenBlue.width = w;
    offscreenBlue.height = h;
    const oBlueCtx = offscreenBlue.getContext("2d")!;
    oBlueCtx.putImageData(snapshot, 0, 0);
    oBlueCtx.globalCompositeOperation = "source-in";
    oBlueCtx.fillStyle = channelColor2;
    oBlueCtx.fillRect(0, 0, w, h);

    // Don't clear the canvas - work with existing content
    // Apply RGB channel splits using screen blend mode
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    ctx.globalAlpha = 0.5;
    ctx.drawImage(offscreenBlue, finalRgbOffset, 0);
    ctx.drawImage(offscreenRed, -finalRgbOffset, 0);
    ctx.globalAlpha = 1.0;

    // Restore original text on top
    ctx.globalCompositeOperation = "source-over";
    ctx.putImageData(snapshot, 0, 0);
    ctx.restore();

    if (glitch.slices > 0 && shouldGlitch) {
      const textBounds = bounds;
      const minBoundY = Math.max(0, textBounds.y - fontSize);
      const maxBoundY = Math.min(h, textBounds.y + fontSize);

      for (let i = 0; i < glitch.slices; i++) {
        const sliceH = Math.random() * 20 + 5;
        const sliceY = Math.random() * (maxBoundY - minBoundY) + minBoundY;
        const shiftX = (Math.random() - 0.5) * glitch.sliceMaxOffset;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, sliceY, w, sliceH);
        ctx.clip();

        ctx.fillStyle = "#050508";
        ctx.fillRect(0, sliceY, w, sliceH);

        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.6;
        ctx.drawImage(offscreenRed, -finalRgbOffset + shiftX, 0);
        ctx.drawImage(offscreenBlue, finalRgbOffset + shiftX, 0);
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "source-over";

        const sliceData = snapshot;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d")!;
        tempCtx.putImageData(sliceData, shiftX, 0);
        ctx.drawImage(tempCanvas, 0, 0);

        ctx.restore();
      }
    }

    if (glitch.blockArtifacts && shouldGlitch && Math.random() > 0.4) {
      const blockCount = Math.floor(Math.random() * 3) + 2;
      const blockColor1 = glitch.blockColor1 || channelColor1;
      const blockColor2 = glitch.blockColor2 || "#00FFFF";

      for (let i = 0; i < blockCount; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? blockColor1 : blockColor2;
        const blockW = Math.random() * 12 + 4;
        const blockH = Math.random() * 4 + 2;
        const blockX = bounds.x + (Math.random() - 0.5) * bounds.w;
        const blockY = bounds.y + (Math.random() - 0.5) * bounds.h;
        ctx.fillRect(blockX, blockY, blockW, blockH);
      }
    }

    if (glitch.scanlineOpacity > 0) {
      ctx.save();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.globalAlpha = glitch.scanlineOpacity;
      ctx.beginPath();
      for (let scanY = 0; scanY < h; scanY += 4) {
        ctx.moveTo(0, scanY);
        ctx.lineTo(w, scanY);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
      ctx.restore();
    }

    if (glitch.noiseBar) {
      const frameCount = Date.now() / 16;
      if (frameCount % 60 < 15) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        const noiseBarY = (frameCount * 8) % h;
        ctx.fillRect(0, noiseBarY, w, 8);
      }
    }
  }

  // 11. Floor Reflection (if defined and enabled)
  if (effect.floorReflection && effect.floorReflection.enabled) {
    const refl = effect.floorReflection;
    ctx.save();

    const refOffscreen = document.createElement("canvas");
    refOffscreen.width = canvasWidth;
    refOffscreen.height = canvasHeight;
    const rectx = refOffscreen.getContext("2d");

    if (rectx) {
      const defWithoutRefl = {
        ...effect,
        floorReflection: undefined,
      };

      renderTextEffectToContext(rectx, text, defWithoutRefl, fontSize, x, y, canvasWidth, canvasHeight);

      rectx.save();
      rectx.globalCompositeOperation = "destination-in";

      const grad = rectx.createLinearGradient(0, y + fontSize * 0.4, 0, y - fontSize * 0.5);
      grad.addColorStop(0, `rgba(0, 0, 0, ${refl.opacity})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      rectx.fillStyle = grad;

      rectx.fillRect(0, 0, canvasWidth, canvasHeight);
      rectx.restore();

      ctx.save();
      if (typeof ctx.translate === "function") {
        ctx.translate(0, y * 2 + refl.offsetY);
      }
      if (typeof ctx.scale === "function") {
        ctx.scale(1, -1);
      }
      if (refl.blur > 0) {
        (ctx as any).filter = `blur(${refl.blur}px)`;
      }
      ctx.drawImage(refOffscreen, 0, 0);
      ctx.restore();
    }
  }

  // 12. Newspaper Offset Printing (if defined and enabled)
  if (effect.newspaper && effect.newspaper.enabled) {
    renderNewspaper(ctx, text, effect, fontSize, x, y, canvasWidth, canvasHeight, lines, lineHeightPx, textWidth, textHeight);
  }

  // 13. Frosted Glass Etch (if defined and enabled)
  if (effect.frostedGlass && effect.frostedGlass.enabled) {
    renderFrostedGlass(ctx, text, effect, fontSize, x, y, canvasWidth, canvasHeight, lines, lineHeightPx, textWidth, textHeight);
  }

  // 14. Burned Wood Pyrography (if defined and enabled)
  if (effect.burnedWood && effect.burnedWood.enabled) {
    renderBurnedWood(ctx, text, effect, fontSize, x, y, canvasWidth, canvasHeight, lines, lineHeightPx, textWidth, textHeight);
  }

  // 15. Victorian Ornate (if defined and enabled)
  if (effect.victorianOrnate && effect.victorianOrnate.enabled) {
    renderVictorianOrnate(ctx, text, effect, fontSize, x, y, canvasWidth, canvasHeight, lines, lineHeightPx, textWidth, textHeight);
  }

  // 16. Calligraphy Ink (if defined and enabled)
  if (effect.calligraphyInk && effect.calligraphyInk.enabled) {
    renderCalligraphyInk(ctx, text, effect, fontSize, x, y, canvasWidth, canvasHeight, lines, lineHeightPx, textWidth, textHeight);
  }
};

/**
 * Core Canvas 2D Text Effects Rendering Engine.
 * Renders full text layers back-to-front in premium NLE composition order.
 * @param canvas - The HTMLCanvasElement to render onto.
 * @param text - The text string, supporting newlines.
 * @param effect - The text effect definition block.
 * @param fontSize - Master font size in pixels.
 */
export const renderTextEffect = (canvas: HTMLCanvasElement, text: string, effect: TextEffectDefinition, fontSize: number) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderTextEffectToContext(ctx, text, effect, fontSize, canvas.width / 2, canvas.height / 2, canvas.width, canvas.height);
};

/**
 * Renders the full text effect on a configurable offscreen canvas and returns a high-resolution export PNG data URL.
 * @param text - The text string.
 * @param effect - The text effect definition block.
 * @param fontSize - Master font size in pixels.
 * @param width - Canvas export width in px (default: 800).
 * @param height - Canvas export height in px (default: 400).
 * @returns A base64 PNG data URL string.
 */
export const renderTextEffectToDataURL = (text: string, effect: TextEffectDefinition, fontSize: number, width: number = 800, height: number = 400): string => {
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;

  renderTextEffect(offscreen, text, effect, fontSize);
  return offscreen.toDataURL("image/png");
};
