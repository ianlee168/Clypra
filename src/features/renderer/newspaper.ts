import { TextEffectDefinition } from "./types";
import { applyFontConfig } from "./helpers";

export const renderNewspaper = (
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
  if (!effect.newspaper || !effect.newspaper.enabled) return;
  const newspaper = effect.newspaper;
  const w = canvasWidth;
  const h = canvasHeight;

  // Helper function to draw paper texture with foxing and aging
  const drawPaperTexture = (context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, width: number, height: number, density: number) => {
    // Subtle paper grain
    context.globalCompositeOperation = "multiply";
    context.fillStyle = "rgba(0,0,0,0.02)";
    for (let i = 0; i < 50; i++) {
      context.fillRect(Math.random() * width, Math.random() * height, Math.random() * 4 + 1, Math.random() * 4 + 1);
    }

    // Foxing spots (age spots)
    context.globalCompositeOperation = "source-over";
    for (let i = 0; i < density * 8; i++) {
      const spotX = Math.random() * width;
      const spotY = Math.random() * height;
      const spotR = Math.random() * 30 + 10;
      const grad = context.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotR);
      grad.addColorStop(0, "rgba(115, 78, 48, 0.12)");
      grad.addColorStop(0.5, "rgba(115, 78, 48, 0.04)");
      grad.addColorStop(1, "rgba(115, 78, 48, 0)");
      context.fillStyle = grad;
      context.beginPath();
      context.arc(spotX, spotY, spotR, 0, Math.PI * 2);
      context.fill();
    }

    // Paper fibers
    context.strokeStyle = "rgba(60, 45, 30, 0.15)";
    context.lineWidth = 0.6;
    for (let i = 0; i < density * 15; i++) {
      const fiberX = Math.random() * width;
      const fiberY = Math.random() * height;
      const fiberLen = Math.random() * 12 + 4;
      const fiberAngle = Math.random() * Math.PI * 2;
      context.beginPath();
      context.moveTo(fiberX, fiberY);
      context.lineTo(fiberX + Math.cos(fiberAngle) * fiberLen, fiberY + Math.sin(fiberAngle) * fiberLen);
      context.stroke();
    }
  };

  // Calculate tight background panel
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
  ctx.fillStyle = newspaper.paperColor;
  ctx.fill();
  ctx.clip(); // Limit paper texture & fibers to this panel!

  // Draw paper texture within panel
  drawPaperTexture(ctx, w, h, newspaper.foxingDensity);

  // Create offscreen canvas for text mask
  const textMaskCanvas = document.createElement("canvas");
  textMaskCanvas.width = w;
  textMaskCanvas.height = h;
  const textMaskCtx = textMaskCanvas.getContext("2d");
  if (!textMaskCtx) return;

  // Draw white text on black background for mask
  textMaskCtx.fillStyle = "#000000";
  textMaskCtx.fillRect(0, 0, w, h);
  textMaskCtx.fillStyle = "#ffffff";
  applyFontConfig(textMaskCtx, effect.font, fontSize);

  lines.forEach((line, index) => {
    const lineY = y - ((lines.length - 1) * lineHeightPx) / 2 + index * lineHeightPx;
    textMaskCtx.fillText(line, x, lineY);
  });

  // Apply ink bleed if specified
  if (newspaper.inkBleed > 0) {
    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = w;
    blurCanvas.height = h;
    const blurCtx = blurCanvas.getContext("2d");
    if (blurCtx) {
      blurCtx.filter = `blur(${newspaper.inkBleed}px)`;
      blurCtx.drawImage(textMaskCanvas, 0, 0);
      textMaskCtx.clearRect(0, 0, w, h);
      textMaskCtx.drawImage(blurCanvas, 0, 0);
    }
  }

  // Get text mask pixel data
  const maskData = textMaskCtx.getImageData(0, 0, w, h);
  const maskPixels = maskData.data;

  // Render each color separation with halftone dots
  newspaper.separations.forEach((sep: any) => {
    ctx.fillStyle = sep.color;
    ctx.globalCompositeOperation = "multiply";

    for (let dotY = newspaper.dotSpacing / 2; dotY < h; dotY += newspaper.dotSpacing) {
      for (let dotX = newspaper.dotSpacing / 2; dotX < w; dotX += newspaper.dotSpacing) {
        // Sample from offset position
        const sampleX = Math.floor(dotX - sep.dx);
        const sampleY = Math.floor(dotY - sep.dy);

        if (sampleX >= 0 && sampleX < w && sampleY >= 0 && sampleY < h) {
          const idx = (sampleY * w + sampleX) * 4;
          const brightness = maskPixels[idx]; // Red channel (grayscale)

          if (brightness > 15) {
            // Calculate dot radius based on brightness
            const radius = (brightness / 255) * (newspaper.dotSpacing / 1.3);
            ctx.beginPath();
            ctx.arc(dotX, dotY, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  });

  // Reset composite operation
  ctx.globalCompositeOperation = "source-over";
  ctx.restore(); // Restore context state to remove clipping path!
};
