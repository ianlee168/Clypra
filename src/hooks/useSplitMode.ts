/**
 * Split Mode Hook
 *
 * Manages split mode interactions:
 * - Visual feedback (cursor, hover states)
 * - Click-to-split behavior
 * - Mode activation/deactivation
 *
 * When split mode is active:
 * - Cursor changes to scissors over clips
 * - Clicking a clip splits it at that position
 * - Hover shows split preview line
 */

import { useEffect } from "react";
import { EditingActions } from "../core/interactions";

interface UseSplitModeOptions {
  /** Whether split mode is active */
  enabled: boolean;
  /** Callback when split is executed */
  onSplit?: (clipId: string, time: number) => void;
  /** Callback for toast messages */
  onMessage?: (message: string) => void;
}

export const useSplitMode = ({ enabled, onSplit, onMessage }: UseSplitModeOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: MouseEvent) => {
      // Check if clicking on a clip
      const target = e.target as HTMLElement;
      const clipElement = target.closest("[data-clip-id]");

      if (!clipElement) return;

      const clipId = clipElement.getAttribute("data-clip-id");
      if (!clipId) return;

      // Calculate click position in timeline time
      const rect = clipElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clipWidth = rect.width;

      // Get clip data to calculate time
      const clipStartAttr = clipElement.getAttribute("data-clip-start");
      const clipDurationAttr = clipElement.getAttribute("data-clip-duration");

      if (!clipStartAttr || !clipDurationAttr) {
        // Fallback: split at center if attributes missing
        console.warn("[SplitMode] Clip attributes missing, cannot calculate split time");
        return;
      }

      const clipStart = parseFloat(clipStartAttr);
      const clipDuration = parseFloat(clipDurationAttr);
      const clickRatio = clickX / clipWidth;
      const splitTime = clipStart + clipDuration * clickRatio;

      // Execute split
      const result = EditingActions.splitAtPosition(clipId, splitTime);

      if (result.success) {
        onSplit?.(clipId, splitTime);
        onMessage?.(`Clip split at ${splitTime.toFixed(2)}s`);
      } else {
        onMessage?.(result.error || "Split failed");
      }
    };

    // Add click listener
    document.addEventListener("click", handleClick);

    // Change cursor when hovering over clips
    const style = document.createElement("style");
    style.id = "split-mode-cursor";
    style.textContent = `
      [data-clip-id] {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M6 6l12 12M6 18L18 6"/></svg>') 12 12, crosshair !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("click", handleClick);
      const styleElement = document.getElementById("split-mode-cursor");
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [enabled, onSplit, onMessage]);

  return {
    enabled,
  };
};
