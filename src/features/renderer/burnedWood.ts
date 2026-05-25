import { TextEffectDefinition } from "./types";
import { applyFontConfig } from "./helpers";

export const renderBurnedWood = (
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
  if (!effect.burnedWood || !effect.burnedWood.enabled) return;
  const wood = effect.burnedWood;
  const w = canvasWidth;
  const h = canvasHeight;

  // Define wood tone colors
  let baseColor = "#d68e42";
  let darkGrain = "#7c3b0d";
  let lightGrain = "#e9af6a";
  let knotColor = "#4e1e03";

  if (wood.woodTone === "Dark Walnut") {
    baseColor = "#4a2f1c";
    darkGrain = "#1f1007";
    lightGrain = "#66452e";
    knotColor = "#120701";
  } else if (wood.woodTone === "Spiced Cherry") {
    baseColor = "#94381d";
    darkGrain = "#4a1104";
    lightGrain = "#b55b3c";
    knotColor = "#2d0600";
  }

  // Define a tight wood panel (wrap text)
  const paddingX = fontSize * 0.7;
  const paddingY = fontSize * 0.5;
  const panelW = textWidth + paddingX * 2;
  const panelH = textHeight + paddingY * 2;
  const panelX = x - panelW / 2;
  const panelY = y - panelH / 2;
  const borderRadius = 6;

  ctx.save();
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(panelX, panelY, panelW, panelH, borderRadius);
  } else {
    ctx.rect(panelX, panelY, panelW, panelH);
  }
  ctx.fillStyle = baseColor;
  ctx.fill();
  ctx.clip(); // Limit all wood grains and textures to this panel!

  // Helper function for wood warp/distortion
  const getWarp = (x: number, y: number) => {
    return Math.sin(x * 0.0025) * 25 + Math.sin(x * 0.008 + y * 0.01) * 8;
  };

  // Draw natural vertical wood grains with sine distortion
  ctx.save();
  ctx.lineWidth = 1;
  const step = 2 / wood.grainDetail;
  for (let gx = panelX - 20; gx < panelX + panelW + 20; gx += step) {
    ctx.strokeStyle = Math.sin(gx * 0.05) > 0 ? darkGrain : lightGrain;
    ctx.globalAlpha = 0.08 + Math.random() * 0.07;
    ctx.beginPath();
    for (let gy = panelY - 10; gy < panelY + panelH + 10; gy += 4) {
      const warp = getWarp(gx, gy) * (wood.warpStrength / 15);
      if (gy === panelY - 10) {
        ctx.moveTo(gx + warp, gy);
      } else {
        ctx.lineTo(gx + warp, gy);
      }
    }
    ctx.stroke();
  }
  ctx.restore();

  // Draw procedural circular wood knots
  ctx.save();
  ctx.strokeStyle = knotColor;
  ctx.fillStyle = knotColor;
  for (let k = 0; k < wood.knotCount; k++) {
    // Deterministic positions inside the panel based on k
    const knotX = panelX + (0.2 + k * 0.35) * panelW;
    const knotY = panelY + (0.35 + (k % 2) * 0.3) * panelH;
    const maxR = 25 + (k * 8) % 15;

    ctx.globalAlpha = 0.12;
    for (let r = 2; r < maxR; r += 2.5) {
      const warpR = r + Math.sin(r * 0.2) * 2.5;
      ctx.beginPath();
      ctx.arc(knotX, knotY, warpR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Central dark core
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(knotX, knotY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Re-draw text with burned charcoal pyrography effect
  ctx.save();

  // Outer charred heat/glow bleed border
  ctx.shadowColor = "rgba(224, 95, 31, 0.35)";
  ctx.shadowBlur = wood.bleedRadius;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  applyFontConfig(ctx, effect.font, fontSize);
  ctx.fillStyle = "rgba(0,0,0,0)"; // invisible fill to project shadow outline only

  // Draw the charred shadow boundary (cast from outline)
  ctx.strokeStyle = "rgba(18, 7, 1, 0.9)";
  ctx.lineWidth = wood.charcoalWidth * 2;
  ctx.lineJoin = "round";

  lines.forEach((line, index) => {
    const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
    ctx.strokeText(line, x, lineY);
  });

  // Re-set shadows for deep inside fill face engraving
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  // Dark charcoal carbon gradient fill
  const carbonGrad = ctx.createLinearGradient(0, panelY, 0, panelY + panelH);
  carbonGrad.addColorStop(0, "#1c110a");
  carbonGrad.addColorStop(0.5, "#0b0502");
  carbonGrad.addColorStop(1, "#180d06");
  ctx.fillStyle = carbonGrad;

  lines.forEach((line, index) => {
    const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
    ctx.fillText(line, x, lineY);
  });

  ctx.restore();
  ctx.restore(); // Restore context state to remove wood panel clipping path!
};
