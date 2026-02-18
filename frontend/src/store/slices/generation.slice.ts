import type { StateCreator } from 'zustand';
import type { AiModel, Template, Generation, AspectRatio } from 'src/types';

import { logger } from 'src/utils/logger';

import { apiService } from 'src/services/api.service';

export interface GenerationSlice {
  // Editor state
  selectedModel: string;
  selectedTemplate: Template | null;
  prompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  sourceImageUrl: string | null;
  maskImageUrl: string | null;

  // Data
  templates: Template[];
  models: AiModel[];
  generations: Generation[];
  currentGeneration: Generation | null;

  // Loading states
  isGenerating: boolean;
  isLoadingTemplates: boolean;
  isLoadingModels: boolean;
  isUploading: boolean;

  // Actions
  setSelectedModel: (model: string) => void;
  setSelectedTemplate: (template: Template | null) => void;
  setPrompt: (prompt: string) => void;
  setNegativePrompt: (negativePrompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;

  uploadSourceImage: (file: File) => Promise<void>;
  setSourceImageUrl: (url: string) => void;
  clearSourceImage: () => void;
  setMaskImageUrl: (url: string | null) => void;
  clearMask: () => void;
  clearCurrentGeneration: () => void;

  fetchTemplates: (category?: string) => Promise<void>;
  fetchModels: () => Promise<void>;
  fetchHistory: (page?: number) => Promise<void>;

  createGeneration: () => Promise<string | null>;
  pollGenerationStatus: (id: string) => Promise<Generation>;

  resetEditor: () => void;
}

export const createGenerationSlice: StateCreator<GenerationSlice> = (set, get) => ({
  selectedModel: 'flux-1.1-pro',
  selectedTemplate: null,
  prompt: '',
  negativePrompt: '',
  aspectRatio: '1:1',
  sourceImageUrl: null,
  maskImageUrl: null,

  templates: [],
  models: [],
  generations: [],
  currentGeneration: null,

  isGenerating: false,
  isLoadingTemplates: false,
  isLoadingModels: false,
  isUploading: false,

  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedTemplate: (template) => {
    set({ selectedTemplate: template });
    if (template) {
      set({ prompt: template.promptTemplate.replace('{description}', '') });
    }
  },
  setPrompt: (prompt) => set({ prompt }),
  setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),

  uploadSourceImage: async (file: File) => {
    set({ isUploading: true });
    try {
      // Convert file to base64 data URL locally (no server upload needed)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      set({ sourceImageUrl: base64, isUploading: false });
    } catch (error) {
      logger.error('Failed to convert image:', error);
      set({ isUploading: false });
      throw error;
    }
  },

  setSourceImageUrl: (url) => set({ sourceImageUrl: url, maskImageUrl: null }),
  clearSourceImage: () => set({ sourceImageUrl: null, maskImageUrl: null }),

  setMaskImageUrl: (url) => set({ maskImageUrl: url }),
  clearMask: () => set({ maskImageUrl: null }),
  clearCurrentGeneration: () => set({ currentGeneration: null }),

  fetchTemplates: async (category?: string) => {
    set({ isLoadingTemplates: true });
    try {
      const templates = await apiService.getTemplates(category);
      set({ templates, isLoadingTemplates: false });
    } catch (error) {
      logger.error('Failed to fetch templates:', error);
      set({ isLoadingTemplates: false });
    }
  },

  fetchModels: async () => {
    set({ isLoadingModels: true });
    try {
      const models = await apiService.getModels();
      set({ models: models || [], isLoadingModels: false });
      if (models && models.length > 0 && !get().selectedModel) {
        set({ selectedModel: models[0].name });
      }
    } catch (error) {
      logger.error('Failed to fetch models:', error);
      set({ models: [], isLoadingModels: false });
    }
  },

  fetchHistory: async (page = 1) => {
    try {
      const { items } = await apiService.getGenerationHistory(page);
      set({ generations: items });
    } catch (error) {
      logger.error('Failed to fetch history:', error);
    }
  },

  createGeneration: async () => {
    const {
      selectedModel,
      prompt,
      negativePrompt,
      selectedTemplate,
      aspectRatio,
      sourceImageUrl,
      maskImageUrl,
    } = get();

    if (!prompt.trim()) {
      return null;
    }

    // Determine generation type based on available inputs
    let generationType: 'TEXT_TO_IMAGE' | 'IMAGE_TO_IMAGE' | 'INPAINTING' = 'TEXT_TO_IMAGE';
    if (sourceImageUrl && maskImageUrl) {
      generationType = 'INPAINTING';
    } else if (sourceImageUrl) {
      generationType = 'IMAGE_TO_IMAGE';
    }

    set({ isGenerating: true });
    try {
      const result = await apiService.createGeneration({
        model: selectedModel,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        templateId: selectedTemplate?.id,
        aspectRatio,
        sourceImageUrl: sourceImageUrl || undefined,
        maskImageUrl: maskImageUrl || undefined,
        generationType,
      });

      return result.id;
    } catch (error) {
      logger.error('Failed to create generation:', error);
      set({ isGenerating: false });
      throw error;
    }
  },

  pollGenerationStatus: async (id: string) => {
    const poll = async (): Promise<Generation> => {
      const generation = await apiService.getGenerationStatus(id);
      set({ currentGeneration: generation });

      if (generation.status === 'QUEUED' || generation.status === 'PROCESSING') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return poll();
      }

      set({ isGenerating: false });
      return generation;
    };

    return poll();
  },

  resetEditor: () =>
    set({
      selectedTemplate: null,
      prompt: '',
      negativePrompt: '',
      sourceImageUrl: null,
      maskImageUrl: null,
      currentGeneration: null,
    }),
});
