import { TextEffectDefinition } from "./types";
import { applyFontConfig } from "./helpers";

export const renderVictorianOrnate = (
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
  if (!effect.victorianOrnate || !effect.victorianOrnate.enabled) return;
  const victorian = effect.victorianOrnate;
  const w = canvasWidth;
  const h = canvasHeight;

  // Velvet background presets
  let bgGradient = ctx.createLinearGradient(0, 0, 0, h);
  bgGradient.addColorStop(0, "#4a0606");
  bgGradient.addColorStop(1, "#1f0202");

  if (victorian.bgType === "Midnight Navy") {
    bgGradient = ctx.createLinearGradient(0, 0, 0, h);
    bgGradient.addColorStop(0, "#081026");
    bgGradient.addColorStop(1, "#020512");
  } else if (victorian.bgType === "Forest Green") {
    bgGradient = ctx.createLinearGradient(0, 0, 0, h);
    bgGradient.addColorStop(0, "#05260f");
    bgGradient.addColorStop(1, "#010f05");
  }

  // Define a tight Victorian panel (wrap text)
  const paddingX = fontSize * 0.8;
  const paddingY = fontSize * 0.6;
  const panelW = textWidth + paddingX * 2;
  const panelH = textHeight + paddingY * 2 + (victorian.subtitle ? 60 : 0);
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
  ctx.fillStyle = bgGradient;
  ctx.fill();
  ctx.clip(); // Limit all subsequent Victorian drawing (damask, borders, ornaments) to the panel!

  // Helper to draw seamless damask pattern
  const drawDamaskPattern = (width: number, height: number, opacity: number) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 0.5;

    const cellSize = 60;
    for (let px = panelX - cellSize; px < panelX + panelW + cellSize; px += cellSize) {
      for (let py = panelY - cellSize; py < panelY + panelH + cellSize; py += cellSize) {
        // Draw elegant repeating diamond outline
        ctx.beginPath();
        ctx.moveTo(px + cellSize / 2, py);
        ctx.lineTo(px + cellSize, py + cellSize / 2);
        ctx.lineTo(px + cellSize / 2, py + cellSize);
        ctx.lineTo(px, py + cellSize / 2);
        ctx.closePath();
        ctx.stroke();

        // Small inner decorative diamond core
        ctx.beginPath();
        ctx.arc(px + cellSize / 2, py + cellSize / 2, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  // Draw velvet damask
  drawDamaskPattern(w, h, victorian.patternOpacity);

  // Gold tone gradients
  const getGoldGradient = (x1: number, y1: number, x2: number, y2: number, tone: string) => {
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    if (tone === "Champagne Gold") {
      grad.addColorStop(0, "#edd5be");
      grad.addColorStop(0.3, "#fcf1e3");
      grad.addColorStop(0.5, "#d2b090");
      grad.addColorStop(0.85, "#edd5be");
      grad.addColorStop(1, "#b58e69");
    } else if (tone === "Rose Gold") {
      grad.addColorStop(0, "#e0b0b0");
      grad.addColorStop(0.3, "#fce8e8");
      grad.addColorStop(0.5, "#c28888");
      grad.addColorStop(0.85, "#e0b0b0");
      grad.addColorStop(1, "#a86060");
    } else {
      // Antique Gold
      grad.addColorStop(0, "#d4af37");
      grad.addColorStop(0.3, "#fff3a8");
      grad.addColorStop(0.5, "#aa7c11");
      grad.addColorStop(0.85, "#d4af37");
      grad.addColorStop(1, "#8b6508");
    }
    return grad;
  };

  const outerGold = getGoldGradient(panelX, panelY, panelX + panelW, panelY + panelH, victorian.goldTone);

  // Double gold frames
  if (victorian.borderStyle !== "Minimalist") {
    ctx.save();
    ctx.strokeStyle = outerGold;

    // Outer border
    ctx.lineWidth = 2.5;
    ctx.strokeRect(panelX + 8, panelY + 8, panelW - 16, panelH - 16);

    // Inner border
    if (victorian.borderStyle === "Intricate Filigree") {
      ctx.lineWidth = 1.0;
      ctx.strokeRect(panelX + 13, panelY + 13, panelW - 26, panelH - 26);
    }
    ctx.restore();
  }

  // Draw corner gold filigree ornaments
  if (victorian.borderStyle === "Intricate Filigree" && victorian.showOrnaments) {
    ctx.save();
    ctx.strokeStyle = outerGold;
    ctx.lineWidth = 1.2;

    const drawFiligree = (cx: number, cy: number, flipX: number, flipY: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(flipX, flipY);

      ctx.beginPath();
      // Swirly scroll curve
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(15, 0, 15, 15);
      ctx.quadraticCurveTo(15, 25, 5, 25);
      ctx.quadraticCurveTo(-2, 22, 3, 15);
      ctx.stroke();

      // Leaf accent
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(8, 8, 12, 4, 18, 18);
      ctx.stroke();

      ctx.restore();
    };

    // Draw at 4 corners
    drawFiligree(panelX + 16, panelY + 16, 1, 1); // Top-left
    drawFiligree(panelX + panelW - 16, panelY + 16, -1, 1); // Top-right
    drawFiligree(panelX + 16, panelY + panelH - 16, 1, -1); // Bottom-left
    drawFiligree(panelX + panelW - 16, panelY + panelH - 16, -1, -1); // Bottom-right

    ctx.restore();
  }

  // Draw Subtitle (if active)
  if (victorian.subtitle) {
    ctx.save();
    ctx.font = `italic 400 ${fontSize * 0.35}px Georgia, serif`;
    ctx.textAlign = "center";

    // Text Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillText(victorian.subtitle, x + 2, y + fontSize * 0.9 + 2);

    ctx.fillStyle = outerGold;
    ctx.fillText(victorian.subtitle, x, y + fontSize * 0.9);

    // Decorative subtitle divider line
    if (victorian.showDivider) {
      ctx.strokeStyle = outerGold;
      ctx.lineWidth = 0.8;
      const lineLen = panelW * 0.35;
      const lineY = y + fontSize * 0.65;

      ctx.beginPath();
      ctx.moveTo(x - lineLen / 2, lineY);
      ctx.lineTo(x + lineLen / 2, lineY);
      ctx.stroke();

      // Central divider diamond
      ctx.fillStyle = outerGold;
      ctx.beginPath();
      ctx.rect(x - 3, lineY - 3, 6, 6);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore(); // Restore context state to remove Victorian panel clipping path!
};
