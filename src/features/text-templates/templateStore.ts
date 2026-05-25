import { create } from "zustand";
import {
  TemplateDefinition,
  TemplateCustomization,
  TemplateCategory,
  RenderedFrameSequence,
} from "./types";
import { injectText, injectColor } from "./TemplateInjector";
import { renderToFrameSequence } from "./FrameRenderer";

interface TemplateState {
  templates: TemplateDefinition[];
  selectedTemplate: TemplateDefinition | null;
  customization: TemplateCustomization;
  isRendering: boolean;
  renderProgress: number; // 0–100
  activeCategory: TemplateCategory | "all";
  searchQuery: string;

  // Actions
  selectTemplate: (template: TemplateDefinition | null) => void;
  updateCustomization: (partial: Partial<TemplateCustomization>) => void;
  setCategory: (category: TemplateCategory | "all") => void;
  setSearchQuery: (query: string) => void;
  startRender: () => Promise<RenderedFrameSequence>;
  cancelRender: () => void;
}

let renderCancelToken = { cancelled: false };

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  selectedTemplate: null,
  customization: {
    primaryText: "Clypra",
    secondaryText: "",
    accentText: "",
  },
  isRendering: false,
  renderProgress: 0,
  activeCategory: "all",
  searchQuery: "",

  selectTemplate: (template) => {
    if (!template) {
      set({
        selectedTemplate: null,
        customization: { primaryText: "Clypra", secondaryText: "", accentText: "" },
      });
      return;
    }

    // Initialize customisation with defaults from the selected template
    const primary = template.textLayers.find((tl) => tl.role === "primary")?.defaultText || "Clypra";
    const secondary = template.textLayers.find((tl) => tl.role === "secondary")?.defaultText || "";
    const accent = template.textLayers.find((tl) => tl.role === "accent")?.defaultText || "";

    set({
      selectedTemplate: template,
      customization: {
        primaryText: primary,
        secondaryText: secondary,
        accentText: accent,
      },
    });
  },

  updateCustomization: (partial) => {
    set((state) => ({
      customization: {
        ...state.customization,
        ...partial,
      },
    }));
  },

  setCategory: (category) => {
    set({ activeCategory: category });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  startRender: async (): Promise<RenderedFrameSequence> => {
    const selected = get().selectedTemplate;
    if (!selected) {
      throw new Error("No template selected for rendering");
    }

    set({ isRendering: true, renderProgress: 0 });
    renderCancelToken.cancelled = false;
    const activeToken = renderCancelToken;

    try {
      // 1. Prepare customizable Lottie JSON
      let data = selected.lottieData || {};
      data = injectText(data, get().customization, selected.textLayers);

      if (get().customization.primaryColor) {
        data = injectColor(data, "primary-fill-layer", get().customization.primaryColor!);
      }
      if (get().customization.secondaryColor) {
        data = injectColor(data, "secondary-fill-layer", get().customization.secondaryColor!);
      }

      // 2. Perform the frame-by-frame render
      const sequence = await renderToFrameSequence(
        data,
        selected,
        (progress) => {
          if (activeToken.cancelled) {
            throw new Error("Render cancelled by user");
          }
          set({ renderProgress: progress });
        }
      );

      set({ isRendering: false, renderProgress: 100 });
      return sequence;
    } catch (err: any) {
      set({ isRendering: false, renderProgress: 0 });
      throw err;
    }
  },

  cancelRender: () => {
    renderCancelToken.cancelled = true;
    set({ isRendering: false, renderProgress: 0 });
  },
}));
