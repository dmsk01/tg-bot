import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),

  DATABASE_URL: z.string(),

  TELEGRAM_BOT_TOKEN: z.string(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),
  MINI_APP_URL: z.string().optional(),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Replicate API (Flux models)
  REPLICATE_API_TOKEN: z.string().optional(),

  // Kandinsky API (FusionBrain) - legacy
  KANDINSKY_API_KEY: z.string().optional(),
  KANDINSKY_SECRET_KEY: z.string().optional(),
  KANDINSKY_API_URL: z.string().default('https://api-key.fusionbrain.ai/'),

  YOOKASSA_SHOP_ID: z.string().optional(),
  YOOKASSA_SECRET_KEY: z.string().optional(),
  YOOKASSA_RETURN_URL: z.string().optional(),

  UPLOAD_DIR: z.string().default('./uploads'),
  GENERATED_DIR: z.string().default('./generated'),
  MAX_FILE_SIZE: z.string().default('10485760').transform(Number),

  GENERATION_COST: z.string().default('0.04').transform(Number),

  JWT_SECRET: z.string(),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  DISABLE_BOT: z.string().optional().transform(val => val === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const configService = {
  get env() {
    return parsed.data;
  },

  get isDevelopment() {
    return parsed.data.NODE_ENV === 'development';
  },

  get isProduction() {
    return parsed.data.NODE_ENV === 'production';
  },

  get port() {
    return parsed.data.PORT;
  },

  get databaseUrl() {
    return parsed.data.DATABASE_URL;
  },

  get telegram() {
    return {
      botToken: parsed.data.TELEGRAM_BOT_TOKEN,
      webhookUrl: parsed.data.TELEGRAM_WEBHOOK_URL,
      miniAppUrl: parsed.data.MINI_APP_URL,
    };
  },

  get redis() {
    return {
      url: parsed.data.REDIS_URL,
    };
  },

  get replicate() {
    return {
      apiToken: parsed.data.REPLICATE_API_TOKEN,
    };
  },

  get kandinsky() {
    return {
      apiKey: parsed.data.KANDINSKY_API_KEY,
      secretKey: parsed.data.KANDINSKY_SECRET_KEY,
      apiUrl: parsed.data.KANDINSKY_API_URL,
    };
  },

  get yookassa() {
    return {
      shopId: parsed.data.YOOKASSA_SHOP_ID,
      secretKey: parsed.data.YOOKASSA_SECRET_KEY,
      returnUrl: parsed.data.YOOKASSA_RETURN_URL,
    };
  },

  get storage() {
    return {
      uploadDir: parsed.data.UPLOAD_DIR,
      generatedDir: parsed.data.GENERATED_DIR,
      maxFileSize: parsed.data.MAX_FILE_SIZE,
    };
  },

  get generationCost() {
    return parsed.data.GENERATION_COST;
  },

  get jwtSecret() {
    return parsed.data.JWT_SECRET;
  },

  get logLevel() {
    return parsed.data.LOG_LEVEL;
  },

  get disableBot() {
    return parsed.data.DISABLE_BOT || false;
  },
};
