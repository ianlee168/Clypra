import { TextEffectDefinition } from "./types";
import { applyFontConfig } from "./helpers";

export const renderFrostedGlass = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  text: string,
  effect: TextEffectDefinition,
  fontSize: number,
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  lines: string[],
  lineHeightPx: number,
  textWidth: number,
  textHeight: number
) => {
  if (!effect.frostedGlass || !effect.frostedGlass.enabled) return;
  const glass = effect.frostedGlass;
  const w = canvasWidth;
  const h = canvasHeight;

  ctx.globalCompositeOperation = "source-over";

  // Create glass plate effect with semi-transparent overlay (dynamic to wrap text)
  const paddingX = fontSize * 0.8;
  const paddingY = fontSize * 0.6;
  const plateW = textWidth + paddingX * 2;
  const plateH = textHeight + paddingY * 2;
  const plateX = x - plateW / 2;
  const plateY = y - plateH / 2;
  const plateRadius = 8;

  // Draw ambient backlight glow centered immediately behind the glass plate
  const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(plateW, plateH) * 0.85);
  glowGrad.addColorStop(0, glass.glowColor);
  glowGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(plateX - 50, plateY - 50, plateW + 100, plateH + 100);

  // Glass plate background
  ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(plateX, plateY, plateW, plateH, plateRadius);
  } else {
    ctx.rect(plateX, plateY, plateW, plateH);
  }
  ctx.fill();

  // Glass plate border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Inner bevel highlight (top-left)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plateX + plateRadius, plateY + 1);
  ctx.lineTo(plateX + plateW - plateRadius, plateY + 1);
  ctx.moveTo(plateX + 1, plateY + plateRadius);
  ctx.lineTo(plateX + 1, plateY + plateH - plateRadius);
  ctx.stroke();

  // Inner bevel shadow (bottom-right)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.beginPath();
  ctx.moveTo(plateX + plateRadius, plateY + plateH - 1);
  ctx.lineTo(plateX + plateW - plateRadius, plateY + plateH - 1);
  ctx.moveTo(plateX + plateW - 1, plateY + plateRadius);
  ctx.lineTo(plateX + plateW - 1, plateY + plateH - plateRadius);
  ctx.stroke();

  // Create text with frosted effect
  const textCanvas = document.createElement("canvas");
  textCanvas.width = w;
  textCanvas.height = h;
  const textCtx = textCanvas.getContext("2d");
  if (!textCtx) return;

  // Draw text
  applyFontConfig(textCtx, effect.font, fontSize);
  textCtx.fillStyle = `rgba(235, 247, 250, ${glass.etchOpacity})`;
  textCtx.textAlign = "center";
  textCtx.textBaseline = "middle";

  lines.forEach((line, index) => {
    const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
    textCtx.fillText(line, x, lineY);
  });

  // Apply frosted texture using noise
  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = w;
  noiseCanvas.height = h;
  const noiseCtx = noiseCanvas.getContext("2d");
  if (noiseCtx) {
    const imageData = noiseCtx.createImageData(w, h);
    const data = imageData.data;

    // Generate fractal noise pattern
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const idx = (py * w + px) * 4;
        // Multi-octave noise simulation
        let noise = 0;
        let amplitude = 1;
        let frequency = glass.noiseFrequency;
        for (let octave = 0; octave < 4; octave++) {
          noise += (Math.sin(px * frequency * 0.01) * Math.cos(py * frequency * 0.01) + 1) * 0.5 * amplitude;
          amplitude *= 0.5;
          frequency *= 2;
        }
        const value = Math.floor(noise * 255);
        data[idx] = value;
        data[idx + 1] = value;
        data[idx + 2] = value;
        data[idx + 3] = Math.floor(glass.noiseOpacity * 255);
      }
    }
    noiseCtx.putImageData(imageData, 0, 0);

    // Composite noise onto text
    textCtx.globalCompositeOperation = "source-atop";
    textCtx.drawImage(noiseCanvas, 0, 0);
  }

  // Apply specular highlights (simulated)
  const highlightCanvas = document.createElement("canvas");
  highlightCanvas.width = w;
  highlightCanvas.height = h;
  const highlightCtx = highlightCanvas.getContext("2d");
  if (highlightCtx) {
    // Get text alpha channel
    const textData = textCtx.getImageData(0, 0, w, h);
    highlightCtx.putImageData(textData, 0, 0);

    // Apply edge detection for highlights
    highlightCtx.globalCompositeOperation = "source-in";
    const highlightGrad = highlightCtx.createLinearGradient(0, 0, w * 0.3, h * 0.3);
    highlightGrad.addColorStop(0, glass.highlightColor);
    highlightGrad.addColorStop(1, "rgba(224, 248, 252, 0)");
    highlightCtx.fillStyle = highlightGrad;
    highlightCtx.fillRect(0, 0, w, h);

    // Composite highlights onto text
    textCtx.globalCompositeOperation = "lighter";
    textCtx.globalAlpha = glass.specularConstant * 0.5;
    textCtx.drawImage(highlightCanvas, -1, -1);
    textCtx.globalAlpha = 1;
  }

  // Draw final text onto main canvas
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(textCanvas, 0, 0);

  // Add subtle glass plate shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(plateX, plateY, plateW, plateH, plateRadius);
  } else {
    ctx.rect(plateX, plateY, plateW, plateH);
  }
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
};
