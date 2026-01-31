import Replicate from 'replicate';
import { configService } from '../../common/config/config.service.js';
import { logger } from '../../common/utils/logger.util.js';

// Flux model identifiers
export const FLUX_MODELS = {
  'flux-1.1-pro': 'black-forest-labs/flux-1.1-pro',
  'flux-fill-pro': 'black-forest-labs/flux-fill-pro',
  'flux-schnell': 'black-forest-labs/flux-schnell',
  'flux-dev': 'black-forest-labs/flux-dev',
} as const;

export type FluxModelName = keyof typeof FLUX_MODELS;

// Aspect ratio mapping for Flux
export const FLUX_ASPECT_RATIOS: Record<string, string> = {
  '1:1': '1:1',
  '16:9': '16:9',
  '9:16': '9:16',
  '4:3': '4:3',
  '3:4': '3:4',
  '21:9': '21:9',
  '9:21': '9:21',
  '3:2': '3:2',
  '2:3': '2:3',
};

export interface FluxTextToImageParams {
  prompt: string;
  aspectRatio?: string;
  outputFormat?: 'webp' | 'jpg' | 'png';
  outputQuality?: number;
  safetyTolerance?: number;
  promptUpsampling?: boolean;
  seed?: number;
}

export interface FluxImageToImageParams {
  prompt: string;
  image: string; // URL or base64
  strength?: number;
  outputFormat?: 'webp' | 'jpg' | 'png';
  outputQuality?: number;
  seed?: number;
}

export interface FluxInpaintingParams {
  prompt: string;
  image: string; // URL or base64
  mask: string; // URL or base64
  outputFormat?: 'webp' | 'jpg' | 'png';
  outputQuality?: number;
  seed?: number;
}

export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
  metrics?: {
    predict_time?: number;
  };
}

class ReplicateService {
  private client: Replicate | null = null;

  private getClient(): Replicate {
    if (!this.client) {
      const token = configService.replicate.apiToken;
      if (!token) {
        throw new Error('REPLICATE_API_TOKEN is not configured');
      }
      this.client = new Replicate({ auth: token });
    }
    return this.client;
  }

  /**
   * Generate image using Flux text-to-image
   */
  async textToImage(
    modelName: FluxModelName,
    params: FluxTextToImageParams
  ): Promise<ReplicatePrediction> {
    const client = this.getClient();
    const modelId = FLUX_MODELS[modelName];

    if (!modelId) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    logger.info(`Starting text-to-image generation with ${modelName}`, {
      prompt: params.prompt.substring(0, 100),
      aspectRatio: params.aspectRatio,
    });

    try {
      const input: Record<string, unknown> = {
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio || '1:1',
        output_format: params.outputFormat || 'webp',
        output_quality: params.outputQuality || 80,
        safety_tolerance: params.safetyTolerance ?? 2,
        prompt_upsampling: params.promptUpsampling ?? true,
      };

      if (params.seed !== undefined) {
        input.seed = params.seed;
      }

      // Create prediction and wait for result
      const output = await client.run(modelId as `${string}/${string}`, { input });

      // Handle the output
      const imageUrl = Array.isArray(output) ? output[0] : output;

      return {
        id: `flux-${Date.now()}`,
        status: 'succeeded',
        output: imageUrl as string,
      };
    } catch (error) {
      logger.error('Replicate text-to-image failed:', error);
      throw error;
    }
  }

  /**
   * Create a prediction and return immediately (async mode)
   */
  async createPrediction(
    modelName: FluxModelName,
    params: FluxTextToImageParams
  ): Promise<ReplicatePrediction> {
    const client = this.getClient();
    const modelId = FLUX_MODELS[modelName];

    if (!modelId) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    logger.info(`Creating async prediction with ${modelName}`, {
      prompt: params.prompt.substring(0, 100),
    });

    try {
      const input: Record<string, unknown> = {
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio || '1:1',
        output_format: params.outputFormat || 'webp',
        output_quality: params.outputQuality || 80,
        safety_tolerance: params.safetyTolerance ?? 2,
        prompt_upsampling: params.promptUpsampling ?? true,
      };

      if (params.seed !== undefined) {
        input.seed = params.seed;
      }

      const prediction = await client.predictions.create({
        model: modelId,
        input,
      });

      return {
        id: prediction.id,
        status: prediction.status as ReplicatePrediction['status'],
        output: prediction.output as string | string[] | undefined,
        error: prediction.error as string | undefined,
      };
    } catch (error) {
      logger.error('Replicate create prediction failed:', error);
      throw error;
    }
  }

  /**
   * Get prediction status
   */
  async getPrediction(predictionId: string): Promise<ReplicatePrediction> {
    const client = this.getClient();

    try {
      const prediction = await client.predictions.get(predictionId);

      return {
        id: prediction.id,
        status: prediction.status as ReplicatePrediction['status'],
        output: prediction.output as string | string[] | undefined,
        error: prediction.error as string | undefined,
        metrics: prediction.metrics as ReplicatePrediction['metrics'],
      };
    } catch (error) {
      logger.error('Replicate get prediction failed:', error);
      throw error;
    }
  }

  /**
   * Wait for prediction to complete
   */
  async waitForPrediction(
    predictionId: string,
    maxAttempts = 60,
    intervalMs = 2000
  ): Promise<ReplicatePrediction> {
    for (let i = 0; i < maxAttempts; i++) {
      const prediction = await this.getPrediction(predictionId);

      if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
        return prediction;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Prediction timeout');
  }

  /**
   * Generate image using Flux inpainting (fill)
   */
  async inpaint(params: FluxInpaintingParams): Promise<ReplicatePrediction> {
    const client = this.getClient();
    const modelId = FLUX_MODELS['flux-fill-pro'];

    logger.info('Starting inpainting generation', {
      prompt: params.prompt.substring(0, 100),
    });

    try {
      const input: Record<string, unknown> = {
        prompt: params.prompt,
        image: params.image,
        mask: params.mask,
        output_format: params.outputFormat || 'webp',
        output_quality: params.outputQuality || 80,
      };

      if (params.seed !== undefined) {
        input.seed = params.seed;
      }

      const output = await client.run(modelId as `${string}/${string}`, { input });
      const imageUrl = Array.isArray(output) ? output[0] : output;

      return {
        id: `flux-fill-${Date.now()}`,
        status: 'succeeded',
        output: imageUrl as string,
      };
    } catch (error) {
      logger.error('Replicate inpainting failed:', error);
      throw error;
    }
  }

  /**
   * Check if Replicate is configured
   */
  isConfigured(): boolean {
    return !!configService.replicate.apiToken;
  }
}

export const replicateService = new ReplicateService();
