import { TextEffectDefinition } from "./types";
import { applyFontConfig } from "./helpers";

export const renderCalligraphyInk = (
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
  if (!effect.calligraphyInk || !effect.calligraphyInk.enabled) return;
  const calli = effect.calligraphyInk;
  const w = canvasWidth;
  const h = canvasHeight;

  // Define a tight Calligraphy paper panel (wrap text)
  const paddingX = fontSize * 0.6;
  const paddingY = fontSize * 0.4;
  const panelW = textWidth + paddingX * 2;
  const panelH = textHeight + paddingY * 2;
  const panelX = x - panelW / 2;
  const panelY = y - panelH / 2;
  const borderRadius = 8;

  ctx.save();
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(panelX, panelY, panelW, panelH, borderRadius);
  } else {
    ctx.rect(panelX, panelY, panelW, panelH);
  }

  // Clear and draw paper background with radial gradient inside panel
  const paperGrad = ctx.createRadialGradient(x, y, 10, x, y, Math.max(panelW, panelH) * 0.8);
  paperGrad.addColorStop(0, calli.paperWarmth);
  paperGrad.addColorStop(0.5, "#f4f1e8");
  paperGrad.addColorStop(1, "#dedbd2");
  ctx.fillStyle = paperGrad;
  ctx.fill();
  ctx.clip(); // Limit fibers and inks to this paper panel!

  // Draw procedural mulberry paper fibers
  ctx.save();
  let localSeed = 0.54321;
  const sRandom = () => {
    let val = Math.sin(localSeed++) * 10000;
    return val - Math.floor(val);
  };

  ctx.lineWidth = 0.4;
  for (let i = 0; i < calli.fiberDensity; i++) {
    const fx = sRandom() * w;
    const fy = sRandom() * h;
    const flen = 15 + sRandom() * 45;
    const fangle = sRandom() * Math.PI * 2;

    ctx.strokeStyle = sRandom() > 0.5 ? "rgba(125,115,100,0.07)" : "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.quadraticCurveTo(
      fx + Math.cos(fangle) * (flen / 2) + (sRandom() - 0.5) * 10,
      fy + Math.sin(fangle) * (flen / 2) + (sRandom() - 0.5) * 10,
      fx + Math.cos(fangle) * flen,
      fy + Math.sin(fangle) * flen
    );
    ctx.stroke();
  }
  ctx.restore();

  // Measure text for gradient
  applyFontConfig(ctx, effect.font, fontSize);
  const textMetrics = ctx.measureText(text);
  const textWidthResolved = textMetrics.width;

  // Create ink gradient
  const inkGrad = ctx.createLinearGradient(x - textWidthResolved / 2, 0, x + textWidthResolved / 2, 0);
  inkGrad.addColorStop(0, calli.inkGradient.start);
  inkGrad.addColorStop(0.2, calli.inkGradient.mid1);
  inkGrad.addColorStop(0.65, calli.inkGradient.mid2);
  inkGrad.addColorStop(0.85, calli.inkGradient.mid3);
  inkGrad.addColorStop(1, calli.inkGradient.end);

  // Draw text with multiple ink layers for bleed effect
  ctx.save();

  // Layer 1: Bleed halo (outermost)
  ctx.filter = `blur(${calli.bleedAmount * 2.5}px)`;
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = calli.inkColor;
  lines.forEach((line, index) => {
    const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
    ctx.fillText(line, x, lineY);
  });

  // Layer 2: Wet bleed margin
  ctx.filter = `blur(${calli.bleedAmount * 0.8}px)`;
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = calli.inkColor;
  lines.forEach((line, index) => {
    const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
    ctx.fillText(line, x, lineY);
  });

  // Layer 3: Master stroke with gradient
  ctx.filter = "blur(0.3px)";
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = inkGrad;
  lines.forEach((line, index) => {
    const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
    ctx.fillText(line, x, lineY);
  });

  // Layer 4: Trailing dry bristles (if enabled)
  if (calli.dryBrushIntensity > 0) {
    ctx.filter = "none";
    ctx.strokeStyle = "rgba(66,77,94,0.3)";
    ctx.lineWidth = 0.6;

    const startX = x + textWidthResolved / 2 - 20;
    const startY = y + 10;

    for (let i = 0; i < 6 * calli.dryBrushIntensity; i++) {
      ctx.beginPath();
      ctx.moveTo(startX - i * 3, startY + i * 2);
      ctx.bezierCurveTo(
        startX + 30 + i * 5,
        startY - 10 + i * 3,
        startX + 60 + i * 8,
        startY - 5 + i * 2,
        startX + 100 + i * 12,
        startY + i * 4 - 20
      );
      ctx.stroke();
    }
  }

  ctx.restore();
  ctx.restore(); // Restore context state to remove clipping path!
};
